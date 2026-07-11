import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  MoreHorizontal, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle, 
  ListMusic, 
  Music, 
  ChevronDown,
  ChevronUp,
  Trash2,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Star,
  Snowflake,
  Image as ImageIcon,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Song, ListenTogetherState, Friend, AppSettings } from '../../types';

interface ListenTogetherProps {
  state: ListenTogetherState;
  setState: React.Dispatch<React.SetStateAction<ListenTogetherState>>;
  friend: Friend;
  user: any;
  settings: AppSettings;
  onSendMessage: (msg: any) => void;
}

export default function ListenTogether({ state, setState, friend, user, settings, onSendMessage }: ListenTogetherProps) {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [showLinkImport, setShowLinkImport] = useState(false);
  const [linkData, setLinkData] = useState({ title: '', artist: '', cover: '', url: '', lyrics: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lyricsRef = useRef<HTMLDivElement>(null);

  const currentSong = state.playlist.find(s => s.id === state.currentSongId);

  // Timer for listening together
  const [listeningDuration, setListeningDuration] = useState(0);
  useEffect(() => {
    if (state.isActive && state.isAccepted && state.startTime) {
      const interval = setInterval(() => {
        setListeningDuration(Math.floor((Date.now() - state.startTime!) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [state.isActive, state.isAccepted, state.startTime]);

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.floor(seconds || 0);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePlay = () => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleNext = () => {
    if (state.playlist.length === 0) return;
    const currentIndex = state.playlist.findIndex(s => s.id === state.currentSongId);
    let nextIndex = (currentIndex + 1) % state.playlist.length;
    if (state.playbackMode === 'random') {
      nextIndex = Math.floor(Math.random() * state.playlist.length);
    }
    setState(prev => ({ ...prev, currentSongId: prev.playlist[nextIndex].id, isPlaying: true }));
  };

  const handlePrev = () => {
    if (state.playlist.length === 0) return;
    const currentIndex = state.playlist.findIndex(s => s.id === state.currentSongId);
    let prevIndex = (currentIndex - 1 + state.playlist.length) % state.playlist.length;
    setState(prev => ({ ...prev, currentSongId: prev.playlist[prevIndex].id, isPlaying: true }));
  };

  const handleModeToggle = () => {
    const modes: ('loop' | 'random' | 'single')[] = ['loop', 'random', 'single'];
    const currentIndex = modes.indexOf(state.playbackMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setState(prev => ({ ...prev, playbackMode: nextMode }));
  };

  const handleInvite = () => {
    onSendMessage({
      role: 'user',
      content: '邀请你一起听歌 🎵',
      type: 'text',
      timestamp: Date.now()
    });
    // Simulate AI accepting
    setTimeout(() => {
      setState(prev => ({ ...prev, isAccepted: true, startTime: Date.now() }));
      onSendMessage({
        role: 'assistant',
        content: '好呀，我也想听听你喜欢的音乐 ✨',
        type: 'text',
        timestamp: Date.now()
      });
    }, 2000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newSong: Song = {
        id: Math.random().toString(36).substr(2, 9),
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: '本地音乐',
        mediaUrl: url,
        localFile: file,
        duration: 0 
      };
      setState(prev => ({
        ...prev,
        playlist: [...prev.playlist, newSong],
        currentSongId: prev.currentSongId || newSong.id
      }));
    }
  };

  const handleLinkSave = () => {
    if (!linkData.title || !linkData.url) return;
    const newSong: Song = {
      id: Math.random().toString(36).substr(2, 9),
      title: linkData.title,
      artist: linkData.artist || '未知歌手',
      albumCover: linkData.cover,
      mediaUrl: linkData.url,
      lyrics: linkData.lyrics,
      duration: 0 // Will be detected on play
    };
    setState(prev => ({
      ...prev,
      playlist: [...prev.playlist, newSong],
      currentSongId: prev.currentSongId || newSong.id
    }));
    setShowLinkImport(false);
    setLinkData({ title: '', artist: '', cover: '', url: '', lyrics: '' });
  };

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'vinyl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'main') {
          setState(prev => ({ ...prev, backgroundUrl: reader.result as string }));
        } else {
          setState(prev => ({ ...prev, vinylBackgroundUrl: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const mainBgInputRef = useRef<HTMLInputElement>(null);
  const vinylBgInputRef = useRef<HTMLInputElement>(null);

  const parseLyrics = (lyricsStr: string) => {
    if (!lyricsStr) return [];
    return lyricsStr.split('\n').map(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 1000;
        return { time, text: match[4].trim() };
      }
      return { time: 0, text: line.trim() };
    }).filter(l => l.text);
  };

  const lyrics = parseLyrics(currentSong?.lyrics || '');
  const currentLyricIndex = lyrics.findIndex((l, i) => {
    const next = lyrics[i + 1];
    return state.currentTime >= l.time && (!next || state.currentTime < next.time);
  });

  // AI Interaction based on lyrics
  const lastLyricIndex = useRef(-1);
  useEffect(() => {
    if (state.isActive && state.isAccepted && currentLyricIndex !== -1 && currentLyricIndex !== lastLyricIndex.current) {
      lastLyricIndex.current = currentLyricIndex;
      const currentLyric = lyrics[currentLyricIndex];
      
      // 15% chance to comment on a lyric line
      if (Math.random() < 0.15) {
        const thoughts = [
          `这句“${currentLyric.text}”写得真好...`,
          `听着这首歌，感觉心情都变好了 ✨`,
          `这句歌词让我想起了一些往事呢。`,
          `旋律和歌词真的很配，你说是吗？`,
          `这首歌的氛围感太棒了，谢谢你带我一起听 🎵`,
          `“${currentLyric.text}”，很有共鸣呢。`,
          `感觉这首歌就是在唱我们的心情呀 💖`
        ];
        const randomThought = thoughts[Math.floor(Math.random() * thoughts.length)];
        
        onSendMessage({
          role: 'assistant',
          content: randomThought,
          type: 'text',
          timestamp: Date.now()
        });
      }
    }
  }, [currentLyricIndex, state.isActive, state.isAccepted]);

  if (!state.isActive) return null;

  return (
    <AnimatePresence>
      {state.isFolded ? (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          onClick={() => setState(prev => ({ ...prev, isFolded: false }))}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0">
            {currentSong?.albumCover ? (
              <img src={currentSong.albumCover} className="w-full h-full object-cover animate-spin-slow" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music size={16} className="text-white/40" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{currentSong?.title || '未在播放'}</div>
            <div className="text-[10px] text-white/40 truncate">{currentSong?.artist || '一起听'}</div>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); handleTogglePlay(); }}
            className="p-1.5 bg-white/10 rounded-full text-white"
          >
            {state.isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[20000] bg-black flex flex-col text-white overflow-hidden"
        >
          {/* Top Spacer to prevent Status Bar overlap */}
          {!settings.hideStatusBar ? (
            <div 
              className="shrink-0 bg-black/40"
              style={{ height: settings.fullScreenMode ? 'max(env(safe-area-inset-top), 68px)' : '36px' }}
            />
          ) : settings.fullScreenMode ? (
            <div 
              className="shrink-0 bg-black/40"
              style={{ height: 'env(safe-area-inset-top)' }}
            />
          ) : null}
          {/* Custom Background */}
          {state.backgroundUrl && (
            <img 
              src={state.backgroundUrl}
              className="absolute inset-0 z-0 pointer-events-none transition-all duration-700 w-full h-full object-cover"
              style={{
                filter: 'brightness(0.7)'
              }}
              referrerPolicy="no-referrer"
            />
          )}

          {/* Background Decorations */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute top-10 left-10"><Snowflake size={40} /></motion.div>
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} className="absolute bottom-20 right-10"><Star size={30} /></motion.div>
            <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute top-1/2 left-20"><Sparkles size={24} /></motion.div>
          </div>

          {/* Header */}
          <div className="px-6 py-6 flex items-center justify-between relative z-[60]">
            <button onClick={() => setState(prev => ({ ...prev, isFolded: true }))} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <ChevronDown size={24} />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="text-sm font-bold truncate max-w-[200px] tracking-tight">{currentSong?.title || '一起听'}</div>
              <div className="text-[10px] text-white/40 truncate max-w-[150px] uppercase tracking-[0.2em] mt-0.5">{currentSong?.artist || 'INS MUSIC'}</div>
            </div>
            <div className="relative">
              <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <MoreHorizontal size={24} />
              </button>
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50"
                  >
                    <button 
                      onClick={() => { mainBgInputRef.current?.click(); setShowMoreMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3"
                    >
                      <ImageIcon size={16} /> 更换页面背景
                    </button>
                    <button 
                      onClick={() => { vinylBgInputRef.current?.click(); setShowMoreMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 border-t border-white/5"
                    >
                      <PlusCircle size={16} /> 更换专辑背景
                    </button>
                    <button 
                      onClick={() => { setState(prev => ({ ...prev, isActive: false, isPlaying: false })); setShowMoreMenu(false); }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 border-t border-white/5 text-red-400"
                    >
                      <X size={16} /> 结束一起听
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Listeners Info */}
          <div className="flex flex-col items-center gap-3 mt-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img src={user.avatar} className="w-12 h-12 rounded-full border-2 border-white/20 object-cover" />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
              </div>
              {state.isAccepted ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative">
                  <img src={friend.avatar} className="w-12 h-12 rounded-full border-2 border-white/20 object-cover" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black" />
                </motion.div>
              ) : (
                <button 
                  onClick={handleInvite}
                  className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors"
                >
                  <Plus size={20} className="text-white/40" />
                </button>
              )}
            </div>
            {state.isAccepted && (
              <div className="text-[10px] text-white/60 font-medium">
                一起听了 {Math.floor(listeningDuration / 60)} 分 {listeningDuration % 60} 秒
              </div>
            )}
          </div>

          {/* Main Content (Vinyl or Lyrics) */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10" onClick={() => setShowLyrics(!showLyrics)}>
            <AnimatePresence mode="wait">
              {!showLyrics ? (
                <motion.div
                  key="vinyl"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  className="relative w-64 h-64"
                >
                  {/* Vinyl Record */}
                  <div className={cn(
                    "absolute inset-0 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-[10px] border-[#222] flex items-center justify-center",
                    state.isPlaying && "animate-spin-slow"
                  )}>
                    <div className="w-full h-full rounded-full border border-white/5 flex items-center justify-center relative">
                      {/* Vinyl Grooves */}
                      <div className="absolute inset-2 rounded-full border border-white/5 opacity-20" />
                      <div className="absolute inset-6 rounded-full border border-white/5 opacity-10" />
                      <div className="absolute inset-10 rounded-full border border-white/5 opacity-5" />
                      
                      <div className="w-40 h-40 rounded-full overflow-hidden bg-slate-800 relative shadow-inner">
                        {state.vinylBackgroundUrl ? (
                          <img src={state.vinylBackgroundUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (currentSong?.albumCover ? (
                          <img src={currentSong.albumCover} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music size={60} className="text-white/10" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Stylus (Optional but adds vibe) */}
                  <div className={cn(
                    "absolute -top-4 -right-4 w-24 h-24 transition-transform duration-500 origin-top-right",
                    state.isPlaying ? "rotate-[15deg]" : "rotate-0"
                  )}>
                    <div className="w-1 h-20 bg-slate-400 rounded-full rotate-[45deg] absolute top-0 right-0" />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="lyrics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full h-full flex flex-col items-center justify-center text-center overflow-hidden"
                >
                  <div ref={lyricsRef} className="space-y-6 overflow-y-auto py-20 px-4 scroll-smooth no-scrollbar">
                    {lyrics.length > 0 ? lyrics.map((line, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "text-lg transition-all duration-300",
                          currentLyricIndex === i ? "text-white font-bold scale-110" : "text-white/30"
                        )}
                      >
                        {line.text}
                      </div>
                    )) : (
                      <div className="text-white/30 italic">暂无歌词</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Controls */}
          <div className="px-8 pb-12 space-y-8 relative z-10">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-white" 
                  style={{ width: `${(state.currentTime / (currentSong?.duration || 1)) * 100}%` }} 
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>{formatDuration(Math.floor(state.currentTime))}</span>
                <span>{formatDuration(Math.floor(currentSong?.duration || 0))}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between">
              <button onClick={handleModeToggle} className="p-2 text-white/60 hover:text-white transition-colors">
                {state.playbackMode === 'loop' && <Repeat size={20} />}
                {state.playbackMode === 'random' && <Shuffle size={20} />}
                {state.playbackMode === 'single' && <div className="relative"><Repeat size={20} /><span className="absolute -top-1 -right-1 text-[8px] font-bold">1</span></div>}
              </button>
              <div className="flex items-center gap-8">
                <button onClick={handlePrev} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <SkipBack size={28} fill="currentColor" />
                </button>
                <button 
                  onClick={handleTogglePlay}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  {state.isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <SkipForward size={28} fill="currentColor" />
                </button>
              </div>
              <button onClick={() => setShowPlaylist(true)} className="p-2 text-white/60 hover:text-white transition-colors">
                <ListMusic size={24} />
              </button>
            </div>
          </div>

          {/* Playlist Modal */}
          <AnimatePresence>
            {showPlaylist && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute inset-0 z-[400] bg-[#121212] flex flex-col"
              >
                <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowImportMenu(!showImportMenu)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                      <Plus size={20} />
                    </button>
                    <span className="font-bold">播放列表 ({state.playlist.length})</span>
                  </div>
                  <button onClick={() => setShowPlaylist(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                {/* Import Menu */}
                <AnimatePresence>
                  {showImportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-16 left-4 bg-[#1e1e1e] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[410] w-48"
                    >
                      <button 
                        onClick={() => { fileInputRef.current?.click(); setShowImportMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3"
                      >
                        <Upload size={16} /> 本地文件导入
                      </button>
                      <button 
                        onClick={() => { setShowLinkImport(true); setShowImportMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-white/5 flex items-center gap-3 border-t border-white/5"
                      >
                        <LinkIcon size={16} /> 图床链接导入
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {state.playlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/20">
                      <Music size={48} className="mb-4" />
                      <p>列表空空如也，快去添加歌曲吧</p>
                    </div>
                  ) : (
                    state.playlist.map((song) => (
                      <div 
                        key={song.id}
                        onClick={() => setState(prev => ({ ...prev, currentSongId: song.id, isPlaying: true }))}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group",
                          state.currentSongId === song.id ? "bg-white/10" : "hover:bg-white/5"
                        )}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                          {song.albumCover ? (
                            <img src={song.albumCover} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={16} className="text-white/20" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("text-sm font-medium truncate", state.currentSongId === song.id ? "text-white" : "text-white/80")}>
                            {song.title}
                          </div>
                          <div className="text-xs text-white/40 truncate">{song.artist}</div>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setState(prev => ({
                              ...prev,
                              playlist: prev.playlist.filter(s => s.id !== song.id),
                              currentSongId: prev.currentSongId === song.id ? (prev.playlist.find(s => s.id !== song.id)?.id || null) : prev.currentSongId
                            }));
                          }}
                          className="p-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                {state.playlist.length > 0 && (
                  <div className="p-4 border-t border-white/5">
                    <button 
                      onClick={() => setState(prev => ({ ...prev, playlist: [], currentSongId: null, isPlaying: false }))}
                      className="w-full py-3 text-sm text-red-400 font-bold hover:bg-red-400/10 rounded-xl transition-colors"
                    >
                      清空播放列表
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Link Import Modal */}
          <AnimatePresence>
            {showLinkImport && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-[#1e1e1e] w-full max-w-sm rounded-2xl p-6 space-y-4 shadow-2xl border border-white/10"
                >
                  <h3 className="text-lg font-bold">链接导入歌曲</h3>
                  <div className="space-y-3">
                    <input 
                      placeholder="歌曲名称" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20"
                      value={linkData.title}
                      onChange={e => setLinkData({ ...linkData, title: e.target.value })}
                    />
                    <input 
                      placeholder="歌手名称" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20"
                      value={linkData.artist}
                      onChange={e => setLinkData({ ...linkData, artist: e.target.value })}
                    />
                    <input 
                      placeholder="音频链接 (MP3/URL)" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20"
                      value={linkData.url}
                      onChange={e => setLinkData({ ...linkData, url: e.target.value })}
                    />
                    <input 
                      placeholder="封面图床链接" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20"
                      value={linkData.cover}
                      onChange={e => setLinkData({ ...linkData, cover: e.target.value })}
                    />
                    <textarea 
                      placeholder="歌词内容 (支持 LRC 格式)" 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/20 h-24 resize-none"
                      value={linkData.lyrics}
                      onChange={e => setLinkData({ ...linkData, lyrics: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowLinkImport(false)} className="flex-1 py-3 text-sm font-bold text-white/40 hover:bg-white/5 rounded-xl transition-colors">取消</button>
                    <button onClick={handleLinkSave} className="flex-1 py-3 text-sm font-bold bg-white text-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all">保存</button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileImport} />
          <input type="file" ref={mainBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleBackgroundChange(e, 'main')} />
          <input type="file" ref={vinylBgInputRef} className="hidden" accept="image/*" onChange={(e) => handleBackgroundChange(e, 'vinyl')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
