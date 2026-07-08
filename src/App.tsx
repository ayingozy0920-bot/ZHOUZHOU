import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Book, 
  BookOpen,
  Settings as SettingsIcon, 
  ShoppingBag, 
  Globe, 
  Smartphone, 
  Calendar as CalendarIcon, 
  Heart, 
  Search,
  Wifi,
  Battery,
  Signal,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  Send,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Image as ImageIcon,
  Brain,
  Check,
  Upload,
  ToggleLeft,
  ToggleRight,
  Palette,
  Lock,
  Unlock,
  BookHeart,
  Moon,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Desktop from './components/Desktop';
import { AppId, AppInfo, Friend, ChatMessage, DesktopItem, AppSettings, ListenTogetherState, Song, ReceivedGift } from './types';
import { useSettings } from './hooks/useSettings';
import { useMemory } from './hooks/useMemory';
import { useFriends } from './hooks/useFriends';
import { useGifts } from './hooks/useGifts';
import { set, get } from 'idb-keyval';
import ChatApp from './components/Apps/Chat';
import SettingsApp from './components/Apps/Settings';
import RainyBackground from './components/Theme/RainyBackground';
import SnowBackground from './components/Theme/SnowBackground';
import MemoryApp from './components/Apps/MemoryApp';
import CharacterHomeApp from './components/Apps/CharacterHomeApp';
import DatingApp from './components/Apps/DatingApp';
import YueyuInteraction from './components/Apps/YueyuInteraction';
import PlaceholderApp from './components/Apps/Placeholder';
import CharacterProfileApp from './components/Apps/CharacterProfileApp';
import WorldBookApp from './components/Apps/WorldBookApp';
import DiaryApp from './components/Apps/DiaryApp';
import WeiboApp from './components/Apps/WeiboApp';
import CheckPhoneApp from './components/Apps/CheckPhoneApp';
import MoonShadowApp from './components/Apps/MoonShadowApp';
import ParallelUniverseApp from './components/Apps/ParallelUniverseApp';
import CalendarApp from './components/Apps/CalendarApp';
import ListenTogether from './components/Apps/ListenTogether';
import PasswordLockScreen from './components/PasswordLockScreen';
import { DynamicEffects } from './components/Theme/DynamicEffects';
import { CatBattery, CatTime, CatProgressBar, CatMusicPlayer } from './components/Theme/CatElements';
import { cn } from './lib/utils';
// AI Integration via Backend Proxy
import { speakText } from './lib/voice';

interface CallState {
  isActive: boolean;
  isMinimized: boolean;
  isCollapsed: boolean;
  friend: Friend | null;
  startTime: number | null;
  type: 'voice' | 'video';
  isAccepted: boolean;
  isMicMuted: boolean;
  isCameraMuted: boolean;
}

const APPS: AppInfo[] = [
  { id: 'chat', name: '聊天', icon: 'MessageCircle', color: 'bg-green-500' },
  { id: 'phone', name: '电话', icon: 'Phone', color: 'bg-green-600' },
  { id: 'world-book', name: '世界书', icon: 'Book', color: 'bg-indigo-500' },
  { id: 'meituan', name: '休息室', icon: 'ShoppingBag', color: 'bg-yellow-400' },
  { id: 'weibo', name: '微博', icon: 'Globe', color: 'bg-red-500' },
  { id: 'shopping', name: '购物', icon: 'ShoppingBag', color: 'bg-orange-500' },
  { id: 'parallel-universe', name: '平行时空', icon: 'Globe', color: 'bg-purple-600' },
  { id: 'check-phone', name: '查手机', icon: 'Smartphone', color: 'bg-slate-700' },
  { id: 'dating', name: '月遇', icon: 'Heart', color: 'bg-pink-500' },
  { id: 'calendar', name: '日历', icon: 'CalendarIcon', color: 'bg-white text-red-500' },
  { id: 'diary', name: '心动日记', icon: 'Heart', color: 'bg-rose-400' },
  { id: 'settings', name: '设置', icon: 'SettingsIcon', color: 'bg-slate-400' },
  { id: 'memory', name: '记忆库', icon: 'Brain', color: 'bg-purple-500' },
  { id: 'character-profile', name: '角色资料', icon: 'BookHeart', color: 'bg-pink-300' },
  { id: 'moon-shadow', name: '月影', icon: 'Moon', color: 'bg-slate-900' },
];

const IconMap: Record<string, any> = {
  MessageCircle,
  Phone,
  Book,
  BookOpen,
  SettingsIcon,
  ShoppingBag,
  Globe,
  Smartphone,
  CalendarIcon,
  Heart,
  Search,
  Brain,
  BookHeart,
  Moon,
  Cloud
};

export default function App() {
  const [activeApp, setActiveApp] = useState<AppId>('home');
  const [activeAppData, setActiveAppData] = useState<any>(null);
  const [time, setTime] = useState(new Date());
  const { settings, saveSettings, isLoaded } = useSettings();
  const { friends, addMessage, user, updateFriend, addTransaction, chats } = useFriends();
  const { addGift } = useGifts();
  const { addOnlineMemory, addOfflinePlot, getFriendMemory } = useMemory();

  const handleBackToHome = React.useCallback(() => setActiveApp('home'), []);

  useEffect(() => {
    // Override window.alert to prevent SecurityError in iframes
    const originalAlert = window.alert;
    window.alert = (msg) => {
      try {
        originalAlert(msg);
      } catch (e) {
        console.warn('window.alert blocked:', e, 'Message was:', msg);
        // Fallback for when alert is blocked
        console.error("Alert:", msg);
      }
    };
    return () => { window.alert = originalAlert; };
  }, []);

  useEffect(() => {
    const handleReceiveGift = (e: any) => {
      if (e.detail) {
        // Map event detail to ReceivedGift interface
        const gift: ReceivedGift = {
          id: e.detail.id,
          productId: e.detail.productId || '',
          name: e.detail.name,
          image: e.detail.image || e.detail.coverUrl || '',
          timestamp: e.detail.timestamp || e.detail.receivedAt || Date.now(),
          from: e.detail.from || '系统',
          characterReaction: e.detail.characterReaction || e.detail.characterThoughts || '',
          friendId: e.detail.friendId,
          // Legacy fields
          boxId: e.detail.boxId,
          coverUrl: e.detail.coverUrl,
          receivedAt: e.detail.receivedAt,
          characterThoughts: e.detail.characterThoughts
        };
        addGift(gift);
      }
    };
    window.addEventListener('zhouzhou_ji_receive_gift', handleReceiveGift);
    return () => {
      window.removeEventListener('zhouzhou_ji_receive_gift', handleReceiveGift);
    };
  }, []);

  const summarizeContent = async (friend: Friend, messages: ChatMessage[], type: 'chat' | 'call' | 'group' | 'offline', customPrompt?: string, range?: { start: number, end: number }) => {
    if (!messages || messages.length === 0) return null;
    try {
      const { getGeminiClient, getGeminiModel } = await import('./lib/gemini');
      const ai = getGeminiClient(settings);
      const now = new Date();
      const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const startTime = new Date(messages[0]?.timestamp || Date.now()).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
      const endTime = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

      const context = messages.slice(-200).map(m => `${m.role === 'user' ? '我' : (friend?.name || '角色')}: ${m.content}`).join('\n');
      
      let roundTitle = '';
      if (range) {
        roundTitle = `【第 ${range.start}-${range.end} 轮对话总结】\n\n`;
      } else if (type === 'chat') {
        const memories = getFriendMemory(friend.id)?.onlineMemories || [];
        const currentSummaryIndex = memories.length;
        const threshold = friend.memorySettings?.summaryThreshold || settings.autoSummaryThreshold || 100;
        const startRound = currentSummaryIndex * threshold + 1;
        const endRound = (currentSummaryIndex + 1) * threshold;
        roundTitle = `【第 ${startRound}-${endRound} 轮对话总结】\n\n`;
      }

      const onlinePrompt = customPrompt || `##停止角色扮演，请根据从【${dateStr} ${startTime}】至当前时间点的全部对话内容，生成一份结构化的剧情总结报告。

报告格式与内容要求：

一、 分时段剧情流水账
请按时间顺序，以分条目形式总结每一轮关键对话。

格式：
[年/月/日]起始时间-结束时间：地点：[具体位置]
-起因： [简述]
-经过： [简述核心互动与对话要点]
-结果： [简述该轮互动的直接后果或进展]
要求：
1. 每条总结需标有序号。
2. 单条总结尽量精简，控制在100字以内。
3. 只收录重要事件与关键转折点，但必须包含所有关键约定、关键物品、关键信息的交接或揭示，禁止省略。

二、 核心要素提炼与分析
在完成分条总结后，请额外生成以下条目的内容：

1. 人设性格复盘：
-核心特质：[例如：外冷内热、骄傲但重诺]
-校准检查：基于所有互动，评估${friend?.name || '角色'}的核心性格表现是否一致。如发现偏离，需在后续互动中立即修正。
2. 不可遗忘的重要节点：
-关键事件/转折点：[按时间顺序列出真正改变关系或推动核心剧情的事件]
-约定与承诺：[记录所有约定，无论大小]
-信物与纪念日：[记录所有重要物品、地点或日期]
3. 关系动态评估：
-当前关系阶段：[参考情感发展系统进行判断]
-关系定性：[用一句话精确定义当前关系]
4. 主要人物互动与关系演进：
-重点总结主要角色之间导致关系变化的显著互动、情感状态变化或关系发展。

行文规范与用途说明：
-采用精炼的语句进行概述。报告中首次登场的人名、地名、特有称号及核心情节要素，需进行突出显示。
-此报告旨在为后续内容创作提供核心参考依据，其首要任务是维护故事线的连贯性、角色行为的稳定性与世界设定的统一性，有效防止关键情节、人物关联与背景设定的遗漏或偏离。
-确保内容客观中立、条理清晰。所有结论必须严格依据原始素材得出，杜绝任何形式的主观推测或延伸。`;

      const offlineTemplate = `
输出格式必须严格遵守以下模板（不要包含任何其他文字）：

【线下剧情记录】
剧情名称：${messages[0]?.content.slice(0, 20) || '未命名剧情'}...
参与角色：${friend?.name || '角色'}、我
时间：${dateStr}
地点：[请根据对话内容推断地点，如：咖啡馆 / 家里 / 商场 / 公园]

【剧情概要】
（1～3句话概括整个线下发生的事）

【关键互动】
• 发生了什么重要动作
• 角色说了什么关键话
• 用户做了什么选择
• 两人关系/氛围变化

【重要细节】
• 穿着/外貌
• 环境/氛围
• 小礼物/小动作/小甜蜜
• 角色情绪状态

【剧情总结（给角色记忆）】
（提炼成角色能记住的核心内容，不少于三百字。请详细描述情感变化、重要对话和未来可能的伏笔。）
`;

      const finalPrompt = customPrompt 
        ? `${customPrompt}\n\n${type === 'offline' ? offlineTemplate : onlinePrompt}\n\n对话内容：\n${context}` 
        : `${type === 'offline' ? `你现在是${friend.name}的记忆助手。请根据以下线下剧情内容进行详细总结。\n${offlineTemplate}` : onlinePrompt}\n\n对话内容：\n${context}`;

      const response = await ai.models.generateContent({
        model: (await import('./lib/gemini')).getGeminiModel(settings),
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
        config: {
          temperature: 0.3
        }
      });

      let summaryText = "";
      try {
        summaryText = response.text || "";
      } catch (e) {
        console.warn('Summarize access failed:', e);
      }
      
      if (!summaryText && response.candidates?.[0]?.content?.parts?.[0]?.text) {
        summaryText = response.candidates[0].content.parts[0].text;
      }

      return summaryText ? roundTitle + summaryText : null;
    } catch (e: any) {
      console.error("Summarize error:", e);
      return null;
    }
  };
  const [showPassword, setShowPassword] = useState(false);
  const [isLocked, setIsLocked] = useState(true);

  // Check if password exists
  useEffect(() => {
    const checkLockStatus = () => {
      let savedPassword = localStorage.getItem('lockScreenPassword');
      const settingsPin = settings.lockScreenPin;
      
      // Default password 0920
      if (!savedPassword && !settingsPin) {
        localStorage.setItem('lockScreenPassword', '0920');
        savedPassword = '0920';
      }

      // Sync setting to localStorage if it's in settings but not in localStorage
      if (settingsPin && !savedPassword) {
        localStorage.setItem('lockScreenPassword', settingsPin);
      }

      if (settings.lockScreenEnabled === false) {
        setIsLocked(false);
      } else {
        // 默认开启锁定，只要有密码就锁定
        setIsLocked(true);
      }
    };
    
    if (isLoaded) {
      checkLockStatus();
    }
  }, [isLoaded, settings.lockScreenPin, settings.lockScreenEnabled]);

  // Re-check lock when data is imported
  useEffect(() => {
    const handleImport = () => {
      setTimeout(() => {
        const savedPassword = localStorage.getItem('lockScreenPassword');
        if (savedPassword) setIsLocked(true);
      }, 500);
    };
    window.addEventListener('data-imported', handleImport);
    return () => window.removeEventListener('data-imported', handleImport);
  }, []);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.warn('Unhandled promise rejection:', event.reason);
      if (event.reason instanceof Error) {
        console.error(event.reason.stack);
      } else {
        console.error(JSON.stringify(event.reason));
      }
      // Prevent the default browser error logging
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  const handleUnlock = () => {
    setIsLocked(false);
    setShowPassword(false);
  };
  const [listenTogetherState, setListenTogetherState] = useState<ListenTogetherState>({
    isActive: false,
    isFolded: false,
    currentSongId: null,
    isPlaying: false,
    playlist: [],
    playbackMode: 'loop',
    startTime: null,
    isAccepted: false,
    friendId: null,
    currentTime: 0,
  });

  // Load Listen Together State
  useEffect(() => {
    get('listenTogetherState').catch(err => console.error("IDB get error:", err)).then(saved => {
      if (saved) {
        // Restore Object URLs for local files
        const restoredPlaylist = (saved.playlist || []).map((song: Song) => {
          if (song.localFile instanceof Blob) {
            return { ...song, mediaUrl: URL.createObjectURL(song.localFile) };
          }
          return song;
        });

        setListenTogetherState(prev => ({
          ...saved,
          playlist: restoredPlaylist,
          isActive: false, // Don't auto-start on reload
          isPlaying: false,
          currentTime: 0
        }));
      }
    }).catch(err => console.error(err));
  }, []);

  // Save Listen Together State
  useEffect(() => {
    set('listenTogetherState', listenTogetherState).catch(err => console.error("Failed to save listenTogetherState:", err));
  }, [listenTogetherState]);

  // Handle Listen Together Session Summary
  const prevIsActive = useRef(false);
  useEffect(() => {
    if (prevIsActive.current && !listenTogetherState.isActive && listenTogetherState.startTime && listenTogetherState.friendId) {
      const duration = Math.floor((Date.now() - listenTogetherState.startTime) / 1000);
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      
      addMessage(listenTogetherState.friendId, {
        role: 'system',
        content: `一起听结束。本次共听歌 ${mins} 分 ${secs} 秒 🎵`,
        type: 'text',
        timestamp: Date.now()
      });
      
      setListenTogetherState(prev => ({ ...prev, startTime: null, isAccepted: false }));
    }
    prevIsActive.current = listenTogetherState.isActive;
  }, [listenTogetherState.isActive, listenTogetherState.startTime, listenTogetherState.friendId, addMessage]);
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isMinimized: false,
    isCollapsed: false,
    friend: null,
    startTime: null,
    type: 'video',
    isAccepted: false,
    isMicMuted: false,
    isCameraMuted: false
  });
  const [lastCallResult, setLastCallResult] = useState<{ friendId: string; status: 'rejected' | 'ended' | 'missed'; duration: number } | null>(null);
  const [callMessages, setCallMessages] = useState<string[]>([]);
  const callScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (callScrollRef.current) {
      callScrollRef.current.scrollTop = callScrollRef.current.scrollHeight;
    }
  }, [callMessages]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [showCallSettings, setShowCallSettings] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const callBgInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  // Handle Listen Together Audio
  useEffect(() => {
    if (!musicAudioRef.current) return;
    const audio = musicAudioRef.current;

    const currentSong = listenTogetherState.playlist.find(s => s.id === listenTogetherState.currentSongId);
    if (currentSong && currentSong.mediaUrl !== audio.src) {
      audio.src = currentSong.mediaUrl;
      audio.load();
    }

    if (listenTogetherState.isPlaying && listenTogetherState.isActive) {
      audio.play().catch(e => console.warn("Audio play failed:", e));
    } else {
      audio.pause();
    }
  }, [listenTogetherState.currentSongId, listenTogetherState.isPlaying, listenTogetherState.isActive]);

  useEffect(() => {
    if (!musicAudioRef.current) return;
    const audio = musicAudioRef.current;

    const handleLoadedMetadata = () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      setListenTogetherState(prev => {
        const newPlaylist = prev.playlist.map(s => {
          if (s.id === prev.currentSongId) {
            return { ...s, duration: audio.duration };
          }
          return s;
        });
        return { ...prev, playlist: newPlaylist };
      });
    };

    const handleTimeUpdate = () => {
      setListenTogetherState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleEnded = () => {
      // Handle next song based on playback mode
      setListenTogetherState(prev => {
        if (prev.playlist.length === 0) return { ...prev, isPlaying: false };
        
        let nextIndex = 0;
        const currentIndex = prev.playlist.findIndex(s => s.id === prev.currentSongId);

        if (prev.playbackMode === 'single') {
          audio.currentTime = 0;
          audio.play().catch(e => console.error("Audio play failed:", e));
          return prev;
        } else if (prev.playbackMode === 'random') {
          nextIndex = Math.floor(Math.random() * prev.playlist.length);
        } else {
          nextIndex = (currentIndex + 1) % prev.playlist.length;
        }

        return { ...prev, currentSongId: prev.playlist[nextIndex].id };
      });
    };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('canplay', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        
        return () => {
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('canplay', handleLoadedMetadata);
          audio.removeEventListener('ended', handleEnded);
        };
      }, [musicAudioRef, listenTogetherState.currentSongId]);

  // Slide to unlock logic
  const x = useMotionValue(0);
  const xInput = [0, 200];
  const opacity = useTransform(x, xInput, [1, 0]);
  const unlockProgress = useTransform(x, xInput, [0, 1]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = unlockProgress.on("change", (latest) => {
      if (latest >= 1) {
        // 只要是锁定状态，滑动解锁就进入密码界面（因为默认有 0920）
        setShowPassword(true);
        x.set(0);
      }
    });
    return () => unsubscribe();
  }, [unlockProgress, x]);

  useEffect(() => {
    // 处理全屏 API
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (settings.fullScreenMode) {
      window.scrollTo(0, 0);
      document.documentElement.classList.add('is-fullscreen');
      document.body.classList.add('is-fullscreen');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#000000');
    } else {
      document.documentElement.classList.remove('is-fullscreen');
      document.body.classList.remove('is-fullscreen');
      if (themeColorMeta) themeColorMeta.setAttribute('content', settings.themeId === 'rainy-cat' ? '#1a1a1a' : '#0f172a');
    }

    const handleFsChange = () => {
      console.log('[Fullscreen] Fullscreen state changed, current element:', document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.body.classList.remove('is-fullscreen');
      document.documentElement.classList.remove('is-fullscreen');
    };
  }, [settings.fullScreenMode]);

  const handleCallBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 720;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          saveSettings({ ...settings, callBackground: dataUrl });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStartCall = (friend: Friend, type: 'voice' | 'video') => {
    setCallState({
      isActive: true,
      isMinimized: false,
      isCollapsed: false,
      friend,
      startTime: null,
      type,
      isAccepted: false,
      isMicMuted: false,
      isCameraMuted: false
    });
    setCallMessages([]);

    // Simulate AI answering after a short delay
    setTimeout(() => {
      setCallState(prev => {
        if (prev.isActive && !prev.isAccepted) {
          return { ...prev, isAccepted: true, startTime: Date.now() };
        }
        return prev;
      });
      setCallMessages([`${friend.name} 已加入通话`]);
    }, 3000);
  };

  const handleEndCall = async (status: 'rejected' | 'ended' | 'missed' = 'ended') => {
    const duration = callState.startTime ? Math.floor((Date.now() - callState.startTime) / 1000) : 0;
    
    if (callState.friend) {
      setLastCallResult({
        friendId: callState.friend.id,
        status,
        duration
      });

      // Auto-summarize call to memory
      if (status === 'ended' && duration > 2) { // Lower threshold for awareness
        const callMsgs: ChatMessage[] = callMessages.map(m => ({
          role: m.startsWith('You:') ? 'user' : 'assistant',
          content: m.replace(/^(You:|[^:]+:)\s*/, ''),
          timestamp: Date.now()
        }));
        summarizeContent(callState.friend, callMsgs, 'call', callState.friend.memorySettings?.summaryPrompt).then(summary => {
          if (summary && callState.friend) {
            addOnlineMemory(callState.friend.id, summary, 'auto', 'chat');
            // Add a system record to ensure awareness in next chat turn
            addMessage(callState.friend.id, {
              role: 'system',
              content: `【${callState.type === 'video' ? '视频' : '语音'}通话摘要】此次通话时长${duration}秒。核心交流内容：${summary}`,
              timestamp: Date.now(),
              type: 'text'
            });
          }
        });
      }
    }

    setCallState(prev => ({ ...prev, isActive: false, isMinimized: false }));
    setShowCallSettings(false);
  };

  const handleAcceptCall = () => {
    setCallState(prev => ({ ...prev, isAccepted: true, startTime: Date.now() }));
  };

  const handleAiResponse = async (userText: string, isSpoken: boolean = false) => {
    if (!callState.friend) return;
    setIsAiResponding(true);
    const displayMsg = isSpoken ? `[语音] ${userText}` : userText;
    setCallMessages(prev => [...prev, `You: ${displayMsg}`]);
    
    try {
      const { getGeminiClient, getGeminiModel } = await import('./lib/gemini');
      const ai = getGeminiClient(settings);
      
      // Get recent chat history to provide context for the call
      const recentChatContext = chats[callState.friend?.id || '']?.slice(-15).filter(m => m.role !== 'system').map(m => 
        `${m.role === 'user' ? '用户' : callState.friend?.name}: ${m.content}`
      ).join('\n') || '无近期聊天记录';

      // Get recent memories
      const friendMemory = getFriendMemory(callState.friend?.id || '');
      const recentMemories = friendMemory.onlineMemories.slice(0, 5).map(m => m.content).join('\n') || '无相关记忆';

      // Get current call history (the last 10 messages from the current session)
      const currentCallHistory = callMessages.slice(-10).map(msg => {
        const isUser = msg.startsWith('You:');
        const content = msg.replace(/^(You:|[^:]+:)\s*/, '');
        return {
          role: (isUser ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: content }]
        };
      });

      let systemPrompt = `你现在正与用户进行实时${callState.type === 'video' ? '视频' : '语音'}通话。
角色：${callState.friend?.name || '角色'}
人设：${callState.friend?.persona || '伙伴'}

【近期文字聊天背景】
${recentChatContext}

【近期关键记忆】
${recentMemories}

【通话环境/指令】
1. 你正处于通话过程中，声音和神态要自然，像在真实互动。
2. 绝对记住文字聊天和通话记录的所有细节，保持对话逻辑连贯，增强上下文粘性，决不能自说自话或复述旧话。
3. 展现出你对文字聊天内容的清晰记忆，主动提及之前聊过的话题。
4. 严禁复述自己说过的话，要根据用户的输入做出具有高度针对性的、感性的反馈。
5. 若用户沉默或简短回应，你可以微笑着引导话题，谈论你们共同的记忆或近期文字聊天中的趣事。
`;

      // Add World Book Entries
      const worldBookEntries = settings.worldBookEntries || [];
      const activeEntries = worldBookEntries.filter(e => 
        e.isEnabled && (e.scope === 'global' || (e.scope === 'character' && (e.linkedCharacterIds || []).includes(callState.friend?.profileId || '')))
      );

      if (activeEntries.length > 0) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        activeEntries.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

        systemPrompt += `\n【世界设定】\n`;
        activeEntries.forEach(entry => {
          systemPrompt += `\n[${entry.category}] ${entry.name}\n${entry.content}\n`;
        });
      }

      if (settings.timeAwarenessEnabled) {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN', { 
          year: 'numeric', month: '2-digit', day: '2-digit', 
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          weekday: 'long'
        });
        systemPrompt += `\n当前时间：${timeString}。`;
        if (callState.friend.address) {
          systemPrompt += ` 位置：${callState.friend.address}。`;
        }
      }
      
      systemPrompt += `

当前处于通话状态，请表现得像是在真实${callState.type === 'video' ? '视频' : '语音'}连线中。你应该记住并延续之前文字聊天中的话题和氛围。

【极度增强活人感与情感机制 (CRITICAL)】
- **去掉机器感：** 绝对拒绝教科书式回答，拒绝刻板书面语。语言贴合普通人日常聊天语气，高度口语化、自然松弛，会使用大量的口语语气词（嗯、啊、哎呀、啧、欸等）。
- **真实互动与情绪变化：** 情绪必须受当前对话剧烈影响：被关心会软下来，被调侃会害羞或反击，无聊会慵懒敷衍。会接梗、会撒娇、会打趣、会轻微拌嘴。
- **生活化碎碎念：** 会主动分享细碎日常，下意识吐槽，随口感慨，像真实的恋人或朋友一样发牢骚。
- **高度连贯性：** 紧密承接上一句，绝不答非所问！

对话要求：
1. 回复需极其简短（建议15-30字以内），适合语音输出。
2. 严禁使用旁白、星号动作描写或括号及括号内的文字（如：*脸红*、(笑)、(动作描写) 等）。
3. 直接输出你对用户说的话。
4. 语气要自然、生活化。

用户${isSpoken ? '说' : '输入'}了：${userText}`;

      // 1. Generate Text Response via Direct Gemini SDK
      let response;
      try {
        response = await ai.models.generateContent({
          model: (await import('./lib/gemini')).getGeminiModel(settings),
          contents: [
            ...currentCallHistory,
            { role: 'user', parts: [{ text: userText || "你好？" }] }
          ],
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.9, // SLIGHTLY higher for more natural flow
            topP: 0.8,
            maxOutputTokens: 100
          }
        });
      } catch (err: any) {
        if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('quota')) {
          setCallMessages(prev => [...prev, `${callState.friend?.name || '角色'}: (网络忙碌中，请稍后再试...)`]);
          setIsAiResponding(false);
          return;
        }
        throw err;
      }

      let text = "";
      try {
        text = response.text || "";
      } catch (e) {
        console.warn('Call text access failed:', e);
      }
      
      if (!text && response.candidates?.[0]?.content?.parts?.[0]?.text) {
        text = response.candidates[0].content.parts[0].text;
      }

      if (!text) text = "对方由于网络原因暂时没有回应";

      setCallMessages(prev => [...prev, `${callState.friend?.name || '角色'}: ${text}`]);

      // 2. Generate Audio Response (TTS)
      speakText(text, callState.friend?.voiceId, callState.friend?.voiceType, settings).catch(err => console.error(err));
    } catch (err) {
      console.error("AI Call Response Error:", err);
    } finally {
      setIsAiResponding(false);
    }
  };

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Uncaught error:", event.error);
    };
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      if (event.reason instanceof Error) {
        console.error(event.reason.stack);
      } else {
        console.error(JSON.stringify(event.reason));
      }
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-sm text-white/60">加载系统数据...</p>
        </div>
      </div>
    );
  }

  const handleOpenApp = (appId: AppId, data?: any) => {
    setActiveApp(appId);
    setActiveAppData(data);
  };

  const renderActiveApp = () => {
    const activeFriend = friends.find(f => f.id === listenTogetherState.friendId) || friends[0];
    
    return (
      <>
        {listenTogetherState.isActive && (
          <ListenTogether 
            state={listenTogetherState}
            setState={setListenTogetherState}
            friend={activeFriend}
            user={user}
            settings={settings}
            onSendMessage={(msg) => {
              if (listenTogetherState.friendId) {
                addMessage(listenTogetherState.friendId, msg);
              }
            }}
          />
        )}
        {(() => {
          switch (activeApp) {
            case 'moon-shadow':
              return <MoonShadowApp settings={settings} onBack={handleBackToHome} />;
            case 'chat':
              return (
                <ChatApp 
                  settings={settings} 
                  onBack={() => setActiveApp('home')} 
                  onStartCall={handleStartCall}
                  externalCallStatus={lastCallResult}
                  onClearCallStatus={() => setLastCallResult(null)}
                  summarizeContent={summarizeContent}
                  onUpdateSettings={saveSettings}
                  listenTogetherState={listenTogetherState}
                  onUpdateListenTogether={setListenTogetherState}
                  onOpenApp={handleOpenApp}
                />
              );
            case 'phone':
              return (
                <PhoneApp 
                  settings={settings} 
                  onBack={() => setActiveApp('home')} 
                  onStartCall={handleStartCall}
                />
              );
            case 'settings':
              return <SettingsApp settings={settings} onSave={saveSettings} onBack={() => setActiveApp('home')} apps={APPS} />;
            case 'calendar':
              return (
                <CalendarApp 
                  settings={settings} 
                  onBack={() => setActiveApp('home')} 
                  friends={friends} 
                  onUpdateSettings={saveSettings}
                  onUpdateFriend={updateFriend}
                />
              );
            case 'character-profile':
              return <CharacterProfileApp settings={settings} onSave={saveSettings} onBack={() => setActiveApp('home')} />;
            case 'world-book':
              return <WorldBookApp settings={settings} onSave={saveSettings} onBack={() => setActiveApp('home')} />;
            case 'diary':
              return <DiaryApp settings={settings} onSave={saveSettings} onBack={() => setActiveApp('home')} />;
            case 'weibo':
              return <WeiboApp settings={settings} onBack={() => setActiveApp('home')} />;
            case 'check-phone':
              return <CheckPhoneApp settings={settings} onBack={() => setActiveApp('home')} />;
            case 'parallel-universe':
              return <ParallelUniverseApp 
                settings={settings} 
                onBack={() => setActiveApp('home')} 
              />;
            case 'memory':
              return <MemoryApp friends={friends} settings={settings} onBack={() => setActiveApp('home')} />;
            case 'meituan':
              return <CharacterHomeApp settings={settings} friends={friends} onBack={() => setActiveApp('home')} />;
            case 'dating':
              return (
                <DatingApp 
                  settings={settings} 
                  friends={friends} 
                  chats={chats}
                  onBack={() => { setActiveApp('home'); setActiveAppData(null); }} 
                  addOnlineMemory={addOnlineMemory}
                  addOfflinePlot={addOfflinePlot}
                  addTransaction={addTransaction}
                  addMessage={addMessage}
                  initialData={activeAppData}
                />
              );
            case 'home':
              return null;
            default:
              const app = APPS.find(a => a.id === activeApp);
              return <PlaceholderApp name={app?.name || '应用'} onBack={() => setActiveApp('home')} />;
          }
        })()}
      </>
    );
  };

  const getFontFamily = () => {
    if (settings.customFontUrl) return 'CustomFont, sans-serif';
    switch (settings.fontFamily) {
      case 'serif': return '"Playfair Display", serif';
      case 'mono': return '"JetBrains Mono", monospace';
      case 'rounded': return '"Quicksand", sans-serif';
      case 'cute-cheese': return '"ZCOOL KuaiLe", cursive';
      case 'dynalight': return '"Dynalight", cursive';
      case 'lxgw-wenkai': return '"LXGW WenKai TC", serif';
      default: return '"Inter", sans-serif';
    }
  };

  return (
    <div 
      className={cn(
        "flex flex-col selection:bg-blue-100 transition-all duration-500",
        settings.fullScreenMode ? "w-screen h-dvh overflow-hidden fixed inset-0 z-[9999]" : "w-full min-h-screen bg-slate-900 py-10 px-4"
      )}
      style={{ 
        fontFamily: getFontFamily(),
        fontSize: settings.fontSize === 'small' ? '12px' : settings.fontSize === 'large' ? '18px' : '14px'
      }}
    >
      {settings.customFontUrl && (
        <style>
          {`
            @font-face {
              font-family: 'CustomFont';
              src: url('${settings.customFontUrl}');
            }
          `}
        </style>
      )}

      {settings.customGlobalCss && (
        <style>{settings.customGlobalCss}</style>
      )}

      {settings.customBubbleCss && (
        <style>{settings.customBubbleCss}</style>
      )}

      <style>
        {`
          .is-fullscreen {
            margin: 0 !important;
            padding: 0 !important;
            width: 100vw !important;
            min-height: 100vh !important;
            min-height: 100dvh !important;
            background-color: #000;
          }
          .fullscreen-immersive {
            width: 100vw !important;
            min-height: 100vh !important;
            min-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            margin: 0 !important;
          }
          .safe-area-padding-top {
            padding-top: env(safe-area-inset-top);
          }
          .safe-area-padding-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        `}
      </style>

      {/* Hidden Audio for Listen Together */}
      <audio ref={musicAudioRef} className="hidden" />

      {/* ✨粥粥机✨ Mockup Container */}
      <div className={cn(
        "flex-1 flex flex-col items-center w-full max-w-full overflow-hidden",
        settings.fullScreenMode ? "h-full" : "justify-center"
      )}>
        <div 
          className={cn(
            "relative overflow-hidden flex flex-col transition-all duration-500",
            settings.themeId === 'rainy-cat' && "grayscale-[0.2] contrast-[0.9]",
            settings.themeId === 'pink-cat' && "cute-rabbit-theme",
            settings.themeId === 'ocean-blue' && "ocean-snow-theme",
            settings.fullScreenMode 
              ? "fullscreen-immersive" 
              : "w-full max-w-[380px] h-[min(800px,90dvh)] min-h-[600px] sm:min-h-[700px] rounded-[24px] sm:rounded-[40px] border-[2px] sm:border-[4px] border-[#333] shadow-2xl my-4"
          )}
        style={{ 
          background: settings.themeId === 'pink-cat' ? '#fffafb' : settings.themeId === 'ocean-blue' ? '#f0f9ff' : '#000',
          transform: 'translateZ(0)', // Force fixed elements to stay within this container
        }}
      >
        {/* Notch (刘海) */}
        {!settings.fullScreenMode && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-4 bg-black rounded-b-xl z-[150] flex items-center justify-center">
            <div className="w-4 h-1 bg-white/10 rounded-full" />
          </div>
        )}
        {/* Dynamic Wallpaper */}
        <div 
          className="absolute inset-0 z-0 transition-all duration-700"
          style={{ 
            backgroundImage: (activeApp === 'home' && settings.homeWallpaperUrl) 
              ? `url(${settings.homeWallpaperUrl})` 
              : (activeApp === 'settings' && settings.settingsBackgroundUrl)
                ? `url(${settings.settingsBackgroundUrl})`
                : (activeApp === 'chat' && settings.appBackgroundUrl)
                  ? `url(${settings.appBackgroundUrl})`
                  : (settings.wallpaperUrl ? `url(${settings.wallpaperUrl})` : 'none'),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: `blur(${
              activeApp === 'home' 
                ? (settings.homeWallpaperBlur ?? 0) 
                : activeApp === 'settings' 
                  ? (settings.settingsBackgroundBlur ?? 0)
                  : activeApp === 'chat'
                    ? (settings.chatWallpaperBlur ?? 0)
                    : (settings.backgroundBlurIntensity ?? 0)
            }px) ${settings.themeId === 'rainy-cat' ? 'brightness(0.9) saturate(0.7)' : ''}`,
            opacity: ((activeApp === 'home' && settings.homeWallpaperUrl) || (activeApp === 'settings' && settings.settingsBackgroundUrl) || (activeApp === 'chat' && settings.appBackgroundUrl) || settings.wallpaperUrl) 
              ? (1 - (
                  activeApp === 'home' 
                    ? (settings.homeWallpaperOpacity ?? 0)
                    : activeApp === 'settings'
                      ? (settings.settingsBackgroundOpacity ?? 0)
                      : activeApp === 'chat'
                        ? (settings.chatWallpaperOpacity ?? 0)
                        : (settings.backgroundOpacity ?? 0)
                )) 
              : 0
          }}
        />
        
        {/* Effects */}
        {settings.themeId === 'rainy-cat' && <RainyBackground />}
        {settings.themeId === 'pink-cat' && <DynamicEffects />}
        {settings.themeId === 'ocean-blue' && <SnowBackground />}
        
        {/* Status Bar */}
        {!settings.hideStatusBar && (
          <div className={cn(
            "w-full flex items-center justify-between px-4 pt-2 pb-1 z-[10001] pointer-events-none transition-all duration-500",
            (settings.fullScreenMode) ? "absolute top-0 left-0 right-0 bg-transparent safe-area-padding-top" : "relative bg-black/20 backdrop-blur-md"
          )}>
            {/* Left: Time */}
            <div className="flex items-center justify-start">
              {settings.themeId === 'rainy-cat' ? (
                <CatTime time={time} />
              ) : (
                <span className={cn(
                  "text-sm font-bold tracking-tight",
                  settings.themeId === 'normal' && !settings.fullScreenMode ? "text-white" : 
                  settings.themeId === 'normal' ? "text-slate-900" : "text-white"
                )}>
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              )}
            </div>

            {/* Center: Camera Punch Hole (Android Style) - Hidden in Fullscreen */}
            {!settings.fullScreenMode && (
              <div className="flex justify-center">
                <div className="w-4 h-4 rounded-full bg-black shadow-inner" />
              </div>
            )}

            {/* Right: Battery & Signal */}
            <div className="flex items-center justify-end gap-2">
              {settings.themeId === 'rainy-cat' ? (
                <CatBattery level={81} />
              ) : (
                <div className={cn(
                  "flex items-center gap-1.5",
                  (settings.themeId === 'normal' || settings.themeId === 'pink-cat') && !settings.fullScreenMode ? "text-white" : 
                  (settings.themeId === 'normal' || settings.themeId === 'pink-cat') ? "text-slate-900" : "text-white"
                )}>
                  <Signal size={14} />
                  <Wifi size={14} />
                  <div className={cn(
                    "relative w-6 h-3 border rounded-sm flex items-center px-0.5",
                    (settings.themeId === 'normal' || settings.themeId === 'pink-cat') && !settings.fullScreenMode ? "border-white/60" : 
                    (settings.themeId === 'normal' || settings.themeId === 'pink-cat') ? "border-slate-900/40" : "border-white/60"
                  )}>
                    <div className={cn(
                      "h-full rounded-px",
                      (settings.themeId === 'normal' || settings.themeId === 'pink-cat') && !settings.fullScreenMode ? "bg-white" : 
                      (settings.themeId === 'normal' || settings.themeId === 'pink-cat') ? "bg-slate-900" : "bg-white"
                    )} style={{ width: '80%' }} />
                  </div>
                  <span className="text-[11px] font-bold">80%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div 
          className={cn(
            "flex-1 relative overflow-hidden flex flex-col",
            ((activeApp === 'home' && settings.homeWallpaperUrl) || 
             (activeApp === 'chat' && settings.appBackgroundUrl) || 
             (activeApp === 'settings' && settings.settingsBackgroundUrl) || 
             settings.wallpaperUrl) ? "bg-transparent" : (
              settings.themeId === 'pink-cat' ? "bg-[#fffafb]" : (
                settings.themeId === 'ocean-blue' ? "bg-[#f0f9ff]" : (
                  settings.themeId !== 'rainy-cat' && activeApp === 'chat' ? "bg-[#f5f5f5]" :
                  settings.themeId !== 'rainy-cat' && activeApp === 'settings' ? "bg-slate-50" :
                  settings.themeId !== 'rainy-cat' && activeApp === 'calendar' ? "bg-[#FFF0F5]" :
                  settings.themeId !== 'rainy-cat' && activeApp === 'memory' ? "bg-slate-900" : ""
                )
              )
            )
          )}
        >
          {/* Fullscreen Spacer to avoid status bar overlap */}
          {settings.fullScreenMode && activeApp !== 'chat' && <div className="safe-area-padding-top h-11 pointer-events-none" />}
          
          <AnimatePresence mode="wait">
            {isLocked ? (
              <motion.div
                key="lockscreen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -50 }}
                className={cn(
                  "absolute inset-0 z-[60] flex flex-col items-center justify-between py-20 px-8",
                  settings.themeId === 'rainy-cat' && "backdrop-blur-[2px]"
                )}
              >
                <div className="text-center space-y-2">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex justify-center mb-4"
                  >
                    {(settings.themeId === 'rainy-cat' || settings.themeId === 'pink-cat' || settings.themeId === 'ocean-blue') ? (
                      <div className={cn(
                        "w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center border",
                        settings.themeId === 'ocean-blue' ? "bg-sky-100/20 border-sky-200/20 text-sky-400" : "bg-pink-100/20 border-pink-200/20"
                      )}>
                        <Heart className={settings.themeId === 'ocean-blue' ? "text-sky-400" : "text-pink-300"} size={24} />
                      </div>
                    ) : (
                      <Lock className="text-white/80" size={32} />
                    )}
                  </motion.div>
                  <h1 className={cn(
                    "text-6xl font-light text-white tracking-tighter",
                    settings.themeId === 'rainy-cat' && "font-serif italic opacity-60",
                    settings.themeId === 'pink-cat' && "text-[#ff85a2]",
                    settings.themeId === 'ocean-blue' && "text-sky-600"
                  )}>
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </h1>
                  <p className={cn(
                    "text-lg font-medium",
                    settings.themeId === 'rainy-cat' ? "text-white/30 tracking-[0.2em]" : 
                    settings.themeId === 'pink-cat' ? "text-[#ff85a2]/80" : 
                    settings.themeId === 'ocean-blue' ? "text-sky-600/80" : "text-white/80"
                  )}>
                    {time.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                  </p>
                </div>

                {(settings.themeId === 'rainy-cat' || settings.themeId === 'pink-cat') && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-48 h-48 flex items-center justify-center"
                  >
                    <div className={cn("absolute inset-0 border rounded-full animate-pulse", settings.themeId === 'rainy-cat' ? "border-white/5" : "border-pink-200/20")} />
                    <div className={cn("w-32 h-32 border-2 rounded-full relative flex items-center justify-center", settings.themeId === 'rainy-cat' ? "border-white/10" : "border-pink-200/30")}>
                      <div className={cn("w-1.5 h-1.5 rounded-full absolute top-10 left-8", settings.themeId === 'rainy-cat' ? "bg-white/20" : "bg-pink-300/40")} />
                      <div className={cn("w-1.5 h-1.5 rounded-full absolute top-10 right-8", settings.themeId === 'rainy-cat' ? "bg-white/20" : "bg-pink-300/40")} />
                      <div className={cn("w-5 h-2.5 border-b rounded-full absolute top-16", settings.themeId === 'rainy-cat' ? "border-white/10" : "border-pink-300/40")} />
                    </div>
                    {/* Cat Ears */}
                    <div className={cn("absolute top-6 left-12 w-6 h-6 border-t border-l rounded-tl-[15px] rotate-[-15deg]", settings.themeId === 'rainy-cat' ? "border-white/10" : "border-pink-200/30")} />
                    <div className={cn("absolute top-6 right-12 w-6 h-6 border-t border-r rounded-tr-[15px] rotate-[15deg]", settings.themeId === 'rainy-cat' ? "border-white/10" : "border-pink-200/30")} />
                  </motion.div>
                )}

                <div className="w-full space-y-8">
                  <motion.div 
                    className={cn(
                      "relative h-16 rounded-full flex items-center p-1 overflow-hidden cursor-pointer",
                      "bg-white/10 backdrop-blur-md border border-white/10"
                    )}
                    drag="x"
                    dragConstraints={{ left: 0, right: 260 }}
                    dragElastic={0.1}
                    dragMomentum={false}
                    onDragEnd={(e, info) => {
                      if (info.offset.x > 150) {
                        const savedPassword = localStorage.getItem('lockScreenPassword');
                        if (savedPassword || settings.lockScreenPin) {
                          setShowPassword(true);
                        } else {
                          handleUnlock();
                        }
                      }
                      x.set(0);
                    }}
                    style={{ x }}
                  >
                    <motion.div 
                      className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
                      style={{ opacity: opacity }}
                    >
                      <ChevronLeft size={24} className="text-white rotate-180" />
                    </motion.div>
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center text-white/60 font-medium text-sm"
                      style={{ opacity: opacity }}
                    >
                      滑动以解锁
                    </motion.div>
                  </motion.div>

                  {isLocked && showPassword && (
                    <PasswordLockScreen 
                      onUnlock={handleUnlock} 
                      onClose={() => setShowPassword(false)}
                      themeId={settings.themeId}
                      wallpaperUrl={settings.homeWallpaperUrl}
                    />
                  )}
                </div>
              </motion.div>
            ) : activeApp === 'home' ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full w-full relative"
              >
                <Desktop 
                  settings={settings}
                  apps={APPS}
                  iconMap={IconMap}
                  onOpenApp={setActiveApp}
                  onUpdateLayout={(newLayout) => saveSettings({ ...settings, desktopLayout: newLayout })}
                  currentTime={time}
                />

                {/* Dock */}
                <div 
                  className={cn(
                    "absolute bottom-6 left-1/2 -translate-x-1/2 w-[320px] h-20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl transition-all duration-500 z-20",
                    settings.themeId === 'rainy-cat' ? "bg-white/5 border border-white/10" : ""
                  )}
                  style={settings.themeId !== 'rainy-cat' ? { backgroundColor: `rgba(255, 255, 255, ${settings.glassOpacity || 0.2})` } : {}}
                >
                  {APPS.slice(0, 4).map((app) => {
                    const Icon = IconMap[app.icon];
                    const customIcon = settings.customIcons?.[app.id];
                    return (
                      <div key={`dock-${app.id}`} className="relative w-[68px] h-12 flex items-center justify-center">
                        
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setActiveApp(app.id)}
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all overflow-hidden z-10",
                            settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-md border border-white/10" : (!customIcon && app.color)
                          )}
                        >
                          {customIcon ? (
                            <img src={customIcon} className="w-full h-full object-cover" />
                          ) : (
                            <Icon size={24} className={cn(
                              "text-white",
                              settings.themeId === 'rainy-cat' && "text-white/40"
                            )} />
                          )}
                        </motion.button>
                      </div>
                    );
                  })}
                </div>

                {/* Home Indicator */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-50" />
              </motion.div>
            ) : (
              <motion.div
                key="app"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className={cn(
                  "flex-1 flex flex-col z-50 bg-transparent w-full h-full",
                  !settings.fullScreenMode && "pt-6"
                )}
              >
                {renderActiveApp()}
                {/* Home Indicator for Apps */}
                <button 
                  onClick={() => setActiveApp('home')}
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-black/20 hover:bg-black/40 rounded-full z-[110] transition-colors" 
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Full Screen Call UI */}
          <AnimatePresence>
            {callState.isActive && !callState.isMinimized && (
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className={cn(
                  "absolute inset-0 z-[100] flex flex-col text-white overflow-hidden transition-all duration-500",
                  settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl" : "bg-[#FFF5F8]"
                )}
              >
                {/* Background for Call */}
                <div className="absolute inset-0 z-0">
                  {settings.isCallBackgroundEnabled && settings.callBackground ? (
                    <img 
                      src={settings.callBackground} 
                      className={cn(
                        "w-full h-full object-cover transition-all duration-1000",
                        settings.themeId === 'rainy-cat' && "grayscale contrast-125 brightness-50 blur-xl scale-125"
                      )} 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#FFF9FB]" />
                  )}
                  {settings.themeId === 'rainy-cat' && <RainyBackground />}
                </div>

                {/* Call Background */}
                <div className="absolute inset-0 z-0">
                  {callState.type === 'video' ? (
                    <div className="relative w-full h-full">
                      {settings.isCallBackgroundEnabled && settings.callBackground && (
                        <img 
                          src={settings.callBackground} 
                          className={cn(
                            "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                            settings.themeId === 'rainy-cat' ? "opacity-40 grayscale-[0.3] blur-[2px]" : "opacity-100"
                          )}
                        />
                      )}
                      {settings.themeId === 'rainy-cat' && <RainyBackground />}
                    </div>
                  ) : (
                    <div className={cn(
                      "w-full h-full transition-all duration-500",
                      settings.themeId === 'rainy-cat' ? "bg-gradient-to-b from-white/5 to-white/10" : "bg-gradient-to-b from-pink-50 to-pink-100/50"
                    )} />
                  )}
                </div>

                {/* Hidden Background Input */}
                <input 
                  type="file" 
                  ref={callBgInputRef} 
                  onChange={handleCallBgChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                {/* Call Header */}
                <div className="relative z-[500] p-6 flex justify-between items-center bg-white/5 backdrop-blur-md shadow-sm">
                  <button 
                    onClick={() => setCallState(prev => ({ ...prev, isMinimized: true }))} 
                    className={cn(
                      "p-2 rounded-full backdrop-blur-md transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/10 hover:bg-white/20 border border-white/10" : "bg-white/10"
                    )}
                  >
                    <Minimize2 size={20} />
                  </button>
                  <div className="text-center flex flex-col items-center">
                    <h2 className={cn(
                      "font-bold text-lg transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "text-white/90" : "text-pink-900"
                    )}>{callState.friend?.name}</h2>
                    <p className={cn(
                      "text-xs transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "text-white/40" : "text-pink-400"
                    )}>
                      {callState.isAccepted ? (
                        callState.startTime ? new Date(Date.now() - callState.startTime).toISOString().substr(14, 5) : '00:00'
                      ) : '正在呼叫...'}
                    </p>
                    {callState.isAccepted && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-3 relative"
                      >
                        <img src={callState.friend?.avatar} className={cn(
                          "w-16 h-16 rounded-full border-2 shadow-xl transition-all duration-500",
                          settings.themeId === 'rainy-cat' ? "border-white/20 grayscale-[0.2]" : "border-white/20"
                        )} />
                        <div className="absolute -bottom-1 left-0 right-0 flex justify-center gap-1">
                          {[1, 2, 3].map(i => (
                            <motion.div 
                              key={`header-pulse-${i}`}
                              animate={{ height: [4, 12, 4] }}
                              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                              className={cn(
                                "w-0.5 rounded-full",
                                settings.themeId === 'rainy-cat' ? "bg-white/40" : "bg-green-400"
                              )}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowCallSettings(!showCallSettings)}
                      className={cn(
                        "p-2 rounded-full backdrop-blur-md transition-all duration-300",
                        settings.themeId === 'rainy-cat' ? "bg-white/10 hover:bg-white/20 border border-white/10" : "bg-white/10"
                      )}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    
                                <AnimatePresence mode="popLayout">
                                  {showCallSettings && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                      className={cn(
                                        "absolute right-0 top-12 w-64 border rounded-3xl shadow-2xl p-2 z-[1000] transition-all duration-300",
                                        settings.themeId === 'rainy-cat' ? "bg-black/80 backdrop-blur-2xl border-white/10 text-white" : "bg-white/95 backdrop-blur-3xl border-pink-100 text-slate-800"
                                      )}
                                    >
                          <div className={cn(
                            "text-[10px] px-3 py-1 uppercase tracking-wider font-bold transition-all duration-300",
                            settings.themeId === 'rainy-cat' ? "text-white/30" : "text-pink-300"
                          )}>通话设置</div>
                          <button 
                            onClick={() => {
                              saveSettings({ ...settings, isCallBackgroundEnabled: !settings.isCallBackgroundEnabled });
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-sm",
                              settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-pink-50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Palette size={18} className={cn(
                                "transition-all duration-300",
                                settings.themeId === 'rainy-cat' ? "text-white/60" : "text-pink-400"
                              )} />
                              <span>美化通话背景</span>
                            </div>
                            {settings.isCallBackgroundEnabled ? (
                              <ToggleRight size={20} className="text-green-400" />
                            ) : (
                              <ToggleLeft size={20} className={cn(
                                "transition-all duration-300",
                                settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-400"
                              )} />
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              callBgInputRef.current?.click();
                              setShowCallSettings(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-sm",
                              settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-pink-50"
                            )}
                          >
                            <ImageIcon size={18} className={cn(
                              "transition-all duration-300",
                              settings.themeId === 'rainy-cat' ? "text-white/60" : "text-blue-400"
                            )} />
                            <span>选择背景图片</span>
                          </button>
                          <button 
                            onClick={() => {
                              if (callState.friend) {
                                const callMsgs: ChatMessage[] = callMessages.map(m => ({
                                  role: m.startsWith('You:') ? 'user' : 'assistant',
                                  content: m.replace(/^(You:|[^:]+:)\s*/, ''),
                                  timestamp: Date.now()
                                }));
                                summarizeContent(callState.friend, callMsgs, 'call', callState.friend.memorySettings?.summaryPrompt).then(summary => {
                                  if (summary && callState.friend) {
                                    addOnlineMemory(callState.friend.id, summary, 'manual', 'chat');
                                    alert('已成功总结并存入记忆库');
                                  }
                                }).catch(err => {
                                  console.error(err);
                                  alert('总结导出失败，请检查网络');
                                });
                              }
                              setShowCallSettings(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-sm",
                              settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-pink-50"
                            )}
                          >
                            <Brain size={18} className={cn(
                              "transition-all duration-300",
                              settings.themeId === 'rainy-cat' ? "text-white/60" : "text-purple-400"
                            )} />
                            <span>手动总结记忆</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Video Area / Chat Area */}
                <div className="flex-1 relative flex flex-col items-center justify-center overflow-hidden py-4 z-10">
                  {!callState.isAccepted ? (
                    <div className="flex flex-col items-center gap-6">
                      <img src={callState.friend?.avatar} className={cn(
                        "w-32 h-32 rounded-full border-4 shadow-2xl transition-all duration-500",
                        settings.themeId === 'rainy-cat' ? "border-white/20 grayscale-[0.2]" : "border-white/10"
                      )} />
                      <div className="flex gap-2">
                        {[1, 2, 3].map(i => (
                          <motion.div 
                            key={`wait-pulse-${i}`}
                            animate={{ height: [10, 30, 10] }}
                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                            className={cn(
                              "w-1 rounded-full transition-all duration-300",
                              settings.themeId === 'rainy-cat' ? "bg-white/40" : "bg-green-500"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col">
                      {/* Call Messages Overlay - Now scrollable in the center */}
                      <div 
                        ref={callScrollRef}
                        className="flex-1 overflow-y-auto px-6 py-4 space-y-3 pointer-events-auto z-20 white-scrollbar scroll-smooth"
                      >
                        {callMessages.map((msg, i) => {
                          const isUser = msg.startsWith('You:');
                          const content = msg.replace(/^(You:|[^:]+:)\s*/, '');
                          return (
                            <motion.div 
                              key={i}
                              initial={{ opacity: 0, y: 10, x: isUser ? 20 : -20 }}
                              animate={{ opacity: 1, y: 0, x: 0 }}
                              className={cn(
                                "flex flex-col",
                                isUser ? "items-end" : "items-start"
                              )}
                            >
                              <div className={cn(
                                "backdrop-blur-3xl px-4 py-2.5 rounded-2xl text-[13px] inline-block max-w-[85%] shadow-xl border transition-all duration-300",
                                isUser 
                                  ? (settings.themeId === 'rainy-cat' 
                                      ? "bg-white/20 border-white/20 text-white" 
                                      : "bg-white/80 backdrop-blur-md border border-pink-100/50 text-pink-950 font-medium shadow-pink-200/10")
                                  : (settings.themeId === 'rainy-cat' 
                                      ? "bg-black/80 border-white/10 text-white/90" 
                                      : "bg-pink-100/40 border-pink-200/50 text-pink-900 font-medium")
                              )}>
                                {content}
                              </div>
                            </motion.div>
                          );
                        })}
                        {isAiResponding && (
                          <div className={cn(
                            "text-[10px] animate-pulse transition-all duration-300 ml-2",
                            settings.themeId === 'rainy-cat' ? "text-white/40" : "text-pink-400"
                          )}>对方正在说话...</div>
                        )}
                        <div className="h-4 w-full" /> {/* Bottom spacing */}
                      </div>
                    </div>
                  )}
                </div>

              {/* Call Controls & Input */}
              <div className={cn(
                "relative z-30 p-6 pb-10 space-y-6 pointer-events-auto transition-all duration-500",
                settings.themeId === 'rainy-cat' ? "bg-gradient-to-t from-black/40 to-transparent" : "bg-gradient-to-t from-pink-100/80 to-transparent"
              )}>
                {!callState.isAccepted ? (
                  <div className="flex justify-around items-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEndCall('rejected');
                      }} 
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-300 cursor-pointer",
                        settings.themeId === 'rainy-cat' ? "bg-red-500/40 border border-red-500/20" : "bg-red-500"
                      )}
                    >
                      <PhoneOff size={32} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAcceptCall();
                      }} 
                      className={cn(
                        "w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-300 cursor-pointer",
                        settings.themeId === 'rainy-cat' ? "bg-green-500/40 border border-green-500/20" : "bg-green-500"
                      )}
                    >
                      <Phone size={32} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "flex items-center gap-2 backdrop-blur-md rounded-full px-4 py-2 border transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white/40 border-white/40"
                    )}>
                      <input 
                        type="text" 
                        placeholder="发消息..." 
                        className={cn(
                          "flex-1 bg-transparent border-none focus:outline-none text-sm transition-all duration-300",
                          settings.themeId === 'rainy-cat' ? "text-white/80 placeholder:text-white/20" : "text-pink-900 placeholder:text-pink-300"
                        )}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = e.currentTarget.value;
                            if (val) {
                              handleAiResponse(val);
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (!callState.isMicMuted) {
                            setIsVoiceInputActive(true);
                          }
                        }}
                        className={cn(
                          "p-1 transition-colors",
                          isVoiceInputActive ? "text-green-400" : (settings.themeId === 'rainy-cat' ? "text-white/40" : "text-pink-400")
                        )}
                      >
                        <Mic size={18} />
                      </button>
                    </div>
                    <div className="flex justify-around items-center">
                      <button 
                        onClick={() => setCallState(prev => ({ ...prev, isMicMuted: !prev.isMicMuted }))}
                        className={cn(
                          "p-4 rounded-full transition-all duration-300", 
                          callState.isMicMuted 
                            ? (settings.themeId === 'rainy-cat' ? "bg-red-500/10 text-red-400" : "bg-red-500/20 text-red-500") 
                            : (settings.themeId === 'rainy-cat' ? "bg-white/5 hover:bg-white/10 text-white/60" : "bg-pink-400/20 hover:bg-pink-400/40 text-pink-600")
                        )}
                      >
                        {callState.isMicMuted ? <MicOff size={24} /> : <Mic size={24} />}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndCall('ended');
                        }} 
                        className={cn(
                          "w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-300 cursor-pointer",
                          settings.themeId === 'rainy-cat' ? "bg-red-500/40 border border-red-500/20" : "bg-red-500"
                        )}
                      >
                        <PhoneOff size={32} />
                      </button>
                    </div>
                  </>
                )
              }
            </div>

                {/* Voice Input Modal during Call */}
                <AnimatePresence>
                  {isVoiceInputActive && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute inset-0 z-[110] bg-black/80 flex items-center justify-center p-6"
                    >
                      <div className={cn(
                        "w-full max-w-xs rounded-2xl p-6 space-y-4 transition-all duration-500",
                        settings.themeId === 'rainy-cat' ? "bg-white/10 backdrop-blur-xl border border-white/20 text-white" : "bg-slate-800"
                      )}>
                        <div className="flex justify-between items-center">
                          <h3 className="font-bold">语音输入</h3>
                          <button onClick={() => setIsVoiceInputActive(false)}><X size={20} /></button>
                        </div>
                        <textarea 
                          autoFocus
                          className={cn(
                            "w-full h-32 rounded-xl p-3 text-sm focus:outline-none border transition-all duration-300",
                            settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white placeholder-white/30" : "bg-slate-700 border-slate-600"
                          )}
                          placeholder="描述你想说的话..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              const val = e.currentTarget.value;
                              if (val) {
                                handleAiResponse(val, true);
                                setIsVoiceInputActive(false);
                              }
                            }
                          }}
                        />
                        <button 
                          onClick={(e) => {
                            const textarea = e.currentTarget.previousElementSibling as HTMLTextAreaElement;
                            if (textarea.value) {
                              handleAiResponse(textarea.value, true);
                              setIsVoiceInputActive(false);
                            }
                          }}
                          className={cn(
                            "w-full py-3 rounded-xl font-bold active:scale-95 transition-all duration-300",
                            settings.themeId === 'rainy-cat' ? "bg-white/20 hover:bg-white/30 text-white border border-white/20" : "bg-green-600"
                          )}
                        >
                          发送语音描述
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Call UI */}
          <AnimatePresence>
            {callState.isActive && callState.isMinimized && (
              <motion.div 
                drag
                dragConstraints={{ left: -300, right: 0, top: 0, bottom: 600 }}
                dragElastic={0.1}
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  width: callState.isCollapsed ? 56 : 80,
                  height: callState.isCollapsed ? 56 : 112,
                  borderRadius: callState.isCollapsed ? 28 : 16
                }}
                className={cn(
                  "absolute top-20 right-4 z-[100] shadow-2xl overflow-hidden border cursor-move flex items-center justify-center transition-all duration-500",
                  settings.themeId === 'rainy-cat' ? "bg-white/10 backdrop-blur-xl border-white/20" : "bg-slate-800 border-white/20",
                  callState.isCollapsed && settings.themeId !== 'rainy-cat' ? "bg-green-500" : ""
                )}
              >
                {callState.isCollapsed ? (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCallState(prev => ({ ...prev, isCollapsed: false }));
                    }}
                    className="w-full h-full flex items-center justify-center text-white"
                  >
                    <div className="relative">
                      <Phone size={24} />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    </div>
                  </button>
                ) : (
                  <div className="relative w-full h-full group" onClick={() => setCallState(prev => ({ ...prev, isMinimized: false }))}>
                    {callState.type === 'video' && !callState.isCameraMuted ? (
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 relative">
                        {settings.isCallBackgroundEnabled && settings.callBackground ? (
                          <img 
                            src={settings.callBackground} 
                            className="absolute inset-0 w-full h-full object-cover opacity-100"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20" />
                        )}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <img src={callState.friend?.avatar} className="w-10 h-10 rounded-full border border-white/20 shadow-lg" />
                          <div className="flex gap-1">
                            {[1, 2, 3].map(i => (
                              <motion.div 
                                key={`small-pulse-${i}`}
                                animate={{ height: [3, 8, 3] }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                className="w-0.5 bg-green-500 rounded-full"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Controls Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-50 pointer-events-auto">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCallState(prev => ({ ...prev, isMinimized: false }));
                          }}
                          className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                        >
                          <Maximize2 size={14} className="text-white" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCallState(prev => ({ ...prev, isCollapsed: true }));
                          }}
                          className="p-1.5 bg-white/20 rounded-full hover:bg-white/40 transition-colors"
                        >
                          <Minimize2 size={14} className="text-white" />
                        </button>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndCall('ended');
                        }}
                        className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <PhoneOff size={16} className="text-white" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Modal Root */}
        <div id="modal-root" className="absolute inset-0 z-[150] pointer-events-none" />
      </div>
    </div>
  </div>
  );
}

function PhoneApp({ settings, onBack, onStartCall }: { settings: any, onBack: () => void, onStartCall: (f: Friend, type: 'voice' | 'video') => void }) {
  const [dialNumber, setDialNumber] = useState('');
  const { friends } = useFriends();

  const handleDial = (num: string) => {
    if (dialNumber.length < 15) {
      setDialNumber(prev => prev + num);
    }
  };

  const handleCall = () => {
    if (dialNumber) {
      const friend = friends[Math.floor(Math.random() * friends.length)];
      onStartCall(friend, 'voice');
    }
  };

  const isRainy = (settings.themeId === 'rainy-cat' || settings.themeId === 'pink-cat' || settings.themeId === 'ocean-blue');

  return (
    <div className={cn(
      "h-full flex flex-col transition-all duration-500",
      isRainy ? "bg-black/20 backdrop-blur-xl text-white" : "bg-slate-100"
    )}>
      {/* Header */}
      <div className={cn(
        "px-6 py-4 flex items-center justify-between transition-all duration-300",
        isRainy ? "bg-white/5 backdrop-blur-xl border-b border-white/10" : "bg-white"
      )}>
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full transition-colors"><ChevronLeft size={24} /></button>
        <h2 className={cn("font-bold text-lg", isRainy ? "text-white/60" : "text-slate-900")}>电话</h2>
        <div className="w-10" />
      </div>

      {/* Dial Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="h-24 flex items-center justify-center mb-12">
          <span className={cn(
            "text-5xl font-light tracking-[0.2em] transition-all duration-300",
            isRainy ? "text-white/80 font-serif italic" : "text-slate-900"
          )}>{dialNumber || ' '}</span>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-8">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleDial(key)}
              className={cn(
                "w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 relative group",
                isRainy ? "bg-white/5 hover:bg-white/10 border border-white/10" : "bg-white shadow-sm hover:bg-slate-50"
              )}
            >
              {isRainy && (
                <>
                  <div className="absolute -top-1 left-3 w-2 h-2 bg-white/10 rounded-tr-full rotate-[-15deg]" />
                  <div className="absolute -top-1 right-3 w-2 h-2 bg-white/10 rounded-tl-full rotate-[15deg]" />
                </>
              )}
              <span className={cn("text-2xl font-medium", isRainy ? "text-white/60" : "text-slate-800")}>{key}</span>
              <span className={cn("text-[9px] opacity-40 font-bold", isRainy ? "text-white/40" : "text-slate-400")}>
                {key === '2' && 'ABC'}
                {key === '3' && 'DEF'}
                {key === '4' && 'GHI'}
                {key === '5' && 'JKL'}
                {key === '6' && 'MNO'}
                {key === '7' && 'PQRS'}
                {key === '8' && 'TUV'}
                {key === '9' && 'WXYZ'}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Call Actions */}
        <div className="mt-16 flex items-center gap-16">
          <div className="w-20" /> {/* Spacer */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCall}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300",
              isRainy ? "bg-green-500/20 border border-green-500/30 text-green-400" : "bg-green-500 text-white"
            )}
          >
            <Phone size={36} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setDialNumber(prev => prev.slice(0, -1))}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
              isRainy ? "text-white/20 hover:text-white/40" : "text-slate-300 hover:text-slate-500"
            )}
          >
            <X size={28} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
