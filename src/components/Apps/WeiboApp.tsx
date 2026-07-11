import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageSquare, Share2, MoreHorizontal, Camera, Home, Play, Search, Mail, User, ChevronLeft, Plus, Users, Settings, UserPlus, RefreshCw, X, Trash2, Edit2, Star, FileText, Ban, Download, Upload, History, Image, Link, Smile, Sparkles, Send, Quote, Copy, Edit3, CornerUpLeft } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AppSettings, Friend, MomentPost, WeiboCategory, MomentComment } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useFriends } from '../../hooks/useFriends';
import { useMemory } from '../../hooks/useMemory';
import { get, set } from 'idb-keyval';
import { getGeminiClient, getGeminiModel } from '../../lib/gemini';

interface Props {
  settings: AppSettings;
  onBack: () => void;
  onUpdateSettings?: (updates: Partial<AppSettings>) => void;
}

const EMOJIS = ['😊', '😂', '🥹', '😍', '🥰', '😘', '😋', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😢', '😭', '❤️', '👍', '🔥', '✨', '🎉', '💩', '👻', '🐱', '🌹', '☕', '🍻'];

const getPureStickerUrl = (content: string, customStickers: any[] = []) => {
  if (!content) return null;
  const trimmed = content.trim();
  const bracketMatch = trimmed.match(/\[(?:SEND_STICKER|表情|发送了表情):\s*([^\]]+)\]/i) || trimmed.match(/\[([^\]]+)\]/);
  const targetIdOrDesc = bracketMatch ? bracketMatch[1].replace(/^(SEND_STICKER|表情|发送了表情)[:：]\s*/i, '').trim() : trimmed;

  if (customStickers && customStickers.length > 0) {
    const found = customStickers.find((s: any) => 
      s.id === targetIdOrDesc || 
      (s.description && (s.description.includes(targetIdOrDesc) || targetIdOrDesc.includes(s.description)))
    );
    if (found) return { url: found.url, desc: found.description };

    if (bracketMatch || trimmed.startsWith('[SEND_STICKER') || trimmed.startsWith('[表情')) {
      const fallbackSticker = customStickers[0];
      return { url: fallbackSticker.url, desc: fallbackSticker.description || targetIdOrDesc };
    }
  }

  const defaultStickers: Record<string, string> = {
    '9y0': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=400',
    'dog': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=400',
    'cat': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=400',
    'cute': 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400',
    'sticker': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
  };
  if (defaultStickers[targetIdOrDesc]) {
    return { url: defaultStickers[targetIdOrDesc], desc: targetIdOrDesc };
  }
  if (bracketMatch || trimmed.startsWith('[SEND_STICKER') || trimmed.startsWith('[表情')) {
    return { url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=400', desc: targetIdOrDesc };
  }
  return null;
};

interface FeedItem {
  friend: Friend;
  moment: MomentPost;
}

export default function WeiboApp({ settings, onBack, onUpdateSettings }: Props) {
  const { friends, user } = useFriends();
  const { addOnlineMemory, getFriendMemory } = useMemory();
  const isRainy = settings.themeId === 'rainy-cat';
  const [activeTab, setActiveTab] = useState<'home' | 'video' | 'discover' | 'message' | 'me'>('home');
  const [activeSubTab, setActiveSubTab] = useState<'following' | 'recommend'>('recommend');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('1');
  const [categories, setCategories] = useState<WeiboCategory[]>([
    { id: '1', name: '热门', prompt: '热门话题' },
    { id: '2', name: '同城', prompt: '同城热点' },
  ]);
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', prompt: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [weiboFriends, setWeiboFriends] = useState<Friend[]>([]);
  const [weiboChats, setWeiboChats] = useState<Record<string, any[]>>({});
  const [weiboGroups, setWeiboGroups] = useState<any[]>([]);
  const [messageSubTab, setMessageSubTab] = useState<'groups' | 'friends' | 'messages'>('messages');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [viewingFriendProfileId, setViewingFriendProfileId] = useState<string | null>(null);
  const [activeChatFriendId, setActiveChatFriendId] = useState<string | null>(null);
  const [showChatSettingsId, setShowChatSettingsId] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [stickerTab, setStickerTab] = useState<'emoji' | 'custom'>('emoji');
  const [showStickerImport, setShowStickerImport] = useState<'url' | 'file' | null>(null);
  const [stickerUrlInput, setStickerUrlInput] = useState('');
  const [stickerDeleteMode, setStickerDeleteMode] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [quotedMessage, setQuotedMessage] = useState<any | null>(null);
  const [contextMenu, setContextMenu] = useState<{ messageIndex: number } | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const longPressTimer = useRef<any>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevChatFriendIdRef = useRef<string | null>(null);
  const stickerFileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (messagesEndRef.current && activeChatFriendId) {
      const isJustOpened = prevChatFriendIdRef.current !== activeChatFriendId;
      messagesEndRef.current.scrollIntoView({ behavior: isJustOpened ? 'auto' : 'smooth' });
    }
    prevChatFriendIdRef.current = activeChatFriendId;
  }, [activeChatFriendId, weiboChats, isAiGenerating]);

  const formatMessageTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (isToday) return timeStr;
    if (isYesterday) return `昨天 ${timeStr}`;
    return `${date.getMonth() + 1}月${date.getDate()}日 ${timeStr}`;
  };

  const [moments, setMoments] = useState<MomentPost[]>([]);
  const [likedMoments, setLikedMoments] = useState<Set<string>>(new Set());
  const [userProfile, setUserProfile] = useState({
    name: '小阿堂撇',
    signature: '乖乖长大',
    avatar: 'https://picsum.photos/seed/avatar/200/200',
    background: 'https://picsum.photos/seed/weibo/800/400',
    followers: 23,
    following: 88,
    likes: 8
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(userProfile);

  // Combine all moments into a single feed
  const feed: FeedItem[] = moments.map(moment => {
    let friend: Friend;
    if (moment.authorId === 'user') {
      friend = { id: 'user', name: userProfile.name, avatar: userProfile.avatar || '', persona: '', createdAt: Date.now() };
    } else if (moment.authorId.startsWith('ai_user_')) {
      friend = { id: moment.authorId, name: moment.authorName || '网友', avatar: moment.authorAvatar || '', persona: '', createdAt: Date.now() };
    } else {
      friend = friends.find(f => f.id === moment.authorId) || { id: moment.authorId, name: '未知', avatar: '', persona: '', createdAt: Date.now() };
    }
    return { friend, moment };
  }).sort((a, b) => b.moment.timestamp - a.moment.timestamp);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedMoments = await get<MomentPost[]>('weibo-moments');
        setMoments(savedMoments || []);
        
        const savedLikes = await get<string[]>('weibo-liked-moments');
        if (savedLikes) setLikedMoments(new Set(savedLikes));

        const savedProfile = await get('weibo-user-profile');
        if (savedProfile) {
          setUserProfile(savedProfile);
          setEditForm(savedProfile);
        }
        
        const savedCategories = await get<WeiboCategory[]>('weibo-categories');
        if (savedCategories) setCategories(savedCategories);

        const savedWeiboFriends = await get<Friend[]>('weibo-friends');
        if (savedWeiboFriends) setWeiboFriends(savedWeiboFriends);

        const savedWeiboChats = await get<Record<string, any[]>>('weibo-chats');
        if (savedWeiboChats) setWeiboChats(savedWeiboChats);

        const savedWeiboGroups = await get<any[]>('weibo-groups');
        if (savedWeiboGroups) setWeiboGroups(savedWeiboGroups);
      } catch (error) {
        console.error("Failed to load weibo data:", error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, [friends]);

  useEffect(() => {
    if (isLoaded) {
      set('weibo-moments', moments).catch(console.warn);
      set('weibo-liked-moments', Array.from(likedMoments)).catch(console.warn);
      set('weibo-user-profile', userProfile).catch(console.warn);
      set('weibo-categories', categories).catch(console.warn);
      set('weibo-friends', weiboFriends).catch(console.warn);
      set('weibo-chats', weiboChats).catch(console.warn);
      set('weibo-groups', weiboGroups).catch(console.warn);
    }
  }, [moments, likedMoments, userProfile, categories, weiboFriends, weiboChats, isLoaded]);

  const saveProfile = () => {
    setUserProfile(editForm);
    setIsEditing(false);
  };

  const isPinkTheme = true; // Force pink theme
  const themeClasses = {
    bg: "bg-pink-50",
    text: "text-pink-900",
    border: "border-pink-100",
    header: "bg-white/90 border-pink-100",
    active: "text-pink-600",
    inactive: "text-pink-300",
  };

  const handleFileChange = (type: 'avatar' | 'background', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Increase dimensions and quality for better clarity
          const MAX_WIDTH = type === 'avatar' ? 300 : 800; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Compress to JPEG with better quality (0.8)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Check size before setting state (allow up to 2MB)
          if (dataUrl.length > 2 * 1024 * 1024) {
            alert("图片依然过大，请尝试上传更小的图片。");
            return;
          }
          
          setUserProfile(prev => ({ ...prev, [type]: dataUrl }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const renderMessagePage = () => (
    <div className={cn("flex-1 flex flex-col pb-20", themeClasses.bg)}>
      <div className="flex-1 overflow-y-auto">
        {messageSubTab === 'messages' && (
          weiboFriends.filter(f => weiboChats[f.id]?.length > 0).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <Mail size={48} className="opacity-20 mb-4" />
              <p className="text-sm">暂无私信消息</p>
              <button 
                onClick={() => setMessageSubTab('friends')}
                className="mt-4 text-orange-500 font-bold text-sm"
              >
                去联系好友
              </button>
            </div>
          ) : (
            <div className="divide-y divide-pink-50">
              {weiboFriends.filter(f => weiboChats[f.id]?.length > 0).map(friend => {
                const lastMsg = weiboChats[friend.id]?.[weiboChats[friend.id].length - 1];
                return (
                  <div 
                    key={friend.id} 
                    onClick={() => setActiveChatFriendId(friend.id)}
                    className="flex items-center gap-3 p-4 hover:bg-white/50 cursor-pointer transition-colors"
                  >
                    <img src={friend.avatar} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm truncate">{friend.name}</span>
                        <span className="text-[10px] text-slate-400">{lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{lastMsg?.content || '点击开始聊天'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {messageSubTab === 'friends' && (
          <div className="divide-y divide-pink-50">
            {weiboFriends.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <UserPlus size={48} className="mx-auto opacity-20 mb-4" />
                <p className="text-sm">暂无好友，快去添加吧</p>
                <button onClick={() => setShowAddFriendModal(true)} className="mt-4 text-orange-500 font-bold">添加好友</button>
              </div>
            ) : (
              weiboFriends.map(friend => (
                <div 
                  key={friend.id} 
                  onClick={() => setViewingFriendProfileId(friend.id)}
                  className="flex items-center gap-3 p-4 hover:bg-white/50 cursor-pointer transition-colors"
                >
                  <img src={friend.avatar} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <span className="font-bold text-sm">{friend.name}</span>
                    <p className="text-xs text-slate-500 truncate">{friend.persona || '这个博主很懒，什么都没写'}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveChatFriendId(friend.id); }}
                    className="p-2 text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                  >
                    <Mail size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {messageSubTab === 'groups' && (
          <div className="p-4 space-y-4">
            <button 
              onClick={() => setShowCreateGroupModal(true)}
              className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Plus size={20} />
              发起群聊
            </button>
            {weiboGroups.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <Users size={48} className="mx-auto opacity-20 mb-4" />
                <p className="text-sm">暂无群聊，快去发起一个吧</p>
              </div>
            ) : (
              <div className="space-y-2">
                {weiboGroups.map(group => (
                  <div key={group.id} className="bg-white p-4 rounded-xl shadow-sm border border-pink-50 flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <Users size={24} className="text-slate-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{group.name}</p>
                      <p className="text-[10px] text-slate-400">{group.members.length} 位成员</p>
                    </div>
                    <button className="text-xs text-orange-500 font-bold">进入</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderChatView = () => {
    if (!activeChatFriendId) return null;
    const friend = weiboFriends.find(f => f.id === activeChatFriendId);
    if (!friend) return null;
    const messages = weiboChats[activeChatFriendId] || [];

    const handleSendMessage = () => {
      if (!chatInput.trim()) return;
      const userMsg = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: chatInput, 
        quote: quotedMessage || undefined,
        timestamp: Date.now() 
      };
      const newMessages = [...messages, userMsg];
      setWeiboChats(prev => ({ ...prev, [activeChatFriendId]: newMessages }));
      setChatInput('');
      setQuotedMessage(null);
    };

    const handleSendSticker = (sticker: any) => {
      const userMsg = { 
        id: Date.now().toString(), 
        role: 'user', 
        content: `[表情:${sticker.description || '表情包'}]`, 
        timestamp: Date.now() 
      };
      const newMessages = [...messages, userMsg];
      setWeiboChats(prev => ({ ...prev, [activeChatFriendId]: newMessages }));
      setShowEmojiPicker(false);
    };

    const handleAddStickersByUrl = () => {
      const lines = stickerUrlInput.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return;
      
      const newStickers = lines.map(line => {
        const urlPattern = /(https?:\/\/\S+)/i;
        const match = line.match(urlPattern);
        if (match) {
          const url = match[1];
          let description = line.replace(url, '').trim();
          description = description.replace(/^[:：\-\s]+|[:：\-\s]+$/g, '').trim() || '批量导入的表情包';
          return {
            id: Math.random().toString(36).substr(2, 9),
            url,
            description,
            addedAt: Date.now()
          };
        }
        return null;
      }).filter(Boolean) as any[];

      if (newStickers.length === 0) return;
      const updatedStickers = [...(settings.customStickers || []), ...newStickers];
      if (onUpdateSettings) {
        onUpdateSettings({ customStickers: updatedStickers });
      }
      setStickerUrlInput('');
      setShowStickerImport(null);
    };

    const handleTriggerAiReply = async () => {
      const friend = weiboFriends.find(f => f.id === activeChatFriendId);
      if (!friend) return;
      setIsAiGenerating(true);
      const currentMessages = weiboChats[activeChatFriendId] || [];

      const contextLimit = friend.memorySettings?.contextLimit || 10;
      const contextMessages = currentMessages.slice(-contextLimit);

      // Get memories for this friend
      const friendMemory = getFriendMemory(friend.id);
      const memoriesStr = friendMemory.onlineMemories.length > 0 
        ? `\n你的记忆库中有以下关于用户的记录：\n${friendMemory.onlineMemories.slice(0, 5).map(m => `- [${m.source === 'weibo' ? '微博' : '聊天'}] ${m.content}`).join('\n')}`
        : "";

      // Fetch Chat App history
      let chatAppContext = '';
      try {
        const allChats = await get('zhouzhou_ji_chats') || {};
        const friendChats = allChats[friend.id] || [];
        const recentChatAppHistory = friendChats.slice(-20);
        chatAppContext = recentChatAppHistory.length > 0
          ? `\n【微信私信记录（最近20条）】\n${recentChatAppHistory.map((m: any) => `${m.role === 'user' ? '用户' : friend.name}: ${m.content}`).join('\n')}`
          : '';
      } catch (e) {
        console.error(e);
      }

      // Weibo context
      const latestFeed = feed.slice(0, 20).map(item => {
        const authorType = item.moment.authorId === 'user' ? '用户(你聊天的对象)' : item.moment.authorId === friend.id ? '你自己' : '其他网友/好友';
        return `[作者类型: ${authorType}] [博主: ${item.friend.name}] ${item.moment.content}`;
      }).join('\n');
      const userPosts = moments.filter(m => m.authorId === 'user').slice(0, 10).map(m => `- ${m.content}`).join('\n');
      const friendPosts = moments.filter(m => m.authorId === friend.id).slice(0, 10).map(m => `- ${m.content}`).join('\n');
      const weiboContext = `\n【微博实时动态与广场】\n首页动态列表（包含你,用户及其他网友发布的微博,你可以通过作者类型明确区分）：\n${latestFeed}\n\n用户自己发表的微博：\n${userPosts}\n\n你自己(${friend.name})发表的微博：\n${friendPosts}`;

      try {
        const ai = getGeminiClient(settings);
        const beijingTimeStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
        const timeContext = `\n\n【系统设定：北京实时时间感知】\n当前北京实时时间是：${beijingTimeStr}。请在对话中自然地体现对当前时间（如上午、下午、深夜、星期几等）的感知和流逝。`;
        
        let stickerPromptSection = '';
        if (settings.customStickers && settings.customStickers.length > 0) {
          stickerPromptSection = `\n\n【系统设定：用户导入的自定义表情包库】\n你可以使用用户导入的表情包。发送表情包时，请使用格式：[SEND_STICKER:表情包ID] 或 [表情:描述]。\n以下是你可用的所有自定义表情包列表：\n`;
          settings.customStickers.forEach(s => {
            stickerPromptSection += `- ID: ${s.id}, 描述: ${s.description || '无描述'}\n`;
          });
          stickerPromptSection += `\n请根据实时语境和人设，适时在2-7条短句回复中挑选并发送合适的表情包（可单独作为一行短句输出 [SEND_STICKER:表情包ID]）。`;
        }

        const systemPrompt = `你正在微博私信中扮演 ${friend.name}。性格设定：${friend.persona}。${memoriesStr}${chatAppContext}${weiboContext}${timeContext}${stickerPromptSection}
要求：
1. **彻底去AI化**：完全去掉机器感，贴合普通人日常说话语气，高度口语化，不要刻板书面语，像真人一样随性、自然。
2. **互动张力**：会接梗、会撒娇、会打趣、会轻微拌嘴，真实互动。
3. **【‼️ 严格禁令】禁止动作描写**：你必须表现得像一个正在打字的真人，严禁使用任何括号、星号或中括号包裹的动作描写、神态描述（如：禁止出现 “(脸红)”、“*微笑*”、“[点头]”、“（笑）” 等）。严禁包含任何括号内的动作/心理描写。
4. **【‼️ 严格限制数量】多条动态回复机制：** 像真实打字聊天一样，一次发送多条短句。**必须且只能回复 2 到 7 条短句，绝对禁止超过 7 条或少于 2 条**。需要发送多条消息时，请用换行符（\\n）分隔每一条消息。每一行都会作为一条独立的私信消息。绝对禁止每次只发一条或长篇大论，必须用短平快、高频互动的碎碎念。
5. **上下文感知**：你可以感知到上方提供的微博动态内容和微信聊天记录，并根据语境自然地提起。
请回复用户的私信。`;

        const result = await ai.models.generateContent({
          model: getGeminiModel(settings),
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...contextMessages.map(m => ({ 
              role: m.role === 'user' ? 'user' : 'model', 
              parts: [{ text: m.content }] 
            }))
          ],
          config: {
            temperature: 0.7
          }
        });
        const aiContent = result.text || "嗯嗯。";
        let aiLines = aiContent.split('\n').filter(l => l.trim());
        if (aiLines.length > 7) {
          aiLines = aiLines.slice(0, 7);
        }
        if (aiLines.length === 0) {
          aiLines = ["嗯嗯"];
        }
        
        const aiMsgs = aiLines.map((line, i) => ({
          id: (Date.now() + 100 + i).toString(),
          role: 'assistant',
          content: line.trim(),
          timestamp: Date.now() + 100 + i
        }));

        if (aiMsgs.length > 0) {
          setWeiboChats(prev => ({
            ...prev,
            [activeChatFriendId]: [...(prev[activeChatFriendId] || []), ...aiMsgs]
          }));
        }
      } catch (err: any) {
        if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || err?.message?.includes('quota')) {
          const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: "(博主正在休息中，请稍后再试)", timestamp: Date.now() };
          setWeiboChats(prev => ({ ...prev, [activeChatFriendId]: [...(prev[activeChatFriendId] || []), aiMsg] }));
          return;
        }
        console.error("私信回复失败:", err);
      } finally {
        setIsAiGenerating(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-slate-50" style={{ 
        backgroundImage: friend.chatBackground ? `url(${friend.chatBackground})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 text-white px-4 py-2 rounded-xl text-xs shadow-lg backdrop-blur-md animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Top Header with Centered Name & Typing Indicator */}
        <div className="relative flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b shrink-0 shadow-sm">
          <div className="flex items-center gap-3 z-10">
            <button onClick={() => setActiveChatFriendId(null)} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
              <ChevronLeft size={24} className="text-slate-700" />
            </button>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center truncate max-w-[200px]">
            <span className="font-bold text-sm text-slate-900 truncate w-full text-center">{friend.name}</span>
            {isAiGenerating && (
              <span className="text-[10px] text-sky-500 animate-pulse font-sans">正在输入中...</span>
            )}
          </div>
          <div className="flex items-center gap-3 z-10">
            <button onClick={() => setViewingFriendProfileId(friend.id)} className="p-1 rounded-full hover:bg-slate-100 transition-colors text-slate-600">
              <User size={20} />
            </button>
            <button onClick={() => setShowChatSettingsId(friend.id)} className="p-1 rounded-full hover:bg-slate-100 transition-colors text-slate-600">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Messages List with WeChat style bubbles & avatars */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showTimeSep = !prevMsg || (m.timestamp - prevMsg.timestamp > 5 * 60 * 1000);
            
            const stickerInfo = getPureStickerUrl(m.content, settings.customStickers || []);

            return (
              <React.Fragment key={m.id || idx}>
                {showTimeSep && (
                  <div className="flex justify-center my-3">
                    <span className="text-[11px] text-slate-400 bg-slate-200/60 px-2.5 py-0.5 rounded-full font-sans">
                      {formatMessageTime(m.timestamp)}
                    </span>
                  </div>
                )}
                <div 
                  data-message-index={idx}
                  onContextMenu={(e) => { e.preventDefault(); setContextMenu({ messageIndex: idx }); }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
                    longPressTimer.current = setTimeout(() => {
                      setContextMenu({ messageIndex: idx });
                    }, 500);
                  }}
                  onTouchMove={(e) => {
                    if (!touchStartPosRef.current) return;
                    const touch = e.touches[0];
                    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
                    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
                    if (dx > 10 || dy > 10) {
                      if (longPressTimer.current) clearTimeout(longPressTimer.current);
                      longPressTimer.current = null;
                    }
                  }}
                  onTouchEnd={() => {
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                    touchStartPosRef.current = null;
                  }}
                  onTouchCancel={() => {
                    if (longPressTimer.current) clearTimeout(longPressTimer.current);
                    touchStartPosRef.current = null;
                  }}
                  onMouseDown={() => {
                    longPressTimer.current = setTimeout(() => {
                      setContextMenu({ messageIndex: idx });
                    }, 500);
                  }}
                  onMouseUp={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                  onMouseLeave={() => { if (longPressTimer.current) clearTimeout(longPressTimer.current); }}
                  className={cn("flex items-start gap-2.5", isUser ? "justify-end" : "justify-start")}
                >
                  {!isUser && (
                    <img 
                      src={friend.avatar} 
                      className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200/80 shadow-sm bg-white" 
                      referrerPolicy="no-referrer" 
                      alt={friend.name} 
                    />
                  )}
                  <div className={cn("flex flex-col gap-1 max-w-[70%]", isUser ? "items-end" : "items-start")}>
                    {m.quote && (
                      <div className="mb-1 p-1.5 bg-black/5 rounded text-[11px] opacity-70 border-l-2 border-orange-500 truncate max-w-full">
                        引用: {m.quote.content}
                      </div>
                    )}
                    {stickerInfo ? (
                      <div className="max-w-[140px] aspect-square rounded-2xl overflow-hidden shadow-sm bg-white/50 border border-slate-200/40">
                        <img src={stickerInfo.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={stickerInfo.desc} />
                      </div>
                    ) : editingMessageIndex === idx ? (
                      <div className="flex flex-col gap-2 p-2 bg-white rounded-xl shadow-md border w-64">
                        <textarea
                          value={editingContent}
                          onChange={e => setEditingContent(e.target.value)}
                          className="w-full p-2 text-xs border rounded outline-none resize-none h-20 text-slate-800"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingMessageIndex(null)} className="px-2.5 py-1 text-xs text-slate-500 bg-slate-100 rounded">取消</button>
                          <button onClick={() => {
                            const newMsgs = [...messages];
                            newMsgs[idx] = { ...newMsgs[idx], content: editingContent };
                            setWeiboChats(prev => ({ ...prev, [activeChatFriendId]: newMsgs }));
                            setEditingMessageIndex(null);
                            showToast('已修改');
                          }} className="px-2.5 py-1 text-xs text-white bg-orange-500 rounded font-bold">保存</button>
                        </div>
                      </div>
                    ) : (
                      <div className={cn(
                        "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words",
                        isUser 
                          ? "bg-black !text-white font-medium rounded-tr-sm" 
                          : "bg-white text-slate-900 border border-slate-200/60 rounded-tl-sm"
                      )} style={isUser ? { color: '#ffffff', backgroundColor: '#000000' } : {}}>
                        {m.content}
                      </div>
                    )}
                  </div>
                  {isUser && (
                    <img 
                      src={userProfile.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                      className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200/80 shadow-sm bg-white" 
                      referrerPolicy="no-referrer" 
                      alt={userProfile.name} 
                    />
                  )}
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Context Menu Modal (WeChat Style) */}
        <AnimatePresence>
          {contextMenu && (
            <div className="fixed inset-0 z-[99999] bg-black/5" onClick={() => setContextMenu(null)}>
              {(() => {
                const msgEl = document.querySelector(`[data-message-index="${contextMenu.messageIndex}"]`);
                if (!msgEl) return null;
                const rect = msgEl.getBoundingClientRect();
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: "-50%", y: -10 }}
                    animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: "-50%", y: -10 }}
                    onClick={(e) => e.stopPropagation()}
                    className="fixed pointer-events-auto"
                    style={{
                      left: '50%',
                      top: rect.top - 12,
                      zIndex: 100000,
                      width: 240,
                      transformOrigin: 'bottom center'
                    }}
                  >
                    <div className="bg-[#333333]/95 backdrop-blur-xl rounded-2xl shadow-2xl p-3.5 border border-white/10 -translate-y-full">
                      <div className="grid grid-cols-5 gap-y-4 gap-x-2">
                        {[
                          { label: '复制', icon: Copy, onClick: () => {
                            navigator.clipboard.writeText(messages[contextMenu.messageIndex].content);
                            showToast('已复制');
                          }},
                          { label: '编辑', icon: Edit3, onClick: () => {
                            setEditingMessageIndex(contextMenu.messageIndex);
                            setEditingContent(messages[contextMenu.messageIndex].content);
                          }},
                          { label: '引用', icon: Quote, onClick: () => {
                            setQuotedMessage(messages[contextMenu.messageIndex]);
                          }},
                          { label: '撤回', icon: CornerUpLeft, onClick: () => {
                            const newMsgs = messages.filter((_, i) => i !== contextMenu.messageIndex);
                            setWeiboChats(prev => ({ ...prev, [activeChatFriendId]: newMsgs }));
                            showToast('已撤回');
                          }},
                          { label: '删除', icon: Trash2, onClick: () => {
                            const newMsgs = messages.filter((_, i) => i !== contextMenu.messageIndex);
                            setWeiboChats(prev => ({ ...prev, [activeChatFriendId]: newMsgs }));
                            showToast('已删除');
                          }},
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center gap-1.5 active:opacity-50 transition-opacity cursor-pointer"
                            onClick={() => {
                              item.onClick();
                              setContextMenu(null);
                            }}
                          >
                            <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/10 transition-colors">
                              <item.icon size={16} style={{ color: 'white' }} />
                            </div>
                            <span className="text-[10px] font-medium text-white">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </div>
          )}
        </AnimatePresence>

        {/* Emoji / Sticker Picker Panel */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 260, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="shrink-0 flex flex-col bg-white border-t overflow-hidden shadow-lg z-20"
            >
              <div className="flex border-b border-slate-100">
                <button 
                  onClick={() => setStickerTab('emoji')}
                  className={cn("flex-1 py-2 flex items-center justify-center transition-all", stickerTab === 'emoji' ? "text-orange-500 border-b-2 border-orange-500 font-bold" : "text-slate-400")}
                >
                  <Smile size={18} />
                </button>
                <button 
                  onClick={() => setStickerTab('custom')}
                  className={cn("flex-1 py-2 flex items-center justify-center transition-all", stickerTab === 'custom' ? "text-orange-500 border-b-2 border-orange-500 font-bold" : "text-slate-400")}
                >
                  <Heart size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {stickerTab === 'emoji' ? (
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJIS.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => setChatInput(prev => prev + emoji)}
                        className="text-xl rounded p-1 hover:bg-slate-100 transition-colors flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowStickerImport('url')}
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-500 text-white"
                        >
                          URL批量导入
                        </button>
                        <button 
                          onClick={() => stickerFileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700"
                        >
                          相册导入
                        </button>
                      </div>
                      <button 
                        onClick={() => {
                          if (stickerDeleteMode) {
                            if (selectedStickers.length > 0) {
                              const updated = (settings.customStickers || []).filter(s => !selectedStickers.includes(s.id));
                              onUpdateSettings?.({ customStickers: updated });
                              setSelectedStickers([]);
                            }
                            setStickerDeleteMode(false);
                          } else {
                            setStickerDeleteMode(true);
                          }
                        }}
                        className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold", stickerDeleteMode ? "bg-red-500 text-white" : "bg-slate-200 text-slate-700")}
                      >
                        {stickerDeleteMode ? `确认删除(${selectedStickers.length})` : '批量删除'}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={() => stickerFileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-slate-200 text-slate-400 rounded-xl flex items-center justify-center hover:border-slate-400 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                      {(settings.customStickers || []).map((sticker, idx) => (
                        <div key={`${sticker.id}-${idx}`} className="relative group flex flex-col gap-1">
                          <button
                            onClick={() => {
                              if (stickerDeleteMode) {
                                setSelectedStickers(prev => 
                                  prev.includes(sticker.id) ? prev.filter(id => id !== sticker.id) : [...prev, sticker.id]
                                );
                              } else {
                                handleSendSticker(sticker);
                              }
                            }}
                            className={cn(
                              "w-full aspect-square rounded-xl overflow-hidden border-2 transition-all",
                              selectedStickers.includes(sticker.id) ? "border-red-500 scale-95" : "border-transparent"
                            )}
                          >
                            <img src={sticker.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={sticker.description} />
                          </button>
                          {!stickerDeleteMode && sticker.description && (
                            <span className="text-[10px] truncate text-center text-slate-500 px-1">
                              {sticker.description}
                            </span>
                          )}
                          {stickerDeleteMode && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                              {selectedStickers.includes(sticker.id) && <div className="w-2 h-2 rounded-full bg-red-500" />}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {quotedMessage && (
          <div className="bg-slate-100 border-t px-3 py-1.5 flex items-center justify-between text-xs text-slate-600 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <Quote size={14} className="text-orange-500 shrink-0" />
              <span className="truncate">引用: {quotedMessage.content}</span>
            </div>
            <button onClick={() => setQuotedMessage(null)} className="p-1 hover:text-slate-900">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Bottom Input Bar: No overflow, WeChat style minimalist buttons */}
        <div className="shrink-0 bg-white border-t px-3 py-2 flex items-center gap-2 max-w-full overflow-hidden shadow-sm">
          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2 text-slate-600 hover:text-slate-900 transition-colors bg-transparent border-none shadow-none shrink-0" title="表情">
            <Smile size={22} className={showEmojiPicker ? "text-orange-500" : ""} />
          </button>
          <button className="p-2 text-slate-600 hover:text-slate-900 transition-colors bg-transparent border-none shadow-none shrink-0" title="更多功能">
            <Plus size={22} />
          </button>
          <input 
            type="text" 
            value={chatInput} 
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="发送私信..."
            className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm outline-none border border-slate-200/50 focus:border-slate-400 min-w-0"
          />
          <button 
            onClick={handleSendMessage} 
            className="p-2 text-slate-600 hover:text-slate-900 transition-colors bg-transparent border-none shadow-none shrink-0" 
            title="发送"
          >
            <Send size={20} />
          </button>
          <button 
            onClick={handleTriggerAiReply} 
            className="p-2 text-sky-500 hover:text-sky-600 transition-colors bg-transparent border-none shadow-none shrink-0" 
            title="生成角色回复"
          >
            <Sparkles size={20} />
          </button>
        </div>

        {/* Hidden File Input for Stickers */}
        <input 
          type="file" 
          ref={stickerFileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const newSticker = {
                  id: Math.random().toString(36).substr(2, 9),
                  url: event.target?.result as string,
                  description: '自定义表情包',
                  addedAt: Date.now()
                };
                const updated = [...(settings.customStickers || []), newSticker];
                onUpdateSettings?.({ customStickers: updated });
              };
              reader.readAsDataURL(file);
            }
          }} 
        />

        {/* URL Sticker Import Modal */}
        <AnimatePresence>
          {showStickerImport === 'url' && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm bg-white text-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
                <h3 className="font-bold text-lg">批量导入表情包URL</h3>
                <p className="text-xs text-slate-400">参考格式：雨中落泪：https://... 或每行一个链接</p>
                <textarea 
                  value={stickerUrlInput}
                  onChange={(e) => setStickerUrlInput(e.target.value)}
                  className="w-full h-40 p-3 bg-slate-100 rounded-2xl text-sm focus:outline-none"
                  placeholder="雨中落泪：https://imgbed.heliar.top/file/...&#10;看一眼手机：https://v1.ax1x.com/..."
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowStickerImport(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">取消</button>
                  <button onClick={handleAddStickersByUrl} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold">导入</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderFriendProfile = () => {
    if (!viewingFriendProfileId) return null;
    const friend = weiboFriends.find(f => f.id === viewingFriendProfileId) || friends.find(f => f.id === viewingFriendProfileId);
    if (!friend) return null;

    // Generate stats if not present
    const stats = friend.weiboStats || {
      fans: (Math.floor(Math.random() * 2000000) / 10000).toFixed(1) + '万',
      following: Math.floor(Math.random() * 500).toString(),
      likes: (Math.floor(Math.random() * 15000000) / 10000).toFixed(1) + '万'
    };

    // Dynamic Blogger Tag based on persona
    const bloggerTag = friend.weiboTag || (friend.persona?.includes('动漫') ? '动漫博主' : 
                        friend.persona?.includes('游戏') ? '游戏博主' : 
                        friend.persona?.includes('美食') ? '美食博主' : 
                        friend.persona?.includes('时尚') ? '时尚博主' : '生活博主');

    // Gender logic based on persona or explicit gender
    const gender = friend.gender === 'female' || friend.persona?.includes('女') || friend.persona?.includes('她') ? 'female' : 
                   friend.gender === 'male' || friend.persona?.includes('男') || friend.persona?.includes('他') ? 'male' : 'other';

    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          // Ensure friend exists in weiboFriends before updating
          setWeiboFriends(prev => {
            const exists = prev.some(f => f.id === friend.id);
            if (exists) {
              return prev.map(f => f.id === friend.id ? { ...f, weiboBackground: dataUrl } : f);
            } else {
              return [...prev, { ...friend, weiboBackground: dataUrl }];
            }
          });
        };
        reader.readAsDataURL(file);
      }
    };

    const refreshProfile = async () => {
      setIsRefreshing(true);
      try {
        // Simulate refreshing stats and content
        const newStats = {
          fans: (parseFloat(stats.fans) + (Math.random() * 0.5)).toFixed(1) + '万',
          following: stats.following,
          likes: (parseFloat(stats.likes) + (Math.random() * 1.2)).toFixed(1) + '万'
        };
        setWeiboFriends(prev => prev.map(f => f.id === friend.id ? { ...f, weiboStats: newStats } : f));
        
        // Also trigger a refresh of their posts if we had a more complex system
        await new Promise(resolve => setTimeout(resolve, 1500));
      } finally {
        setIsRefreshing(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[70] flex flex-col bg-white overflow-y-auto">
        {/* Header Background */}
        <div className="relative h-72 shrink-0 group">
          <img 
            src={friend.weiboBackground || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1000'} 
            className="w-full h-full object-cover cursor-pointer" 
            referrerPolicy="no-referrer" 
            onClick={() => document.getElementById('weibo-bg-upload')?.click()}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <button onClick={() => setViewingFriendProfileId(null)} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white"><ChevronLeft size={20} /></button>
            <div className="flex gap-2">
              <button onClick={refreshProfile} className={cn("p-2 bg-black/20 backdrop-blur-md rounded-full text-white", isRefreshing && "animate-spin")}><RefreshCw size={20} /></button>
              <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white"><MoreHorizontal size={20} /></button>
            </div>
          </div>
          
          {/* Background Upload Button */}
          <label className="absolute bottom-4 left-4 p-2 bg-black/40 backdrop-blur-md rounded-lg text-white text-xs cursor-pointer flex items-center gap-1 hover:bg-black/60 transition-colors">
            <Camera size={14} />
            更换背景
            <input type="file" id="weibo-bg-upload" className="hidden" onChange={handleBgUpload} accept="image/*" />
          </label>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm font-bold">点击更换背景图</div>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="px-4 -mt-16 relative z-10">
          <div className="bg-white rounded-t-3xl p-6 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-start">
              <div className="relative">
                <img src={friend.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" referrerPolicy="no-referrer" />
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-[10px]">V</div>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => setActiveChatFriendId(friend.id)}
                  className="px-4 py-2 border border-slate-200 rounded-full text-sm font-bold flex items-center gap-1 hover:bg-slate-50 transition-colors"
                >
                  <Mail size={16} />
                  私信
                </button>
                <button 
                  onClick={() => {
                    const isFollowed = weiboFriends.find(f => f.id === friend.id)?.isFollowedByMe;
                    setWeiboFriends(prev => prev.map(f => f.id === friend.id ? { ...f, isFollowedByMe: !isFollowed } : f));
                  }}
                  className={cn(
                    "px-6 py-2 rounded-full text-sm font-bold transition-all",
                    weiboFriends.find(f => f.id === friend.id)?.isFollowedByMe 
                      ? "bg-slate-100 text-slate-500" 
                      : "bg-orange-500 text-white shadow-lg shadow-orange-200"
                  )}
                >
                  {weiboFriends.find(f => f.id === friend.id)?.isFollowedByMe ? '已关注' : '+ 关注'}
                </button>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900">{friend.name}</h2>
                <span className={cn(gender === 'female' ? "text-pink-500" : gender === 'male' ? "text-blue-500" : "text-slate-400")}>
                  {gender === 'female' ? '♀' : gender === 'male' ? '♂' : '⚧'}
                </span>
                <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 rounded text-[10px] text-white font-bold italic">
                  <Star size={8} fill="white" />
                  VVIP Ⅱ
                </div>
              </div>
              <div className="flex gap-6 mt-4 text-slate-500">
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-900">{stats.fans}</span>
                  <span className="text-[10px] uppercase tracking-wider">粉丝</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-900">{stats.following}</span>
                  <span className="text-[10px] uppercase tracking-wider">关注</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-900">{stats.likes}</span>
                  <span className="text-[10px] uppercase tracking-wider">转评赞</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-pink-50/50 rounded-xl border border-pink-100/50">
                <p className="text-xs text-orange-500 font-medium">视频累计播放量 2765.2万</p>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                  <Users size={12} />
                </div>
                <span>{bloggerTag}</span>
              </div>

              <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Users size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">粉丝群</p>
                    <p className="text-[10px] text-slate-400">2个群聊</p>
                  </div>
                </div>
                <ChevronLeft size={20} className="rotate-180 text-slate-300" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-around border-b border-slate-100 mt-2">
            {['动态', '微博', '视频', '相册'].map((tab, i) => (
              <button key={tab} className={cn("py-4 text-sm font-bold relative", i === 0 ? "text-slate-900" : "text-slate-400")}>
                {tab}
                {i === 0 && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
              </button>
            ))}
          </div>

          {/* Content Placeholder */}
          <div className="py-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                  <Edit2 size={12} className="text-slate-400" />
                </div>
                <p className="text-sm font-bold">她今天发布了 38 条微博，获得了 1224 次互动</p>
              </div>
              <span className="text-xs text-orange-500">查看更多 &gt;</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="aspect-square bg-slate-100 rounded-lg overflow-hidden">
                  <img src={`https://picsum.photos/seed/weibo_${friend.id}_${i}/300/300`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderChatSettings = () => {
    if (!showChatSettingsId) return null;
    const friend = weiboFriends.find(f => f.id === showChatSettingsId);
    if (!friend) return null;

    const handleChatBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setWeiboFriends(prev => prev.map(f => f.id === friend.id ? { ...f, chatBackground: dataUrl } : f));
        };
        reader.readAsDataURL(file);
      }
    };

    const exportChat = () => {
      const messages = weiboChats[friend.id] || [];
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `weibo_chat_${friend.name}_${Date.now()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    };

    const importChat = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const messages = JSON.parse(event.target?.result as string);
            setWeiboChats(prev => ({ ...prev, [friend.id]: messages }));
            alert("聊天记录导入成功！");
          } catch (err) {
            alert("导入失败，文件格式错误。");
          }
        };
        reader.readAsText(file);
      }
    };

    const manualSummary = async () => {
      const messages = weiboChats[friend.id] || [];
      if (messages.length === 0) {
        alert("暂无聊天记录，无法总结。");
        return;
      }
      
      alert("正在总结当前对话记忆...");
      const summaryPrompt = `请总结以下对话记忆：\n${messages.map(m => `${m.role}: ${m.content}`).join('\n')}`;
      try {
        const ai = getGeminiClient(settings);
        const result = await ai.models.generateContent({
          model: getGeminiModel(settings),
          contents: summaryPrompt,
          config: {
            temperature: 0.3
          }
        });
        const summary = result.text || "总结失败。";
        
        // Save to global memory store
        addOnlineMemory(friend.id, summary, 'manual', 'weibo');
        
        alert(`记忆总结完成并已存入记忆库（微博模块）：\n${summary}`);
      } catch (e) {
        console.error("总结失败:", e);
        alert("总结失败，请检查网络或 API 设置。");
      }
    };

    return (
      <div className="fixed inset-0 z-[120] bg-slate-50 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowChatSettingsId(null)}><ChevronLeft size={24} /></button>
            <span className="font-bold">聊天设置</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Friend Info */}
          <div className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm">
            <img src={friend.avatar} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
            <div>
              <p className="font-bold text-lg">{friend.name}</p>
              <p className="text-xs text-slate-400 truncate max-w-[200px]">{friend.persona}</p>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">查找聊天记录</span>
              <Search size={18} className="text-slate-400" />
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="搜索关键词..." 
                value={chatSearchQuery}
                onChange={e => setChatSearchQuery(e.target.value)}
                className="w-full bg-slate-100 rounded-xl px-4 py-2 text-sm outline-none"
              />
              {chatSearchQuery && (
                <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                  {(weiboChats[friend.id] || []).filter(m => m.content.includes(chatSearchQuery)).map(m => (
                    <div key={m.id} className="text-xs p-2 bg-slate-50 rounded border border-slate-100">
                      <p className="font-bold text-slate-500">{m.role === 'user' ? '我' : friend.name}</p>
                      <p>{m.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Memory Summary */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">记忆总结</span>
              <FileText size={18} className="text-slate-400" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>自动总结</span>
              <button 
                onClick={() => {
                  const current = friend.memorySettings?.autoSummaryEnabled ?? true;
                  setWeiboFriends(prev => prev.map(f => f.id === friend.id ? { 
                    ...f, 
                    memorySettings: { ...(f.memorySettings || { contextLimit: 10, summaryThreshold: 20, summaryBuffer: 5, autoSummaryEnabled: true, silentSummaryMode: false, syncThreshold: 5 }), autoSummaryEnabled: !current } 
                  } : f));
                }}
                className={cn("w-12 h-6 rounded-full transition-all relative", (friend.memorySettings?.autoSummaryEnabled ?? true) ? "bg-orange-500" : "bg-slate-200")}
              >
                <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", (friend.memorySettings?.autoSummaryEnabled ?? true) ? "right-1" : "left-1")} />
              </button>
            </div>
            <button 
              onClick={manualSummary}
              className="w-full py-2 bg-slate-100 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              手动总结当前记忆
            </button>
          </div>

          {/* Chat Background */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">设置聊天背景</span>
              <Image size={18} className="text-slate-400" />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => document.getElementById('chat-bg-upload')?.click()}
                className="flex-1 py-2 bg-slate-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                从相册上传
              </button>
              <button 
                onClick={() => {
                  const url = prompt("请输入背景图 URL:");
                  if (url) setWeiboFriends(prev => prev.map(f => f.id === friend.id ? { ...f, chatBackground: url } : f));
                }}
                className="flex-1 py-2 bg-slate-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              >
                <Link size={16} />
                从图床上传
              </button>
              <input type="file" id="chat-bg-upload" className="hidden" onChange={handleChatBgUpload} accept="image/*" />
            </div>
            {friend.chatBackground && (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-100">
                <img src={friend.chatBackground} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setWeiboFriends(prev => prev.map(f => f.id === friend.id ? { ...f, chatBackground: undefined } : f))}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Context Rounds */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">上下文记忆轮数</span>
              <History size={18} className="text-slate-400" />
            </div>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="5"
                value={friend.memorySettings?.contextLimit || 10}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  setWeiboFriends(prev => prev.map(f => f.id === friend.id ? { 
                    ...f, 
                    memorySettings: { ...(f.memorySettings || { contextLimit: 10, summaryThreshold: 20, summaryBuffer: 5, autoSummaryEnabled: true, silentSummaryMode: false, syncThreshold: 5 }), contextLimit: val } 
                  } : f));
                }}
                className="flex-1 accent-orange-500"
              />
              <span className="text-sm font-bold w-8">{friend.memorySettings?.contextLimit || 10}</span>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">数据管理</span>
              <Download size={18} className="text-slate-400" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={exportChat} className="py-2 bg-slate-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Download size={16} />
                导出记录
              </button>
              <button onClick={() => document.getElementById('chat-import')?.click()} className="py-2 bg-slate-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                <Upload size={16} />
                导入记录
              </button>
              <input type="file" id="chat-import" className="hidden" onChange={importChat} accept=".json" />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            <button 
              onClick={() => {
                const isBlocked = friend.isBlocked;
                setWeiboFriends(prev => prev.map(f => f.id === friend.id ? { ...f, isBlocked: !isBlocked } : f));
                alert(isBlocked ? "已取消拉黑" : "已拉黑该好友");
              }}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <Ban size={18} />
              {friend.isBlocked ? '取消拉黑' : '拉黑好友'}
            </button>
            <button 
              onClick={() => {
                if (confirm("确定要删除该好友吗？聊天记录也将被清空。")) {
                  setWeiboFriends(prev => prev.filter(f => f.id !== friend.id));
                  setWeiboChats(prev => {
                    const next = { ...prev };
                    delete next[friend.id];
                    return next;
                  });
                  setShowChatSettingsId(null);
                  setActiveChatFriendId(null);
                }
              }}
              className="w-full py-3 flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 size={18} />
              删除好友
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreateGroupModal = () => (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <span className="font-bold">发起群聊</span>
          <button onClick={() => { setShowCreateGroupModal(false); setSelectedFriendsForGroup([]); }} className="p-1 hover:bg-slate-200 rounded-full"><X size={20} /></button>
        </div>
        <div className="p-4">
           <input 
             type="text" 
             placeholder="群聊名称" 
             className="w-full border-b-2 border-slate-100 py-2 outline-none focus:border-orange-500 transition-colors"
             id="group-name-input"
           />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-3 py-2 text-xs text-slate-400 font-bold uppercase tracking-wider">选择好友</p>
          {weiboFriends.length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-sm">暂无微博好友，请先添加好友</p>
          ) : (
            weiboFriends.map(friend => (
              <div 
                key={friend.id} 
                onClick={() => {
                  setSelectedFriendsForGroup(prev => 
                    prev.includes(friend.id) ? prev.filter(id => id !== friend.id) : [...prev, friend.id]
                  );
                }}
                className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img src={friend.avatar} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <span className="font-medium text-sm">{friend.name}</span>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  selectedFriendsForGroup.includes(friend.id) ? "bg-orange-500 border-orange-500" : "border-slate-200"
                )}>
                  {selectedFriendsForGroup.includes(friend.id) && <Plus size={14} className="text-white rotate-45" />}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t bg-slate-50">
          <button 
            disabled={selectedFriendsForGroup.length === 0}
            onClick={() => {
               const nameInput = document.getElementById('group-name-input') as HTMLInputElement;
               const groupName = nameInput.value.trim() || `${userProfile.name}发起的群聊`;
               const newGroup = {
                 id: Date.now().toString(),
                 name: groupName,
                 members: ['user', ...selectedFriendsForGroup],
                 createdAt: Date.now()
               };
               setWeiboGroups(prev => [...prev, newGroup]);
               setShowCreateGroupModal(false);
               setSelectedFriendsForGroup([]);
            }}
            className={cn(
              "w-full py-3 rounded-xl font-bold transition-all",
              selectedFriendsForGroup.length > 0 ? "bg-orange-500 text-white shadow-lg shadow-orange-100" : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            完成 ({selectedFriendsForGroup.length})
          </button>
        </div>
      </div>
    </div>
  );

  const renderMePage = () => (
    <div className={cn("flex-1 overflow-y-auto pb-20", themeClasses.bg)}>
      <input type="file" id="bg-upload" className="hidden" onChange={(e) => handleFileChange('background', e)} />
      <div className="relative h-48 cursor-pointer" onClick={() => document.getElementById('bg-upload')?.click()}>
          {userProfile.background && <img src={userProfile.background} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
      </div>
      <div className="px-4 -mt-12 relative">
        <div className="flex items-end gap-4">
          <input type="file" id="avatar-upload" className="hidden" onChange={(e) => handleFileChange('avatar', e)} />
          {userProfile.avatar && <img src={userProfile.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover cursor-pointer" referrerPolicy="no-referrer" onClick={() => document.getElementById('avatar-upload')?.click()} />}
          <div className="mb-2">
            <h2 className={cn("text-xl font-bold", themeClasses.text)}>{userProfile.name}</h2>
            <p className={cn("text-sm", themeClasses.text)}>{userProfile.signature}</p>
          </div>
        </div>
        <div className={cn("flex gap-6 mt-4 text-sm", themeClasses.text)}>
          <span><strong className="text-lg">{userProfile.followers}</strong> 粉丝</span>
          <span><strong className="text-lg">{userProfile.following}</strong> 关注</span>
          <span><strong className="text-lg">{userProfile.likes}</strong> 转评赞</span>
        </div>
        <button onClick={() => setIsEditing(true)} className={cn("w-full mt-4 py-2 border rounded-full text-sm font-bold", themeClasses.text, themeClasses.border)}>编辑个人资料</button>
      </div>
      <div className="mt-4 px-4 pb-10">
        <h3 className={cn("font-bold mb-2", themeClasses.text)}>我的微博</h3>
        {feed.filter(item => item.friend.name === 'Me').length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">暂无微博</p>
        ) : (
          feed.filter(item => item.friend.name === 'Me').map(item => (
            <div key={item.moment.id} className="bg-white p-4 mb-2 rounded-lg text-sm shadow-sm">{item.moment.content}</div>
          ))
        )}
      </div>
      {/* ... (edit modal remains same) ... */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm space-y-4 overflow-y-auto max-h-[80vh]">
            <h3 className="font-bold text-lg">编辑个人资料</h3>
            <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border p-2 rounded" placeholder="昵称" />
            <input type="text" value={editForm.signature} onChange={e => setEditForm({...editForm, signature: e.target.value})} className="w-full border p-2 rounded" placeholder="个性签名" />
            <input type="text" value={editForm.avatar} onChange={e => setEditForm({...editForm, avatar: e.target.value})} className="w-full border p-2 rounded" placeholder="头像 URL" />
            <input type="text" value={editForm.background} onChange={e => setEditForm({...editForm, background: e.target.value})} className="w-full border p-2 rounded" placeholder="背景图 URL" />
            <input type="number" value={editForm.followers} onChange={e => setEditForm({...editForm, followers: parseInt(e.target.value)})} className="w-full border p-2 rounded" placeholder="粉丝数" />
            <input type="number" value={editForm.following} onChange={e => setEditForm({...editForm, following: parseInt(e.target.value)})} className="w-full border p-2 rounded" placeholder="关注数" />
            <input type="number" value={editForm.likes} onChange={e => setEditForm({...editForm, likes: parseInt(e.target.value)})} className="w-full border p-2 rounded" placeholder="转评赞数" />
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-2 border rounded">取消</button>
              <button onClick={saveProfile} className="flex-1 py-2 bg-orange-500 text-white rounded">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const [replyingTo, setReplyingTo] = useState<MomentComment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [newMomentContent, setNewMomentContent] = useState('');

  const triggerAutoReply = async (moment: MomentPost, targetComment: MomentComment) => {
    // 1. Check if this AI character has already replied to this post to save quota
    // We'll pick a random friend who hasn't replied yet, or the post author if they are AI
    const hasReplied = (moment.comments || []).some(c => c.authorId === moment.authorId) || 
                       (moment.comments || []).some(c => (c.replies || []).some(r => r.authorId === moment.authorId));

    // Determine who should reply
    let replier: Friend | null = null;
    
    if (moment.authorId.startsWith('ai_user_')) {
      // If it's a generated AI user's post, they might reply to comments
      if (!hasReplied) {
        replier = { id: moment.authorId, name: moment.authorName || '网友', avatar: moment.authorAvatar || '', persona: '一个普通的微博网友', createdAt: Date.now() };
      }
    } else {
      // If it's a friend's post or user's post, pick a random friend who hasn't replied
      const availableFriends = friends.filter(f => 
        !(moment.comments || []).some(c => c.authorId === f.id) &&
        !(moment.comments || []).some(c => (c.replies || []).some(r => r.authorId === f.id))
      );
      if (availableFriends.length > 0) {
        replier = availableFriends[Math.floor(Math.random() * availableFriends.length)];
      }
    }

    if (!replier) return;
    
    // Artificial delay to simulate thinking
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    try {
      const systemPrompt = `你正在扮演 ${replier.name}。${replier.persona ? `性格设定：${replier.persona}。` : ''}
现在你在微博上看到一条动态：
作者：${moment.authorName}
内容：${moment.content}

你准备回复 ${targetComment.authorName} 的评论：
评论内容：${targetComment.content}

请生成一条简短、符合你人设的回复（20字以内）。
要求：完全去掉机器感，贴合普通人日常说话语气，高度口语化，不要刻板书面语，像真人一样随性、自然。只返回回复内容。`;

      const ai = getGeminiClient(settings);
      const result = await ai.models.generateContent({
        model: getGeminiModel(settings),
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        config: {
          temperature: 0.7
        }
      });
      const replyContent = result.text || "赞同！";
      
      const autoReply: MomentComment = {
        id: Date.now().toString() + Math.random(),
        authorId: replier.id,
        authorName: replier.name,
        authorAvatar: replier.avatar,
        content: replyContent.replace(/^["'「『]|["'」』]$/g, ''), // Clean quotes
        timestamp: Date.now(),
        replyToId: targetComment.id,
        replyToName: targetComment.authorName
      };
      
      setMoments(prev => prev.map(m => m.id === moment.id ? {
        ...m,
        comments: (m.comments || []).map(c => c.id === targetComment.id ? {
          ...c,
          replies: [...(c.replies || []), autoReply]
        } : c)
      } : m));

      // After an AI replies, there's a small chance another AI joins the conversation (AI-AI interaction)
      // Reduced probability to 15% and added a depth limit check to save quota
      const replyDepth = (targetComment.replies || []).length;
      if (Math.random() > 0.85 && replyDepth < 3) {
        setTimeout(() => {
          triggerAutoReply(moment, autoReply).catch(err => console.error("Recursive auto-reply failed:", err));
        }, 8000);
      }

    } catch (e) {
      console.error("AI回复失败:", e);
    }
  };

  const triggerAiComment = async (moment: MomentPost) => {
    // Pick a random friend who hasn't commented yet
    const availableFriends = friends.filter(f => 
      !(moment.comments || []).some(c => c.authorId === f.id)
    );
    
    if (availableFriends.length === 0) return;
    const replier = availableFriends[Math.floor(Math.random() * availableFriends.length)];

    // Artificial delay
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 5000));

    try {
      const systemPrompt = `你正在扮演 ${replier.name}。${replier.persona ? `性格设定：${replier.persona}。` : ''}
现在你在微博上看到好友 ${moment.authorName} 发了一条动态：
内容：${moment.content}

请生成一条简短、符合你人设的评论（20字以内）。
要求：完全去掉机器感，贴合普通人日常说话语气，高度口语化，不要刻板书面语，像真人一样随性、自然。只返回评论内容。`;

      const ai = getGeminiClient(settings);
      const result = await ai.models.generateContent({
        model: getGeminiModel(settings),
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        config: {
          temperature: 0.7
        }
      });
      const commentContent = result.text || "好棒！";

      const newComment: MomentComment = {
        id: Date.now().toString() + Math.random(),
        authorId: replier.id,
        authorName: replier.name,
        authorAvatar: replier.avatar,
        content: commentContent.replace(/^["'「『]|["'」』]$/g, ''),
        timestamp: Date.now(),
        replies: []
      };

      setMoments(prev => prev.map(m => m.id === moment.id ? {
        ...m,
        comments: [...(m.comments || []), newComment]
      } : m));

      // Small chance for another AI to reply to this new comment
      // Reduced probability to 20% to save quota
      if (Math.random() > 0.8) {
        setTimeout(() => {
          triggerAutoReply(moment, newComment).catch(err => console.error("Delayed auto-reply failed:", err));
        }, 8000);
      }
    } catch (e) {
      console.error("AI评论失败:", e);
    }
  };

  const handleReply = (moment: MomentPost) => {
    if (!replyContent.trim()) return;
    const newComment: MomentComment = {
      id: Date.now().toString() + Math.random(),
      authorId: 'user',
      authorName: userProfile.name,
      authorAvatar: userProfile.avatar,
      content: replyContent,
      timestamp: Date.now(),
      replyToId: replyingTo?.id,
      replyToName: replyingTo?.authorName
    };
    setMoments(prev => prev.map(m => {
      if (m.id !== moment.id) return m;
      if (replyingTo) {
        // Add as a nested reply
        return {
          ...m,
          comments: (m.comments || []).map(c => c.id === replyingTo.id ? {
            ...c,
            replies: [...(c.replies || []), newComment]
          } : c)
        };
      } else {
        // Add as a top-level comment
        return {
          ...m,
          comments: [...(m.comments || []), newComment]
        };
      }
    }));
    
    // Trigger auto-reply if author is a generated user
    triggerAutoReply(moment, newComment);
    
    setReplyContent('');
    setReplyingTo(null);
  };

  const renderWritingPage = () => (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={() => setIsWriting(false)} className="text-slate-600">取消</button>
        <span className="font-bold text-lg">发微博</span>
        <button 
          onClick={() => {
            if (!newMomentContent.trim()) return;
            const newMoment: MomentPost = {
              id: Date.now().toString() + Math.random(),
              authorId: 'user',
              authorName: userProfile.name,
              authorAvatar: userProfile.avatar,
              content: newMomentContent,
              timestamp: Date.now(),
              images: [],
              likes: [],
              comments: [],
              visibility: 'public',
              categoryId: selectedCategoryId === 'all' ? categories[0]?.id : selectedCategoryId
            };
            setMoments(prev => [newMoment, ...prev]);
            // Trigger AI comments
            setTimeout(() => triggerAiComment(newMoment), 2000);
            if (Math.random() > 0.5) {
              setTimeout(() => triggerAiComment(newMoment), 15000);
            }
            setNewMomentContent('');
            setIsWriting(false);
          }}
          className={cn("px-4 py-1.5 rounded-full text-sm font-bold", newMomentContent.trim() ? "bg-orange-400 text-white" : "bg-slate-200 text-slate-400")}
        >
          发送
        </button>
      </div>
      <div className="flex-1 p-4">
        <textarea 
          value={newMomentContent}
          onChange={(e) => setNewMomentContent(e.target.value)}
          placeholder="分享新鲜事..."
          className="w-full h-32 outline-none text-lg resize-none"
        />
        <div className="mt-4">
          <p className="text-sm text-slate-500 mb-2">选择分类：</p>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button 
                key={cat.id} 
                onClick={() => {
                   // Create a temporary state for selected category in writing page
                   // For now, just use a local state or update selectedCategoryId directly
                   // Let's update selectedCategoryId directly as it affects the feed
                   setSelectedCategoryId(cat.id);
                }}
                className={cn("px-3 py-1 rounded-full text-sm", selectedCategoryId === cat.id ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600")}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailView = () => {
    if (!selectedMomentId) return null;
    const item = feed.find(i => i.moment.id === selectedMomentId);
    if (!item) return null;
    const { friend, moment } = item;

    return (
      <div className={cn("fixed inset-0 z-50 flex flex-col", themeClasses.bg)}>
        {/* Header */}
        <div className={cn("flex items-center justify-between px-4 py-3 border-b shrink-0", isRainy ? "bg-black/80 border-white/10" : "bg-white border-slate-200")}>
          <div className="flex items-center">
            <button onClick={() => setSelectedMomentId(null)} className={cn("p-1", isRainy ? "text-white" : "text-slate-700")}><ChevronLeft size={24} /></button>
            <span className="font-bold ml-4">微博正文</span>
          </div>
          <button 
            onClick={async () => {
              setIsRefreshing(true);
              try {
                const ai = getGeminiClient(settings);
                const result = await ai.models.generateContent({
                  model: getGeminiModel(settings),
                  contents: [{ role: 'user', parts: [{ text: `为这条微博生成最新的评论列表（包含作者名、头像文字、内容、时间）以及点赞数和转发数。微博内容是：${moment.content}。请返回JSON格式：{ "comments": [{ "authorName": "...", "authorAvatar": "...", "content": "...", "timestamp": "..." }], "likesCount": number, "repostsCount": number }` }] }],
                  config: {
                    temperature: 0.7,
                    responseMimeType: "application/json"
                  }
                });

                let text = result.text || "";
                if (!text) throw new Error("API未返回有效内容");
                
                const jsonStartIndex = text.indexOf('{');
                const jsonEndIndex = text.lastIndexOf('}');
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                  text = text.substring(jsonStartIndex, jsonEndIndex + 1);
                }
                const data = JSON.parse(text);
                
                // Update moment with new data
                setMoments(prev => prev.map(m => m.id === moment.id ? {
                  ...m,
                  comments: [
                    ...(m.comments || []),
                    ...data.comments.filter((c: any) => !(m.comments || []).some(existing => existing.content === c.content)).map((c: any) => ({
                      id: Date.now().toString() + Math.random(),
                      authorId: 'ai_user_' + Math.random(),
                      authorName: c.authorName,
                      authorAvatar: c.authorAvatar,
                      content: c.content,
                      timestamp: Date.now()
                    }))
                  ],
                  likes: Array(data.likesCount).fill('liked_user')
                } : m));
              } catch (e) {
                console.error("刷新详情页失败:", e);
              } finally {
                setIsRefreshing(false);
              }
            }}
            className={cn("p-1", isRefreshing && "animate-spin", isRainy ? "text-white" : "text-slate-700")}
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-3">
            <img src={friend.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
            <div>
              <div className={cn("font-bold text-sm", isRainy ? "text-blue-400" : "text-slate-900")}>{friend.name}</div>
              <div className="text-[10px] text-slate-400">{new Date(moment.timestamp).toLocaleString()} · 来自 iPhone 14 Pro Max</div>
            </div>
          </div>
          
          <p className={cn("text-base leading-relaxed", isRainy ? "text-white/90" : "text-slate-800")}>{moment.content}</p>
          
          {moment.images && moment.images.map((img, i) => img && <img key={i} src={img} className="w-full rounded-lg" referrerPolicy="no-referrer" />)}

          <div className="border-t pt-4">
            <div className="flex gap-6 text-sm text-slate-500 mb-4">
                <span>转发 0</span>
                <span className="font-bold text-orange-500 border-b-2 border-orange-500">评论 {(moment.comments || []).length}</span>
                <span>赞 {(moment.likes || []).length}</span>
            </div>
            
            <div className="space-y-4">
              {(moment.comments || []).map(comment => {
                const commentAuthor = comment.authorId === 'user' ? userProfile : friends.find(f => f.id === comment.authorId);
                return (
                  <div key={comment.id} className="flex gap-3">
                      {commentAuthor?.avatar ? (
                        <img src={commentAuthor.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-xs font-bold text-slate-500">
                          {comment.authorAvatar || (commentAuthor?.name ? commentAuthor.name[0] : comment.authorName[0])}
                        </div>
                      )}
                      <div className="flex-1 border-b pb-3">
                          <div className="font-bold text-sm text-slate-700">{comment.authorName}</div>
                          <div className="text-sm text-slate-800 mt-1">{comment.content}</div>
                          
                          {/* Nested Replies */}
                          {(comment.replies || []).map(reply => (
                            <div key={reply.id} className="mt-2 bg-slate-50 p-2 rounded text-sm">
                                <span className="font-bold text-slate-700">{reply.authorName}</span>
                                <span className="text-slate-500"> 回复 </span>
                                <span className="font-bold text-slate-700">{reply.replyToName}</span>
                                <span>: {reply.content}</span>
                            </div>
                          ))}

                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-4">
                            <span>{new Date(comment.timestamp).toLocaleDateString()}</span>
                            <button onClick={() => { /* TODO: Like comment */ }} className="flex items-center gap-1">
                              <Heart size={12} />
                              <span>{(comment.likes || []).length}</span>
                            </button>
                            <button onClick={() => setReplyingTo(comment)} className="flex items-center gap-1">
                              <MessageSquare size={12} />
                              <span>回复</span>
                            </button>
                          </div>
                      </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reply Input */}
        {replyingTo && (
          <div className="p-4 border-t bg-white flex gap-2">
            <input 
              type="text" 
              value={replyContent} 
              onChange={e => setReplyContent(e.target.value)}
              placeholder={`回复 ${replyingTo.authorName}:`}
              className="flex-1 border rounded-full px-4 py-2 text-sm"
            />
            <button onClick={() => handleReply(moment)} className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm">发送</button>
          </div>
        )}

        {/* Fixed Bottom Bar */}
        <div className={cn("border-t p-2 flex items-center justify-around shrink-0", isRainy ? "bg-black/90 border-white/10" : "bg-white border-slate-200")}>
            <button onClick={() => {/* TODO: Implement Forward */}} className="flex flex-col items-center gap-1 text-slate-500">
                <Share2 size={20} />
                <span className="text-[10px]">转发</span>
            </button>
            <div className="flex-1 px-4">
                <input 
                    type="text" 
                    value={commentInputs[moment.id] || ''}
                    onChange={e => setCommentInputs(prev => ({ ...prev, [moment.id]: e.target.value }))}
                    className="w-full bg-slate-100 p-2 rounded-full text-sm"
                    placeholder="评论一下..."
                />
            </div>
            <button onClick={() => handleComment(moment.id)} className="bg-orange-500 text-white px-4 py-1 rounded text-sm">发送</button>
            <button onClick={() => toggleLike(moment.id)} className="flex flex-col items-center gap-1">
                <Heart size={20} className={cn("transition-all", likedMoments.has(moment.id) ? "fill-red-500 text-red-500" : "text-slate-500")} />
                <span className="text-[10px] text-slate-500">{(moment.likes || []).length}</span>
            </button>
        </div>
      </div>
    );
  };

  const toggleLike = (momentId: string) => {
    // Update likedMoments state
    const newLiked = new Set(likedMoments);
    if (newLiked.has(momentId)) newLiked.delete(momentId);
    else newLiked.add(momentId);
    setLikedMoments(newLiked);

    // Update moments state
    setMoments(prev => prev.map(m => {
      if (m.id === momentId) {
        const isLiked = newLiked.has(momentId);
        const currentLikes = m.likes || [];
        const newLikes = isLiked 
          ? [...currentLikes, 'user'] 
          : currentLikes.filter(id => id !== 'user');
        return { ...m, likes: newLikes };
      }
      return m;
    }));
  };

  const handleComment = async (momentId: string) => {
    const content = commentInputs[momentId];
    if (!content || isRefreshing) return;

    // 1. Add user comment
    const newComment: MomentComment = {
      id: Date.now().toString(),
      authorId: 'user',
      authorName: userProfile.name,
      content: content,
      timestamp: Date.now(),
    };

    // Update moments state
    setMoments(prev => prev.map(m => m.id === momentId ? { ...m, comments: [...(m.comments || []), newComment] } : m));
    setCommentInputs(prev => ({ ...prev, [momentId]: '' }));

    // 2. AI Role Perception & Auto-Reply
    const moment = moments.find(m => m.id === momentId);
    if (moment) {
      triggerAutoReply(moment, newComment).catch(err => console.error("Auto-reply trigger failed:", err));
    }
  };

  const refreshFeed = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    const category = categories.find(c => c.id === selectedCategoryId);
    const categoryPrompt = category ? category.prompt : '生成一些有趣的微博内容';
    const categoryId = category ? category.id : (categories.length > 0 ? categories[Math.floor(Math.random() * categories.length)].id : 'all');

    try {
      const ai = getGeminiClient(settings);
      const newMoments: MomentPost[] = [];

      // 1. For contact characters (friends), generate Weibo posts strictly matching their persona, reading the latest 30 chat records from chat app, and using first-person thinking.
      const targetFriends = friends.length > 0 
        ? [...friends].sort(() => 0.5 - Math.random()).slice(0, 3) 
        : [];

      for (const friend of targetFriends) {
        try {
          // Read chat app, online chat user and character latest chat context 30 records
          const allChats = await get('zhouzhou_ji_chats') || {};
          const friendChats = allChats[friend.id] || [];
          const recentChatAppHistory = friendChats.slice(-30);
          const chatAppContext = recentChatAppHistory.length > 0
            ? recentChatAppHistory.map((m: any) => `${m.role === 'user' ? '用户' : friend.name}: ${m.content}`).join('\n')
            : '暂无与用户的聊天记录';

          // Read Weibo private chat context (20 records)
          const friendWeiboChats = weiboChats[friend.id] || [];
          const recentWeiboChatHistory = friendWeiboChats.slice(-20);
          const weiboChatContext = recentWeiboChatHistory.length > 0
            ? recentWeiboChatHistory.map((m: any) => `${m.role === 'user' ? '用户' : friend.name}: ${m.content}`).join('\n')
            : '暂无微博私聊记录';

          const prompt = `你现在正在扮演微博博主兼通讯录角色 ${friend.name}。
【角色人设与性格】
${friend.persona || '一个性格鲜明的好友'}

【与用户的聊天App最新聊天上下文（最近30条记录）】
${chatAppContext}

【与用户在微博私聊的最新上下文（最近20条记录）】
${weiboChatContext}

【任务要求】
微博是公共网络平台，角色百分百按照人设思维发表内容的同时，也需要考虑社交平台发言需要以正常人思维考虑，我发表的这条微博，会不会影响个人形象，会不会造成不合适的舆论压力，有一个思考过程,然后才正式输出想要发表的微博帖子内容。
请结合你的【人设生活】与上述聊天上下文，以 ${friend.name} 的【第一人称思维】（第一视角），创作并发表一条微博内容。
1. **百分百符合人设**：语气、性格、说话口吻和行为方式必须100%符合上述人设，绝对不能出戏或带有AI机械感。
2. **结合现实与聊天**：可以融入你最近的生活状态、心情、感悟，或者将与用户的聊天互动中的点滴转化为微博日常分享、吐槽或碎碎念。
3. **微博风格**：高度口语化、接地气、符合当代年轻人发微博的真实习惯（字数50-200字左右），可适当带有话题或表情符号。
4. **输出格式**：可先进行内心思考评估（考虑形象与舆论压力），最终仅返回微博正文内容文本，不要包含任何多余的解释。`;

          const result = await ai.models.generateContent({
            model: getGeminiModel(settings),
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              temperature: 0.8
            }
          });

          const content = result.text?.trim();
          if (content) {
            newMoments.push({
              id: Date.now().toString() + Math.random(),
              authorId: friend.id,
              authorName: friend.name,
              authorAvatar: friend.avatar,
              content: content.replace(/^["'「『]|["'」』]$/g, ''),
              timestamp: Date.now(),
              images: [],
              imageDescription: '',
              likes: [],
              comments: [],
              visibility: 'public',
              categoryId: categoryId
            });
          }
        } catch (friendErr) {
          console.error(`Failed to generate Weibo for friend ${friend.name}:`, friendErr);
        }
      }

      // 2. Also generate 2 netizen posts to keep the feed rich
      const netizenPrompt = `请以微博风格生成2条网友或热门话题微博内容，主题是：${categoryPrompt}。请返回JSON数组，每个对象包含：content(微博内容), authorName(作者名), authorAvatar(作者头像单字，例如：'网', '路', '星')。`;
      
      const netizenResult = await ai.models.generateContent({
        model: getGeminiModel(settings),
        contents: [{ role: 'user', parts: [{ text: netizenPrompt }] }],
        config: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });

      let netizenText = netizenResult.text || "";
      const jsonStartIndex = netizenText.indexOf('[');
      const jsonEndIndex = netizenText.lastIndexOf(']');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        netizenText = netizenText.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      const netizenData = JSON.parse(netizenText || '[]');
      const netizenMoments: MomentPost[] = netizenData.map((item: any) => ({
        id: Date.now().toString() + Math.random(),
        authorId: 'ai_user_' + Math.random(),
        authorName: item.authorName || '网友',
        authorAvatar: item.authorAvatar || '网',
        content: item.content,
        timestamp: Date.now() - Math.floor(Math.random() * 60000),
        images: [],
        imageDescription: '',
        likes: [],
        comments: [],
        visibility: 'public',
        categoryId: categoryId
      }));

      const combinedMoments = [...newMoments, ...netizenMoments];
      setMoments(prev => [...combinedMoments, ...prev]);
      
      // Trigger some AI comments on the new AI posts to make it lively
      combinedMoments.forEach((m, idx) => {
        if (Math.random() > 0.3) {
          setTimeout(() => {
            triggerAiComment(m).catch(err => console.error("Delayed AI comment failed:", err));
          }, 5000 + idx * 3000);
        }
      });
      
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderTopBar = () => {
    return (
      <div className={cn("sticky top-0 z-20 flex items-center justify-between px-4 py-2 border-b", isRainy ? "bg-black/80 border-white/10" : "bg-white border-slate-200")}>
        {activeTab === 'home' && (
          <>
            <button onClick={onBack} className={cn("p-1", isRainy ? "text-white" : "text-slate-700")}><ChevronLeft size={24} /></button>
            <div className="flex gap-6">
              {['recommend', 'following'].map(tab => (
                <button key={tab} onClick={() => setActiveSubTab(tab as any)} className={cn("font-bold text-base pb-1", activeSubTab === tab ? (isRainy ? "text-white border-b-2 border-white" : "text-slate-900 border-b-2 border-slate-900") : "text-slate-400")}>
                  {tab === 'recommend' ? '推荐' : '关注'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button onClick={refreshFeed} className={cn("p-1", isRefreshing && "animate-spin", isRainy ? "text-white" : "text-slate-700")}><RefreshCw size={24} /></button>
              <button onClick={() => setIsWriting(true)} className={cn("p-1", isRainy ? "text-white" : "text-slate-700")}><Plus size={24} /></button>
              <button onClick={() => setShowCategoryPopup(true)} className={cn("p-1", isRainy ? "text-white" : "text-slate-700")}><Settings size={24} /></button>
            </div>
          </>
        )}
        
        {activeTab === 'video' && (
          <>
            <div className="w-8" /> {/* Spacer */}
            <div className="flex gap-6">
              {['recommend', 'short-drama'].map(tab => (
                <button key={tab} className={cn("font-bold text-base pb-1", tab === 'recommend' ? (isRainy ? "text-white border-b-2 border-white" : "text-slate-900 border-b-2 border-slate-900") : "text-slate-400")}>
                  {tab === 'recommend' ? '推荐' : '短剧'}
                </button>
              ))}
            </div>
            <div className="w-8" /> {/* Spacer */}
          </>
        )}

        {activeTab === 'discover' && (
          <div className="flex-1 flex items-center bg-slate-100 rounded-full px-3 py-1.5 gap-2">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="搜索微博、用户" className="bg-transparent w-full text-sm outline-none" />
          </div>
        )}

        {activeTab === 'message' && (
          <>
            <div className="flex-1 flex justify-center gap-6">
              {['groups', 'friends', 'messages'].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setMessageSubTab(tab as any)}
                  className={cn(
                    "font-bold text-base pb-1 transition-all",
                    messageSubTab === tab 
                      ? (isRainy ? "text-white border-b-2 border-white" : "text-orange-500 border-b-2 border-orange-500") 
                      : "text-slate-400"
                  )}
                >
                  {tab === 'groups' ? '发现群' : tab === 'friends' ? '好友' : '消息'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAddFriendModal(true)} className="text-slate-500 hover:text-orange-500 transition-colors"><UserPlus size={20} /></button>
              <button className="text-slate-500 hover:text-orange-500 transition-colors"><Settings size={20} /></button>
            </div>
          </>
        )}

        {activeTab === 'me' && (
          <>
            <div className="w-8" /> {/* Spacer */}
            <span className="font-bold">我的</span>
            <div className="flex gap-4">
              <button><UserPlus size={20} /></button>
              <button><Settings size={20} /></button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderSubTabs = () => {
    if (activeTab !== 'home' || activeSubTab !== 'recommend') return null;
    return (
      <div className={cn("sticky top-[48px] z-20 flex items-center gap-6 px-4 py-2 border-b overflow-x-auto", isRainy ? "bg-black/80 border-white/10" : "bg-white border-slate-200")}>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className={cn("font-bold text-sm whitespace-nowrap", cat.id === selectedCategoryId ? (isRainy ? "text-white" : "text-orange-500") : "text-slate-500")}>
            {cat.name}
          </button>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        const filteredFeed = selectedCategoryId === 'all' 
          ? feed 
          : feed.filter(item => (item.moment as any).categoryId === selectedCategoryId);
        
        const sortedFeed = selectedCategoryId === 'hot'
          ? [...feed].sort((a, b) => (b.moment.likes?.length || 0) - (a.moment.likes?.length || 0))
          : filteredFeed;

        return (
          <div className="space-y-2">
            {sortedFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <p>暂时没有微博</p>
                <button onClick={refreshFeed} className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-full">刷新获取</button>
              </div>
            ) : (
              sortedFeed.map(({ friend, moment }) => (
                <motion.div 
                  key={moment.id}
                  onClick={() => setSelectedMomentId(moment.id)}
                  className={cn(
                    "p-4 space-y-3 transition-all duration-300 border-b cursor-pointer",
                    isRainy ? "bg-white/5 border-white/5" : "bg-white border-slate-100"
                  )}
                >
                  <div className="flex gap-3">
                    {moment.authorId.startsWith('ai_user_') ? (
                      <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-orange-700 font-bold text-lg shrink-0">
                        {moment.authorAvatar}
                      </div>
                    ) : (
                      friend.avatar ? (
                        <img 
                          src={friend.avatar} 
                          className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer" 
                          referrerPolicy="no-referrer"
                          onClick={(e) => { e.stopPropagation(); setViewingFriendProfileId(friend.id); }}
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setViewingFriendProfileId(friend.id); }}
                        >
                          {friend.name[0]}
                        </div>
                      )
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={cn("font-bold text-sm", isRainy ? "text-blue-400" : "text-slate-900")}>
                          {moment.authorId.startsWith('ai_user_') ? moment.authorName : friend.name}
                        </span>
                        <button className="text-slate-400 z-10 relative p-2 bg-slate-100 rounded" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setDeleteConfirm(moment.id); }}>删除</button>
                      </div>
                      
                      {deleteConfirm === moment.id && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                          <div className="bg-white p-6 rounded-2xl shadow-xl w-64">
                            <p className="text-sm text-slate-800 mb-4">确定要删除这条微博吗？</p>
                            <div className="flex justify-end gap-3">
                              <button onClick={() => setDeleteConfirm(null)} className="text-sm text-slate-500">取消</button>
                              <button onClick={() => { setMoments(prev => prev.filter(m => m.id !== deleteConfirm)); setDeleteConfirm(null); }} className="text-sm text-red-500 font-bold">确定</button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <p className={cn("text-sm leading-relaxed", isRainy ? "text-white/80" : "text-slate-800")}>
                        {moment.content}
                      </p>

                      {moment.imageDescription && (
                        <div className="mt-3 p-4 bg-pink-100 rounded-2xl border-2 border-pink-200 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-pink-400 shrink-0 shadow-sm">
                            <Camera size={24} />
                          </div>
                          <p className="text-xs text-pink-700 font-medium italic">“{moment.imageDescription}”</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] text-slate-400">{new Date(moment.timestamp).toLocaleDateString()}</span>
                        <div className="flex items-center gap-6">
                          <button onClick={(e) => { e.stopPropagation(); toggleLike(moment.id); }} className="flex items-center gap-1 group">
                            <Heart size={18} className={cn("transition-all", likedMoments.has(moment.id) ? "fill-red-500 text-red-500" : "text-slate-400")} />
                            <span className="text-xs text-slate-400">{(moment.likes || []).length}</span>
                          </button>
                          <button className="flex items-center gap-1 group">
                            <MessageSquare size={18} className="text-slate-400" />
                            <span className="text-xs text-slate-400">{(moment.comments || []).length}</span>
                          </button>
                          <button className="flex items-center gap-1 group">
                            <Share2 size={18} className="text-slate-400" />
                            <span className="text-xs text-slate-400">0</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        );
      case 'video': 
        return (
          <div className={cn("flex-1 flex flex-col items-center justify-center text-slate-400", themeClasses.bg)}>
            <Play size={48} className="opacity-20 mb-4" />
            <p className="text-sm">暂无视频内容</p>
          </div>
        );
      case 'discover': 
        return (
          <div className={cn("flex-1 flex flex-col items-center justify-center text-slate-400", themeClasses.bg)}>
            <Search size={48} className="opacity-20 mb-4" />
            <p className="text-sm">发现更多精彩</p>
          </div>
        );
      case 'message': return renderMessagePage();
      case 'me': return renderMePage();
      default: return null;
    }
  };

  return (
    <div className={cn(
      "h-full w-full flex flex-col font-sans transition-all duration-500",
      themeClasses.bg, themeClasses.text
    )}>
      {renderTopBar()}
      {renderSubTabs()}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
      {renderDetailView()}
      {isWriting && renderWritingPage()}

      {/* Add Friend Modal */}
      {showAddFriendModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <span className="font-bold">添加通讯录好友</span>
              <button onClick={() => setShowAddFriendModal(false)} className="p-1 hover:bg-slate-200 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {friends.filter(f => !weiboFriends.some(wf => wf.id === f.id)).length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-sm">通讯录好友已全部添加</p>
              ) : (
                friends.filter(f => !weiboFriends.some(wf => wf.id === f.id)).map(friend => (
                  <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <img src={friend.avatar} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                      <span className="font-medium text-sm">{friend.name}</span>
                    </div>
                    <button 
                      onClick={() => {
                        setWeiboFriends(prev => [...prev, { ...friend, isFollowedByMe: true, isFollowingMe: Math.random() > 0.3 }]);
                        setShowAddFriendModal(false);
                      }}
                      className="bg-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold"
                    >
                      添加
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeChatFriendId && renderChatView()}
      {viewingFriendProfileId && renderFriendProfile()}
      {showChatSettingsId && renderChatSettings()}
      {showCreateGroupModal && renderCreateGroupModal()}

      {showCategoryPopup && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">分类设置</h3>
              <button onClick={() => setShowCategoryPopup(false)}><X size={20} /></button>
            </div>
            <input type="text" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="w-full border p-2 rounded" placeholder="分类名称" />
            <textarea value={newCategory.prompt} onChange={e => setNewCategory({...newCategory, prompt: e.target.value})} className="w-full border p-2 rounded h-32" placeholder="内容设定（支持长文）" />
            <div className="flex gap-2">
              <button onClick={() => {
                setCategories([...categories, { id: Date.now().toString(), ...newCategory }]);
                setNewCategory({ name: '', prompt: '' });
                setShowCategoryPopup(false);
              }} className="flex-1 py-2 bg-orange-500 text-white rounded">添加分类</button>
            </div>
            <div className="mt-4 space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex justify-between items-center p-2 border rounded">
                  {editingCategoryId === cat.id ? (
                    <div className="flex-1 flex gap-2">
                      <input type="text" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="border p-1 rounded flex-1" />
                      <button onClick={() => {
                        setCategories(categories.map(c => c.id === cat.id ? { ...c, ...newCategory } : c));
                        setEditingCategoryId(null);
                        setNewCategory({ name: '', prompt: '' });
                      }} className="text-green-500">保存</button>
                    </div>
                  ) : (
                    <>
                      <span>{cat.name}</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCategoryId(cat.id); setNewCategory({ name: cat.name, prompt: cat.prompt }); }} className="text-blue-500"><Edit2 size={16} /></button>
                        <button onClick={() => setCategories(categories.filter(c => c.id !== cat.id))} className="text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Bottom Nav */}
      <div className={cn(
        "flex items-center justify-around py-2 border-t",
        themeClasses.header
      )}>
        {[
          { id: 'home', icon: Home, label: '首页' },
          { id: 'video', icon: Play, label: '视频' },
          { id: 'discover', icon: Search, label: '发现' },
          { id: 'message', icon: Mail, label: '消息' },
          { id: 'me', icon: User, label: '我' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center gap-1",
              activeTab === tab.id ? themeClasses.active : themeClasses.inactive
            )}
          >
            <tab.icon size={22} />
            <span className="text-[10px]">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
