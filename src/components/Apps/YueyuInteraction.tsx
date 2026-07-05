import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Send, 
  Mic, 
  Smile, 
  Plus, 
  Camera, 
  Heart, 
  Sparkles,
  Sun,
  Moon,
  CloudRain,
  User,
  MessageSquare,
  Gift,
  Gamepad2,
  HandMetal,
  Image as ImageIcon,
  Link as LinkIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Friend, AppSettings } from '../../types';
import { GoogleGenAI } from "@google/genai";

interface SceneInteractionProps {
  settings: AppSettings;
  friends: Friend[];
  onBack: () => void;
  sceneId: string;
  mode: 'single' | 'multi';
  selectedFriendIds: string[];
  theme: string;
  timeOfDay: 'day' | 'night' | 'sunset';
  weather: 'sunny' | 'rainy';
  wallpaperUrl: string;
  onUpdateWallpaper: (url: string) => void;
  onCapture: (photo: { url: string, date: string, theme: string, thought?: string, friendId?: string }) => void;
  onFinish: (summary: { duration: string, affection: number, photos: number, messages: {role: string, content: string}[] }) => void;
  onSendGift: (gift: { productId: string, name: string, image: string, thought: string }) => void;
  purchasedProducts: { id: string, name: string, image: string }[];
  initialMessage?: string;
  onlineChatHistory?: any[];
}

const YueyuInteraction: React.FC<SceneInteractionProps> = ({ 
  settings, friends, onBack, sceneId, mode, selectedFriendIds, theme, timeOfDay, weather, wallpaperUrl, onUpdateWallpaper, onCapture, onFinish, onSendGift, purchasedProducts, initialMessage, onlineChatHistory = []
}) => {
  const activeFriends = friends.filter(f => selectedFriendIds.includes(f.id));

  const [messages, setMessages] = useState<{role: string, content: string, type?: 'dialogue' | 'narration'}[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isNarrationMode, setIsNarrationMode] = useState(false);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [interactionMood, setInteractionMood] = useState('开心');
  const [isInteracting, setIsInteracting] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showGiftSelection, setShowGiftSelection] = useState(false);
  const [showWallpaperInput, setShowWallpaperInput] = useState(false);
  const [tempWallpaperUrl, setTempWallpaperUrl] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{ url: string, date: string, theme: string, thought?: string, friendId?: string } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [capturedPhotosCount, setCapturedPhotosCount] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [meetingSettings, setMeetingSettings] = useState({ minLen: 10, maxLen: 150, style: '日常风格', perspective: '第一人称' });

  useEffect(() => {
    if (activeFriends && activeFriends[0]) {
      const saved = localStorage.getItem(`meeting_settings_${activeFriends[0].id}`);
      if (saved) {
        try {
          setMeetingSettings(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse meeting settings', e);
        }
      }
    }
  }, [activeFriends[0]?.id]);

  const saveMeetingSettings = (newSettings: typeof meetingSettings) => {
    setMeetingSettings(newSettings);
    if (activeFriends && activeFriends[0]) {
      localStorage.setItem(`meeting_settings_${activeFriends[0].id}`, JSON.stringify(newSettings));
    }
    setIsSettingsOpen(false);
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = now - startTime;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      // The openingText from invitation is treated as the scene setting narration
      setMessages([
        { role: 'assistant', content: initialMessage, type: 'narration' }
      ]);
    }
  }, [initialMessage, activeFriends]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCapture = async (isSmart = false) => {
    setIsCapturing(true);
    
    // Generate character thought
    let thought = "这一刻真美好。";
    const friendNames = activeFriends.map(f => f.name).join('和');
    const chatHistory = messages.slice(-5).map(m => `${m.role === 'user' ? '用户' : '角色'}: ${m.content}`).join('\n');
    
    const prompt = `你正在扮演角色 ${friendNames}。你们正在进行约会，刚刚拍下了一张合照。
    场景：${theme}
    聊天背景：
    ${chatHistory}
    
    请以角色的口吻，写下一句对这张照片的“内心独白”或“评价”。
    要求：感性、真实、简短（20字以内），不要提到AI。直接输出内容。`;
    
    const { getGeminiClient, getGeminiModel } = await import('../../lib/gemini');
    const ai = getGeminiClient(settings);
    try {
      const result = await ai.models.generateContent({
        model: getGeminiModel(settings),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.8
        }
      });
      thought = result.text || thought;
    } catch (err: any) {
      if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('quota')) {
        thought = "这一刻的温柔，我会永远记得。";
      } else {
        console.error("Generate thought error:", err);
      }
    }

    setTimeout(() => {
      setIsCapturing(false);
      const photo = { 
        url: wallpaperUrl, 
        date: new Date().toLocaleDateString(), 
        theme: theme,
        thought: thought,
        friendId: activeFriends[0]?.id
      };
      setCapturedPhoto(photo);
      setCapturedPhotosCount(prev => prev + 1);
      onCapture(photo);
    }, 300);
  };

  const handleFinalizeDate = () => {
    setShowSummary(false);
    onFinish({
      duration: elapsedTime,
      affection: 120, // This could be calculated based on interaction
      photos: capturedPhotosCount,
      messages: messages
    });
  };

  const handleEditMessage = (index: number) => {
    setEditingIndex(index);
    setEditValue(messages[index].content);
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      const newMessages = [...messages];
      newMessages[editingIndex].content = editValue;
      setMessages(newMessages);
      setEditingIndex(null);
    }
  };

  const handleSendGift = async (product: { id: string, name: string, image: string }) => {
    setShowGiftSelection(false);
    setIsTyping(true);
    
    // Add user message about giving gift
    setMessages(prev => [...prev, { role: 'user', content: `送给你一个礼物：${product.name}`, type: 'narration' }]);

    // Generate character thought/reaction
    let thought = "谢谢你，我很喜欢。";
    const friendNames = activeFriends.map(f => f.name).join('和');
    const prompt = `你正在扮演角色 ${friendNames}。用户在约会中送了你一个礼物：${product.name}。
    请以角色的口吻，写下一句收到礼物后的“内心独白”或“感谢的话”。
    要求：感性、真实、简短（20字以内），不要提到AI。直接输出内容。`;
    
    const { getGeminiClient, getGeminiModel } = await import('../../lib/gemini');
    const ai = getGeminiClient(settings);
    try {
      const result = await ai.models.generateContent({
        model: getGeminiModel(settings),
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          temperature: 0.8
        }
      });
      thought = result.text || thought;
    } catch (err: any) {
      if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('quota')) {
        thought = "谢谢你，我很开心。";
      } else {
        console.error("Generate gift thought error:", err);
      }
    }

    // Add character reaction to chat
    setMessages(prev => [...prev, { role: 'assistant', content: thought, type: 'dialogue' }]);
    setIsTyping(false);
    setInteractionMood('惊喜');
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 3000);

    // Call callback to save gift to character's phone
    onSendGift({
      productId: product.id,
      name: product.name,
      image: product.image,
      thought: thought
    });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMsg: { role: string, content: string, type: 'dialogue' | 'narration' } = { 
      role: 'user', 
      content: inputValue, 
      type: isNarrationMode ? 'narration' : 'dialogue' 
    };
    setMessages([...messages, newMsg]);
    setInputValue('');
    setIsInteracting(true);
    setTimeout(() => setIsInteracting(false), 3000);
  };

  const handleGenerateReply = async () => {
    if (isTyping) return;
    setIsTyping(true);
    
    try {
      const friendNames = activeFriends.map(f => f.name).join('和');
      const chatHistory = messages.map(m => `${m.role === 'user' ? '用户' : '角色'}${m.type === 'narration' ? '(动作/旁白)' : ''}: ${m.content}`).join('\n');
      
      const formattedOnlineHistory = onlineChatHistory && onlineChatHistory.length > 0
        ? onlineChatHistory.slice(-50).map(m => {
            const sender = m.role === 'user' ? '用户' : (friendNames || '角色');
            return `[线上聊天记录] ${sender}: ${m.content}`;
          }).join('\n')
        : '（暂无线上聊天记录）';

      const prompt = `你正在扮演角色 ${friendNames} 与用户进行约会互动。
      场景：${theme}
      当前时间：${timeOfDay}
      天气：${weather}
      
      【重要记忆：你们之前的线上聊天记录（共约50条，供你融入你们的关系默契与最近的话题）】：
      ${formattedOnlineHistory}
      
      【当前互动的设定与个性化要求】：
      - 回复字数限制：${meetingSettings.minLen} 到 ${meetingSettings.maxLen} 字。
      - 文风风格：${meetingSettings.style}。
      - 用户设定采用：${meetingSettings.perspective}。
      
      【旁白称谓与视角规则（至关重要）】：
      - 旁白括号中，描述角色的神态、动作、心理时，必须使用【第三人称】（如使用角色名字“${friendNames}”或使用“他/她”），严禁使用第一人称（如“我”）。
      - 旁白中提及用户时，必须使用【第二人称】“你”。
      - 格式示例：正确的旁白：(沈聿珩脸颊微红，轻轻拉住你的手)；错误的旁白：(我脸颊微红，轻轻拉住你的手)。
      
      【当前正在进行的约会互动记录】：
      ${chatHistory}
      
      要求：
      1. 你必须完全沉浸在角色中，你是一个真实的人，绝对不能提到你是AI、人工智能、程序或机器人。你的回复要百分百模仿真人。
      2. 以角色的口吻回复对话。
      3. 回复必须包含“旁白”（动作、神态、心理描写，放在括号内）和“对话”内容。
      4. 格式示例：(沈聿珩轻轻拉住你的手，脸颊微红) 我们去那边看看吧。
      5. 关键规则：气泡对话框中禁止出现任何动作描写（即括号内容），动作描写必须且只能出现在旁白中。
      6. 角色回复必须是“多段式”的，即包含一段旁白和一段对话，或者多段交替。
      7. 语气要符合约会氛围：温馨、治愈、细腻。
      8. 不要重复用户的动作，要做出回应。
      9. 直接输出回复内容。`;
      
      const { getGeminiClient, getGeminiModel } = await import('../../lib/gemini');
      const ai = getGeminiClient(settings);
      let reply = "";
      try {
        const result = await ai.models.generateContent({
          model: getGeminiModel(settings),
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7
          }
        });
        reply = result.text || "";
      } catch (err: any) {
        if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('quota')) {
          reply = "(微微低头，有些不知所措) 网络有点不太好，我刚才没听清...";
        } else {
          throw err;
        }
      }
      
      // Improved parsing for multi-segment responses
      // We look for all instances of (narration) and text outside them
      const segments: { type: 'dialogue' | 'narration', content: string }[] = [];
      
      // Regex to match content inside brackets and content outside
      const regex = /\((.*?)\)|([^\(\)]+)/g;
      let match;
      
      while ((match = regex.exec(reply)) !== null) {
        if (match[1]) {
          // It's a narration (content inside brackets)
          segments.push({ type: 'narration', content: match[1].trim() });
        } else if (match[2] && match[2].trim()) {
          // It's a dialogue (content outside brackets)
          segments.push({ type: 'dialogue', content: match[2].trim() });
        }
      }
      
      if (segments.length === 0 && reply.trim()) {
        segments.push({ role: 'assistant', content: reply.trim(), type: 'dialogue' } as any);
      }
      
      const newMessages = segments.map(s => ({
        role: 'assistant',
        content: s.content,
        type: s.type
      }));
      
      setMessages(prev => [...prev, ...newMessages]);
      setInteractionMood('开心');
    } catch (error) {
      console.error("Generate Reply Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "嗯...我刚才在想事情，你刚才说什么？", type: 'dialogue' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleApplyWallpaper = () => {
    if (tempWallpaperUrl.trim()) {
      onUpdateWallpaper(tempWallpaperUrl.trim());
      setShowWallpaperInput(false);
      setTempWallpaperUrl('');
    }
  };

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col relative overflow-hidden">
      {/* Wallpaper Background Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src={wallpaperUrl} 
          alt="Scene Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Overlay for atmosphere */}
        <div className={cn(
          "absolute inset-0 transition-colors duration-1000",
          timeOfDay === 'night' ? "bg-indigo-950/40" : 
          timeOfDay === 'sunset' ? "bg-orange-500/20" : 
          "bg-transparent"
        )} />
      </div>

      {/* Characters Layer (2D Representation) */}
      <div className="absolute top-24 left-0 right-0 z-5 pointer-events-none flex items-start justify-center gap-6">
        {activeFriends.map((friend, idx) => (
          <motion.div 
            key={friend.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex flex-col items-center pointer-events-auto cursor-pointer"
            onClick={() => setIsSettingsOpen(true)}
          >
            <div className="w-20 h-20 rounded-full border-2 border-white/60 shadow-xl overflow-hidden bg-white/20 backdrop-blur-md">
              <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
            </div>
            
            {/* Mood Bubble */}
            <AnimatePresence>
              {isInteracting && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, y: -10 }}
                  className="absolute -bottom-8 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-rose-100 flex items-center gap-1.5 whitespace-nowrap z-10"
                >
                  <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
                  <span className="text-[10px] font-bold text-rose-500">{interactionMood}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/60 to-transparent">
          <button 
            onClick={() => setShowSummary(true)} 
            className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30 hover:bg-white/40 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
            <h2 className="text-white font-bold text-lg drop-shadow-md">{theme}</h2>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] text-white/80 font-medium tracking-wider">{elapsedTime} · 约会进行中</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleCapture(false).catch(err => console.error("Capture failed:", err))}
              className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white border border-white/30"
            >
              <Camera size={20} />
            </button>
            <button 
              onClick={() => setShowWallpaperInput(!showWallpaperInput)}
              className={cn(
                "p-2 rounded-full text-white border border-white/30 transition-all",
                showWallpaperInput ? "bg-rose-400" : "bg-white/20 backdrop-blur-md"
              )}
            >
              <ImageIcon size={20} />
            </button>
          </div>
        </header>

        {/* Wallpaper URL Input Modal */}
        <AnimatePresence>
          {showWallpaperInput && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className="absolute top-24 left-6 right-6 z-50 pointer-events-auto"
            >
              <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[32px] shadow-2xl border border-white/40 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <ImageIcon className="w-5 h-5 text-rose-400" />
                  <span>更换约会背景</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-2xl border border-slate-200">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={tempWallpaperUrl}
                    onChange={(e) => setTempWallpaperUrl(e.target.value)}
                    placeholder="输入图片 URL..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-600"
                  />
                </div>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            onUpdateWallpaper(event.target.result as string);
                            setShowWallpaperInput(false);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 font-bold text-sm">
                    <ImageIcon className="w-4 h-4" />
                    <span>从相册选择</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowWallpaperInput(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleApplyWallpaper}
                    className="flex-1 py-3 bg-rose-400 text-white rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 hover:bg-rose-500 transition-colors"
                  >
                    应用背景
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1" />

        {/* Interaction Area */}
        <div className="p-4 pb-6 space-y-3 pointer-events-auto bg-gradient-to-t from-black/95 via-black/60 to-transparent">
          {/* Chat Messages */}
          <div 
            ref={scrollRef}
            className="max-h-[60vh] overflow-y-auto space-y-3 mb-2 custom-scrollbar flex flex-col px-2"
          >
            <AnimatePresence>
              {messages.map((msg, i) => {
                const isEditing = editingIndex === i;

                if (msg.type === 'narration') {
                  return (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-1 group relative"
                      onClick={() => !isEditing && handleEditMessage(i)}
                    >
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <input 
                            autoFocus
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                            className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-[11px] text-white outline-none w-full max-w-[200px]"
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] text-white/60 font-medium italic tracking-wide cursor-pointer hover:text-white/80 transition-colors">
                          {msg.role === 'user' ? `* ${msg.content} *` : `( ${msg.content} )`}
                        </span>
                      )}
                    </motion.div>
                  );
                }
                return (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm font-medium shadow-lg backdrop-blur-md border cursor-pointer transition-all hover:scale-[1.02]",
                      msg.role === 'user' 
                        ? "bg-pink-100/95 text-pink-900 self-end rounded-tr-none border-pink-200/50 shadow-pink-900/5" 
                        : "bg-white/95 text-slate-800 self-start rounded-tl-none border-white/40"
                    )}
                    onClick={() => !isEditing && handleEditMessage(i)}
                  >
                    {isEditing ? (
                      <textarea 
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && saveEdit()}
                        className="bg-transparent border-none outline-none w-full resize-none text-inherit font-inherit"
                        rows={Math.max(1, editValue.split('\n').length)}
                      />
                    ) : (
                      msg.content
                    )}
                  </motion.div>
                );
              })}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl self-start rounded-tl-none flex gap-1 shadow-lg"
                >
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Actions */}
          <AnimatePresence>
            {showQuickActions && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="grid grid-cols-4 gap-3 mb-4"
              >
                {[
                  { icon: <HandMetal size={20} />, label: '牵手', color: 'bg-rose-100 text-rose-500' },
                  { icon: <Gift size={20} />, label: '送礼', color: 'bg-blue-100 text-blue-500', action: () => setShowGiftSelection(true) },
                  { icon: <Gamepad2 size={20} />, label: '小游戏', color: 'bg-indigo-100 text-indigo-500' },
                  { icon: <Smile size={20} />, label: '摸头', color: 'bg-amber-100 text-amber-500' },
                ].map((action) => (
                  <button 
                    key={action.label}
                    onClick={() => {
                      if (action.action) {
                        action.action();
                      } else {
                        setIsInteracting(true);
                        setInteractionMood(action.label === '送礼' ? '惊喜' : '害羞');
                        setTimeout(() => setIsInteracting(false), 3000);
                      }
                      setShowQuickActions(false);
                      
                      // Trigger a smart capture chance
                      if (Math.random() > 0.7) {
                        handleCapture(true);
                      }
                    }}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", action.color)}>
                      {action.icon}
                    </div>
                    <span className="text-[10px] text-white font-bold drop-shadow-md">{action.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Bar */}
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-xl backdrop-blur-md border border-white/30 transition-all shrink-0",
                showQuickActions ? "bg-rose-400 text-white" : "bg-white/20 text-white"
              )}
            >
              <Plus size={18} className={cn("transition-transform", showQuickActions && "rotate-45")} />
            </button>
            
            <div className="flex-1 min-w-0 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 px-2 flex items-center gap-1.5 h-9">
              <button 
                onClick={() => setIsNarrationMode(!isNarrationMode)}
                className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors shrink-0",
                  isNarrationMode ? "bg-rose-400 border-rose-300 text-white" : "bg-white/20 border-white/30 text-white/60"
                )}
              >
                旁白
              </button>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={isNarrationMode ? "输入动作..." : "说点什么..."}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/40 text-[11px] py-1 min-w-0"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="text-white/60 hover:text-white disabled:opacity-30 transition-colors shrink-0"
              >
                <Send size={16} />
              </button>
            </div>

            <button 
              onClick={() => handleGenerateReply().catch(err => console.error("Generate reply failed:", err))}
              disabled={isTyping || messages.length === 0}
              className="w-9 h-9 flex items-center justify-center bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-xl shadow-lg shadow-rose-400/30 disabled:opacity-50 disabled:shadow-none transition-all shrink-0"
              title="生成回复"
            >
              {isTyping ? (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles size={18} />
                </motion.div>
              ) : (
                <Sparkles size={18} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-sm space-y-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-black text-slate-800 text-center">见面预设</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">最少字数</label>
                    <input type="number" className="w-full bg-slate-50 p-2 rounded-xl text-xs font-bold" value={meetingSettings.minLen} onChange={e => setMeetingSettings({...meetingSettings, minLen: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">最多字数</label>
                    <input type="number" className="w-full bg-slate-50 p-2 rounded-xl text-xs font-bold" value={meetingSettings.maxLen} onChange={e => setMeetingSettings({...meetingSettings, maxLen: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-slate-400 block mb-1">文风预设</label>
                   <select className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold" value={meetingSettings.style} onChange={e => setMeetingSettings({...meetingSettings, style: e.target.value})}>
                     {['小说文风', '日常风格', '剧本风格', '诗意风格'].map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-[10px] font-bold text-slate-400 block mb-1">人称设置</label>
                   <select className="w-full bg-slate-50 p-3 rounded-xl text-xs font-bold" value={meetingSettings.perspective} onChange={e => setMeetingSettings({...meetingSettings, perspective: e.target.value})}>
                     {['第一人称', '第二人称', '第三人称'].map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
              </div>
              <button onClick={() => saveMeetingSettings(meetingSettings)} className="w-full py-3 bg-pink-500 text-white rounded-2xl font-black text-sm">保存</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showGiftSelection && (
          <div className="absolute inset-0 z-[130] flex items-end justify-center bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full rounded-t-[40px] p-8 space-y-6 max-h-[70%] flex flex-col pointer-events-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800">选择礼物</h3>
                <button onClick={() => setShowGiftSelection(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-4 no-scrollbar">
                {purchasedProducts.length === 0 ? (
                  <div className="col-span-3 py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
                    <Gift size={48} className="opacity-20" />
                    <p className="text-sm font-bold">还没有购买过商品哦</p>
                  </div>
                ) : (
                  purchasedProducts.map(product => (
                    <button 
                      key={product.id}
                      onClick={() => handleSendGift(product).catch(err => console.error("Send gift failed:", err))}
                      className="flex flex-col gap-2 group"
                    >
                      <div className="aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group-active:scale-95 transition-transform">
                        <img src={product.image} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 line-clamp-1">{product.name}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Capture Flash Effect */}
      <AnimatePresence>
        {isCapturing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-[100] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Captured Photo Card Modal */}
      <AnimatePresence>
        {capturedPhoto && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-4 rounded-[32px] shadow-2xl w-full max-w-sm space-y-4"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
                <img src={capturedPhoto.url} className="w-full h-full object-cover" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1">
                  <div className="text-white font-bold text-lg drop-shadow-md">{theme}</div>
                  <div className="text-white/80 text-[10px] font-medium drop-shadow-md">
                    {new Date().toLocaleDateString()} · {activeFriends.map(f => f.name).join(' & ')}
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-rose-400/80 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] text-white font-bold">
                  月遇 · 浪漫瞬间
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-slate-600 text-xs italic">“{capturedPhoto.thought || '这一刻的温柔，我会永远记得。'}”</p>
                <button 
                  onClick={() => setCapturedPhoto(null)}
                  className="w-full py-3 bg-rose-400 text-white rounded-2xl font-bold text-sm"
                >
                  保存至相册
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Date Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-[40px] p-8 w-full max-w-md space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-10 h-10 text-rose-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">约会小结</h2>
                <p className="text-slate-400 text-sm">感谢这段美好的陪伴</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">互动时长</span>
                  <div className="text-lg font-bold text-slate-800">{elapsedTime}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">好感度变化</span>
                  <div className="text-lg font-bold text-rose-500">+120</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl col-span-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">精彩瞬间</span>
                  <div className="text-sm font-bold text-slate-700">在{theme}留下了 {capturedPhotosCount} 张珍贵合照</div>
                </div>
              </div>

              <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100 relative">
                <div className="absolute -top-3 left-6 px-3 py-1 bg-rose-400 text-white text-[8px] font-bold rounded-full">
                  {activeFriends[0]?.name} 的感言
                </div>
                <p className="text-rose-600 text-sm font-medium leading-relaxed italic">
                  “和你在一起的时间总是过得很快，希望下次我们还能像今天这样，一起去看更美的风景。”
                </p>
              </div>

              <button 
                onClick={handleFinalizeDate}
                className="w-full py-5 bg-gradient-to-r from-rose-400 to-rose-500 text-white rounded-[32px] font-bold shadow-xl shadow-rose-200"
              >
                结束约会
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default YueyuInteraction;

