import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiClient, getGeminiModel } from '../../lib/gemini';
import { 
  ChevronLeft, 
  Play, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Upload, 
  Link as LinkIcon,
  Maximize2,
  Volume2,
  Settings,
  Users,
  MessageSquare,
  Send,
  Zap,
  Star,
  BookOpen,
  History,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFriends } from '../../hooks/useFriends';
import { useMemory } from '../../hooks/useMemory';
import { Friend, MovieDanmaku, MovieReport, ChatMessage, AppSettings } from '../../types';
import { get, set } from 'idb-keyval';

interface Movie {
  id: string;
  name: string;
  coverUrl: string;
  videoUrl: string;
  director?: string;
  screenwriter?: string;
  genre?: string;
  cast?: string;
  duration?: string;
  description?: string;
}

interface MoonShadowAppProps {
  settings: AppSettings;
  onBack: () => void;
}

const DEFAULT_MOVIES: Movie[] = [
  {
    id: '1',
    name: '落日余晖',
    coverUrl: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-sunset-seen-from-a-mountain-top-4008-large.mp4',
    director: '自然之子',
    screenwriter: '时光',
    genre: '治愈 / 风景',
    cast: '群山、落日',
    duration: '120分钟',
    description: '记录了大自然最壮丽的落日时刻，带你领略光影交织的宁静与美好。'
  },
  {
    id: '2',
    name: '星辰大海',
    coverUrl: 'https://images.unsplash.com/photo-1516339901600-2e1a62dc0c45?auto=format&fit=crop&q=80&w=800',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-the-night-sky-11606-large.mp4',
    director: '宇宙',
    screenwriter: '星尘',
    genre: '科幻 / 纪录',
    cast: '繁星',
    duration: '90分钟',
    description: '穿梭于浩瀚星空，探索宇宙深处的奥秘与孤独。'
  }
];

const MovieReportCard: React.FC<{ report: MovieReport; onDelete?: (id: string) => void }> = ({ report, onDelete }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i < report.rating);
  
  return (
    <div className="relative bg-[#fdfcf8] border-[1.5px] border-[#a8b5a0] rounded-sm shadow-md p-4 font-serif text-[#4a5d4e] overflow-hidden">
      {onDelete && (
        <button 
          onClick={() => onDelete(report.id)}
          className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full text-slate-400 hover:text-rose-500 transition-colors z-10"
        >
          <Trash2 size={14} />
        </button>
      )}
      
      <div className="flex gap-4 border-b border-dashed border-[#a8b5a0] pb-4 mb-4">
        <div className="flex flex-col items-center justify-center border-r border-dashed border-[#a8b5a0] pr-4 py-2">
          <span className="text-lg font-black tracking-[0.5em] [writing-mode:vertical-rl]">观影记录卡</span>
        </div>
        
        <div className="flex-1 space-y-3">
          <div className="bg-[#f0f4ee] rounded-md py-1 px-4 inline-block w-full text-center">
            <h3 className="text-lg font-black tracking-widest">{report.movieName}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="opacity-60 shrink-0">导演</span>
              <span className="bg-[#f0f4ee] px-2 py-0.5 rounded-sm flex-1 truncate">{report.director || '未知'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-60 shrink-0">编剧</span>
              <span className="bg-[#f0f4ee] px-2 py-0.5 rounded-sm flex-1 truncate">{report.screenwriter || '未知'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-60 shrink-0">类型</span>
              <span className="bg-[#f0f4ee] px-2 py-0.5 rounded-sm flex-1 truncate">{report.genre || '未知'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-60 shrink-0">时长</span>
              <span className="bg-[#f0f4ee] px-2 py-0.5 rounded-sm flex-1 truncate">{report.duration || '未知'}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <span className="opacity-60 shrink-0">主演</span>
              <span className="bg-[#f0f4ee] px-2 py-0.5 rounded-sm flex-1 truncate">{report.cast || '未知'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-[#a8b5a0]/30">
            <div className="flex items-center gap-4">
              <span className="text-xs opacity-60">日期</span>
              <span className="text-sm font-bold tracking-wider">{new Date(report.timestamp).toLocaleDateString().replace(/\//g, '.')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs opacity-60">评分</span>
              <div className="flex gap-0.5">
                {stars.map((filled, i) => (
                  <Star key={i} size={14} className={filled ? "fill-[#a8b5a0] text-[#a8b5a0]" : "text-[#a8b5a0]"} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#a8b5a0] text-white text-[10px] px-2 py-0.5 rounded-full">我的短评</span>
              <div className="h-[1px] flex-1 bg-[#a8b5a0]/30"></div>
            </div>
            <div className="relative text-xs leading-[24px] text-justify min-h-[120px]" style={{ backgroundImage: 'linear-gradient(#a8b5a0 1px, transparent 1px)', backgroundSize: '100% 24px', backgroundPosition: '0 23px' }}>
              {report.content}
            </div>
          </div>
          {report.posterUrl && (
            <div className="w-24 h-36 shrink-0 border-2 border-[#a8b5a0] p-0.5 bg-white shadow-sm rotate-2">
              <img src={report.posterUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#a8b5a0] text-white text-[10px] px-2 py-0.5 rounded-full">心动摘录</span>
            <div className="h-[1px] flex-1 bg-[#a8b5a0]/30"></div>
          </div>
          <div className="relative text-xs leading-[24px] text-justify min-h-[72px]" style={{ backgroundImage: 'linear-gradient(#a8b5a0 1px, transparent 1px)', backgroundSize: '100% 24px', backgroundPosition: '0 23px' }}>
            {report.excerpts || '暂无摘录'}
          </div>
        </div>
      </div>

      <div className="mt-4 text-right">
        <span className="text-[10px] opacity-40 italic">— {report.friendName} 的观影笔记</span>
      </div>
    </div>
  );
};

const MoonShadowApp: React.FC<MoonShadowAppProps> = React.memo(({ settings, onBack }) => {
  const { friends, user } = useFriends();
  const { addOnlineMemory } = useMemory();
  const [movies, setMovies] = useState<Movie[]>(() => {
    const saved = localStorage.getItem('moon_shadow_movies');
    return saved ? JSON.parse(saved) : DEFAULT_MOVIES;
  });
  const [view, setView] = useState<'hall' | 'room' | 'archive'>('hall');
  const [activeMovie, setActiveMovie] = useState<Movie | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Partial<Movie> | null>(null);

  // Co-watching states
  const [invitedFriend, setInvitedFriend] = useState<Friend | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [danmakus, setDanmakus] = useState<MovieDanmaku[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isGeneratingDanmaku, setIsGeneratingDanmaku] = useState(false);
  const [showReport, setShowReport] = useState<MovieReport | null>(null);
  const [reports, setReports] = useState<MovieReport[]>([]);
  const [isEnding, setIsEnding] = useState(false);
  const [selectedFilterFriendId, setSelectedFilterFriendId] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadReports = async () => {
      const saved = await get('moon_shadow_reports') || [];
      setReports(saved);
    };
    loadReports();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('moon_shadow_movies', JSON.stringify(movies));
    } catch (e) {
      console.warn("Storage quota exceeded for moon_shadow_movies", e);
    }
  }, [movies]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSaveMovie = () => {
    if (!editingMovie?.name || !editingMovie?.coverUrl || !editingMovie?.videoUrl) return;

    if (editingMovie.id) {
      setMovies(prev => prev.map(m => m.id === editingMovie.id ? (editingMovie as Movie) : m));
    } else {
      const newMovie: Movie = {
        ...(editingMovie as Movie),
        id: Date.now().toString()
      };
      setMovies(prev => [...prev, newMovie]);
    }
    setShowEditModal(false);
    setEditingMovie(null);
  };

  const handleDeleteMovie = (id: string) => {
    setMovies(prev => prev.filter(m => m.id !== id));
  };

  const handleDeleteReport = async (id: string) => {
    const updatedReports = reports.filter(r => r.id !== id);
    setReports(updatedReports);
    await set('moon_shadow_reports', updatedReports);
  };

  const generateDanmaku = async () => {
    if (!invitedFriend || !activeMovie || isGeneratingDanmaku) return;
    setIsGeneratingDanmaku(true);

    try {
      console.log("Generating danmaku for movie:", activeMovie.name, "with friend:", invitedFriend.name);
      const movieInfo = `电影名：《${activeMovie.name}》
      导演：${activeMovie.director || '未知'}
      类型：${activeMovie.genre || '未知'}
      主演：${activeMovie.cast || '未知'}
      剧情简介：${activeMovie.description || '暂无'}`;

      const prompt = `你现在是 ${invitedFriend.name}，性格是：${invitedFriend.persona}。
      我们正在月影剧场一起看电影。
      电影信息：
      ${movieInfo}
      
      请根据你的性格，针对这部电影发一条简短的弹幕评论（15字以内）。
      只返回弹幕内容，不要有任何其他文字。`;

      const ai = getGeminiClient(settings);
      const result = await ai.models.generateContent({
        model: getGeminiModel(settings),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.8
        }
      });
      const content = (result.text || "").trim();

      const newDanmaku: MovieDanmaku = {
        id: Date.now().toString(),
        content,
        timestamp: Date.now(),
        authorName: invitedFriend.name,
        color: ['#FF6B6B', '#4D96FF', '#6BCB77', '#FFD93D', '#FFFFFF'][Math.floor(Math.random() * 5)]
      };

      setDanmakus(prev => [...prev, newDanmaku]);
      
      // Also add to chat as a reaction
      const chatMsg: ChatMessage = {
        role: 'assistant',
        content: `（发了条弹幕）${content}`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, chatMsg]);

    } catch (error) {
      console.error("Failed to generate danmaku:", error);
    } finally {
      setIsGeneratingDanmaku(false);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !invitedFriend) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
  };

  const generateAIReply = async () => {
    if (!invitedFriend || isReplying) return;
    setIsReplying(true);

    try {
      console.log("Generating AI reply with friend:", invitedFriend.name);
      const movieInfo = activeMovie ? `电影名：《${activeMovie.name}》
      导演：${activeMovie.director || '未知'}
      类型：${activeMovie.genre || '未知'}
      主演：${activeMovie.cast || '未知'}
      剧情简介：${activeMovie.description || '暂无'}` : '';

      const prompt = `你现在是 ${invitedFriend.name}，性格是：${invitedFriend.persona}。
      我们正在月影剧场一起看电影。
      ${movieInfo}
      
      最近的聊天记录：
      ${chatMessages.slice(-5).map(m => `${m.role === 'user' ? '用户' : invitedFriend.name}: ${m.content}`).join('\n')}
      
      请根据你的性格和当前观影氛围，对用户说一句话。
      如果是对电影的评价，请带上一些动作描写（用括号包裹）。
      回复格式要求：动作描写（可选）+ 说话内容。`;

      const ai = getGeminiClient(settings);
      const result = await ai.models.generateContent({
        model: getGeminiModel(settings),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.8
        }
      });
      const content = (result.text || "").trim();

      const aiMsg: ChatMessage = {
        role: 'assistant',
        content,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
    } finally {
      setIsReplying(false);
    }
  };

  const endWatching = async () => {
    if (!invitedFriend || !activeMovie || isEnding) {
      setView('hall');
      setInvitedFriend(null);
      setChatMessages([]);
      setDanmakus([]);
      return;
    }
    setIsEnding(true);

    try {
      console.log("Generating movie report for movie:", activeMovie.name, "with friend:", invitedFriend.name);
      const movieInfo = `电影名：《${activeMovie.name}》
      导演：${activeMovie.director || '未知'}
      编剧：${activeMovie.screenwriter || '未知'}
      类型：${activeMovie.genre || '未知'}
      主演：${activeMovie.cast || '未知'}
      时长：${activeMovie.duration || '未知'}
      剧情简介：${activeMovie.description || '暂无'}`;

      const prompt = `你现在是 ${invitedFriend.name}，性格是：${invitedFriend.persona}。
      你刚和用户一起在月影剧场看完了电影。
      电影信息：
      ${movieInfo}
      
      你们期间的聊天记录如下：
      ${chatMessages.map(m => `${m.role === 'user' ? '用户' : invitedFriend.name}: ${m.content}`).join('\n')}
      
      请写一份详细的观影心得报告，包含：
      1. 对电影的评价（我的短评）
      2. 电影中的心动摘录（台词或精彩瞬间描述）
      3. 给这次观影打分（1-5星）
      
      请以 JSON 格式返回，格式如下：
      {
        "content": "我的短评内容...",
        "excerpts": "心动摘录内容...",
        "rating": 5
      }`;

      const ai = getGeminiClient(settings);
      const result = await ai.models.generateContent({
        model: getGeminiModel(settings),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.8
        }
      });
      const text = result.text || "";
      const data = JSON.parse(text.replace(/```json|```/g, '').trim());

      const newReport: MovieReport = {
        id: Date.now().toString(),
        friendId: invitedFriend.id,
        friendName: invitedFriend.name,
        movieName: activeMovie.name,
        content: data.content,
        excerpts: data.excerpts,
        director: activeMovie.director || data.director,
        screenwriter: activeMovie.screenwriter || data.screenwriter,
        genre: activeMovie.genre || data.genre,
        cast: activeMovie.cast || data.cast,
        duration: activeMovie.duration || data.duration,
        posterUrl: activeMovie.coverUrl,
        timestamp: Date.now(),
        rating: data.rating
      };

      const updatedReports = [newReport, ...reports];
      setReports(updatedReports);
      await set('moon_shadow_reports', updatedReports);
      
      // Add to online memory
      await addOnlineMemory(invitedFriend.id, `和用户一起在月影剧场看了电影《${activeMovie.name}》，评价是：${data.content.substring(0, 50)}... 评分：${data.rating}星`);

      setShowReport(newReport);
    } catch (error) {
      console.error("Failed to end watching:", error);
      setView('hall');
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col relative overflow-hidden text-slate-900 font-sans">
      {/* 1. 影片大厅 (Hall) */}
      <AnimatePresence mode="wait">
        {view === 'hall' ? (
          <motion.div 
            key="hall"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            {/* Header */}
            <header className="px-6 pt-12 pb-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-xl font-black tracking-tight text-slate-800">🎬 月影剧场</h1>
              <div className="flex gap-2">
                <button 
                  onClick={() => setView('archive')}
                  className="p-2 bg-slate-100 text-slate-600 rounded-full shadow-sm"
                >
                  <History size={20} />
                </button>
                <button 
                  onClick={() => {
                    setEditingMovie({ name: '', coverUrl: '', videoUrl: '' });
                    setShowEditModal(true);
                  }}
                  className="p-2 bg-slate-900 text-white rounded-full shadow-lg"
                >
                  <Plus size={20} />
                </button>
              </div>
            </header>

            {/* Movie List */}
            <main className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                {movies.map((movie) => (
                  <motion.div
                    key={movie.id}
                    layoutId={movie.id}
                    className="group relative flex flex-col gap-3"
                  >
                    {/* Cover Card */}
                    <div className="relative aspect-[3/4] rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100 group-hover:shadow-slate-300/50 transition-all duration-500">
                      <img 
                        src={movie.coverUrl} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-black/20 transition-colors duration-500" />
                      
                      {/* Play Button Overlay */}
                      <button 
                        onClick={() => {
                          setActiveMovie(movie);
                          setView('room');
                        }}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100"
                      >
                        <div className="w-16 h-16 bg-white/90 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl">
                          <Play size={28} className="text-slate-900 fill-slate-900 ml-1" />
                        </div>
                      </button>

                      {/* Edit/Delete Actions */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => {
                            setEditingMovie(movie);
                            setShowEditModal(true);
                          }}
                          className="p-2 bg-white/90 backdrop-blur-md rounded-full text-slate-600 shadow-lg"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteMovie(movie.id)}
                          className="p-2 bg-white/90 backdrop-blur-md rounded-full text-rose-500 shadow-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Movie Info */}
                    <div className="px-2 space-y-0.5">
                      <h3 className="text-[13px] font-black text-slate-800 truncate tracking-tight">{movie.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-rose-400" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Moon Shadow Cinema</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </main>
          </motion.div>
        ) : view === 'room' ? (
          /* 2. 观影室 (Room) */
          <motion.div 
            key="room"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 bg-black z-[100] flex flex-col"
          >
            {/* Video Player Area */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
              <video 
                key={activeMovie?.id}
                src={activeMovie?.videoUrl} 
                autoPlay 
                controls 
                playsInline
                webkit-playsinline="true"
                className="w-full max-h-full"
              />
              
              {/* Danmaku Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {danmakus.map((d, i) => (
                  <motion.div
                    key={d.id}
                    initial={{ x: '100%' }}
                    animate={{ x: '-100%' }}
                    transition={{ duration: 8, ease: 'linear' }}
                    className="absolute whitespace-nowrap font-bold text-lg drop-shadow-lg"
                    style={{ 
                      top: `${(i % 5) * 40 + 60}px`,
                      color: d.color || '#fff'
                    }}
                  >
                    {d.authorName}: {d.content}
                  </motion.div>
                ))}
              </div>

              {/* Back Button Overlay */}
              <button 
                onClick={() => endWatching().catch(err => console.error("End watching failed:", err))}
                className="absolute top-12 left-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20 transition-colors z-20"
              >
                <ChevronLeft size={24} />
              </button>

              {/* Movie Title Overlay */}
              <div className="absolute top-12 right-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 z-20">
                <span className="text-xs font-bold text-white tracking-widest uppercase">{activeMovie?.name}</span>
              </div>

              {/* Invite Character Button (if not invited) */}
              {!invitedFriend && (
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/20 flex items-center gap-2 hover:bg-white/20 transition-all z-20"
                >
                  <Users size={18} />
                  <span className="text-sm font-bold">邀请角色一起观影</span>
                </button>
              )}
            </div>

            {/* Interaction Area (Ins Style) */}
            <div className="h-[300px] bg-white rounded-t-[40px] flex flex-col overflow-hidden shadow-2xl">
              {invitedFriend ? (
                <>
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={invitedFriend.avatar} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <h4 className="text-sm font-black text-slate-800">{invitedFriend.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">正在陪你观影...</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => generateDanmaku().catch(err => console.error("Generate danmaku failed:", err))}
                      disabled={isGeneratingDanmaku}
                      className="px-4 py-2 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-rose-200 disabled:opacity-50"
                    >
                      <Zap size={12} fill="currentColor" />
                      {isGeneratingDanmaku ? '正在思考...' : '生成弹幕'}
                    </button>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                        <MessageSquare size={32} />
                        <p className="text-xs font-bold">和 {invitedFriend.name} 聊聊电影吧</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                          "max-w-[80%] px-4 py-2 rounded-2xl text-sm font-medium",
                          msg.role === 'user' 
                            ? "bg-slate-900 text-white rounded-tr-none" 
                            : "bg-slate-100 text-slate-700 rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="px-6 py-4 border-t flex gap-3 items-center">
                    <button 
                      onClick={() => generateAIReply().catch(err => console.error("Generate AI reply failed:", err))}
                      disabled={isReplying}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg",
                        isReplying ? "bg-slate-100 text-slate-300" : "bg-rose-500 text-white hover:scale-110 active:scale-95"
                      )}
                    >
                      <Sparkles size={18} fill={isReplying ? "none" : "currentColor"} />
                    </button>
                    <input 
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={`对 ${invitedFriend.name} 说点什么...`}
                      className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-slate-200"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <Users size={32} />
                  </div>
                  <p className="text-sm font-bold">暂无角色陪同观影</p>
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-full text-xs font-bold"
                  >
                    立即邀请
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* 4. 观影存档 (Archive) */
          <motion.div 
            key="archive"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 flex flex-col h-full bg-slate-50"
          >
            <header className="px-6 pt-12 pb-6 flex flex-col gap-4 bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setView('hall')}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-black tracking-tight text-slate-800">📖 观影资料库</h1>
              </div>
              
              {/* Character Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button 
                  onClick={() => setSelectedFilterFriendId(null)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    selectedFilterFriendId === null ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                  )}
                >
                  全部
                </button>
                {Array.from(new Set(reports.map(r => r.friendId))).map(id => {
                  const friend = friends.find(f => f.id === id);
                  return (
                    <button 
                      key={id}
                      onClick={() => setSelectedFilterFriendId(id)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                        selectedFilterFriendId === id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {friend?.name || '未知角色'}
                    </button>
                  );
                })}
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-24">
              {reports.filter(r => !selectedFilterFriendId || r.friendId === selectedFilterFriendId).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                  <BookOpen size={48} />
                  <p className="text-sm font-bold">还没有任何观影心得</p>
                </div>
              ) : (
                reports.filter(r => !selectedFilterFriendId || r.friendId === selectedFilterFriendId).map((report) => (
                  <MovieReportCard key={report.id} report={report} onDelete={handleDeleteReport} />
                ))
              )}
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="absolute inset-0 z-[300] flex items-end bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full rounded-t-[40px] p-8 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800">邀请观影伙伴</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => {
                      setInvitedFriend(friend);
                      setShowInviteModal(false);
                      setChatMessages([{
                        role: 'assistant',
                        content: `很高兴能和你一起看《${activeMovie?.name}》！`,
                        timestamp: Date.now()
                      }]);
                    }}
                    className="flex flex-col items-center gap-2"
                  >
                    <img src={friend.avatar} className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
                    <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{friend.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Report Modal */}
      <AnimatePresence>
        {showReport && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm space-y-6"
            >
              <MovieReportCard report={showReport} />

              <button 
                onClick={() => {
                  setShowReport(null);
                  setView('hall');
                  setInvitedFriend(null);
                  setChatMessages([]);
                  setDanmakus([]);
                }}
                className="w-full py-4 bg-white text-slate-900 rounded-[24px] font-bold shadow-lg"
              >
                收下心得
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Edit/Add Modal */}
      <AnimatePresence>
        {showEditModal && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800">
                  {editingMovie?.id ? '编辑影片' : '新增影片'}
                </h3>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">影片名称</label>
                  <input 
                    type="text" 
                    value={editingMovie?.name}
                    onChange={(e) => setEditingMovie(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入影片名称..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">导演</label>
                    <input 
                      type="text" 
                      value={editingMovie?.director}
                      onChange={(e) => setEditingMovie(prev => ({ ...prev, director: e.target.value }))}
                      placeholder="导演名..."
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">编剧</label>
                    <input 
                      type="text" 
                      value={editingMovie?.screenwriter}
                      onChange={(e) => setEditingMovie(prev => ({ ...prev, screenwriter: e.target.value }))}
                      placeholder="编剧名..."
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">类型</label>
                    <input 
                      type="text" 
                      value={editingMovie?.genre}
                      onChange={(e) => setEditingMovie(prev => ({ ...prev, genre: e.target.value }))}
                      placeholder="如：动画 / 奇幻"
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">时长</label>
                    <input 
                      type="text" 
                      value={editingMovie?.duration}
                      onChange={(e) => setEditingMovie(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="如：124分钟"
                      className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">主演</label>
                  <input 
                    type="text" 
                    value={editingMovie?.cast}
                    onChange={(e) => setEditingMovie(prev => ({ ...prev, cast: e.target.value }))}
                    placeholder="输入主演名单..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">影片简介</label>
                  <textarea 
                    value={editingMovie?.description}
                    onChange={(e) => setEditingMovie(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="输入影片剧情简介..."
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">封面 URL</label>
                  <input 
                    type="text" 
                    value={editingMovie?.coverUrl}
                    onChange={(e) => setEditingMovie(prev => ({ ...prev, coverUrl: e.target.value }))}
                    placeholder="输入封面图片 URL..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">视频 URL</label>
                  <input 
                    type="text" 
                    value={editingMovie?.videoUrl}
                    onChange={(e) => setEditingMovie(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="输入视频文件 URL..."
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-[24px] font-bold"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveMovie}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-[24px] font-bold shadow-lg"
                >
                  保存影片
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default MoonShadowApp;
