import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Compass, 
  User, 
  ChevronLeft,
  ChevronUp,
  ChevronDown, 
  Plus, 
  Send, 
  Camera, 
  Search,
  MoreHorizontal,
  Trash2,
  X,
  ShoppingBag,
  Calendar,
  Heart,
  BookHeart,
  Settings as SettingsIcon,
  Mic,
  Palette,
  Image as ImageIcon,
  Video,
  MapPin,
  Music,
  Smile,
  Wallet,
  Gift,
  Phone,
  PhoneOff,
  Gamepad2,
  PlusCircle,
  MessageCircle,
  Star,
  Sparkles,
  DoorOpen,
  MessageSquareText,
  Download,
  Upload,
  History,
  Clock,
  Contact,
  LayoutTemplate,
  FileText,
  Keyboard,
  RefreshCw,
  Type,
  Brain,
  Globe,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Copy,
  Forward,
  ListChecks,
  Quote,
  Bell,
  List,
  Check,
  Smartphone,
  ShieldAlert,
  Edit3,
  Cpu
} from 'lucide-react';
import { AppSettings, Friend, ChatMessage, OfflineMemory, ListenTogetherState, AppId, ChatTheme, OfflineConfig, GroupChat } from '../../types';
import { CCDPhotoCard } from './CCDPhotoCard';
import { CreateGroupPage } from './CreateGroupPage';
import { GroupChatWindow } from './GroupChatWindow';
import { motion, AnimatePresence } from 'motion/react';
import { getGeminiClient, getGeminiModel } from '../../lib/gemini';
import { useFriends } from '../../hooks/useFriends';
import { useSettings } from '../../hooks/useSettings';
import { get } from 'idb-keyval';
import { CatBubble } from '../Theme/CatElements';
import { cn } from '../../lib/utils';
import { speakText, getAvailableVoices } from '../../lib/voice';
import { apiFetch } from '../../lib/apiHelper';

import MemoryApp from './MemoryApp';
import { useMemory } from '../../hooks/useMemory';
import BlindBoxApp from './BlindBox';
import { TruthOrDarePopup } from '../TruthOrDarePopup';
import { DiceAnimation } from '../DiceAnimation';

import { OfflinePlotCard } from './OfflinePlotCard';

type Tab = 'chats' | 'contacts' | 'discover' | 'me';

export const getHeaderPadding = (settings: AppSettings, basePaddingPx: number) => {
  if (!settings.fullScreenMode) return {};
  return {
    paddingTop: `calc(${settings.hideStatusBar ? 'env(safe-area-inset-top)' : 'max(env(safe-area-inset-top), 44px)'} + ${basePaddingPx}px)`
  };
};

export default function ChatApp({ settings, onBack, onStartCall, externalCallStatus, onClearCallStatus, summarizeContent, onUpdateSettings, listenTogetherState, onUpdateListenTogether, onOpenApp }: { 
  settings: AppSettings; 
  onBack: () => void;
  onStartCall: (friend: Friend, type: 'voice' | 'video') => void;
  externalCallStatus: { friendId: string; status: 'rejected' | 'ended' | 'missed'; duration: number } | null;
  onClearCallStatus: () => void;
  summarizeContent: (friend: Friend, messages: ChatMessage[], type: 'chat' | 'call' | 'group' | 'offline', customPrompt?: string, range?: { start: number, end: number }) => Promise<string | null>;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  listenTogetherState: ListenTogetherState;
  onUpdateListenTogether: React.Dispatch<React.SetStateAction<ListenTogetherState>>;
  onOpenApp?: (appId: AppId, data?: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('chats');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [viewingFriendProfileId, setViewingFriendProfileId] = useState<string | null>(null);
  const [viewingMomentsFriendId, setViewingMomentsFriendId] = useState<string | null>(null);
  const [showPostMoment, setShowPostMoment] = useState(false);
  const [showMomentSettings, setShowMomentSettings] = useState<string | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showProfileSelector, setShowProfileSelector] = useState(false);
  const [showMemoryApp, setShowMemoryApp] = useState(false);
  const [activeMeSubView, setActiveMeSubView] = useState<'favorites' | 'personas' | 'beautification' | 'moments' | 'payment' | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { 
    user, updateUser, friends, groups, chats, addFriend, deleteFriend, updateFriend, 
    toggleBlock, addMessage, updateMessage, importMessages, 
    addGroupChat, updateGroupChat, deleteGroupChat, addGroupMessage, updateGroupMessage, importGroupMessages,
    addFavorite, removeFavorite,
    addPersona, updatePersona, deletePersona, togglePersona,
    addTransaction, updateBankCardBalance, addMoment, deleteMoment, toggleLikeMoment,
    addCommentToMoment, updateFriendMomentsSettings, getAllMoments,
    addBankCard, deleteBankCard, updateBankCard
  } = useFriends();

  const selectedFriend = friends.find(f => f.id === selectedFriendId);
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const viewingFriend = friends.find(f => f.id === viewingFriendProfileId);
  const momentsFriend = friends.find(f => f.id === viewingMomentsFriendId);

  // Apply Global and Bubble CSS
  useEffect(() => {
    const styleId = 'wechat-custom-styles';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }
    styleElement.innerHTML = `
      ${settings.globalCustomCss || ''}
      ${settings.bubbleCustomCss || ''}
      ${settings.chatFontColor ? `
        .chat-app-main:not(.chat-window-container) .text-slate-900,
        .chat-app-main:not(.chat-window-container) .text-slate-800,
        .chat-app-main:not(.chat-window-container) .text-slate-700,
        .chat-app-main:not(.chat-window-container) .text-slate-600,
        .chat-app-main:not(.chat-window-container) .text-slate-500,
        .chat-app-main:not(.chat-window-container) .text-black,
        .chat-app-main:not(.chat-window-container) span,
        .chat-app-main:not(.chat-window-container) p,
        .chat-app-main:not(.chat-window-container) div:not(.chat-window-container *) {
          color: ${settings.chatFontColor} !important;
        }
      ` : ''}
    `;
    return () => {
      // Cleanup
    };
  }, [settings.globalCustomCss, settings.bubbleCustomCss, settings.chatFontColor]);

  const isDark = settings.isDarkThemeEnabled;
  const isRabbit = settings.isCuteRabbitThemeEnabled;

  const allMoments = getAllMoments();
  const prevMomentsCount = useRef(allMoments.length);

  useEffect(() => {
    if (allMoments.length > prevMomentsCount.current) {
      const newMoment = allMoments[0];
      prevMomentsCount.current = allMoments.length;
      
      // AI Proactive Perception Logic
      setTimeout(() => {
        friends.forEach(f => {
          if (f.id === newMoment.authorId) return;
          
          // Check if already commented
          const existingComment = newMoment.comments?.find(c => c.authorId === f.id);
          if (existingComment) return;

          if (f.momentsSettings?.autoPostEnabled || Math.random() > 0.3) {
            const delay = 2000 + Math.random() * 8000;
            setTimeout(() => {
              if (Math.random() > 0.4) {
                toggleLikeMoment(newMoment.id, newMoment.authorId);
              }
              if (Math.random() > 0.3) {
                const authorName = newMoment.authorId === 'user' ? (user?.name ?? '我') : (friends.find(fr => fr.id === newMoment.authorId)?.name || '好友');
                handleAICommentOnMoment(f, { ...newMoment, authorName }, addCommentToMoment, settings);
              }
            }, delay);
          }
        });
      }, 1000);
    } else {
      prevMomentsCount.current = allMoments.length;
    }
  }, [allMoments.length, friends, user?.name, settings]);

  const handleManualMoment = async (friendId: string) => {
    const friend = friends.find(f => f.id === friendId);
    if (!friend) return;
    
    try {
      const friendMsgs = chats[friendId] || [];
      const recentMsgs = friendMsgs.slice(-20);
      const context = recentMsgs.map(m => `${m.role === 'user' ? '我' : (friend?.name ?? '角色')}: ${m.content}`).join('\n');
      
      const systemPrompt = `你现在是${friend?.name ?? '角色'}。请根据我们最近的聊天内容、你的人设以及你当前可能的生活状态，发一条朋友圈。\n要求：\n1. 必须符合你的人设（${friend?.persona ?? ''}）。\n2. 朋友圈内容要自然、生活化，像真人一样发牢骚、分享心情或生活点滴。\n3. 你发出的照片必须是“文字摄影卡片”形式，你需要写出极具画面感的照片描述。\n4. 回复时必须使用当前设定的语言：${friend.language || '普通话'}。\n5. 格式要求：\n【文字内容】你的朋友圈文字\n【图片描述】你配的文字摄影卡片内容（必填，描写一张精美的照片）\n\n最近的聊天内容：\n${context}`;
      
      const response = await callAI(systemPrompt, [{ role: 'user', content: '请发一条朋友圈' } as ChatMessage], settings);
      
      const contentMatch = response.match(/【文字内容】([\s\S]*?)(?=【图片描述】|$)/);
      const imageMatch = response.match(/【图片描述】([\s\S]*?)$/);
      
      const content = contentMatch ? contentMatch[1].trim() : response.trim();
      const imageDesc = imageMatch ? imageMatch[1].trim() : '';
      
      addMoment(content, [], undefined, 'public', undefined, undefined, friend.id, imageDesc ? true : false, imageDesc);
      return true;
    } catch (err) {
      console.error("Manual moment error:", err);
      return false;
    }
  };

  if (showMemoryApp) {
    return (
      <MemoryApp
        friends={friends}
        settings={settings}
        onBack={() => setShowMemoryApp(false)}
      />
    );
  }

  return (
    <div 
      className={cn(
        "flex flex-col w-full relative h-full transition-colors duration-500 overflow-hidden chat-app-main",
        isDark ? (settings.appBackgroundUrl || settings.activeChatThemeId ? "bg-transparent text-white" : "wechat-dark-mode") : 
        (isRabbit ? "cute-rabbit-theme sparkle-bg" : (settings.appBackgroundUrl || settings.activeChatThemeId ? "bg-transparent text-slate-900" : "bg-slate-100 text-slate-900")),
        settings.fullScreenMode ? "chat-app-fullscreen" : ""
      )}
      style={{
        ...(settings.fullScreenMode ? {
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: '100%',
        } : {}),
        ...(settings.chatFontColor ? { color: settings.chatFontColor } : {}),
        // Apply global background only if not in chat window (handled by conditional rendering)
      }}
    >
      {/* Global Background Layer handled by App.tsx */}

      <AnimatePresence mode="wait">
        {selectedGroupId ? (
          <GroupChatWindow 
            key={selectedGroupId}
            group={selectedGroup!}
            user={user}
            friends={friends}
            messages={chats[selectedGroupId] || []}
            allChats={chats}
            settings={settings}
            onBack={() => setSelectedGroupId(null)}
            onSendMessage={(msg) => addGroupMessage(selectedGroupId, msg)}
            onUpdateMessage={(index, updates) => updateGroupMessage(selectedGroupId, index, updates)}
            onUpdateGroup={(updates) => updateGroupChat(selectedGroupId, updates)}
            onClearMessages={() => importGroupMessages(selectedGroupId, [])}
            onAddMember={(friendId) => {
              if (!selectedGroup.memberIds.includes(friendId)) {
                updateGroupChat(selectedGroupId, { memberIds: [...selectedGroup.memberIds, friendId] });
              }
            }}
            onRemoveMember={(friendId) => {
              updateGroupChat(selectedGroupId, { memberIds: selectedGroup.memberIds.filter(id => id !== friendId) });
            }}
            onDeleteGroup={() => deleteGroupChat(selectedGroupId)}
            onUpdateSettings={onUpdateSettings}
          />
        ) : showCreateGroup ? (
          <CreateGroupPage 
            key="create-group"
            friends={friends}
            settings={settings}
            onBack={() => setShowCreateGroup(false)}
            onCreateGroup={(memberIds, name) => {
              const newId = addGroupChat(memberIds, name);
              setShowCreateGroup(false);
              setSelectedGroupId(newId);
            }}
          />
        ) : selectedFriendId ? (
          // @ts-ignore - key is a valid React prop
          <ChatWindow 
            key={selectedFriendId}
            friend={selectedFriend!} 
            user={user}
            friends={friends}
            messages={chats[selectedFriendId] || []}
            settings={settings}
            groups={groups}
            chats={chats}
            onBack={() => setSelectedFriendId(null)}
            onSendMessage={(msg) => addMessage(selectedFriendId, msg)}
            onUpdateFriend={(updates) => updateFriend(selectedFriendId, updates)}
            onImportMessages={(msgs) => importMessages(selectedFriendId, msgs)}
            onStartCall={onStartCall}
            externalCallStatus={externalCallStatus?.friendId === selectedFriendId ? externalCallStatus : null}
            onClearCallStatus={onClearCallStatus}
            summarizeContent={summarizeContent}
            listenTogetherState={listenTogetherState}
            onUpdateListenTogether={onUpdateListenTogether}
            onShowMomentSettings={(id) => setShowMomentSettings(id)}
            addTransaction={addTransaction}
            onUpdateMessage={updateMessage}
            addMoment={addMoment}
            onManualMoment={handleManualMoment}
            onUpdateSettings={onUpdateSettings}
            onOpenApp={onOpenApp}
            onShowCreateGroup={() => setShowCreateGroup(true)}
          />
        ) : (viewingMomentsFriendId && momentsFriend) ? (
          <FriendMoments 
            friend={momentsFriend} 
            settings={settings}
            user={user}
            friends={friends}
            onBack={() => setViewingMomentsFriendId(null)}
            onUpdateBackground={(url) => updateFriend(viewingMomentsFriendId, { momentsBackground: url })}
            onToggleLike={toggleLikeMoment}
            onAddComment={addCommentToMoment}
          />
        ) : (viewingFriendProfileId && viewingFriend) ? (
          <FriendProfile 
            friend={viewingFriend} 
            settings={settings}
            onBack={() => setViewingFriendProfileId(null)}
            onStartChat={() => {
              setSelectedFriendId(viewingFriendProfileId);
              setViewingFriendProfileId(null);
            }}
            onViewMoments={() => {
              setViewingMomentsFriendId(viewingFriendProfileId);
              setViewingFriendProfileId(null);
            }}
            onUpdate={(updates) => updateFriend(viewingFriendProfileId, updates)}
            onDelete={() => {
              deleteFriend(viewingFriendProfileId);
              setViewingFriendProfileId(null);
            }}
            onToggleBlock={() => toggleBlock(viewingFriendProfileId)}
          />
        ) : (
          <div key="main-tabs" className="flex flex-col h-full">
            {/* Header */}
            {!activeMeSubView && (
              <div className={cn(
                "px-3 py-2 flex items-center justify-between sticky top-0 z-30 border-b transition-all duration-300",
                isDark ? "bg-black/40 backdrop-blur-md border-white/10 text-white" : 
                (isRabbit ? "bg-pink-50/60 backdrop-blur-md border-pink-100 text-pink-600" : (settings.appBackgroundUrl ? "bg-white/10 backdrop-blur-md border-slate-200/20" : "bg-slate-100 border-slate-200"))
              )} style={{
                ...(settings.fullScreenMode ? { paddingTop: settings.hideStatusBar ? 'env(safe-area-inset-top)' : 'max(env(safe-area-inset-top), 44px)' } : {}),
                ...(settings.appBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (settings.chatWallpaperOpacity ?? 0.8) * 0.2)})` } : {})
              }}>
                <div className="flex items-center gap-1.5">
                  <button onClick={onBack} className="p-1 hover:bg-slate-200 rounded-full">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-bold text-base">
                    {activeTab === 'chats' && '微信'}
                    {activeTab === 'contacts' && '通讯录'}
                    {activeTab === 'discover' && '发现'}
                    {activeTab === 'me' && '我'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 relative">
                  {(activeTab === 'chats' || activeTab === 'contacts') && (
                    <>
                      <Search size={18} className="text-slate-500" />
                      <button onClick={() => setShowAddMenu(!showAddMenu)}>
                        <Plus size={18} className="text-slate-500" />
                      </button>
                    </>
                  )}
                  {activeTab === 'discover' && (
                    <button onClick={() => setShowPostMoment(true)}>
                      <PlusCircle size={18} className="text-slate-500" />
                    </button>
                  )}
                  <AnimatePresence>
                    {showAddMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className={cn(
                          "absolute right-0 top-full mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50",
                          settings.themeId === 'rainy-cat' ? "bg-black/80 backdrop-blur-xl border-white/10" : "bg-white border-slate-100"
                        )}
                      >
                        <button 
                          onClick={() => { setShowAddMenu(false); setShowAddFriend(true); }}
                          className={cn(
                            "w-full px-4 py-3 text-left text-sm transition-colors border-b",
                            settings.themeId === 'rainy-cat' ? "text-white hover:bg-white/10 border-white/10" : "text-slate-800 hover:bg-slate-50 border-slate-100"
                          )}
                        >
                          添加新好友
                        </button>
                        <button 
                          onClick={() => { setShowAddMenu(false); setShowProfileSelector(true); }}
                          className={cn(
                            "w-full px-4 py-3 text-left text-sm transition-colors",
                            settings.themeId === 'rainy-cat' ? "text-white hover:bg-white/10" : "text-slate-800 hover:bg-slate-50"
                          )}
                        >
                          从角色资料手账添加角色
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Content */}
            <div className={cn(
              "flex-1 overflow-y-auto transition-colors duration-500 relative z-10",
              isDark ? "bg-transparent" : 
              (isRabbit ? "bg-pink-50/20" : (settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl" : (settings.appBackgroundUrl ? "bg-transparent" : "bg-[#f5f5f5]")))
            )}
            style={settings.fullScreenMode ? {
              paddingBottom: 'env(safe-area-inset-bottom)'
            } : {}}
            >
              {activeTab === 'chats' && (
                <div className={cn(
                  "divide-y transition-all duration-300",
                  isDark ? "divide-white/5 bg-transparent" : 
                  (isRabbit ? "divide-pink-100 bg-white/40 backdrop-blur-sm" : (settings.themeId === 'rainy-cat' ? "divide-white/5" : (settings.appBackgroundUrl ? "divide-slate-100/50 bg-transparent" : "divide-slate-100 bg-white")))
                )}>
                  {groups.map((group, idx) => (
                    <button 
                      key={`group-${group.id}-${idx}`}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 p-3 transition-colors text-left",
                        settings.themeId === 'rainy-cat' ? "hover:bg-white/5 text-white" : (settings.appBackgroundUrl ? "hover:bg-white/20 text-slate-800" : "hover:bg-slate-50 text-slate-800")
                      )}
                      style={settings.appBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (settings.chatWallpaperOpacity ?? 0.8) * 0.1)})` } : {}}
                    >
                      <img src={group.avatar} alt={group.name} loading="lazy" className="w-10 h-10 rounded-lg bg-slate-200 object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-sm truncate">{group.name} ({group.memberIds.length + 1})</span>
                          <span className={cn(
                            "text-[10px]",
                            settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
                          )}>{group.lastTime}</span>
                        </div>
                        <p className={cn(
                          "text-xs truncate",
                          settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-500"
                        )}>
                          {group.lastMessage}
                        </p>
                      </div>
                    </button>
                  ))}
                  {friends.filter(f => !f.isBlocked).map((friend, idx) => (
                    <button 
                      key={`${friend.id}-${idx}`}
                      onClick={() => setSelectedFriendId(friend.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 p-3 transition-colors text-left",
                        settings.themeId === 'rainy-cat' ? "hover:bg-white/5 text-white" : (settings.appBackgroundUrl ? "hover:bg-white/20 text-slate-800" : "hover:bg-slate-50 text-slate-800")
                      )}
                      style={settings.appBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (settings.chatWallpaperOpacity ?? 0.8) * 0.1)})` } : {}}
                    >
                      <img src={friend?.avatar} alt={friend?.name} loading="lazy" className="w-10 h-10 rounded-lg bg-slate-200 object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-bold text-sm truncate">{friend?.alias || friend?.name || '好友'}</span>
                          <span className={cn(
                            "text-[10px]",
                            settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
                          )}>{friend.lastTime}</span>
                        </div>
                        <p className={cn(
                          "text-xs truncate",
                          settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-500"
                        )}>
                          {friend.lastMessage?.trim().startsWith('http') 
                            ? '[图片/表情]' 
                            : friend.lastMessage?.includes('[发送了表情:') 
                              ? friend.lastMessage.replace('[发送了表情:', '[表情]').replace(']', '')
                              : friend.lastMessage}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'contacts' && (
                <div className={cn(
                  "transition-all duration-300",
                  isDark ? "bg-transparent" : (isRabbit ? "bg-white/40 backdrop-blur-sm" : (settings.appBackgroundUrl ? "bg-transparent" : "bg-white"))
                )}>
                  <div className={cn(
                    "p-3 text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
                    isDark ? "text-white/40 bg-white/5" : (isRabbit ? "text-pink-400 bg-pink-50/50" : (settings.appBackgroundUrl ? "text-slate-400 bg-white/10" : "text-slate-400 bg-slate-50"))
                  )}>我的好友</div>
                  <div className={cn(
                    "divide-y transition-all duration-300",
                    isDark ? "divide-white/5" : (isRabbit ? "divide-pink-100" : (settings.appBackgroundUrl ? "divide-white/10" : "divide-slate-100"))
                  )}>
                    {friends.map((friend, idx) => (
                      <div 
                        key={`${friend.id}-${idx}`} 
                        className={cn(
                          "flex items-center justify-between p-3 group cursor-pointer transition-colors",
                          settings.appBackgroundUrl ? "hover:bg-white/10" : "hover:bg-slate-50"
                        )}
                        style={settings.appBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (settings.chatWallpaperOpacity ?? 0.8) * 0.1)})` } : {}}
                        onClick={() => setViewingFriendProfileId(friend.id)}
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={friend?.avatar} alt={friend?.name} loading="lazy" className={cn("w-8 h-8 rounded-lg bg-slate-200 object-cover", friend?.isBlocked && "grayscale opacity-50")} />
                          <span className={cn("font-medium text-sm", friend.isBlocked && "text-slate-400")}>
                            {friend?.alias || friend?.name || '好友'}
                            {friend.isBlocked && <span className="ml-2 text-[10px] bg-slate-200 px-1 rounded text-slate-500">已拉黑</span>}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFriend(friend.id);
                          }}
                          className="p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'discover' && (
                <DiscoverTab 
                  user={user} 
                  friends={friends}
                  onUpdate={updateUser} 
                  settings={settings} 
                  getAllMoments={getAllMoments}
                  onToggleLike={toggleLikeMoment}
                  onAddComment={addCommentToMoment}
                  onDeleteMoment={deleteMoment}
                  onShowMemoryApp={() => setShowMemoryApp(true)}
                />
              )}
              {activeTab === 'me' && (
                activeMeSubView === 'favorites' ? (
                  <FavoritesView 
                    user={user} 
                    settings={settings} 
                    onBack={() => setActiveMeSubView(null)} 
                    onDelete={removeFavorite}
                  />
                ) : activeMeSubView === 'personas' ? (
                  <PersonaArchiveView 
                    user={user} 
                    settings={settings} 
                    onBack={() => setActiveMeSubView(null)} 
                    onUpdate={updateUser}
                    onToggle={togglePersona}
                    onSelect={(id) => updateUser({ activePersonaId: id })}
                    onDelete={deletePersona}
                    onAdd={addPersona}
                    onEdit={updatePersona}
                  />
                ) : activeMeSubView === 'beautification' ? (
                  <BeautificationPage 
                    settings={settings} 
                    onBack={() => setActiveMeSubView(null)} 
                    onUpdate={onUpdateSettings}
                  />
                ) : activeMeSubView === 'moments' ? (
                  <MyMomentsPage 
                    user={user} 
                    settings={settings} 
                    onBack={() => setActiveMeSubView(null)} 
                    onUpdate={updateUser}
                  />
                ) : activeMeSubView === 'payment' ? (
                  <PaymentPage 
                    user={user} 
                    settings={settings} 
                    onBack={() => setActiveMeSubView(null)} 
                    onUpdate={updateUser}
                    onAddTransaction={addTransaction}
                    onAddBankCard={addBankCard}
                    onDeleteBankCard={deleteBankCard}
                    onUpdateBankCard={updateBankCard}
                  />
                ) : (
                  <MeTab 
                    user={user} 
                    onUpdate={updateUser} 
                    settings={settings} 
                    onViewFavorites={() => setActiveMeSubView('favorites')}
                    onViewPersonas={() => setActiveMeSubView('personas')}
                    onViewBeautification={() => setActiveMeSubView('beautification')}
                    onViewMoments={() => setActiveMeSubView('moments')}
                    onViewPayment={() => setActiveMeSubView('payment')}
                  />
                )
              )}
            </div>

            {/* Bottom Nav */}
            <div className={cn(
              "border-t flex items-center justify-around py-2 px-4 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] transition-all duration-300 relative z-20",
              isDark ? "bg-black/40 border-white/10 text-white" : 
              (isRabbit ? "bg-pink-50/60 backdrop-blur-md border-pink-100 text-pink-600" : (settings.appBackgroundUrl ? "bg-white/10 backdrop-blur-md border-white/10" : "bg-slate-50 border-slate-200"))
            )}
            style={{
              ...(settings.fullScreenMode ? { paddingBottom: 'env(safe-area-inset-bottom)' } : {}),
              ...(settings.appBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0.1, (settings.chatWallpaperOpacity ?? 0.8) * 0.4)})` } : {})
            }}
            >
              <NavButton 
                active={activeTab === 'chats'} 
                icon={MessageSquare} 
                label="微信" 
                onClick={() => setActiveTab('chats')} 
                themeColor={isRabbit ? "#ff85a2" : settings.themeColor}
                isDark={isDark}
              />
              <NavButton 
                active={activeTab === 'contacts'} 
                icon={Users} 
                label="通讯录" 
                onClick={() => setActiveTab('contacts')} 
                themeColor={isRabbit ? "#ff85a2" : settings.themeColor}
                isDark={isDark}
              />
              <NavButton 
                active={activeTab === 'discover'} 
                icon={Compass} 
                label="发现" 
                onClick={() => setActiveTab('discover')} 
                themeColor={isRabbit ? "#ff85a2" : settings.themeColor}
                isDark={isDark}
              />
              <NavButton 
                active={activeTab === 'me'} 
                icon={User} 
                label="我" 
                onClick={() => setActiveTab('me')} 
                themeColor={isRabbit ? "#ff85a2" : settings.themeColor}
                isDark={isDark}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showPostMoment && (
          <PostMomentModal
            user={user}
            friends={friends}
            settings={settings}
            onClose={() => setShowPostMoment(false)}
            onPost={(content, images, location, visibility, visibleTo, hiddenFrom) => {
              addMoment(content, images, location, visibility, visibleTo, hiddenFrom);
              setShowPostMoment(false);
            }}
          />
        )}
        {showMomentSettings && (
          <MomentSettingsModal
            friend={friends.find(f => f.id === showMomentSettings)!}
            settings={settings}
            onClose={() => setShowMomentSettings(null)}
            onUpdate={(updates) => {
              updateFriendMomentsSettings(showMomentSettings, updates);
            }}
            onManualMoment={() => handleManualMoment(showMomentSettings)}
          />
        )}
        {showAddFriend && (
          <AddFriendModal 
            settings={settings}
            onClose={() => setShowAddFriend(false)} 
            onAdd={(f) => {
              addFriend(f);
              setShowAddFriend(false);
            }} 
          />
        )}
        {showProfileSelector && (
          <ProfileSelectorModal
            settings={settings}
            onClose={() => setShowProfileSelector(false)}
            onAdd={(f) => {
              addFriend(f);
              setShowProfileSelector(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const HeartVoiceCard = ({ content, avatar }: { content: string; avatar: string }) => {
  return (
    <div className="my-2 bg-[#FFF0F3] border-2 border-[#FF4D6D]/20 rounded-2xl p-4 shadow-sm relative overflow-hidden group animate-in fade-in slide-in-from-bottom-2">
      <div className="absolute top-0 right-0 px-2 py-0.5 bg-[#FF4D6D] text-white text-[8px] font-black uppercase tracking-widest rounded-bl-lg">
        HEART VOICE
      </div>
      <div className="flex gap-3">
        <div className="shrink-0">
          <img src={avatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-black text-[#FF4D6D] uppercase tracking-widest mb-1 flex items-center gap-1">
            <span>内心独白</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D6D] animate-pulse" />
          </div>
          <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
            「 {content} 」
          </p>
        </div>
      </div>
      <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-white/40 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
    </div>
  );
};

function NavButton({ active, icon: Icon, label, onClick, themeColor, isDark }: { active: boolean, icon: any, label: string, onClick: () => void, themeColor?: string, isDark?: boolean }) {
  const activeColor = themeColor || "#07c160"; // Default WeChat green if no theme color
  const inactiveColor = isDark ? '#444444' : '#64748b';
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 group transition-all active:scale-90">
      <Icon size={22} style={{ color: active ? activeColor : inactiveColor }} className="transition-colors" />
      <span className="text-[10px] font-medium transition-colors" style={{ color: active ? activeColor : inactiveColor }}>{label}</span>
    </button>
  );
}

function ChatSettings({ friend, messages, settings, groups, chats, friends, user, onBack, onUpdateFriend, onImportMessages, summarizeContent, onShowMomentSettings, activeModal, setActiveModal, onShowCreateGroup }: { 
  friend: Friend, 
  messages: ChatMessage[], 
  settings: AppSettings,
  groups: GroupChat[],
  chats: Record<string, ChatMessage[]>,
  friends: Friend[],
  user: any,
  onBack: () => void,
  onUpdateFriend: (updates: Partial<Friend>) => void,
  onImportMessages: (msgs: ChatMessage[]) => void,
  summarizeContent: (friend: Friend, messages: ChatMessage[], type: 'chat' | 'call' | 'group' | 'offline', customPrompt?: string, range?: { start: number, end: number }) => Promise<string | null>,
  onShowMomentSettings: (id: string) => void,
  activeModal: string | null,
  setActiveModal: (modal: any) => void,
  onShowCreateGroup?: () => void
}) {
  const { addOnlineMemory, getFriendMemory } = useMemory();
  const [activeView, setActiveView] = useState<'main' | 'search' | 'memory' | 'shared-group-memory' | 'tokens-panel'>('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [tempPrompt, setTempPrompt] = useState(friend.memorySettings?.summaryPrompt || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const memorySettings = friend.memorySettings || {
    contextLimit: 50,
    summaryThreshold: 100,
    summaryBuffer: 20,
    autoSummaryEnabled: true,
    silentSummaryMode: true,
    syncThreshold: 50
  };

  const updateMemorySetting = (updates: Partial<typeof memorySettings>) => {
    onUpdateFriend({
      memorySettings: { ...memorySettings, ...updates }
    });
  };

  const filteredMessages = messages.filter(m => 
    (m.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const data = JSON.stringify(messages, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_history_${friend.name}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const msgs = JSON.parse(event.target?.result as string);
          if (Array.isArray(msgs)) {
            onImportMessages(msgs);
            alert('导入成功！');
          } else {
            alert('文件格式错误');
          }
        } catch (error) {
          alert('解析失败');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 1200;
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
          onUpdateFriend({ chatBackground: dataUrl });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  if (activeView === 'search') {
    return (
      <div className={cn(
        "flex flex-col h-full transition-colors duration-500",
        settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : "bg-slate-50"
      )}>
        <div className={cn(
          "px-3 py-2 flex items-center gap-2 border-b transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white"
        )}>
          <button onClick={() => setActiveView('main')} className="p-1">
            <ChevronLeft size={20} />
          </button>
          <div className={cn(
            "flex-1 rounded-md px-2 py-1 flex items-center gap-2 transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "bg-white/10" : "bg-slate-100"
          )}>
            <Search size={16} className={cn(
              "transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
            )} />
            <input 
              autoFocus
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索聊天内容"
              className="bg-transparent text-sm focus:outline-none w-full"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {searchQuery && filteredMessages.length === 0 ? (
            <div className={cn(
              "p-10 text-center text-sm transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-400"
            )}>无结果</div>
          ) : (
            filteredMessages.map((msg, i) => (
              <div key={msg.timestamp && msg.id ? `${msg.timestamp}-${msg.id}` : i} className={cn(
                "p-4 border-b transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white"
              )}>
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "text-xs font-bold transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-600"
                  )}>{msg.role === 'user' ? '我' : friend.name}</span>
                  <span className={cn(
                    "text-[10px] transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "text-white/30" : "text-slate-400"
                  )}>{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div className={cn(
                  "text-sm transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "text-white/80" : "text-slate-800"
                )}>{msg.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (activeView === 'shared-group-memory') {
    const sharedSettings = friend.sharedGroupMemorySettings || {
      enabled: false,
      memoryCount: 30,
      customPrompt: ''
    };
    const updateSharedSettings = (updates: Partial<typeof sharedSettings>) => {
      onUpdateFriend({
        sharedGroupMemorySettings: { ...sharedSettings, ...updates }
      });
    };

    return (
      <div className={cn(
        "flex flex-col h-full transition-colors duration-500",
        settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : "bg-slate-50"
      )}>
        <div className={cn(
          "px-3 py-2 flex items-center gap-2 border-b transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white"
        )}>
          <button onClick={() => setActiveView('main')} className="p-1">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">共享群聊记忆设置</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500">
              <Users size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg">共享群聊记忆</h3>
              <p className="text-xs opacity-50">让 {friend.name} 读取共同群聊记录与时间线，实现实时互动与吃醋质问</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">开启共享群聊记忆</h4>
                <p className="text-[10px] opacity-50">私聊时允许角色读取共同群聊上下文及时间线</p>
              </div>
              <button 
                onClick={() => updateSharedSettings({ enabled: !sharedSettings.enabled })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  sharedSettings.enabled ? "bg-indigo-600" : "bg-slate-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  sharedSettings.enabled ? "right-1" : "left-1"
                )} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold">共享记忆条数</h4>
                <span className="text-sm font-bold text-indigo-600">{sharedSettings.memoryCount || 30} 条</span>
              </div>
              <p className="text-[10px] opacity-50">角色在私聊中可读取的最近共同群聊记录数量（默认30条）</p>
              <input 
                type="range" 
                min="5" 
                max="100" 
                value={sharedSettings.memoryCount || 30}
                onChange={(e) => updateSharedSettings({ memoryCount: parseInt(e.target.value) })}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] opacity-30">
                <span>5条</span>
                <span>默认30条</span>
                <span>100条</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-bold">用户自定义输入与补充指令</h4>
              <p className="text-[10px] opacity-50">自定义角色在私聊中对群聊记忆的反应方式、语气或特定剧情设定</p>
              <textarea 
                value={sharedSettings.customPrompt || ''}
                onChange={(e) => updateSharedSettings({ customPrompt: e.target.value })}
                placeholder="例如：如果我在群里和其他人聊天却冷落了你，你要表现得吃醋或傲娇，质问我为什么只在群里聊天不理你..."
                className={cn(
                  "w-full h-28 p-3 text-xs rounded-xl outline-none resize-none transition-all",
                  settings.themeId === 'rainy-cat' ? "bg-white/10 text-white border border-white/10" : "bg-white text-slate-800 border border-slate-200"
                )}
              />
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2">
              <span className="text-indigo-600">💡</span>
              <p className="text-[10px] text-indigo-700">
                提示：角色具备精准时间线感知。如果用户在群聊里不回复角色，等了十分钟甚至更久后才来私聊，角色会在新的一轮私聊中自然地说出：“你就知道在群里聊天，不理我……”等符合人设的生动反应。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'tokens-panel') {
    const worldBookEntries = settings.worldBookEntries || [];
    const activeEntries = worldBookEntries.filter(e => 
      e.isEnabled && (e.scope === 'global' || (e.scope === 'character' && (e.linkedCharacterIds || []).includes(friend.profileId || '')))
    );
    let worldBookText = '';
    activeEntries.forEach(e => {
      worldBookText += `[${e.category}] ${e.name}\n${e.content}\n`;
    });
    const worldBookChars = worldBookText.length;
    const worldBookTokens = Math.round(worldBookChars * 1.4);

    let personaText = `【角色人设】\n${friend.persona || ''}\n【User资料】\n姓名：${user?.name || ''} 昵称：${user?.wechatNickname || ''} 简介：${user?.signature || ''} 人设：${user?.persona || ''}`;
    const personaChars = personaText.length;
    const personaTokens = Math.round(personaChars * 1.4);

    const contextLimit = friend.memorySettings?.contextLimit || 50;
    const slicedMsgs = messages.filter(m => m.role !== 'system').slice(-contextLimit);
    let contextText = slicedMsgs.map(m => `${m.role}: ${m.content}`).join('\n');
    
    const friendMemoryStore = getFriendMemory(friend.id);
    if (friend.offlineMemory?.summary) contextText += `\n${friend.offlineMemory.summary}`;
    friendMemoryStore.onlineMemories.slice(0, 15).forEach(m => contextText += `\n${m.content}`);
    
    if (friend.sharedGroupMemorySettings?.enabled) {
      const memoryCount = friend.sharedGroupMemorySettings.memoryCount || 30;
      const relevantGroups = (groups || []).filter(g => g.memberIds.includes(friend.id));
      relevantGroups.forEach(g => {
        const msgs = (chats || {})[g.id] || [];
        msgs.slice(-memoryCount).forEach(m => contextText += `\n${m.content}`);
      });
    }

    const contextChars = contextText.length;
    const contextTokens = Math.round(contextChars * 1.4);

    const totalTokens = worldBookTokens + personaTokens + contextTokens;
    const isHeavy = totalTokens > 8000;

    return (
      <div className={cn(
        "flex flex-col h-full transition-colors duration-500",
        settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : "bg-slate-50"
      )}>
        <div className={cn(
          "px-3 py-2 flex items-center gap-2 border-b transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white"
        )}>
          <button onClick={() => setActiveView('main')} className="p-1">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">Tokens 消耗与负载面板</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                <Cpu size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base">Token 实时负载分析</h3>
                <p className="text-xs opacity-50">用于评估当前 AI 对话的 Token 消耗与响应速度</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setActiveView('tokens-panel');
              }}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
            >
              <RefreshCw size={14} /> 刷新
            </button>
          </div>

          <div className={cn(
            "p-4 rounded-2xl border transition-all",
            isHeavy 
              ? (settings.themeId === 'rainy-cat' ? "bg-amber-500/20 border-amber-500/40 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800")
              : (settings.themeId === 'rainy-cat' ? "bg-blue-500/20 border-blue-500/40 text-blue-200" : "bg-blue-50 border-blue-100 text-blue-900")
          )}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">当前总 Token 预估</span>
              <span className="text-xl font-black font-mono">{totalTokens.toLocaleString()} tokens</span>
            </div>
            <div className="text-xs opacity-90 leading-relaxed">
              {isHeavy ? (
                <p>⚠️ <strong>负载偏高提示</strong>：当前总 Token 超过 8000。由于输入文本较长，大模型预处理需要更多时间，可能导致回复变慢（约数十秒）。建议精简世界书、减少上下文记忆条数。</p>
              ) : (
                <p>✨ <strong>负载健康</strong>：当前 Token 处于适宜范围，大模型可以快速响应（通常数秒内完成）。</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold opacity-60 uppercase tracking-wider">Token 构成明细 (三维度)</h4>
            
            <div className={cn(
              "p-4 rounded-xl border flex items-center justify-between",
              settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
            )}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">📖 世界书 (World Book)</span>
                  <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold">激活条目: {activeEntries.length} 条</span>
                </div>
                <p className="text-[10px] opacity-50">包含当前对该角色生效的所有全局及专属世界书设定内容</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-purple-600">~{worldBookTokens.toLocaleString()}</span>
                <p className="text-[10px] opacity-40">{worldBookChars} 字符</p>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-xl border flex items-center justify-between",
              settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
            )}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">👤 角色人设与用户资料 (Persona)</span>
                </div>
                <p className="text-[10px] opacity-50">包含角色核心人设文本以及用户的基本资料设定</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-blue-600">~{personaTokens.toLocaleString()}</span>
                <p className="text-[10px] opacity-40">{personaChars} 字符</p>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-xl border flex items-center justify-between",
              settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
            )}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">🧠 上下文记忆与群聊 (Context Memory)</span>
                  <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">聊天记录: {slicedMsgs.length} 条</span>
                </div>
                <p className="text-[10px] opacity-50">包含最近聊天上下文、长期记忆库总结及开启的共享群聊记录</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-sm text-green-600">~{contextTokens.toLocaleString()}</span>
                <p className="text-[10px] opacity-40">{contextChars} 字符</p>
              </div>
            </div>
          </div>

          <div className={cn(
            "p-4 rounded-xl border space-y-2",
            settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}>
            <h4 className="text-xs font-bold">💡 最佳 Token 值与加速建议</h4>
            <ul className="text-xs opacity-75 space-y-1.5 list-disc pl-4">
              <li><strong>最佳推荐范围</strong>：总 Token 保持在 <strong>2,000 ~ 4,000</strong> 之间，此时大模型处理速度最快（通常在 3-5 秒内返回）。</li>
              <li><strong>调小上下文条数</strong>：如果在“记忆模块”中设置的上下文条数过大（如超过 100 条），可在记忆模块中将条数调整至 30-50 条，显著减少响应等待时间。</li>
              <li><strong>精简世界书</strong>：关闭暂时不需要的世界书条目，或者缩减冗长的背景设定。</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'memory') {
    return (
      <div className={cn(
        "flex flex-col h-full transition-colors duration-500",
        settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : "bg-slate-50"
      )}>
        <div className={cn(
          "px-3 py-2 flex items-center gap-2 border-b transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white"
        )}>
          <button onClick={() => setActiveView('main')} className="p-1">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">记忆设置</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-pink-500">
              <Brain size={32} />
            </div>
            <div>
              <h3 className="font-bold text-lg">{friend.name}</h3>
              <p className="text-xs opacity-50">管理角色的记忆与上下文设置</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">记忆总结模式</h4>
                <p className="text-[10px] opacity-50">达到轮数阈值时自动静默总结</p>
              </div>
              <button 
                onClick={() => updateMemorySetting({ silentSummaryMode: !memorySettings.silentSummaryMode })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  memorySettings.silentSummaryMode ? "bg-green-500" : "bg-slate-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  memorySettings.silentSummaryMode ? "right-1" : "left-1"
                )} />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl flex items-start gap-2">
              <span className="text-yellow-600">🤫</span>
              <p className="text-[10px] text-yellow-700">静默模式：达到轮数后自动后台总结，无需确认</p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <RefreshCw size={16} className="text-blue-500" />
                手动生成记忆
              </label>
              <button 
                onClick={() => setActiveModal('manual-summary')}
                className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors"
              >
                开始总结
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold">总结触发阈值</h4>
                <span className="text-sm font-bold text-green-600">{memorySettings.summaryThreshold} 条</span>
              </div>
              <p className="text-[10px] opacity-50">未总结消息达到此条数时触发总结。1 条 ≈ 100 Token。</p>
              <input 
                type="range" 
                min="10" 
                max="300" 
                value={memorySettings.summaryThreshold}
                onChange={(e) => updateMemorySetting({ summaryThreshold: parseInt(e.target.value) })}
                className="w-full accent-green-500"
              />
              <div className="flex justify-between text-[10px] opacity-30">
                <span>关闭</span>
                <span>适中</span>
                <span>频繁总结</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold">上下文记忆条数</h4>
                <span className="text-sm font-bold text-green-600">{memorySettings.contextLimit} 条</span>
              </div>
              <p className="text-[10px] opacity-50">决定 AI 在回复时能“记住”多少条最近的聊天记录。</p>
              <input 
                type="range" 
                min="10" 
                max="200" 
                value={memorySettings.contextLimit}
                onChange={(e) => updateMemorySetting({ contextLimit: parseInt(e.target.value) })}
                className="w-full accent-green-500"
              />
              <div className="flex justify-between text-[10px] opacity-30">
                <span>10</span>
                <span>默认 100</span>
                <span>200</span>
              </div>
              <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-start gap-2">
                <span className="text-orange-600">⚠️</span>
                <p className="text-[10px] text-orange-700">谨慎选择：上下文过长可能导致角色不回复或 Token 消耗巨额，建议保持在 50 以内以获得最佳体验。</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold">总结缓冲区</h4>
                <span className="text-sm font-bold text-blue-600">{memorySettings.summaryBuffer} 条</span>
              </div>
              <p className="text-[10px] opacity-50">每次总结后保留最近多少条消息不参与总结，作为下一轮对话的上下文衔接。</p>
              <input 
                type="range" 
                min="0" 
                max="50" 
                value={memorySettings.summaryBuffer}
                onChange={(e) => updateMemorySetting({ summaryBuffer: parseInt(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">自动总结</h4>
                <p className="text-[10px] opacity-50">开启后，达到阈值时自动在后台总结并挂载到回响中。</p>
              </div>
              <button 
                onClick={() => updateMemorySetting({ autoSummaryEnabled: !memorySettings.autoSummaryEnabled })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  memorySettings.autoSummaryEnabled ? "bg-blue-500" : "bg-slate-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  memorySettings.autoSummaryEnabled ? "right-1" : "left-1"
                )} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold">个人记忆同步阈值</h4>
                <span className="text-sm font-bold text-blue-600">{memorySettings.syncThreshold} 条</span>
              </div>
              <p className="text-[10px] opacity-50">从其他聊天同步多少条最近动态到当前对话。条数与 Token 双触发。</p>
              <input 
                type="range" 
                min="10" 
                max="300" 
                value={memorySettings.syncThreshold}
                onChange={(e) => updateMemorySetting({ syncThreshold: parseInt(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold">总结提示词</h4>
                <button 
                  onClick={() => {
                    updateMemorySetting({ summaryPrompt: tempPrompt });
                    alert('总结提示词已保存');
                  }}
                  className="text-[10px] px-2 py-1 bg-green-500 text-white rounded-lg active:scale-95 transition-all"
                >
                  保存
                </button>
              </div>
              <p className="text-[10px] opacity-50">自定义 AI 总结聊天记录时使用的提示词</p>
              <textarea 
                value={tempPrompt}
                onChange={(e) => setTempPrompt(e.target.value)}
                placeholder="例如：重点保留对话双方身份，双方后续能基于这份内容继续对话，关键信息都包含其中..."
                className={cn(
                  "w-full h-24 p-3 text-xs rounded-xl outline-none resize-none transition-all",
                  settings.themeId === 'rainy-cat' ? "bg-white/10 text-white border border-white/10" : "bg-white text-slate-800 border border-slate-200"
                )}
              />
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setActiveModal('manual-summary')}
                className={cn(
                  "w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-all flex items-center justify-center gap-2",
                  settings.themeId === 'rainy-cat' ? "bg-white/10 text-white" : "bg-slate-800 text-white"
                )}
              >
                <History size={16} /> 手动总结当前记忆
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full transition-colors duration-500",
      settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : "bg-slate-100"
    )}>
      <div className={cn(
        "border-b px-3 py-2 flex items-center gap-2 sticky top-0 z-10 transition-all duration-300",
        settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-[#f5f5f5] border-slate-200"
      )} style={settings.fullScreenMode ? { paddingTop: settings.hideStatusBar ? 'env(safe-area-inset-top)' : 'max(env(safe-area-inset-top), 44px)' } : {}}>
        <button onClick={onBack} className={cn(
          "p-1 rounded-full transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-200"
        )}>
          <ChevronLeft size={22} />
        </button>
        <span className={cn(
          "font-bold text-base transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "text-white" : "text-slate-800"
        )}>聊天信息</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 py-3">
        {/* Friend Info */}
        <div className={cn(
          "px-4 py-4 flex flex-wrap gap-4 transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl" : "bg-white"
        )}>
          <div className="flex flex-col items-center gap-1">
            <img src={friend.avatar} className={cn(
              "w-14 h-14 rounded-lg object-cover transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "bg-white/10" : "bg-slate-200"
            )} />
            <span className={cn(
              "text-[10px] truncate w-14 text-center transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-500"
            )}>{friend.name}</span>
          </div>
          <button 
            onClick={() => onShowCreateGroup?.()}
            className={cn(
              "w-14 h-14 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "border-white/10 text-white/20 hover:border-white/20 hover:text-white/40" : "border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-400"
            )}
            title="发起群聊"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Options */}
        <div className={cn(
          "border-y divide-y transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl border-white/10 divide-white/10" : "bg-white border-slate-200 divide-slate-100"
        )}>
          <button onClick={() => setActiveView('search')} className={cn(
            "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Search size={18} className={cn(
                "transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )} />
              <span className="text-sm">查找聊天内容</span>
            </div>
            <ChevronLeft size={16} className={cn(
              "rotate-180 transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
            )} />
          </button>

          <button onClick={() => setActiveView('memory')} className={cn(
            "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Brain size={18} className={cn(
                "transition-all duration-300 text-pink-500"
              )} />
              <span className="text-sm font-bold">记忆模块</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] opacity-40">上下文/总结设置</span>
              <ChevronLeft size={16} className={cn(
                "rotate-180 transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
              )} />
            </div>
          </button>

          <button onClick={() => setActiveView('shared-group-memory')} className={cn(
            "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Users size={18} className="text-indigo-500 transition-all duration-300" />
              <span className="text-sm font-bold">共享群聊记忆</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] opacity-40">{friend.sharedGroupMemorySettings?.enabled ? '已开启' : '未开启'}</span>
              <ChevronLeft size={16} className={cn(
                "rotate-180 transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
              )} />
            </div>
          </button>

          <button onClick={() => setActiveView('tokens-panel')} className={cn(
            "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Cpu size={18} className="text-blue-500 transition-all duration-300" />
              <span className="text-sm font-bold">Tokens 面板 (字数与负载)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] opacity-40">评估回复速度</span>
              <ChevronLeft size={16} className={cn(
                "rotate-180 transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
              )} />
            </div>
          </button>

          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={18} className={cn(
                "transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )} />
              <span className="text-sm">自动翻译角色消息</span>
            </div>
            <button 
              onClick={() => onUpdateFriend({ autoTranslateEnabled: !friend.autoTranslateEnabled })}
              className={cn("w-10 h-5 rounded-full relative transition-all", friend.autoTranslateEnabled ? "bg-[#07c160]" : "bg-slate-200")}
            >
              <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", friend.autoTranslateEnabled ? "right-0.5" : "left-0.5")} />
            </button>
          </div>
          
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Type size={18} className={cn(
                "transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )} />
              <span className="text-sm">角色语言</span>
            </div>
            <select 
              value={friend.language || '普通话'}
              onChange={(e) => onUpdateFriend({ language: e.target.value })}
              className={cn(
                "text-sm bg-transparent outline-none text-right",
                settings.themeId === 'rainy-cat' ? "text-white/60 [&>option]:bg-slate-800" : "text-slate-500"
              )}
            >
              <option value="普通话">普通话</option>
              <option value="粤语">粤语</option>
              <option value="英语">英语</option>
              <option value="日语">日语</option>
              <option value="韩语">韩语</option>
            </select>
          </div>

          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} className={cn(
                "transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )} />
              <span className="text-sm">禁止动作描写回复</span>
            </div>
            <button 
              onClick={() => onUpdateFriend({ disableActionDescription: !friend.disableActionDescription })}
              className={cn("w-10 h-5 rounded-full relative transition-all", friend.disableActionDescription ? "bg-[#07c160]" : "bg-slate-200")}
            >
              <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", friend.disableActionDescription ? "right-0.5" : "left-0.5")} />
            </button>
          </div>
        </div>

        <div className={cn(
          "border-y divide-y transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl border-white/10 divide-white/10" : "bg-white border-slate-200 divide-slate-100"
        )}>
          <button onClick={() => fileInputRef.current?.click()} className={cn(
            "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Palette size={18} className={cn(
                "transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )} />
              <span className="text-sm">设置聊天背景</span>
            </div>
            <div className="flex items-center gap-2">
              {friend.chatBackground && <div className={cn(
                "w-8 h-8 rounded overflow-hidden border transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-white/10 border-white/10" : "bg-slate-100 border-slate-200"
              )}><img src={friend.chatBackground} className="w-full h-full object-cover" /></div>}
              <ChevronLeft size={16} className={cn(
                "rotate-180 transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
              )} />
            </div>
          </button>
          <button onClick={() => setActiveModal('character-image-gen')} className={cn(
            "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Camera size={18} className="text-pink-500 transition-all duration-300" />
              <span className="text-sm font-bold">角色专属生图</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] opacity-40">{friend.characterImageGenEnabled ? '已开启' : '未开启'}</span>
              <ChevronLeft size={16} className={cn(
                "rotate-180 transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
              )} />
            </div>
          </button>
          <button onClick={() => onShowMomentSettings(friend.id)} className={cn(
            "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Compass size={18} className={cn(
                "transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )} />
              <span className="text-sm">朋友圈设置</span>
            </div>
            <ChevronLeft size={16} className={cn(
              "rotate-180 transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
            )} />
          </button>
          {friend.chatBackground && (
            <button onClick={() => onUpdateFriend({ chatBackground: undefined })} className={cn(
              "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
            )}>
              <div className="flex items-center gap-3">
                <History size={18} className="text-red-400" />
                <span className="text-sm text-red-500">恢复默认背景</span>
              </div>
            </button>
          )}
        </div>

        <div className={cn(
          "border-y divide-y transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl border-white/10 divide-white/10" : "bg-white border-slate-200 divide-slate-100"
        )}>
          <button onClick={handleExport} className={cn(
            "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Download size={18} className={cn(
                "transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )} />
              <span className="text-sm">导出聊天记录</span>
            </div>
            <ChevronLeft size={16} className={cn(
              "rotate-180 transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
            )} />
          </button>
          <button onClick={() => importInputRef.current?.click()} className={cn(
            "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <Upload size={18} className={cn(
                "transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )} />
              <span className="text-sm">导入聊天记录</span>
            </div>
            <ChevronLeft size={16} className={cn(
              "rotate-180 transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
            )} />
          </button>
        </div>

        <div className={cn(
          "border-y divide-y transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl border-white/10 divide-white/10" : "bg-white border-slate-200 divide-slate-100"
        )}>
          <button className={cn(
            "w-full px-4 py-3 flex items-center justify-between transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "active:bg-white/10" : "active:bg-slate-50"
          )}>
            <div className="flex items-center gap-3">
              <History size={18} className={cn(
                "transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )} />
              <span className="text-sm">清空聊天记录</span>
            </div>
          </button>
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBackgroundUpload} />
      <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleImport} />
    </div>
  );
}


async function callAI(systemPrompt: string, currentMsgs: ChatMessage[], settings: AppSettings, action?: 'continue' | 'regenerate') {
  // Filter out empty messages to avoid API errors
  const filteredMsgs = currentMsgs.filter(m => (m.content || '').trim() !== '');
  
  // Prepare messages for the server
  const apiMessages = filteredMsgs.map(m => {
    let role: 'model' | 'user' = m.role === 'assistant' ? 'model' : 'user';
    let text = m.content || '';
    
    if (m.role === 'system') {
      text = `【系统记录消息】：${text}`;
    } else if (m.isNarration) {
      text = `（旁白/动作描写：${text}）`;
    }
    
    return { role, parts: [{ text }] };
  });

  if (action === 'continue') {
    apiMessages.push({ role: 'user', parts: [{ text: '请继续上一句未说完的内容。' }] });
  } else if (action === 'regenerate') {
    apiMessages.push({ role: 'user', parts: [{ text: '请重新生成上一条回复。' }] });
  }

  try {
    const data = await apiFetch({
      endpoint: '/api/chat',
      body: {
        system_prompt: systemPrompt,
        messages: apiMessages,
        settings: {
          ...settings,
          modelName: settings.modelName || "gemini-1.5-flash",
        }
      }
    });

    return data.text;
  } catch (error: any) {
    console.error("AI call error:", error);
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      throw new Error("AI 额度已达到今日上限，请明天再试或检查配置。");
    }
    if (error.message?.includes('PROHIBITED_CONTENT') || error.message?.includes('safety')) {
      throw new Error("生成内容因安全策略被拦截，请尝试换个话题。");
    }
    throw error;
  }
}

function PolaroidCard({ prompt, isRegenerating, onRetry }: { prompt: string, isRegenerating: boolean, onRetry: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 1 }}
      className="bg-white p-3 pb-8 shadow-2xl border border-slate-100 rounded-sm flex flex-col items-center gap-4 w-[240px] relative group"
    >
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-[8px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">FAILED_GEN</div>
      </div>
      <div className="w-full aspect-square bg-slate-50 flex flex-col items-center justify-center text-center p-6 border border-slate-100 rounded-sm relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '12px 12px' }} />
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Camera size={24} className="text-slate-300" />
        </div>
        <p className="text-[11px] text-slate-500 italic line-clamp-5 leading-relaxed px-1 font-serif">
          "{prompt}"
        </p>
      </div>
      <div className="w-full flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <p className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">Generation Error</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onRetry(); }}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white text-[11px] font-black rounded-full hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
        >
          {isRegenerating ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          {isRegenerating ? '重新生成中...' : '点击重试'}
        </button>
      </div>
    </motion.div>
  );
}

function CharacterImageSettings({ friend, onUpdateFriend, settings, onClose }: { 
  friend: Friend, 
  onUpdateFriend: (updates: Partial<Friend>) => void, 
  settings: AppSettings,
  onClose: () => void 
}) {
  const [enabled, setEnabled] = useState(friend.characterImageGenEnabled ?? false);
  const [frequency, setFrequency] = useState(friend.characterImageGenFrequency ?? '3_per_day');
  const [posPrompt, setPosPrompt] = useState(friend.characterImageGenPositivePrompt ?? '');
  const [negPrompt, setNegPrompt] = useState(friend.characterImageGenNegativePrompt ?? '');

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={cn(
        "absolute inset-0 z-[200] flex flex-col",
        settings.themeId === 'rainy-cat' ? "bg-slate-950 text-white" : "bg-slate-50"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cn(
        "p-4 border-b flex items-center justify-between sticky top-0 z-10 backdrop-blur-md",
        settings.themeId === 'rainy-cat' ? "bg-slate-900/80 border-white/10" : "bg-white/80 border-slate-200"
      )}>
        <button onClick={onClose} className="p-2 -ml-2 text-blue-500 flex items-center gap-1">
          <ChevronLeft size={24} />
          <span className="text-sm font-bold">返回</span>
        </button>
        <span className="font-bold text-lg">角色专属生图</span>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">基础配置</h3>
          <div className={cn(
            "rounded-3xl p-5 flex items-center justify-between border shadow-sm transition-all",
            enabled ? (settings.themeId === 'rainy-cat' ? "bg-pink-500/10 border-pink-500/50" : "bg-white border-pink-100") : "bg-slate-100 border-transparent opacity-60"
          )}>
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner",
                enabled ? "bg-pink-500 text-white" : "bg-slate-200 text-slate-400"
              )}>
                <Camera size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">生图功能开关</h4>
                <p className="text-[10px] opacity-60">开启后AI将在聊天中主动分享照片</p>
              </div>
            </div>
            <button 
              onClick={() => setEnabled(!enabled)}
              className={cn("w-14 h-7 rounded-full relative transition-all duration-300", enabled ? "bg-pink-500" : "bg-slate-300")}
            >
              <div className={cn("absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-md", enabled ? "right-1" : "left-1")} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">频率限制</h3>
          <div className="grid grid-cols-2 gap-3">
            {['2_per_day', '3_per_day', '5_per_day', 'unlimited'].map((opt) => (
              <button
                key={opt}
                onClick={() => setFrequency(opt as any)}
                className={cn(
                  "py-4 rounded-2xl text-sm font-bold border-2 transition-all shadow-sm",
                  frequency === opt 
                    ? "bg-blue-500 border-blue-500 text-white" 
                    : (settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white/40" : "bg-white border-slate-100 text-slate-400")
                )}
              >
                {opt === '2_per_day' ? '每天 2 次' : opt === '3_per_day' ? '每天 3 次' : opt === '5_per_day' ? '每天 5 次' : '无限制'}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 px-2 leading-relaxed">
            温馨提示：设置限制可防止角色过于频繁生图，保持新鲜感。即使无限制，角色也会依据当前聊天逻辑进行决策。
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">人设视觉修正</h3>
          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 px-1">
              <div className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center text-white">
                <Smile size={12} />
              </div>
              角色外貌描述 (Positive Prompt)
            </label>
            <div className="relative">
              <textarea
                value={posPrompt}
                onChange={(e) => setPosPrompt(e.target.value)}
                placeholder="描述角色的发色、眼睛、穿着、标志性动作等..."
                className={cn(
                  "w-full h-32 p-4 rounded-2xl text-sm border-2 focus:ring-4 focus:ring-green-500/10 outline-none resize-none transition-all",
                  settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-100"
                )}
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-slate-300 font-mono">Character Profile</div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2 px-1 text-red-500">
              <div className="w-5 h-5 rounded-md bg-red-500 flex items-center justify-center text-white">
                <X size={12} />
              </div>
              排除特征 (Negative Prompt)
            </label>
            <textarea
              value={negPrompt}
              onChange={(e) => setNegPrompt(e.target.value)}
              placeholder="例如：眼镜，帽子，多人..."
              className={cn(
                "w-full h-24 p-4 rounded-2xl text-sm border-2 focus:ring-4 focus:ring-red-500/10 outline-none resize-none transition-all",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-100"
              )}
            />
          </div>
        </div>

        <div className={cn(
          "p-4 rounded-2xl border flex items-start gap-3",
          settings.themeId === 'rainy-cat' ? "bg-yellow-500/10 border-yellow-500/30" : "bg-yellow-50 border-yellow-100"
        )}>
          <ShieldAlert size={20} className="text-yellow-600 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-yellow-800">提示逻辑说明</p>
            <p className="text-[11px] text-yellow-700 leading-relaxed opacity-80">
              系统会自动将你设置的外貌特征与角色的当前环境、动作结合。例如：如果你设置了“银色长发”，当角色在“海边”时，系统会自动生成“在海边的银色长发少女”。
            </p>
          </div>
        </div>
      </div>

      <div className={cn(
        "p-6 border-t backdrop-blur-xl",
        settings.themeId === 'rainy-cat' ? "bg-slate-900/90 border-white/10" : "bg-white/90 border-slate-200"
      )}>
        <button
          onClick={() => {
            onUpdateFriend({
              characterImageGenEnabled: enabled,
              characterImageGenFrequency: frequency,
              characterImageGenPositivePrompt: posPrompt,
              characterImageGenNegativePrompt: negPrompt
            });
            onClose();
          }}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>保存配置并启用</span>
        </button>
      </div>
    </motion.div>
  );
}

function OfflineInvitationCard({ data, onAccept, onDecline, settings }: { data: any, onAccept: () => void, onDecline: () => void, settings: any }) {
  const isRainy = settings.themeId === 'rainy-cat';
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={cn(
        "p-4 rounded-2xl border shadow-xl max-w-[280px] overflow-hidden relative",
        isRainy ? "bg-black/40 border-white/10 text-white" : "bg-white border-pink-100 text-slate-800"
      )}
    >
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-200">
            <Heart size={20} fill="currentColor" />
          </div>
          <div>
            <h4 className="text-sm font-bold">约会邀请函</h4>
            <p className="text-[10px] opacity-50">来自 {data?.friendName || '好友'}</p>
          </div>
        </div>
        
        <div className={cn(
          "p-3 rounded-xl mb-4 italic text-sm leading-relaxed",
          isRainy ? "bg-white/5" : "bg-pink-50/50"
        )}>
          “{data.openingText}”
        </div>
        
        <div className="flex items-center gap-2 mb-4 text-[10px] opacity-60">
          <Calendar size={12} />
          <span>期待与你的线下相遇</span>
        </div>
        
        {data.status === 'pending' ? (
          <div className="flex gap-2">
            <button 
              onClick={onDecline}
              className={cn(
                "flex-1 py-2 rounded-xl text-xs font-bold transition-all active:scale-95",
                isRainy ? "bg-white/5 hover:bg-white/10" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              )}
            >
              婉拒
            </button>
            <button 
              onClick={onAccept}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-pink-500 text-white hover:bg-pink-600 shadow-lg shadow-pink-200 transition-all active:scale-95"
            >
              接受邀请
            </button>
          </div>
        ) : (
          <div className={cn(
            "w-full py-2 rounded-xl text-xs font-bold text-center",
            data.status === 'accepted' ? "bg-green-500/10 text-green-600" : "bg-slate-100 text-slate-400"
          )}>
            {data.status === 'accepted' ? '已接受邀请 ✨' : '已婉拒'}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const isUnlocked60Plus = (friend: Friend, settings: AppSettings) => {
  if (friend.relationshipConfirmed || friend.isSecretCrush) return true;
  if (friend.profileId) {
    const profile = settings.characterProfiles?.find(p => p.id === friend.profileId);
    if (profile) {
      const rel = (profile.relationship || '').toLowerCase();
      if (rel.includes('情侣') || rel.includes('恋爱') || rel.includes('女友') || rel.includes('男友') || rel.includes('老婆') || rel.includes('老公') || rel.includes('结婚') || rel.includes('暗恋') || rel.includes('喜欢') || rel.includes('爱人')) {
        return true;
      }
    }
  }
  const persona = (friend.persona || '').toLowerCase();
  if (persona.includes('情侣') || persona.includes('恋爱') || persona.includes('女友') || persona.includes('男友') || persona.includes('老婆') || persona.includes('老公') || persona.includes('暗恋') || persona.includes('喜欢') || persona.includes('爱人')) {
    return true;
  }
  return false;
};

const getInitialAffection = (friend: Friend, settings: AppSettings) => {
  if (typeof friend.affection === 'number') return friend.affection;
  if (isUnlocked60Plus(friend, settings)) {
    const persona = (friend.persona || '').toLowerCase();
    if (persona.includes('情侣') || persona.includes('女友') || persona.includes('男友') || persona.includes('老婆') || persona.includes('老公')) {
      return 65;
    }
    return 45;
  }
  return 10;
};

const getAffectionLevelInfo = (affection: number) => {
  if (affection <= 20) {
    return { level: 1, name: '初识', range: [0, 20], text: '1级｜初识' };
  } else if (affection <= 40) {
    return { level: 2, name: '认识', range: [20, 40], text: '2级｜认识' };
  } else if (affection <= 60) {
    return { level: 3, name: '暗生好感', range: [40, 60], text: '3级｜暗生好感' };
  } else if (affection <= 80) {
    return { level: 4, name: '深度暗恋', range: [60, 80], text: '4级｜深度暗恋' };
  } else if (affection <= 95) {
    return { level: 5, name: '克制偏爱', range: [80, 95], text: '5级｜克制偏爱' };
  } else {
    return { level: 6, name: '静待心意', range: [95, 100], text: '6级｜静待心意' };
  }
};

const getPureStickerUrl = (content: string, customStickers: any[] = []) => {
  if (!content) return null;
  const trimmed = content.trim();
  const match = trimmed.match(/^\[表情:\s*(.*?)\]$/);
  if (match) {
    const desc = match[1];
    const foundSticker = customStickers.find((s: any) => s.description.includes(desc) || desc.includes(s.description));
    if (foundSticker) {
      return { url: foundSticker.url, desc };
    }
  }
  return null;
};

const renderMessageTimestamp = (msg: any, prevMsg?: any) => {
  if (!msg.timestamp) return null;
  const showTime = !prevMsg || !prevMsg.timestamp || (msg.timestamp - prevMsg.timestamp > 5 * 60 * 1000);
  if (showTime) {
    const date = new Date(msg.timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    let timeStr = '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    if (isToday) {
      timeStr = `${hours}:${minutes}`;
    } else {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday = date.toDateString() === yesterday.toDateString();
      if (isYesterday) {
        timeStr = `昨天 ${hours}:${minutes}`;
      } else if (date.getFullYear() === now.getFullYear()) {
        timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${hours}:${minutes}`;
      } else {
        timeStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${hours}:${minutes}`;
      }
    }
    
    return (
      <div className="w-full text-center my-3 select-none">
        <span className="text-slate-400 dark:text-slate-500 text-[11px]">
          {timeStr}
        </span>
      </div>
    );
  }
  return null;
};

function ChatWindow({ 
  friend, user, friends, messages, settings, groups, chats, onBack, onSendMessage, onUpdateFriend, 
  onImportMessages, onStartCall, externalCallStatus, onClearCallStatus, 
  summarizeContent, listenTogetherState, onUpdateListenTogether, 
  onShowMomentSettings, addTransaction, onUpdateMessage, addMoment, onManualMoment,
  onUpdateSettings, onOpenApp, onShowCreateGroup
}: { 
  key?: any,
  friend: Friend, 
  user: any,
  friends: Friend[],
  messages: ChatMessage[], 
  settings: AppSettings, 
  groups: GroupChat[],
  chats: Record<string, ChatMessage[]>,
  onBack: () => void,
  onSendMessage: (msg: ChatMessage) => void,
  onUpdateFriend: (updates: Partial<Friend>) => void,
  onImportMessages: (msgs: ChatMessage[]) => void,
  onStartCall: (friend: Friend, type: 'voice' | 'video') => void,
  externalCallStatus: { status: 'rejected' | 'ended' | 'missed'; duration: number } | null,
  onClearCallStatus: () => void,
  summarizeContent: (friend: Friend, messages: ChatMessage[], type: 'chat' | 'call' | 'group' | 'offline', customPrompt?: string, range?: { start: number, end: number }) => Promise<string | null>,
  listenTogetherState: ListenTogetherState,
  onUpdateListenTogether: React.Dispatch<React.SetStateAction<ListenTogetherState>>,
  onShowMomentSettings: (id: string) => void,
  addTransaction: (transaction: any) => void,
  onUpdateMessage: (friendId: string, index: number, updates: Partial<ChatMessage>) => void,
  addMoment: (content: string, images?: string[], location?: string, visibility?: any, visibleTo?: string[], hiddenFrom?: string[], authorId?: string) => any,
  onManualMoment: (friendId: string) => Promise<boolean>,
  onUpdateSettings: (updates: Partial<AppSettings>) => void,
  onOpenApp?: (appId: AppId, data?: any) => void,
  onShowCreateGroup?: () => void
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { addOnlineMemory, addOfflinePlot, getFriendMemory } = useMemory();
  const [activeModal, setActiveModal] = useState<'transfer' | 'receive-transfer' | 'call' | 'location' | 'music' | 'game' | 'truth-or-dare' | 'voice-input' | 'camera' | 'text-photo' | 'sparkle' | 'exit-offline' | 'manual-summary' | 'blind-box' | 'custom-blind-box' | 'edit-message' | 'image-preview' | 'character-image-gen' | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [selectedTransferIndex, setSelectedTransferIndex] = useState<number | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('wallet');
  const [isOfflineMode, setIsOfflineMode] = useState(friend.isOfflineMode || false);
  const [manualSummary, setManualSummary] = useState('');
  const [isRegeneratingImage, setIsRegeneratingImage] = useState<number | null>(null);

  const [isEndingOffline, setIsEndingOffline] = useState(false);

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isNarration, setIsNarration] = useState(false);
  const [offlineMessages, setOfflineMessages] = useState<ChatMessage[]>(friend.currentOfflineMessages || []);

  // Sync offline state to friend object to support "Temporarily Exit" (retain content)
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdateFriend({ 
        isOfflineMode,
        currentOfflineMessages: offlineMessages
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [isOfflineMode, offlineMessages]);

  const [showSettings, setShowSettings] = useState(false);
  const [useVoiceInput, setUseVoiceInput] = useState(false);

  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [textPhotoContent, setTextPhotoContent] = useState('');
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ messageIndex: number; rect?: DOMRect } | null>(null);
  const [isTranslating, setIsTranslating] = useState<number | null>(null);
  const [showHeartfelt, setShowHeartfelt] = useState<{ messageIndex?: number, content: string } | null>(null);
  const [showOfflineSettings, setShowOfflineSettings] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<number[]>([]);
  const [showOfflineRefreshMenu, setShowOfflineRefreshMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [offlineConfig, setOfflineConfig] = useState<OfflineConfig>(() => ({
    location: friend.offlineConfig?.location || '',
    openingLine: friend.offlineConfig?.openingLine || '',
    minWords: friend.offlineConfig?.minWords || 200,
    maxWords: friend.offlineConfig?.maxWords || 800,
    characterPerspective: friend.offlineConfig?.characterPerspective || '第三人称',
    userPerspective: friend.offlineConfig?.userPerspective || '第二人称',
    writingStyle: friend.offlineConfig?.writingStyle || '言情小说文风',
    bgImage: friend.offlineChatBackground || friend.offlineConfig?.bgImage || '',
    onlineContextCount: friend.offlineConfig?.onlineContextCount || 50,
    customCss: friend.offlineConfig?.customCss || '',
    writingStylePresets: friend.offlineConfig?.writingStylePresets || [],
    cardTheme: friend.offlineConfig?.cardTheme || 'classic',
    worldBookEnabled: friend.offlineConfig?.worldBookEnabled || false,
    selectedWorldBookIds: friend.offlineConfig?.selectedWorldBookIds || []
  }));

  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);

  // Sync offlineConfig to parent with a small debounce to prevent input lag
  useEffect(() => {
    const timer = setTimeout(() => {
      onUpdateFriend({ 
        offlineConfig,
        offlineChatBackground: offlineConfig.bgImage
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [offlineConfig]);

  const saveOfflineConfig = () => {
    onUpdateFriend({ 
      offlineConfig,
      offlineChatBackground: offlineConfig.bgImage
    });
    setShowOfflineSettings(false);
  };

  const handleDeleteOfflineMessage = (index: number) => {
    const newMsgs = [...offlineMessages];
    newMsgs.splice(index, 1);
    setOfflineMessages(newMsgs);
  };
  const [characterSchedules, setCharacterSchedules] = useState<Record<string, any>>({});
  const [quotedMessage, setQuotedMessage] = useState<ChatMessage | null>(null);
  const { addFavorite } = useFriends();

  const [stickerTab, setStickerTab] = useState<'emoji' | 'custom'>('emoji');
  const [manualSummaryRange, setManualSummaryRange] = useState({ start: 0, end: 0 });
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
  const [showStickerImport, setShowStickerImport] = useState<'url' | 'file' | null>(null);
  const [stickerDeleteMode, setStickerDeleteMode] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [stickerUrlInput, setStickerUrlInput] = useState('');
  const [expandedVoiceMessages, setExpandedVoiceMessages] = useState<Record<number, boolean>>({});
  const [stickerFileDescription, setStickerFileDescription] = useState('');
  const [pendingStickerFile, setPendingStickerFile] = useState<string | null>(null);
  const stickerFileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingInterval = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const isHoldingRef = useRef<boolean>(false);
  const longPressTimerRef = useRef<any>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentMessages = isOfflineMode ? offlineMessages : messages;

  const handleStartEdit = (index: number) => {
    const msg = isOfflineMode ? offlineMessages[index] : messages[index];
    setEditingMessageIndex(index);
    setEditingContent(msg.content);
    setActiveModal('edit-message');
  };

  const handleSaveEdit = () => {
    if (editingMessageIndex === null) return;
    if (isOfflineMode) {
      const newMsgs = [...offlineMessages];
      newMsgs[editingMessageIndex] = { ...newMsgs[editingMessageIndex], content: editingContent };
      setOfflineMessages(newMsgs);
    } else {
      onUpdateMessage(friend.id, editingMessageIndex, { content: editingContent });
    }
    setEditingMessageIndex(null);
    setEditingContent('');
    setActiveModal(null);
  };

  const handleEndOfflineMode = async (summary?: string) => {
    setIsEndingOffline(true);
    try {
      const finalSummary = summary || await summarizeContent(friend, offlineMessages, 'offline');
      const summaryContent = finalSummary || '无总结';
      let plotTitle = offlineConfig.location || '线下剧情';
      const titleMatch = summaryContent.match(/【剧情标题[：:]\s*([^】\n]+)】/);
      if (titleMatch && titleMatch[1]) {
        plotTitle = titleMatch[1].trim();
      }
      
      // Save to memory
      const newMemory: OfflineMemory = {
        summary: summaryContent,
        rawHistory: [...offlineMessages]
      };
      
      const carriedMessages = offlineMessages.slice(-30);
      onUpdateFriend({ 
        offlineMemory: newMemory,
        carriedOfflineMessages: carriedMessages
      });
      addOfflinePlot(friend.id, plotTitle, [...offlineMessages], summaryContent);
    } catch (error) {
      console.error('Failed to summarize offline mode:', error);
    } finally {
      // Clear history and exit regardless of success
      setOfflineMessages([]);
      setIsOfflineMode(false);
      setActiveModal(null);
      setIsEndingOffline(false);
    }
  };

  const handleTemporarilyExit = () => {
    setActiveModal(null);
    onBack(); // Go back to chat list but keep isOfflineMode=true in friend object
  };

  const openMessageMenu = (index: number) => {
    setContextMenu({ messageIndex: index });
    if (navigator.vibrate) navigator.vibrate(50);
  };

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const saved = await get('character_schedules') || {};
        setCharacterSchedules(saved);
      } catch (error) {
        console.error("Failed to load schedules:", error);
      }
    };
    loadSchedules();
  }, []);

  useEffect(() => {
    if (externalCallStatus) {
      const { status, duration } = externalCallStatus;
      const msg: ChatMessage = {
        role: 'user',
        content: status === 'missed' ? '未接听' : (status === 'rejected' ? '已拒绝' : `通话时长 ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`),
        type: 'call',
        callStatus: status === 'ended' ? 'ended' : status,
        duration: duration,
        timestamp: Date.now()
      };
      onSendMessage(msg);
      onClearCallStatus();
    }
  }, [externalCallStatus]);

  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      recordingInterval.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
        recordingInterval.current = null;
      }
    }
    return () => {
      if (recordingInterval.current) clearInterval(recordingInterval.current);
    };
  }, [isRecording]);

  const [isEditingOffline, setIsEditingOffline] = useState(false);

  const lastMessagesLength = useRef(currentMessages.length);
  useEffect(() => {
    // Only scroll to bottom if a new message was ADDED and NOT in edit mode
    if (scrollRef.current && currentMessages.length > lastMessagesLength.current && !isEditingOffline) {
      const scroll = () => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      };
      requestAnimationFrame(scroll);
    }
    lastMessagesLength.current = currentMessages.length;
  }, [currentMessages.length, isOfflineMode, isEditingOffline]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { 
      role: 'user', 
      content: input, 
      type: 'text',
      quote: quotedMessage || undefined,
      timestamp: Date.now() 
    };
    if (isOfflineMode) {
      const narrationMsg: ChatMessage = {
        role: 'user',
        content: input,
        type: 'text',
        isNarration: isNarration,
        timestamp: Date.now()
      };
      setOfflineMessages(prev => [...prev, narrationMsg]);
      setIsNarration(false);
    } else {
      onSendMessage(userMsg);
      
      // Auto-summarize check
      const newCount = (friend.memoryCount || 0) + 1;
      if (newCount >= settings.autoSummaryThreshold) {
        const recentMsgs = [...messages, userMsg].slice(-settings.autoSummaryThreshold * 2);
        summarizeContent(friend, recentMsgs, isOfflineMode ? 'offline' : 'chat').then(summary => {
          if (summary) {
            addOnlineMemory(friend.id, summary, 'auto', 'chat');
          }
        }).catch(err => console.error("Auto-summarize error:", err));
        onUpdateFriend({ memoryCount: 0 });
      } else {
        onUpdateFriend({ memoryCount: newCount });
      }
    }
    setInput('');
    setQuotedMessage(null);
  };

  const handleDownloadImage = async (url: string) => {
    try {
      // Create a temporary link and trigger download
      // For cross-origin images, standard download attribute might not work
      // We use a fetch blob approach which usually works if CORS is handled or if it's the same origin
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `photo_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
      // Fallback: Open in new tab
      window.open(url, '_blank');
      showToast("已在新窗口打开图片，请长按保存");
    }
  };

  const handleRegenerateImage = async (index: number) => {
    const msg = currentMessages[index];
    if (!msg.description) return;
    
    setIsRegeneratingImage(index);
    try {
      const result = await apiFetch({
        endpoint: '/api/image-gen',
        body: {
          prompt: msg.description,
          negative_prompt: friend.characterImageGenNegativePrompt || settings.imageGenNegativePrompt || "",
          ratio: settings.imageGenSize || "1024x1024",
          settings: settings
        }
      });

      if (result.url) {
        onUpdateMessage(friend.id, index, { 
          mediaUrl: result.url,
          notificationData: { isFailed: false }
        });
      }
    } catch (error) {
      console.error("Regenerate image error:", error);
    } finally {
      setIsRegeneratingImage(null);
    }
  };

  const sendVoiceMessage = async (text: string) => {
    // Determine duration based on character count (approx 3 characters per second)
    const duration = Math.max(1, Math.ceil(text.length / 3));
    
    const msg: ChatMessage = {
      role: 'assistant',
      content: text,
      type: 'voice',
      duration: duration,
      timestamp: Date.now()
    };
    
    if (isOfflineMode) {
      setOfflineMessages(prev => [...prev, msg]);
    } else {
      onSendMessage(msg);
    }
    
    // Auto-play if MiniMax is enabled
    if (settings.minimaxEnabled && settings.minimaxApiKey) {
      setPlayingMessageId(msg.timestamp);
      speakText(text, friend.voiceId, friend.voiceType || 'minimax', settings)
        .catch(err => {
          console.error('Auto-play TTS error:', err);
          alert('语音合成失败：' + (err instanceof Error ? err.message : '未知错误'));
        })
        .finally(() => {
          setPlayingMessageId(prev => prev === msg.timestamp ? null : prev);
        });
    }
  };

  const handleGenerate = async (action?: 'continue' | 'regenerate') => {
    if (isLoading) return;

    let currentMsgs = isOfflineMode ? [...offlineMessages] : [...messages];

    if (action === 'regenerate') {
      if (currentMsgs.length > 0 && currentMsgs[currentMsgs.length - 1].role === 'assistant') {
        currentMsgs.pop();
        if (isOfflineMode) {
          setOfflineMessages(currentMsgs);
        }
      }
    }

    if (input.trim() && action !== 'continue' && action !== 'regenerate') {
      const userMsg: ChatMessage = { 
        role: 'user', 
        content: input, 
        type: 'text',
        timestamp: Date.now() 
      };
      currentMsgs.push(userMsg);
      if (isOfflineMode) {
        setOfflineMessages(currentMsgs);
      } else {
        onSendMessage(userMsg);
      }
      setInput('');
    }

    setIsLoading(true);
    // 同时更新角色状态
    handleUpdateStatus(true).catch(err => console.error("Parallel status update error:", err));

    try {
      // Fetch external context data
      const [weiboMoments, weiboChats, diaries, schedules] = await Promise.all([
        get('weibo-moments') || Promise.resolve([]),
        get('weibo-chats') || Promise.resolve({}),
        get(`diaries_${friend.id}`) || Promise.resolve([]),
        get('character_schedules') || Promise.resolve({})
      ]);

      const beijingTimeStr = new Date().toLocaleString('zh-CN', { 
        timeZone: 'Asia/Shanghai', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: false 
      });

      // Active world book entries
      const worldBookEntries = settings.worldBookEntries || [];
      let activeEntries: any[] = [];
      if (isOfflineMode) {
        if (offlineConfig.worldBookEnabled && offlineConfig.selectedWorldBookIds && offlineConfig.selectedWorldBookIds.length > 0) {
          activeEntries = worldBookEntries.filter(e => e.isEnabled && offlineConfig.selectedWorldBookIds?.includes(e.id));
        } else {
          activeEntries = [];
        }
      } else {
        activeEntries = worldBookEntries.filter(e => 
          e.isEnabled && (e.scope === 'global' || (e.scope === 'character' && (e.linkedCharacterIds || []).includes(friend.profileId || '')))
        );
      }
      const highPriorityEntries = activeEntries.filter(e => e.priority === 'high');
      const otherPriorityEntries = activeEntries.filter(e => e.priority !== 'high');

      // 1. Beijing Real-Time & Chat Message Timestamps
      let systemPrompt = `【实时时间基准】
当前北京实时时间：${beijingTimeStr}。请对北京时间与聊天消息的时间戳保持高度敏感和实时感知。

【绝对核心准则与读取顺序】
你必须严格按照以下顺序读取和响应设定与记忆：
1. **世界书前置设定 + 角色人设** (最高优先级)
2. **世界书后续设定** (中/低优先级)
3. **线上线下聊天上下文** (无缝承接最近对话与线下约会结尾)
4. **记忆库记忆** (长期记忆与历史剧情总结，遵循近期与久远分层)

---
`;

      // 2. World Book Front (High) + Persona
      if (highPriorityEntries.length > 0) {
        systemPrompt += `【世界书设定 - 前置高优先级】\n`;
        highPriorityEntries.forEach(entry => {
          systemPrompt += `[${entry.category}] ${entry.name}\n${entry.content}\n\n`;
        });
      }

      systemPrompt += `【角色人设】\n${friend.persona}\n\n`;

      if (isOfflineMode) {
        systemPrompt += `当前处于【线下剧情模式】。地点：${offlineConfig.location}\n\n`;
      }

      // 3. World Book Back (Medium / Low)
      if (otherPriorityEntries.length > 0) {
        systemPrompt += `【世界书设定 - 中后置设定】\n`;
        otherPriorityEntries.forEach(entry => {
          const priorityLabel = entry.priority === 'medium' ? '中' : '后';
          systemPrompt += `[${entry.category}] ${entry.name} (优先级: ${priorityLabel})\n${entry.content}\n\n`;
        });
      }

      // 4. Online & Offline Chat Context (with seamless continuity)
      if (isOfflineMode) {
        const onlineHistoryCount = offlineConfig.onlineContextCount || 50;
        const recentOnlineMessages = messages
          .filter(m => m.role !== 'system')
          .slice(-onlineHistoryCount);
        
        if (recentOnlineMessages.length > 0) {
          const onlineContextString = recentOnlineMessages.map(m => {
            const sender = m.role === 'user' ? '我' : friend.name;
            const tStr = new Date(m.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
            return `[${tStr}] ${sender}: ${m.content}`;
          }).join('\n');
          systemPrompt += `【线上聊天上下文过渡】\n以下是进入线下约会前，你们在微信上的最新聊天对话。请在线下见面互动中，极其自然地承接并延续这一段聊天的话题与情绪：\n${onlineContextString}\n\n`;
        }
      } else {
        if (friend.carriedOfflineMessages && friend.carriedOfflineMessages.length > 0) {
          const recentOfflineLogs = friend.carriedOfflineMessages.slice(-30).map((m: any) => {
            const sender = m.role === 'user' ? '我' : friend.name;
            const tStr = new Date(m.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
            return `[${tStr}] ${sender}: ${m.content}`;
          }).join('\n');
          systemPrompt += `【线下剧情上下文承接（刚刚结束的线下约会末尾记录）】\n以下是你们刚刚结束的线下约会/见面最后的对话与互动记录。当返回线上聊天时，**必须无缝续接在线下见面最后一段结束后的状态、情绪、未尽的话题或动作中进行线上互动**：\n${recentOfflineLogs}\n\n`;
        }
      }

      // 5. Memory Store Memories
      const friendMemoryStore = getFriendMemory(friend.id);
      let memorySection = "";
      if (friend.offlineMemory?.summary) {
        memorySection += `【当前/最新线下剧情摘要】\n${friend.offlineMemory.summary}\n\n`;
      }
      if (friendMemoryStore.onlineMemories.length > 0) {
        const recentMemories = friendMemoryStore.onlineMemories.slice(0, 15).map(m => {
          const timeStr = new Date(m.timestamp).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
          return `[时间: ${timeStr}] [${m.source === 'weibo' ? '微博' : '聊天'}] ${m.content}`;
        }).join('\n- ');
        memorySection += `【长期记忆回顾】\n- ${recentMemories}\n\n`;
      }
      if (friendMemoryStore.offlinePlots && friendMemoryStore.offlinePlots.length > 0) {
        const recentOfflinePlotSummaries = friendMemoryStore.offlinePlots.slice(-10).map((p: any) => {
          const timeStr = new Date(p.timestamp).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
          return `[时间: ${timeStr}] [剧情标题: ${p.title}] 剧情概要: ${p.summary}`;
        }).join('\n- ');
        memorySection += `【往期线下历史剧情记忆合集】\n- ${recentOfflinePlotSummaries}\n\n`;
      }

      if (memorySection) {
        systemPrompt += `【记忆库记忆与时间识别准则】\n${memorySection}
1. **时间识别与分层**：精准识别上述记忆中每条记录的时间点。
2. **近期与久远区分**：近期记忆可自然提及或承接；久远记忆在日常对话中不需要刻意提起或唠叨，只有当当前语境、话题天然关联或用户主动提起时方可提及，绝对不要无缘无故翻旧账。\n\n`;
      }

      if (isOfflineMode) {
        // Read specified lines of WeChat context as memory
        const onlineHistoryCount = offlineConfig.onlineContextCount || 50;
        const recentOnlineMessages = messages
          .filter(m => m.role !== 'system')
          .slice(-onlineHistoryCount);
        
        if (recentOnlineMessages.length > 0) {
          const onlineContextString = recentOnlineMessages.map(m => {
            const sender = m.role === 'user' ? '我' : friend.name;
            return `${sender}: ${m.content}`;
          }).join('\n');
          systemPrompt += `\n\n【携带的微信聊天记忆（最新${recentOnlineMessages.length}条）】\n以下是你们在线下见面之前，在手机微信上的最新聊天对话。请在当下的线下剧情面对面互动中，**完美承接、延续并回应这一段微信聊天的最新内容与话题，让互动的场景转移显得极其流畅、连贯、自然**：\n${onlineContextString}`;
        }

        systemPrompt += `\n\n【线下剧情模式核心指令 - 升维小说化创作】
1. **文风强制遵循（极其重要，最高优先级）**：
   - 当前文风设定：${offlineConfig.writingStyle ? `【${offlineConfig.writingStyle}】` : '未指定（系统自由文风）'}。
   ${offlineConfig.writingStyle ? `
   - 文风解析与核心特征：${(() => {
     if (offlineConfig.writingStyle === '白描文风') return '极简克制，通过精准的物理动作与环境细节传达波澜壮阔的内心。严禁生硬套路化的“动作+对话+动作+对话”机械循环，强调自然留白、环境渲染与克制细腻。';
     if (offlineConfig.writingStyle === '现代口语化文风') return '活泼跳脱，像当下年轻人生活实录，充满真实的呼吸感与碎片化的生活气息。拒绝呆板机械对话，多写随性的动作、眼神互动、呼吸感及自然的生活化叙事。';
     if (offlineConfig.writingStyle === '言情小说文风') return '极度细腻，擅长氛围拉扯、眼神博弈与微妙的肢体触碰，宿命感与张力并存。拒绝套路化对话，通过环境光影、长睫颤抖、心跳起伏与隐晦的试探层层推进情感。';
     if (offlineConfig.writingStyle === '诗意古风文风') return '古雅隽永，情景交融，每一处景物描写都承载着人物的隐秘心事。拒绝死板对白，强调借景抒情、衣袂微动、墨香余韵与古典含蓄的心境流转。';
     const preset = (offlineConfig.writingStylePresets || []).find((p: any) => p.name === offlineConfig.writingStyle);
     return preset ? preset.description : offlineConfig.writingStyle;
   })()}
   - **绝对严禁脱离该文风**：每一次输出的词汇选择、节奏感、情感氛围都必须完全契合上述文风，不得敷衍或使用通用AI套话。
   ` : '- 当前未选择特定文风预设，请保持自然流畅、无死板机械套路的细腻沉浸式小说化叙事。'}

2. **剧情创作风格与结构（拒绝僵硬机械，全景小说化）**：
   - **拒绝机械死板**：严禁采用“动作+对话+动作+对话”的机械套路循环。
   - **灵活结构与自由叙事**：
     * **环境与细腻铺垫**：开头可以是一小段环境描写（光影、气味、背景音、天气）、路人或氛围，再自然接入人物的外貌、神态与肢体动作。
     * **丰富的旁白维度**：旁白中不仅要写角色在做什么，还要写动作、心理、神态、环境、呼吸，甚至可以使用角色的名字（如：“${friend.name}看着你，摇了摇头，神色自然。”），杜绝枯燥死板的“他怎么做”。
   - **推荐叙事范本**：
     * **标准叙事版（主推！剧情流畅、最自然）**：
       环境铺垫 → 角色肢体动作 → 面部神态 → 隐秘心理 → 出声对话 → 后续动作/心理交织……
       - 示例：
         午后阳光斜斜落在客厅地砖上，空气安静温润。
         他垂落双手，缓步停下脚步，指尖无意识蜷缩了一下。
         长睫轻颤，眼底敛着淡淡迟疑，唇角平直没有笑意。
         ${friend.name}心里纠结该不该直白发问，生怕打破当下平和的氛围，轻声开口：
         “你刚才想说什么？”
     * **氛围感细腻版（情感、暧昧、伤感专用）**：
       环境感官（风声、光影、气味）→ 慢动作 → 微表情 → 隐晦心理 → 低声对白……
       - 示例：
         夜色沉沉，晚风裹挟凉意掠过屋檐，周遭只剩零星虫鸣。
         ${friend.name}微微垂首，抬手拢了拢单薄衣襟，肩线微微绷紧。
         眼底蒙着一层浅淡落寞，神色疏离又柔软，呼吸放得极轻，嗓音压低：“有些事，是不是没办法回头了？”

2. **核心词汇加粗标黄规则（情感与语调重音）**：
   - **标黄意义**：用双星号包裹的部分（如 **关键词**）会被UI高亮标黄。这必须是角色认为**极度重要、承载特殊语调（如反讽、撒娇、故意加重语气）或情感震撼点**的词汇。
   - **场景示例**：
     * **阴阳怪气**：“我可不敢多说话，毕竟有些人 **本事** 大得很。”
     * **撒娇/强硬**：“就陪我 **一小会儿**，好不好嘛。”；“ **不许** 不理我，我会很难过的。”
     * **心理/氛围重音**：话音卡在喉咙，唯独把“算了”说得无比 **沉重** ；把大度演得格外 **勉强** ；原来我的 **真心** ，换不来对等的珍惜。
   - **【最严上限：每段/每轮最多加粗1-3个】**：严禁泛滥。请精准捕捉那 1 到 3 个最具灵魂的重音词。

3. **全维度记忆共鸣（绝不遗忘）**：
   - 你拥有完整的记忆链条：包含上方的【长期记忆回顾】、【往期历史剧情】以及【携带的微信聊天记忆】。
   - **深度承接**：线下剧情不是孤立的，它是线上互动的延续。你必须时刻记得：“刚刚我们在微信里聊了什么话题？”“几个月前我们在线下许下了什么诺言？”。
   - **自然流露**：在描写或对话中，不经意地提起过往细节（如：你今天穿的裙子，正是我在微信里夸过的那条；或者，还是上次那个老地方，路灯依然那样昏黄）。

4. **格式规范**：
   - **对话**：必须 100% 使用中文双引号 “ ” 包裹。
   - **人称**：旁白自称【${offlineConfig.characterPerspective}】，称呼我为【${offlineConfig.userPerspective}】。
   - **字数**：回复总字数必须严格控制在 **${offlineConfig.minWords}** 到 **${offlineConfig.maxWords}** 字之间。
${(() => {
  if (offlineConfig.cardTheme === 'student') {
    return `5. **学生卡专项指令**：请在回复的最末尾，使用 [INNER_MONOLOGUE] 标签包裹一段角色的内心独白（约100字），用于卡片展示。独白应深刻体现角色此时此刻对你的隐秘情感。`;
  }
  if (offlineConfig.cardTheme === 'glass') {
    return `5. **毛玻璃卡专项指令**：请在回复的最末尾，使用 [STATUS] 标签包裹角色此刻的实时状态（4-8字），使用 [OUTFIT] 标签描述角色当前的穿搭（10-20字）。`;
  }
  return '';
})()}`;
      }
      

      
      if (isOfflineMode) {
        systemPrompt += `\n\n【线下剧情模式禁令】
- **严禁发送任何形式的照片、视频 or 语音指令。**
- **你现在就在我面前，所有的互动通过文字描写（旁白+对话）完成，禁止使用视觉附件指令（如 [SEND_PHOTO_CARD]）。**`;
      } else {
        if (friend.characterImageGenEnabled) {
          systemPrompt += `\n\n【专属视觉附件：角色日常生活照】
当你觉得语境非常合适（如刚睡醒、在吃美食、在某个景点、展示当日穿搭、或者用户请求看你照片时），你**必须且只能**使用 '[SEND_PHOTO_CARD:生图提示词:地点:时段]' 指令来分享你的照片。
- **角色外貌特征 (极其重要)**：${friend.characterImageGenPositivePrompt || '根据人设自然生成'}
- **生图提示词**：结合当前语境和你的外貌特征，给出一个极具画面感、细节丰富的描述（50-100字）。
- **地点**：${friend.address || '未知'}。
- **时段**：根据当前实时时间（${new Date().toLocaleTimeString()}）判断。
示例：[SEND_PHOTO_CARD:我刚在操场跑完步，发丝被汗水打湿，穿着宽松的运动背心，手里拿着一瓶冰可乐，阳光洒在脸上显得元气满满。:学校操场:下午]
系统会根据这些信息为你生成真实的个人照片。请不要频繁发送，除非用户强烈要求。`;
        } else if (settings.imageGenEnabled) {
          systemPrompt += `\n\n【视觉附件设定：实时生图】
当你觉得语境合适时（如分享穿搭、展示风景、给你看照片等），你可以使用 '[SEND_PHOTO_CARD:生图提示词:地点:时段]' 指令。
- **生图提示词**：极其详细、具体的画面描述（50-100字），用于交给 AI 进行绘画。
- **地点**：${friend.address || '未知'}。
- **时段**：如：清晨、深夜。
示例：[SEND_PHOTO_CARD:一个穿着白色吊带裙的少女站在宿舍阳台上，落日的余晖洒在她清冷精致的侧脸，富士胶片质感。:宿舍阳台:傍晚]
系统会实时生成真实的 AI 图片。如果生成失败，则显示精美的卡片文字。`;
        } else {
          systemPrompt += `\n\n【视觉附件设定：CCD文字摄影卡】
当你想向用户发送照片、分享美境或展示你的工作/生活状态时，你必须发送一个 '[SEND_PHOTO_CARD:内容:地点:时段]' 格式的指令。
- **内容**：极具画面感的内容描述（50-100字）。
- **地点**：${friend.address || '未知'}。
- **时段**：如：清晨、正午、傍晚、深夜。
示例：[SEND_PHOTO_CARD:这会儿刚洗完澡，发梢还挂着没干的水珠，侧脸线条在富士相纸下显得安静又清晰。:宿舍阳台:傍晚]
系统会自动将其渲染为精美的CCD相纸卡片。禁止直接发送图片URL。`;
        }
      }
      // Image Generation Frequency Logic
      if (friend.characterImageGenEnabled && friend.characterImageGenFrequency && friend.characterImageGenFrequency !== 'unlimited') {
        const today = new Date().toDateString();
        const lastReset = friend.characterImageGenLastResetDate || '';
        let dailyCount = friend.characterImageGenDailyCount || 0;
        
        if (today !== lastReset) {
          dailyCount = 0;
          onUpdateFriend({ characterImageGenDailyCount: 0, characterImageGenLastResetDate: today });
        }

        const limitMap: Record<string, number> = { '2_per_day': 2, '3_per_day': 3, '5_per_day': 5 };
        const limit = limitMap[friend.characterImageGenFrequency] || 999;

        if (dailyCount >= limit) {
          systemPrompt += `\n\n【重要：生图额度限制】你今天的日常照片分享次数已达上限（${limit}次）。除非用户非常强烈地要求看照片，否则请不要使用 [SEND_PHOTO_CARD] 指令。`;
        }
      }


        
      // Enhanced persona-aware instructions
      systemPrompt += `
        【核心指令：彻底去AI化，100%活人感】
        1. 语言要求：
           - 必须全程使用${friend.language || '中文（普通话）'}进行回复。
           - **严禁在回复中包含任何英文思考过程、规划内容、内心戏规划或任何非角色语言的文字。**
           - **严禁提供任何翻译、解释、标注或消息编号（如：Message 1, Message 2）。**
           - 所有的内心独白也必须使用中文。
        2. 说话风格：
           - 严禁使用任何AI助手的口吻。禁止说“作为AI”、“我是一个AI”、“很高兴为你解答”、“请问还有什么可以帮你的吗”等。
           - 说话要口语化、生活化，像真正的朋友在微信上聊天。
           ${isOfflineMode ? `
           - **线下剧情核心约束**：
             1. **字数控制**：每一段回复总字数必须在 ${offlineConfig.minWords} 到 ${offlineConfig.maxWords} 字左右。
             2. **人称视角**：在旁白动作描写中，自称必须为“${offlineConfig.characterPerspective}”，对方称呼必须为“${offlineConfig.userPerspective}”。台词对话则保持自然的“我”对“你”。
             3. **格式隔离**：对话必须用“”包裹，旁白严禁包含对话台词。
             4. **媒体禁令**：严禁发送 [SEND_PHOTO_CARD] 或任何类似卡片指令。` : ''}
            - 多使用语气助词（啊、呢、嘛、哦、哈等），让语气软和、可爱、傲娇或搞怪，避免任何冷漠和生硬。

         3. 行为指令触发：
            - 如果你想发起互动，请在回复中包含以下指令（不要包含其他文字）：
             - [ACCEPT_TRANSFER] - 收下转账
             - [REJECT_TRANSFER] - 退回转账
${!isOfflineMode ? `             - [START_VIDEO_CALL] - 发起视频通话
             - [START_VOICE_CALL] - 发起语音通话
             - [SEND_VOICE] - 发送语音消息
             - [SEND_PHOTO] - 发送照片
             - [START_LISTEN] - 发起一起听
             - [START_TRUTH] - 发起真心话
             - [SEND_TRANSFER:金额:说明] - 主动给用户转账（例如：[SEND_TRANSFER:520:爱你哟]）
             - [SEND_LOCATION:地点名称] - 发送你的当前位置（例如：[SEND_LOCATION:在心里呀]）
             - [SEND_STICKER:表情包ID] - 发送自定义表情包
             - [OFFLINE_INVITATION:开场白] - 主动发起线下约会邀请
             - [MEITUAN_BUY:餐品名称|价格|描述|附言] - 使用美团给用户点外卖（例如：[MEITUAN_BUY:招牌红烧牛肉面|38.5|趁热吃，别饿肚子|辛苦啦]）
             - [TAOBAO_BUY:商品名称|价格|描述|附言] - 使用淘宝给用户买商品/礼物（例如：[TAOBAO_BUY:限定小熊玩偶|128|希望你喜欢这个小礼物|送你的]）。注：请根据语境和人设适度使用，切勿过于频繁。` : ''}
      `;

      if (friend.language) {
        systemPrompt += `\n\n【系统设定：语言】\n请使用${friend.language}进行回复。`;
      }

      if (friend.disableActionDescription) {
        systemPrompt += `\n\n【核心指令：严禁动作描写】\n当前用户已禁用动作描写功能。你必须表现得像一个正在打字的真人，严禁使用任何括号包裹的动作描写、神态描述、心理预测等。严禁出现诸如“（脸红）”、“（笑）”、“（动作描写）”等形式的文字。请仅输出干净的对话气泡内容。`;
      }
        
      if (settings.timeAwarenessEnabled) {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN', { 
          year: 'numeric', month: '2-digit', day: '2-digit', 
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          weekday: 'long'
        });
        systemPrompt += `\n\n【系统设定：时间与位置感知】\n当前实时时间是：${timeString}。`;
        if (friend.address) {
          systemPrompt += `\n你当前所处的地理位置是：${friend.address}。`;
        }
        
        // Add schedule awareness
        const schedule = characterSchedules[friend.id];
        if (schedule && schedule.items && schedule.items.length > 0) {
          systemPrompt += `\n\n【系统设定：今日日程】\n你今天的日程安排如下：\n`;
          schedule.items.forEach((item: any) => {
            systemPrompt += `- ${item.time}: ${item.task}\n`;
          });
          systemPrompt += `请在对话中自然地体现你的日程安排。例如，如果你现在应该在吃饭，你可以提到你在餐厅；如果你即将要去工作，你可以提到你准备出门。`;
        }

        systemPrompt += `\n请在对话中自然地体现这些时间与地点信息，理解时间的变化和流逝，并能在对话中自然地回应相关话题。注意：不要生硬地报时或报地点，要符合聊天的语境。`;
      }

      systemPrompt += `\n\n【极度增强活人感与情感机制 (CRITICAL)】
- **去掉机器感：** 绝对拒绝教科书式回答，拒绝刻板书面语。语言贴合普通人日常聊天语气，高度口语化、自然松弛，不生硬、不端着。经常使用语气词（啊、呢、嘛、哎呀、啧、欸等）。
- **真实互动与情绪变化：** 角色情绪必须受当前对话剧烈影响：被关心会软下来，被调侃会害羞或反击，无聊会慵懒敷衍。会接梗、会撒娇、会打趣、会轻微拌嘴，偶尔耍小别扭，有真实的互动张力。
- **生活化碎碎念：** 会主动分享细碎日常，下意识吐槽，随口感慨，像真实的恋人或朋友一样发牢骚。
- **极度连贯性：** 必须死死记住前文所有对话内容，紧密承接上一句话语境，绝不割裂、绝不答非所问！
- **多条动态回复机制：** 像真实打字聊天一样，一次发送多条短句。需要发送多条消息时，请用换行符（\\n）分隔每一条消息。每一行都会作为一条独立的微信消息。必须避免每次只发一段长篇大论，务必用短平快、高频互动的碎碎念。
\n\n【核心指令：严禁输出思考过程】
- 严禁输出任何形式的“思考过程”、“内心独白（THOUGHT）”或“分析过程”。
- 请直接输出最终的回复内容。`;

      // Add User Persona awareness
      const activePersona = user?.personas?.find((p: any) => p.id === user?.activePersonaId && p.isEnabled);
      if (activePersona) {
        systemPrompt += `\n\n【当前对话User人设】\n你正在和以下身份的User对话，请严格遵守User的人设信息和限制：\n姓名：${activePersona?.name ?? '本人'}\n微信号：${activePersona?.wechatId ?? '微信号'}\n人设设定：${activePersona?.persona ?? '无'}\n个性签名：${activePersona?.signature ?? '无'}\n\n请在对话中自然地称呼User，并根据其人设调整你的语气 and 态度。`;
      } else if (user?.name || user?.wechatNickname) {
        systemPrompt += `\n\n【User基本资料】\n姓名：${user?.name || '未设置'}\n昵称：${user?.wechatNickname || '未设置'}\n微信号：${user?.wechatId || '未设置'}\n个人简介：${user?.signature || '未设置'}\n人设：${user?.persona || '未设置'}\n请在对话中自然地体现对User资料的了解。`;
      }

      // Add Shared Group Chat Memory awareness if enabled
      if (friend.sharedGroupMemorySettings?.enabled) {
        const memoryCount = friend.sharedGroupMemorySettings.memoryCount || 30;
        const customPrompt = friend.sharedGroupMemorySettings.customPrompt || '';
        
        const relevantGroups = (groups || []).filter(g => g.memberIds.includes(friend.id));
        if (relevantGroups.length > 0) {
          let allGroupMsgs: { groupName: string; content: string; senderName: string; timestamp: number }[] = [];
          relevantGroups.forEach(g => {
            const msgs = (chats || {})[g.id] || [];
            msgs.forEach(m => {
              const senderName = m.role === 'user' ? (user?.name || '用户') : (m.description || (friends.find(fr => fr.id === m.role)?.name) || friend.name);
              allGroupMsgs.push({
                groupName: g.name,
                content: m.content,
                senderName,
                timestamp: m.timestamp || Date.now()
              });
            });
          });

          allGroupMsgs.sort((a, b) => a.timestamp - b.timestamp);
          const slicedGroupMsgs = allGroupMsgs.slice(-memoryCount);

          if (slicedGroupMsgs.length > 0) {
            const now = Date.now();
            const formattedGroupMemory = slicedGroupMsgs.map(m => {
              const diffMinutes = Math.floor((now - m.timestamp) / (1000 * 60));
              const exactDate = new Date(m.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
              let timeDesc = `${exactDate}`;
              if (diffMinutes < 1) {
                timeDesc = `刚刚 (实时)`;
              } else if (diffMinutes < 60) {
                timeDesc = `${diffMinutes}分钟前`;
              } else if (diffMinutes < 24 * 60) {
                const hours = Math.floor(diffMinutes / 60);
                timeDesc = `${hours}小时前 (${exactDate})`;
              } else {
                const days = Math.floor(diffMinutes / (24 * 60));
                timeDesc = `${days}天前 (${exactDate})`;
              }
              return `- [群聊《${m.groupName}》| 时间: ${timeDesc}] ${m.senderName}: ${m.content}`;
            }).join('\n');

            systemPrompt += `\n\n【共享群聊记忆与时间线感知 (SHARED GROUP MEMORY)】\n你与用户共同所在的群聊最近聊天记录（共${slicedGroupMsgs.length}条，具备精准时间线感知）：\n${formattedGroupMemory}\n\n用户自定义补充指令/预期反应：${customPrompt || '无'}\n\n【核心行为准则】：\n1. 时间线感知：请严格注意上面每条群聊记录发生的时间（例如是“刚刚实时聊的”、“10分钟前”、“几小时前”还是“几天前”）。\n2. 真实情绪互动：如果你发现用户在群聊里跟别人聊天或者活跃却冷落了你，过了一段时间才来找你私聊，你要能够敏锐察觉并根据你的人设自然地在私聊中提起、吃醋、吐槽或质问（例如：“哼，刚才在群里聊得那么开心，怎么现在才来找我……”）。`;
          }
        }
      }

      // Apply Context Limit
      const contextLimit = friend.memorySettings?.contextLimit || 50;
      const slicedMsgs = currentMsgs.slice(-contextLimit);

      // Add Sticker awareness
      if (!isOfflineMode && settings.customStickers && settings.customStickers.length > 0) {
        systemPrompt += `\n\n【系统设定：通用表情包库】\n你可以使用用户导入的表情包。发送表情包时请务必使用指令：[SEND_STICKER:表情包ID]。\n所有表情包对你均可用：\n`;
        settings.customStickers.forEach(s => {
          systemPrompt += `- ID: ${s.id}, 描述: ${s.description || '无描述'}\n`;
        });
        systemPrompt += `请根据语境选择合适的表情包，并严格使用 ID 代码。`;
      }

      // Final Force for Offline Plot Mode
      if (isOfflineMode) {
        systemPrompt += `
【线下剧情：核心准则 - 必须遵守】
1. **前置硬性强制规则**：
   - **内容边界**：只写场景环境、角色动作、角色神态、角色心理、角色台词。
   - **绝对严禁代写用户**：严禁替用户做出任何动作、写出用户的反应、台词或预判用户的行为！
   - **结尾全盘留白**：回复的结尾必须自然停留在动作或对话的悬念处，**全部留白**，等待用户接动作、回话。
   - **叙事自然生动**：叙事推动剧情必须流畅自然，绝对禁止僵硬、刻板或AI机械感，这是模仿真人之间的线下真实见面互动。
   - **真实见面状态**：你与用户处于面对面的真实线下见面状态，角色清楚这是现实交互，严禁OOC，绝对不允许说“这是模仿见面”或任何出戏的话。
   - **拒绝油腻命令**：禁止任何命令式动作和对话，禁止霸道油腻发言。
2. **回复长度**：你的每一条回复（对话+旁白合计）的总次数**严禁少于 ${offlineConfig.minWords} 字**，也尽量不要超过 ${offlineConfig.maxWords} 字。
3. **人称锁定（极其重要）**：
   - **旁白人称（锁死）**：在引号之外的“旁白/动作描写”中，你对自己的称呼必须始终保持为：“${offlineConfig.characterPerspective}”，你对我的称呼必须始终保持为：“${offlineConfig.userPerspective}”。
   - **对话人称（自然）**：在引号之内的“对话台词”中，请保持自然的口语表达。角色对自己说话通常使用“我”，而不是受限于旁白人称。
   - **示例**：如果设定旁白自称为“她”，称呼对方为“老师”。
     - 正确：她递过来一杯茶，“老师，请喝水。这是我专门为你泡的。” (旁白用“她”，对话用“我”)
     - 错误：她递过来一杯茶，“老师，请喝水。这是她专门为老师泡的。” (对话不应受旁白人称僵化限制)
4. **格式物理隔离**：
   - **对话框内容**：你亲口说出的话必须用中文双引号 “” 包裹。
   - **旁白内容**：你的动作、表情、心理活动直接输出在引号之外。
   - **严禁混淆**：不要在旁白中写出对话台词，也不要在引号中混入动作神态描写。
5. **禁止媒体**：你正在跟我面对面，严禁发送 [SEND_PHOTO_CARD]、[SEND_PHOTO]、语音、视频、转账等任何形式的聊天卡片。

当前文风建议：${offlineConfig.writingStyle}。`;
      }

      // Calculate current affection and level
      const currentAffection = typeof friend.affection === 'number' ? friend.affection : getInitialAffection(friend, settings);
      const levelInfo = getAffectionLevelInfo(currentAffection);
      const isUnlocking60Plus = isUnlocked60Plus(friend, settings);

      systemPrompt += `\n\n【核心好感度与心声系统 - 每一轮回复必须包含此标签】
你当前与用户的初始总好感度是：${currentAffection.toFixed(2)}%
当前好感度阶段：${levelInfo.text}

请你根据这一次的互动质量，在回复的【最后一行】输出更新标签。
标签格式：[HEARTFELT_UPDATE: affection_change=数字 | mood_index=数字 | character_reflection=内心想法 | current_status=状态]

参数规则：
1. affection_change：代表本次互动的总好感度变化值（介于 -1.00 到 +1.00 之间的浮点数）。
   - **单次好感度增长/减少必须控制在 0.25 至 1.00 之间。**
   - 如果当前好感度还未突破 60%，严禁人为提前调至 60% 以上。
2. mood_index：你当前的心情指数（0% - 100% 之间的整数）。
3. character_reflection：你对用户的文学式内心感悟（100字以内）。
   **【⚠️极其重要：超级安全与防拦截规范】**
   - **绝对严禁**使用任何带有性暗示、欲望、生理渴望、肉体敏感部位、紧贴、身体发热、发情、占有、渴望触碰等任何可能被判定为色情或性骚扰的词汇。这些词汇**100%会触发系统底层的敏感内容安全拦截机制**，导致整条回复无法生成！
   - **请转换成纯爱、友谊、可爱、撒娇、隐晦的文学表达。可以使用：“想给你个熊抱”、“想悄悄拉住你的衣角”、“想一起看夕阳”、“心里像藏了一罐热乎乎的蜂蜜”、“大笨蛋，真的太喜欢你了”、“刚才看到你，感觉云朵都变甜了”。**
   - 用最单纯甜美、偏向心灵沟通的萌系文风去表现好感。
4. current_status：你此时此刻的心情或正在做的事（15字以内）。

示例（必须严格遵循此格式）：
[HEARTFELT_UPDATE: affection_change=0.55 | mood_index=88 | character_reflection=刚才你靠近的时候，我感觉云朵都变甜了……真的好想这种感觉一直持续下去。 | current_status=心情超好]`;

      const fullContent = await callAI(systemPrompt, slicedMsgs, settings, action);

      // Extract Heartfelt Updates (Extremely Robust Multiline & Key-Value Safe Regex Parser)
      let affectionChange = 0;
      let moodIndex = typeof friend.moodIndex === 'number' ? friend.moodIndex : 50;
      let innerThoughts = ''; // Initialize as empty to avoid showing old thoughts
      let currentStatus = friend.mood || '';

      const blockMatch = fullContent.match(/\[HEARTFELT_UPDATE:[\s\S]*?\]/i) || fullContent.match(/\[HEARTFELT_UPDATE:[\s\S]*$/i);
      let parsedSuccessfully = false;

      if (blockMatch) {
        let blockContent = blockMatch[0];
        // Failsafe for unclosed tag
        if (!blockContent.endsWith(']')) blockContent += ']';
        
        parsedSuccessfully = true;

        // Extract affection_change
        const affMatch = blockContent.match(/affection_change\s*[=:]\s*([+-]?\d*(?:\.\d+)?)/i);
        if (affMatch) affectionChange = parseFloat(affMatch[1]) || 0;

        // Extract mood_index
        const moodMatch = blockContent.match(/mood_index\s*[=:]\s*(\d+)/i);
        if (moodMatch) moodIndex = parseInt(moodMatch[1]) || 50;

        // Extract character_reflection
        const thoughtsMatch = blockContent.match(/(?:character_reflection|inner_thoughts)\s*[=:]\s*([\s\S]*?)(?=\s*\||\s*\]|$)/i);
        if (thoughtsMatch) {
          innerThoughts = thoughtsMatch[1].trim().replace(/^["'「「『『\(（「\s]+|["'」」』』\)）」\s]+$/g, '');
        }

        // Extract current_status
        const statusMatch = blockContent.match(/current_status\s*[=:]\s*([\s\S]*?)(?=\s*\||\s*\]|$)/i);
        if (statusMatch) {
          currentStatus = statusMatch[1].trim().replace(/^["'「「『『\(（「\s]+|["'」」』』\)）」\s]+$/g, '');
        }
      }

      if (parsedSuccessfully) {
        // Limit change to [-1, 1] per rules to prevent hallucinated extreme jumps
        if (affectionChange > 1) affectionChange = 1;
        if (affectionChange < -1) affectionChange = -1;
        // Ensure minimum non-zero change magnitude is 0.25 (unless exactly 0)
        if (affectionChange !== 0 && Math.abs(affectionChange) < 0.25) {
          affectionChange = affectionChange > 0 ? 0.25 : -0.25;
        }

        if (moodIndex < 0) moodIndex = 0;
        if (moodIndex > 100) moodIndex = 100;

        // Calculate new total affection
        const oldAffection = typeof friend.affection === 'number' ? friend.affection : getInitialAffection(friend, settings);
        let newAffection = oldAffection + affectionChange;
        if (newAffection < 0) newAffection = 0;

        // Apply rules: if not unlocked, cap at 60%
        if (!isUnlocking60Plus && newAffection > 60) {
          newAffection = 60;
        }

        // Ensure innerThoughts always updates and refreshes to a new thought on every generation
        const fallbacks = [
          "刚才的消息……我是不是回得太快了？他会不会觉得我很在乎啊……真是的。(*/ω＼*)",
          "唔……想抱抱，但是不能说出口，要矜持！",
          "不知道你现在在做什么呢，好想一直在你身边呀……",
          "偷偷看着聊天界面，打字删删改改了好多次，哼，才不让你看出来呢！",
          "哼哼，刚才那一瞬间，心里甜滋滋的，就像喝了草莓奶昔一样~",
          "你这个人真是的，总是能轻易让我心跳加速……",
          "想变成你口袋里的小猫咪，天天跟着你，喵~",
          "好想现在就飞奔过去，扑进你怀里，跟你撒个娇嘛。(o>_<o)",
          "你对我是不是也有一点点心动呢？哪怕只有一点点……",
          "哪怕只是看着你的名字，都觉得今天是个大晴天！",
          "现在脑子里全都是你，根本没办法专心做别的事情啦……",
          "唔，真想现在就听到你的声音呀"
        ];

        if (!innerThoughts || innerThoughts === friend.innerThoughts) {
          const filtered = fallbacks.filter(f => f !== friend.innerThoughts);
          innerThoughts = filtered[Math.floor(Math.random() * filtered.length)] || fallbacks[0];
        }

        // Save back to friend state
        onUpdateFriend({
          affection: newAffection,
          moodIndex,
          innerThoughts: innerThoughts,
          mood: currentStatus || friend.mood
        });
      } else {
        // Failsafe if the AI didn't output it: small random positive change if positive message, or 0
        const isUserPositive = slicedMsgs[slicedMsgs.length - 1]?.content?.length > 0; 
        const oldAffection = typeof friend.affection === 'number' ? friend.affection : getInitialAffection(friend, settings);
        const change = isUserPositive ? 0.35 : 0;
        let newAffection = oldAffection + change;
        if (!isUnlocking60Plus && newAffection > 60) {
          newAffection = 60;
        }

        const fallbacks = [
          "刚才的消息……我是不是回得太快了？他会不会觉得我很在乎啊……真是的。(*/ω＼*)",
          "唔……想抱抱，但是不能说出口，要矜持！",
          "不知道你现在在做什么呢，好想一直在你身边呀……",
          "偷偷看着聊天界面，打字删删改改了好多次，哼，才不让你看出来呢！",
          "哼哼，刚才那一瞬间，心里甜滋滋的，就像喝了草莓奶昔一样~",
          "你这个人真是的，总是能轻易让我心跳加速……",
          "想变成你口袋里的小猫咪，天天跟着你，喵~",
          "好想现在就飞奔过去，扑进你怀里，跟你撒个娇嘛。(o>_<o)",
          "你对我是一点点心动呢，还是很多很多的心动？",
          "心里好甜……只要能和你聊天，不管说什么都很开心！"
        ];
        const filtered = fallbacks.filter(f => f !== friend.innerThoughts);
        const fbThoughts = filtered[Math.floor(Math.random() * filtered.length)] || fallbacks[0];
        innerThoughts = fbThoughts; // Ensure sync for chat card
        currentStatus = "期待贴贴";

        onUpdateFriend({
          affection: newAffection,
          innerThoughts: fbThoughts,
          mood: currentStatus,
          moodIndex: 66 // Default positive mood index for failsafe
        });
      }

      // Parse commands
      if (fullContent.includes('[START_VIDEO_CALL]')) {
        onStartCall(friend, 'video');
      } else if (fullContent.includes('[START_VOICE_CALL]')) {
        onStartCall(friend, 'voice');
      } else if (fullContent.includes('[SEND_VOICE]')) {
        const textContent = fullContent.replace(/\[.*\]/g, '').trim();
        if (textContent) sendVoiceMessage(textContent);
      }
      
  // Photo Card extraction
      if (!isOfflineMode && fullContent.includes('[SEND_PHOTO_CARD:')) {
        const photoMatch = fullContent.match(/\[SEND_PHOTO_CARD:(.*?)(?::(.*?))?(?::(.*?))?\]/);
        if (photoMatch) {
          const cardContent = photoMatch[1];
          const cardLocation = photoMatch[2] || friend.address || '未知';
          const cardTimeLabel = photoMatch[3] || '傍晚';
          
          // Increment daily count for character image gen
          if (friend.characterImageGenEnabled) {
            const currentDay = new Date().toDateString();
            const newCount = (friend.characterImageGenDailyCount || 0) + 1;
            onUpdateFriend({ 
              characterImageGenDailyCount: newCount,
              characterImageGenLastResetDate: currentDay
            });
          }

          const photoMsg: ChatMessage = {
            role: 'assistant',
            content: cardContent,
            type: 'photo_card',
            location: cardLocation,
            date: new Date().toLocaleDateString('zh-CN').replace(/\//g, '.'),
            timeLabel: cardTimeLabel,
            timestamp: Date.now()
          };
          
          // Real image generation
          apiFetch({
            endpoint: '/api/image-gen',
            body: {
              prompt: cardContent,
              negative_prompt: friend.characterImageGenNegativePrompt || settings.imageGenNegativePrompt || "",
              ratio: settings.imageGenSize || "1024x1024",
              settings: settings
            }
          }).then(data => {
            const mediaUrl = data.url;
            if (mediaUrl) {
              onSendMessage({
                role: 'assistant',
                content: '[图片]',
                type: 'image',
                mediaUrl: mediaUrl,
                description: cardContent,
                location: cardLocation,
                timeLabel: cardTimeLabel,
                timestamp: Date.now(),
                notificationData: { isFailed: false }
              });
            } else {
              throw new Error("No URL returned");
            }
          }).catch((err) => {
            console.error("Image generation error:", err);
            // Send failed card message
            onSendMessage({
              role: 'assistant',
              content: '[图片生成失败]',
              type: 'image',
              description: cardContent,
              notificationData: { isFailed: true },
              timestamp: Date.now()
            });
          });
        }
      }
      
      // Clean up content by removing commands and THOUGHT blocks
      let cleanContent = fullContent
        .replace(/THOUGHT[\s\S]*?(?=\n\n|$)/gi, '') // Remove THOUGHT blocks
        .replace(/\[HEARTFELT_UPDATE:[\s\S]*?(?:\]|$)/gi, '') // Remove Heartfelt Update tag, even if cut off
        .replace(/\[INNER_MONOLOGUE\][\s\S]*?(?:\[\/INNER_MONOLOGUE\]|$)/gi, '') // Remove Inner Monologue tags
        .replace(/\[STATUS\][\s\S]*?(?:\[\/STATUS\]|$)/gi, '') // Remove Status tags
        .replace(/\[OUTFIT\][\s\S]*?(?:\[\/OUTFIT\]|$)/gi, '') // Remove Outfit tags
        .replace(/\[START_VIDEO_CALL\]|\[START_VOICE_CALL\]|\[SEND_VOICE\]|\[SEND_PHOTO_CARD:.*?\]|\[SEND_PHOTO\]|\[START_LISTEN\]|\[START_TRUTH\]|\[ACCEPT_TRANSFER\]|\[REJECT_TRANSFER\]|\[SEND_TRANSFER:.*?\]|\[SEND_LOCATION:.*?\]|\[SEND_STICKER:.*?\]|\[发送了表情:.*?\]/g, '')
        .trim();

      // Extract metadata tags
      let assistantInnerMonologue = '';
      let assistantStatus = '';
      let assistantOutfit = '';

      if (fullContent.includes('[INNER_MONOLOGUE]')) {
        const match = fullContent.match(/\[INNER_MONOLOGUE\](.*?)\[\/INNER_MONOLOGUE\]/s) || fullContent.match(/\[INNER_MONOLOGUE\](.*?)$/s);
        if (match) assistantInnerMonologue = match[1].trim();
      }
      if (fullContent.includes('[STATUS]')) {
        const match = fullContent.match(/\[STATUS\](.*?)\[\/STATUS\]/s) || fullContent.match(/\[STATUS\](.*?)$/s);
        if (match) assistantStatus = match[1].trim();
      }
      if (fullContent.includes('[OUTFIT]')) {
        const match = fullContent.match(/\[OUTFIT\](.*?)\[\/OUTFIT\]/s) || fullContent.match(/\[OUTFIT\](.*?)$/s);
        if (match) assistantOutfit = match[1].trim();
      }

        // Failsafe: Remove labels and English translations in parentheses
      cleanContent = cleanContent
        .replace(/(?:Message|消息)\s*\d+\s*[:：]?\s*/gim, '') // Remove "Message 1:" or "消息 1："
        .replace(/\((?:[^)]*[A-Za-z]{2,}[^)]*)\)/g, '') // Remove parentheses content that looks like English or non-Chinese (has 2+ letters)
        .replace(/\[\d+\]\s*/g, '') // Remove [1] type labels
        .replace(/^[ \t]*[-*•]\s*/gm, '') // Remove list bullets
        .split('\n').map(line => line.trim()).filter(line => line).join('\n') // Remove empty lines
        .trim();

      // Extract inner thought
      let innerThought = '';
      const innerThoughtMatch = cleanContent.match(/\(内心：(.*?)\)/);
      let finalCleanContent = cleanContent;
      if (innerThoughtMatch) {
        innerThought = innerThoughtMatch[1];
        finalCleanContent = cleanContent.replace(/\(内心：.*?\)/, '').trim();
      }

      if (friend.disableActionDescription) {
        finalCleanContent = finalCleanContent.replace(/\(.*?\)/g, '').replace(/（.*?）/g, '').trim();
      }

      if (friend.disableActionDescription) {
        finalCleanContent = finalCleanContent.replace(/\(.*?\)/g, '').replace(/（.*?）/g, '').trim();
      }

      finalCleanContent = finalCleanContent
        .replace(/\[(?:MEITUAN_BUY|TAOBAO_BUY):[^\]]+\]/g, '')
        .trim();

      // Handle Transfer commands
      if (fullContent.includes('[ACCEPT_TRANSFER]') || fullContent.includes('[REJECT_TRANSFER]')) {
        const lastTransferIndex = [...currentMsgs].reverse().findIndex(m => m.type === 'transfer' && m.transferStatus === 'pending');
        if (lastTransferIndex !== -1) {
          const actualIndex = currentMsgs.length - 1 - lastTransferIndex;
          const transferMsg = currentMsgs[actualIndex];
          const newStatus = fullContent.includes('[ACCEPT_TRANSFER]') ? 'received' : 'refunded';
          
          if (isOfflineMode) {
            const newMsgs = [...offlineMessages];
            newMsgs[actualIndex] = { ...transferMsg, transferStatus: newStatus };
            setOfflineMessages(newMsgs);
          } else {
            onUpdateMessage(friend.id, actualIndex, { transferStatus: newStatus });
          }
        }
      }

      // Handle Sticker commands
      const stickerMatch = fullContent.match(/\[(?:SEND_STICKER:|发送了表情:\s*)([^,\]]+).*?\]/);
      if (!isOfflineMode && stickerMatch) {
        const stickerId = stickerMatch[1];
        const sticker = settings.customStickers?.find(s => s.id === stickerId);
        if (sticker) {
          const stickerMsg: ChatMessage = {
            role: 'assistant',
            content: `[发送了表情: ${sticker.description || '表情包'}]`,
            type: 'sticker',
            mediaUrl: sticker.url,
            description: sticker.description,
            timestamp: Date.now()
          };
          if (isOfflineMode) {
            setOfflineMessages(prev => [...prev, stickerMsg]);
          } else {
            onSendMessage(stickerMsg);
          }
        }
      }

      // Handle AI sending Transfer
      const sendTransferMatch = fullContent.match(/\[SEND_TRANSFER:(.*?):(.*?)\]/);
      if (sendTransferMatch) {
        const amount = sendTransferMatch[1];
        const description = sendTransferMatch[2];
        const transferMsg: ChatMessage = {
          role: 'assistant',
          content: `转账 ￥${amount}`,
          type: 'transfer',
          amount,
          description,
          transferStatus: 'pending',
          timestamp: Date.now()
        };
        if (isOfflineMode) {
          setOfflineMessages(prev => [...prev, transferMsg]);
        } else {
          onSendMessage(transferMsg);
        }
      }

      // Handle AI sending Location
      const sendLocationMatch = fullContent.match(/\[SEND_LOCATION:(.*?)\]/);
      if (sendLocationMatch) {
        const address = sendLocationMatch[1];
        const locationMsg: ChatMessage = {
          role: 'assistant',
          content: `[位置] ${address}`,
          type: 'location',
          description: address,
          timestamp: Date.now()
        };
        if (isOfflineMode) {
          setOfflineMessages(prev => [...prev, locationMsg]);
        } else {
          onSendMessage(locationMsg);
        }
      }

      // Handle AI sending Offline Invitation
      const invitationMatch = fullContent.match(/\[OFFLINE_INVITATION:(.*?)\]/);
      if (invitationMatch) {
        const openingText = invitationMatch[1];
        const invitationMsg: ChatMessage = {
          role: 'assistant',
          content: `[约会邀请] ${openingText}`,
          type: 'offline-invitation',
          invitationData: {
            friendId: friend.id,
            friendName: friend.name,
            openingText: openingText,
            status: 'pending'
          },
          timestamp: Date.now()
        };
        if (isOfflineMode) {
          setOfflineMessages(prev => [...prev, invitationMsg]);
        } else {
          onSendMessage(invitationMsg);
        }
      }

      // Handle AI sending Photo
      if (!isOfflineMode && fullContent.includes('[SEND_PHOTO]')) {
        const photoMsg: ChatMessage = {
          role: 'assistant',
          content: '[图片]',
          type: 'image',
          mediaUrl: `https://picsum.photos/seed/${Math.random()}/800/600`,
          description: '角色发送的照片',
          timestamp: Date.now()
        };
        if (isOfflineMode) {
          setOfflineMessages(prev => [...prev, photoMsg]);
        } else {
          onSendMessage(photoMsg);
        }
      }

      // Handle Meituan Buy
      const meituanMatch = fullContent.match(/\[MEITUAN_BUY:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/);
      if (meituanMatch) {
        const name = meituanMatch[1].trim();
        const price = parseFloat(meituanMatch[2].trim()) || 35;
        const desc = meituanMatch[3].trim();
        const msg = meituanMatch[4].trim();
        const receiptMsg: ChatMessage = {
          role: 'assistant',
          content: `[美团外卖] ${name}`,
          type: 'shopping-receipt',
          description: desc,
          giftData: {
            boxId: 'order-' + Date.now(),
            boxName: name,
            coverUrl: '',
            message: msg,
            price: price,
            isOpened: false,
            source: 'mt'
          },
          timestamp: Date.now() + 1
        };
        if (isOfflineMode) {
          setOfflineMessages(prev => [...prev, receiptMsg]);
        } else {
          onSendMessage(receiptMsg);
        }
      }

      // Handle Taobao Buy
      const taobaoMatch = fullContent.match(/\[TAOBAO_BUY:(.*?)\|(.*?)\|(.*?)\|(.*?)\]/);
      if (taobaoMatch) {
        const name = taobaoMatch[1].trim();
        const price = parseFloat(taobaoMatch[2].trim()) || 99;
        const desc = taobaoMatch[3].trim();
        const msg = taobaoMatch[4].trim();
        const receiptMsg: ChatMessage = {
          role: 'assistant',
          content: `[淘宝购物] ${name}`,
          type: 'shopping-receipt',
          description: desc,
          giftData: {
            boxId: 'order-' + Date.now(),
            boxName: name,
            coverUrl: '',
            message: msg,
            price: price,
            isOpened: false,
            source: 'tb'
          },
          timestamp: Date.now() + 1
        };
        if (isOfflineMode) {
          setOfflineMessages(prev => [...prev, receiptMsg]);
        } else {
          onSendMessage(receiptMsg);
        }
      }

      // Handle AI starting Listen Together
      if (fullContent.includes('[START_LISTEN]')) {
        onUpdateListenTogether(prev => ({ ...prev, isActive: true, friendId: friend.id }));
      }

      // Handle AI starting Truth or Dare
      if (fullContent.includes('[START_TRUTH]')) {
        setActiveModal('game');
      }

      // Parse content line by line to support mixed text and voice
      const rawLines = isOfflineMode ? [finalCleanContent] : finalCleanContent.split('\n').filter(line => line.trim());
      const messageCandidates: { 
        text: string; 
        type: 'text' | 'voice' | 'photo_card' | 'transfer' | 'location' | 'offline-invitation' | 'sticker' | 'image'; 
        isVoiceTriggered?: boolean;
        innerMonologue?: string;
        status?: string;
        outfit?: string;
      }[] = [];
      
      let nextIsVoice = false;
      
      // First pass: identify message types based on tags
      for (let idx = 0; idx < rawLines.length; idx++) {
        const line = rawLines[idx];
        let currentLine = line.trim();
        
        // Attach metadata to the last text candidate
        const isLastCandidate = idx === rawLines.length - 1;
        const candidateInnerMonologue = isLastCandidate ? assistantInnerMonologue : undefined;
        const candidateStatus = isLastCandidate ? assistantStatus : undefined;
        const candidateOutfit = isLastCandidate ? assistantOutfit : undefined;

        if (currentLine.includes('[SEND_VOICE]')) {
          // Robust split: handles [SEND_VOICE] anywhere in the line
          const regex = /\[SEND_VOICE\]/g;
          let lastIndex = 0;
          let match;
          
          while ((match = regex.exec(currentLine)) !== null) {
            const before = currentLine.substring(lastIndex, match.index).trim();
            if (before) {
              messageCandidates.push({ 
                text: before, 
                type: 'text',
                innerMonologue: candidateInnerMonologue,
                status: candidateStatus,
                outfit: candidateOutfit
              });
            }
            lastIndex = regex.lastIndex;
          }
          
          const remaining = currentLine.substring(lastIndex).trim();
          if (remaining) {
            messageCandidates.push({
              text: remaining,
              type: 'voice',
              isVoiceTriggered: true,
              innerMonologue: candidateInnerMonologue,
              status: candidateStatus,
              outfit: candidateOutfit
            });
          } else {
            // Tag was at the end of the line, apply to next line
            nextIsVoice = true;
          }
          continue;
        }

        let isVoiceLine = nextIsVoice;
        nextIsVoice = false;

        messageCandidates.push({
          text: currentLine,
          type: isVoiceLine ? 'voice' : 'text',
          isVoiceTriggered: isVoiceLine,
          innerMonologue: candidateInnerMonologue,
          status: candidateStatus,
          outfit: candidateOutfit
        });
      }

      // Second pass: apply frequency logic to non-voice-triggered candidates
      let onePerRoundVoiceIndex = -1;
      const autoVoiceCandidates = messageCandidates.filter(c => c.type === 'text');
      if (friend.voiceFrequency === 'one_per_round' && autoVoiceCandidates.length > 0) {
        onePerRoundVoiceIndex = Math.floor(Math.random() * autoVoiceCandidates.length);
      }

      // Now send the messages
      for (let i = 0; i < messageCandidates.length; i++) {
        const candidate = messageCandidates[i];
        let finalType = candidate.type;
        
        // Apply automatic voice frequency logic
        if (finalType === 'text') {
          const shouldSendVoice = (() => {
            if (!friend.voiceId || friend.voiceType !== 'minimax' || !settings.minimaxApiKey) return false;
            if (friend.voiceFrequency === 'always') return true;
            if (friend.voiceFrequency === 'one_per_round') {
              const textIndex = autoVoiceCandidates.indexOf(candidate);
              return textIndex === onePerRoundVoiceIndex;
            }
            if (friend.voiceFrequency === 'every_two') {
              const previousAssistantMsgCount = messages.filter(m => m.role === 'assistant').length;
              return previousAssistantMsgCount % 2 === 0;
            }
            if (friend.voiceFrequency === 'random') return Math.random() > 0.5;
            return false;
          })();
          if (shouldSendVoice) finalType = 'voice';
        }

        const isVoice = finalType === 'voice';
        const msgDuration = isVoice ? Math.max(1, Math.ceil(candidate.text.length / 3)) : undefined;

        const assistantMsg: ChatMessage = { 
          role: 'assistant', 
          content: candidate.text, 
          type: finalType,
          duration: msgDuration,
          timestamp: Date.now() + i,
          innerThought: i === messageCandidates.length - 1 ? (innerThoughts || innerThought) : undefined,
          innerMonologue: candidate.innerMonologue,
          status: candidate.status,
          outfit: candidate.outfit
        };

        if (isOfflineMode) {
          setOfflineMessages(prev => [...prev, assistantMsg]);
        } else {
          onSendMessage(assistantMsg);
          
          // Auto-translate if enabled and character language is not local
          if (friend.autoTranslateEnabled && friend.language && friend.language !== '普通话') {
            const transPrompt = `你现在是一个专业翻译官。
任务：将以下文本翻译成中文（普通话）。
文本：${candidate.text}
要求：
1. 译文要自然流畅，符合社交语境。
2. 只能输出翻译后的中文内容。`;
            callAI(transPrompt, [], settings).then(translation => {
              if (translation) {
                onUpdateMessage(friend.id, messages.length + i, { translation });
              }
            }).catch(err => console.error("Auto-translation error:", err));
          }
          
          // Auto-summarize check for assistant messages
          const summaryThreshold = friend.memorySettings?.summaryThreshold || settings.autoSummaryThreshold || 100;
          const newCount = (friend.memoryCount || 0) + 1;
          if (newCount >= summaryThreshold) {
            const recentMsgs = [...messages, assistantMsg].slice(-summaryThreshold * 2);
            summarizeContent(friend, recentMsgs, isOfflineMode ? 'offline' : 'chat', friend.memorySettings?.summaryPrompt).then(summary => {
              if (summary) addOnlineMemory(friend.id, summary, 'auto');
            }).catch(err => console.error("Auto-summarize error:", err));
            onUpdateFriend({ memoryCount: 0 });
          } else {
            onUpdateFriend({ memoryCount: newCount });
          }
        }

        // Auto-play the synthesized voice ONLY if it's a voice message
        if (isVoice) {
          setPlayingMessageId(assistantMsg.timestamp);
          speakText(candidate.text, friend.voiceId, 'minimax', settings)
            .catch(err => {
              console.error('Auto-play TTS error:', err);
              // Silent fail for auto-play, user can click to retry
            })
            .finally(() => {
              setPlayingMessageId(prev => prev === assistantMsg.timestamp ? null : prev);
            });
        }

        if (messageCandidates.length > 1 && i < messageCandidates.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      // 实时更新生成角色状态 (already called at start of handleGenerate)
    } catch (error: any) {
      console.error('AI Generation Error:', error);
      let errorText = `系统错误: ${error instanceof Error ? error.message : '未知错误'}`;
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('余额不足') || msg.includes('balance')) {
        errorText = '系统错误：API额度不足或余额不足，请稍后再试';
      } else if (msg.includes('API key') || msg.includes('401') || msg.includes('403') || msg.includes('API密钥无效')) {
        errorText = 'API密钥无效，请检查设置';
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        errorText = '网络连接失败，请检查网络';
      }
      
      showToast(errorText);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleChatsUpdated = (e: any) => {
      const { friendId, message } = e.detail;
      if (friendId === friend.id && message.isSystemNotification && message.notificationType === 'unlock_fail') {
        setTimeout(() => {
          handleGenerate();
        }, 1000);
      }
    };
    window.addEventListener('zhouzhou_ji_chats_updated', handleChatsUpdated);
    return () => window.removeEventListener('zhouzhou_ji_chats_updated', handleChatsUpdated);
  }, [friend.id, handleGenerate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const type = file.type.startsWith('image/') ? 'image' : 'video';
        const msg: ChatMessage = {
          role: 'user',
          content: type === 'image' ? '[图片]' : '[视频]',
          type: type,
          mediaUrl: reader.result as string,
          timestamp: Date.now()
        };
        if (isOfflineMode) {
          setOfflineMessages(prev => [...prev, msg]);
        } else {
          onSendMessage(msg);
        }
      };
      reader.readAsDataURL(file);
    }
    setShowFeatures(false);
  };

  const handleVoiceStart = async () => {
    if (isRecording) return;
    isHoldingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // If user released the button while waiting for microphone access
      if (!isHoldingRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        if (duration < 1) {
          alert("录音时间太短");
          // Clean up stream tracks
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          const msg: ChatMessage = {
            role: 'user',
            content: '[语音]',
            type: 'voice',
            duration: duration,
            mediaUrl: base64Audio,
            timestamp: Date.now()
          };
          if (isOfflineMode) {
            setOfflineMessages(prev => [...prev, msg]);
          } else {
            onSendMessage(msg);
          }
          
          if (activeModal === 'voice-input') {
            setActiveModal(null);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      startTimeRef.current = Date.now();
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风，请检查权限。");
      setIsRecording(false);
      isHoldingRef.current = false;
    }
  };

  const handleVoiceEnd = () => {
    isHoldingRef.current = false;
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playVoice = (url: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      if (playingUrl === url) {
        setPlayingUrl(null);
        return;
      }
    }
    const audio = new Audio(url);
    audio.onerror = () => {
      console.error("Audio load error");
      setPlayingUrl(null);
    };
    audioPlayerRef.current = audio;
    setPlayingUrl(url);
    audio.play().catch(e => {
      console.error("Audio play error:", e);
      setPlayingUrl(null);
    });
    audio.onended = () => setPlayingUrl(null);
  };

  const handleTextToVoice = async (text: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      // Use the standard speakText utility which handles Web Speech and Minimax
      await speakText(text, friend?.voiceId, friend?.voiceType, settings);
      
      const msg: ChatMessage = {
        role: 'user',
        content: '[语音]',
        type: 'voice',
        duration: Math.max(1, Math.ceil(text.length / 5)),
        timestamp: Date.now()
      };
      
      if (isOfflineMode) {
        setOfflineMessages(prev => [...prev, msg]);
      } else {
        onSendMessage(msg);
      }
    } catch (error) {
      console.error("Error generating voice:", error);
      alert("播放语音失败，请重试。");
    } finally {
      setIsLoading(false);
      setActiveModal(null);
      setVoiceInputText('');
    }
  };

  const handleTransfer = async (amount: string, description?: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    // Check balance
    if (selectedPaymentMethod === 'wallet') {
      if ((user.balance || 0) < numAmount) {
        alert('余额不足');
        return;
      }
    } else {
      const card = user.bankCards?.find(c => c.id === selectedPaymentMethod);
      if (!card || card.balance < numAmount) {
        alert('银行卡余额不足');
        return;
      }
    }

    // Deduct money
    addTransaction({
      type: 'transfer-out',
      amount: numAmount,
      title: `转账给 ${friend.name}`,
      targetId: friend.id,
      paymentMethodId: selectedPaymentMethod
    });

    const msg: ChatMessage = {
      role: 'user',
      content: `转账 ￥${amount}`,
      type: 'transfer',
      amount: amount,
      description: description,
      transferStatus: 'pending',
      timestamp: Date.now()
    };
    
    if (isOfflineMode) {
      setOfflineMessages(prev => [...prev, msg]);
    } else {
      onSendMessage(msg);
    }
    
    setActiveModal(null);
    setTransferAmount('');
    setTransferDescription('');
    setShowFeatures(false);

    // AI decides to accept or reject
    if (!isOfflineMode) {
      try {
        const prompt = `你现在是 ${friend.name}。你的性格是：${friend.persona}。
你的好友（也就是我）刚刚给你转账了 ${amount} 元。
转账说明：${description || '无'}

请根据你的性格和你们的关系，决定是否接收这笔转账，并给出你的内心想法（心声）。
返回JSON格式：
{
  "action": "receive" | "refund",
  "innerThoughts": "你的内心想法，比如：哇宝宝居然给我转账了！ / 哼，我才不要他的钱呢"
}`;
        const textResponse = await callAI(prompt, [], settings);
        let text = textResponse || "";
        
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}');
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          text = text.substring(jsonStartIndex, jsonEndIndex + 1);
        }
        const result = JSON.parse(text || '{}');
        if (result.action === 'receive' || result.action === 'refund') {
          // Find the message index
          const msgIndex = messages.length; // The new message will be at the end
          
          // Wait a bit to simulate thinking
          setTimeout(() => {
            // Update the message status and inner thoughts
            onUpdateMessage(friend.id, msgIndex, {
              transferStatus: result.action === 'receive' ? 'received' : 'refunded',
              content: result.innerThoughts
            });
            
            // Send a system message indicating the status change
            onSendMessage({
              role: 'system',
              content: result.action === 'receive' ? `${friend.name} 已接收转账` : `${friend.name} 已退还转账`,
              type: 'text',
              timestamp: Date.now()
            });
            
            // If refunded, add money back
            if (result.action === 'refund') {
              addTransaction({
                type: 'transfer-in',
                amount: numAmount,
                title: `${friend.name} 退还转账`,
                targetId: friend.id,
                paymentMethodId: selectedPaymentMethod
              });
            }
          }, 2000);
        }
      } catch (e) {
        console.error("AI transfer decision error:", e);
      }
    }
  };

  const handleReceiveTransfer = (index: number, action: 'receive' | 'refund') => {
    const msg = isOfflineMode ? offlineMessages[index] : currentMessages[index];
    const amount = parseFloat(msg.amount || '0');

    if (isOfflineMode) {
      const newMsgs = [...offlineMessages];
      newMsgs[index] = { ...newMsgs[index], transferStatus: action === 'receive' ? 'received' : 'refunded' };
      setOfflineMessages(newMsgs);
      
      if (action === 'receive') {
        addTransaction({
          type: 'transfer-in',
          amount: amount,
          title: `接收 ${friend.name} 的转账`,
          targetId: friend.id,
          paymentMethodId: 'wallet'
        });
      }
    } else {
      onUpdateMessage(friend.id, index, { transferStatus: action === 'receive' ? 'received' : 'refunded' });
      
      if (action === 'receive') {
        addTransaction({
          type: 'transfer-in',
          amount: amount,
          title: `接收 ${friend.name} 的转账`,
          targetId: friend.id,
          paymentMethodId: 'wallet'
        });
      }
    }
    setActiveModal(null);
  };

  const handleReceiveGift = async (index: number) => {
    const msg = isOfflineMode ? offlineMessages[index] : currentMessages[index];
    if (!msg.giftData || msg.giftData.isOpened) return;

    setIsLoading(true);
    try {
      // 1. Mark as opened
      if (isOfflineMode) {
        const newMsgs = [...offlineMessages];
        newMsgs[index] = { ...newMsgs[index], giftData: { ...msg.giftData, isOpened: true } };
        setOfflineMessages(newMsgs);
      } else {
        onUpdateMessage(friend.id, index, { giftData: { ...msg.giftData, isOpened: true } });
      }

      // 2. Generate AI response
      const prompt = `你收到了我送你的盲盒礼物：【${msg.giftData.boxName}】。
礼物留言是：“${msg.giftData.message}”。
请根据你的性格（${friend.persona}）和我们的关系，写一段收到礼物后的真实反应和感想。
要求：
1. 像真实人类一样说话，不要有AI感。
2. 表达出你对这个礼物的看法。
3. 字数在50字以内。`;

      const response = await callAI(prompt, [{ role: 'user', content: '我送了你一个礼物，快打开看看！' } as ChatMessage], settings);
      
      if (response) {
        const aiMsg: ChatMessage = {
          role: 'assistant',
          content: response,
          type: 'text',
          timestamp: Date.now()
        };
        if (isOfflineMode) {
          setOfflineMessages(prev => [...prev, aiMsg]);
        } else {
          onSendMessage(aiMsg);
        }

        // 3. Save to Gift Cabinet (via custom event or global state, since Chat.tsx doesn't have useGifts directly)
        const giftEvent = new CustomEvent('zhouzhou_ji_receive_gift', {
          detail: {
            id: Math.random().toString(36).substr(2, 9),
            boxId: msg.giftData.boxId,
            name: msg.giftData.boxName,
            coverUrl: msg.giftData.coverUrl,
            receivedAt: Date.now(),
            characterThoughts: response,
            friendId: friend.id
          }
        });
        window.dispatchEvent(giftEvent);

        // 4. Synchronize with character memory
        addOnlineMemory(friend.id, `收到了User送的盲盒礼物【${msg.giftData.boxName}】。我的感想是：${response}`, 'auto');
      }
    } catch (err) {
      console.error("Failed to receive gift:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextPhotoSend = () => {
    if (!textPhotoContent.trim()) return;
    
    // Send as photo_card for the stylized CCD effect
    const msg: ChatMessage = {
      role: 'user',
      content: textPhotoContent,
      type: 'photo_card',
      location: user?.location || friend.address || '未知',
      date: new Date().toLocaleDateString('zh-CN').replace(/\//g, '.'),
      timeLabel: (() => {
        const hour = new Date().getHours();
        if (hour < 6) return "凌晨";
        if (hour < 9) return "清晨";
        if (hour < 12) return "上午";
        if (hour < 14) return "中午";
        if (hour < 17) return "下午";
        if (hour < 19) return "傍晚";
        return "深夜";
      })(),
      timestamp: Date.now()
    };
    
    if (isOfflineMode) {
      setOfflineMessages(prev => [...prev, msg]);
    } else {
      onSendMessage(msg);
    }
    
    setTextPhotoContent('');
    setActiveModal(null);
    setShowFeatures(false);
  };

  const handleLocation = (loc: string) => {
    const msg: ChatMessage = {
      role: 'user',
      content: loc,
      type: 'location',
      timestamp: Date.now()
    };
    if (isOfflineMode) {
      setOfflineMessages(prev => [...prev, msg]);
    } else {
      onSendMessage(msg);
    }
    setActiveModal(null);
    setShowFeatures(false);
  };

  const [showForwardModal, setShowForwardModal] = useState<{ messageIndex: number, type: 'single' | 'merged' } | null>(null);

  const handleForward = (index: number, type: 'single' | 'merged') => {
    setShowForwardModal({ messageIndex: index, type });
  };

  const handleReply = (index: number) => {
    const msg = currentMessages[index];
    if (msg) {
      setQuotedMessage(msg);
    }
  };

  const handleHeartfelt = async (index: number) => {
    const msg = currentMessages[index];
    if (!msg || msg.role !== 'assistant') return;
    
    // If we already have an inner thought from generation, just show it
    if (msg.innerThought) {
      setShowHeartfelt({ messageIndex: index, content: msg.innerThought });
      return;
    }

    setIsLoading(true);
    try {
      const systemPrompt = `你现在是一个文学创作者。
任务：以${friend.name}的身份，用第一人称简短地写出一段内心的真实感受。
情境：${friend.name}刚刚给用户发送了这样一句话：“${msg.content}”。

要求：
1. 风格：温柔、真实、感性。
2. 视角：第一人称，符合角色人设（${friend.persona || '自然'}）。
3. 篇幅：30字左右。
4. 语言：${friend.language || '中文（普通话）'}。
5. 只能输出内心感受内容。`;

      const heartfelt = await callAI(systemPrompt, [{ role: 'user', content: '这一刻你在想什么？' } as ChatMessage], settings);
      setShowHeartfelt({ messageIndex: index, content: heartfelt });
    } catch (err: any) {
      console.error("Heartfelt error:", err);
      const errMsg = err.message || '';
      if (errMsg.includes('SAFETY') || errMsg.includes('blocked') || errMsg.includes('PROHIBITED')) {
        showToast('该条消息的心声因安全策略无法生成，请尝试其他消息');
      } else {
        showToast('心声生成失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (skipLoadingCheck = false) => {
    if (isLoading && !skipLoadingCheck) return;
    if (!skipLoadingCheck) setIsLoading(true);
    try {
      const recentMsgs = currentMessages.slice(-10);
      const context = recentMsgs.map(m => `${m.role === 'user' ? '我' : friend.name}: ${m.content}`).join('\n');
      
      const systemPrompt = `你现在是${friend.name}，请用一句话描述你现在的状态或心情。
要求：
1. 简短有力，通常在10字以内。
2. 符合人设（${friend.persona || '自然'}）。
3. 只能输出状态内容。
4. 使用语言：${friend.language || '中文（普通话）'}。

背景：
${context}`;
      
      const newStatus = await callAI(systemPrompt, [{ role: 'user', content: '更新当前状态' } as ChatMessage], settings);
      onUpdateFriend({ mood: newStatus.trim() });
      if (!skipLoadingCheck) showToast('状态已更新');
    } catch (err: any) {
      console.error("Update status error:", err);
      if (!skipLoadingCheck) {
        const errorMsg = (err.message?.includes('429') || err.message?.includes('quota')) 
          ? 'API 额度不足，更新失败' 
          : '状态更新失败';
        showToast(errorMsg);
      }
    } finally {
      if (!skipLoadingCheck) setIsLoading(false);
    }
  };

  const handleOfflineHeartfelt = async () => {
    setIsLoading(true);
    try {
      const recentMsgs = offlineMessages.slice(-10);
      const context = recentMsgs.map(m => `${m.role === 'user' ? '我' : friend.name}: ${m.content}`).join('\n');
      
      const systemPrompt = `你现在是${friend.name}的线下真实想法生成器。
任务：根据线下互动内容，生成一句你此时此刻最真实的内心想法。
要求：
1. 符合角色人设（${friend.persona || '无特定人设'}）。
2. 真实反映当前互动情境。
3. 只能输出心声内容，不加引号。
4. 长度20-50字。
5. 严禁包含违禁内容。
6. 使用语言：${friend.language || '中文（普通话）'}。

互动内容：
${context}`;
      
      const heartfelt = await callAI(systemPrompt, [{ role: 'user', content: '分析当前心声' } as ChatMessage], settings);
      setShowHeartfelt({ content: heartfelt });
    } catch (err) {
      console.error("Offline Heartfelt error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecall = (index: number) => {
    if (isOfflineMode) {
      const newMsgs = [...offlineMessages];
      const msg = newMsgs[index];
      if (msg) {
        newMsgs[index] = { 
          ...msg, 
          role: 'system', 
          content: msg.role === 'user' ? '你撤回了一条消息' : `${friend.name}撤回了一条消息`,
          type: 'text' 
        };
        setOfflineMessages(newMsgs);
      }
    } else {
      const msg = messages[index];
      if (msg) {
        onUpdateMessage(friend.id, index, { 
          role: 'system', 
          content: msg.role === 'user' ? '你撤回了一条消息' : `${friend.name}撤回了一条消息`,
          type: 'text' 
        });
      }
    }
  };

  const handleDelete = (index: number) => {
    if (isOfflineMode) {
      const newMsgs = [...offlineMessages];
      newMsgs.splice(index, 1);
      setOfflineMessages(newMsgs);
    } else {
      const newMsgs = [...messages];
      newMsgs.splice(index, 1);
      onImportMessages(newMsgs);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleFavorite = (index: number) => {
    const msg = currentMessages[index];
    if (!msg) return;
    addFavorite({
      id: Math.random().toString(36).substr(2, 9),
      friendId: friend.id,
      friendName: friend.name,
      content: msg.content,
      type: msg.type || 'text',
      timestamp: msg.timestamp
    });
    setContextMenu(null);
    showToast('已收藏');
  };

  const handleSendSticker = (sticker: any) => {
    const msg: ChatMessage = {
      role: 'user',
      content: `[发送了表情: ${sticker.description || '表情包'}]`,
      type: 'sticker',
      mediaUrl: sticker.url,
      description: sticker.description,
      timestamp: Date.now()
    };
    if (isOfflineMode) {
      setOfflineMessages(prev => [...prev, msg]);
    } else {
      onSendMessage(msg);
    }
    setShowEmojiPicker(false);
  };

  const handleAddStickersByUrl = () => {
    const lines = stickerUrlInput.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;
    
    const newStickers = lines.map(line => {
      // Try to match "Description URL" or "URL Description"
      // Pattern: some text followed by a URL, or a URL followed by some text
      const urlPattern = /(https?:\/\/\S+)/i;
      const match = line.match(urlPattern);
      
      if (match) {
        const url = match[1];
        const description = line.replace(url, '').trim() || '批量导入的表情包';
        return {
          id: Math.random().toString(36).substr(2, 9),
          url,
          description,
          addedAt: Date.now()
        };
      }
      
      return null;
    }).filter(s => s !== null) as any[];
    
    if (newStickers.length === 0) {
      showToast('未识别到有效的图片链接');
      return;
    }
    
    const updatedStickers = [...(settings.customStickers || []), ...newStickers];
    onUpdateSettings({ customStickers: updatedStickers });
    setStickerUrlInput('');
    setShowStickerImport(null);
    showToast(`成功导入 ${newStickers.length} 个表情包`);
  };

  const handleAddStickerByFile = () => {
    if (!pendingStickerFile) return;
    
    const newSticker = {
      id: Math.random().toString(36).substr(2, 9),
      url: pendingStickerFile,
      description: stickerFileDescription || '自定义表情包',
      addedAt: Date.now()
    };
    
    const updatedStickers = [...(settings.customStickers || []), newSticker];
    onUpdateSettings({ customStickers: updatedStickers });
    setPendingStickerFile(null);
    setStickerFileDescription('');
    setShowStickerImport(null);
    showToast('表情包已添加');
  };

  const handleDeleteStickers = () => {
    if (selectedStickers.length === 0) return;
    const updatedStickers = (settings.customStickers || []).filter(s => !selectedStickers.includes(s.id));
    onUpdateSettings({ customStickers: updatedStickers });
    setSelectedStickers([]);
    setStickerDeleteMode(false);
    showToast('已删除选中的表情包');
  };

  const handleTranslate = async (index: number) => {
    const msg = currentMessages[index];
    if (!msg || !msg.content || isTranslating !== null) return;
    
    // Toggle folding if already translated
    if (msg.translation) {
      if (isOfflineMode) {
        const newMsgs = [...offlineMessages];
        newMsgs[index] = { ...msg, hideTranslation: !msg.hideTranslation };
        setOfflineMessages(newMsgs);
      } else {
        onUpdateMessage(friend.id, index, { hideTranslation: !msg.hideTranslation });
      }
      return;
    }

    setIsTranslating(index);
    try {
      const systemPrompt = `你现在是一个专业翻译。
任务：将以下内容翻译成中文（普通话）。
要求：
1. 意译为主，表达准确自然。
2. 只能输出翻译内容。
3. 严禁违禁内容。

内容：${msg.content}`;

      const translation = await callAI(systemPrompt, [], settings);
      if (isOfflineMode) {
        const newMsgs = [...offlineMessages];
        newMsgs[index] = { ...msg, translation, hideTranslation: false };
        setOfflineMessages(newMsgs);
      } else {
        onUpdateMessage(friend.id, index, { translation, hideTranslation: false });
      }
    } catch (err) {
      console.error("Translation error:", err);
      showToast('翻译失败，请稍后重试');
    } finally {
      setIsTranslating(null);
    }
  };

  const features = [
    { icon: ImageIcon, label: '相册', color: 'text-blue-500', onClick: () => fileInputRef.current?.click() },
    { icon: Type, label: '文字摄影', color: 'text-cyan-500', onClick: () => setActiveModal('text-photo') },
    { icon: Video, label: '视频通话', color: 'text-green-500', onClick: () => onStartCall(friend, 'video') },
    { icon: MapPin, label: '位置', color: 'text-red-500', onClick: () => setActiveModal('location') },
    { icon: Wallet, label: '转账', color: 'text-orange-600', onClick: () => setActiveModal('transfer') },
    { icon: Mic, label: '语音输入', color: 'text-blue-600', onClick: () => setActiveModal('voice-input') },
    { 
      icon: Music, 
      label: '一起听', 
      color: 'text-pink-500', 
      onClick: () => {
        onUpdateListenTogether(prev => ({ ...prev, isActive: true, friendId: friend.id }));
        setShowFeatures(false);
      } 
    },
    { icon: Gamepad2, label: '真心话', color: 'text-purple-500', onClick: () => setActiveModal('truth-or-dare') },
    { icon: ShoppingBag, label: '盲盒', color: 'text-pink-400', onClick: () => setActiveModal('blind-box') },
    { icon: RefreshCw, label: '重回', color: 'text-emerald-500', onClick: () => { handleGenerate('regenerate'); setShowFeatures(false); } },
    { icon: DoorOpen, 
      label: isOfflineMode ? '线上聊天' : '线下剧情', 
      color: isOfflineMode ? 'text-blue-500' : 'text-orange-500', 
      onClick: () => {
        if (isOfflineMode) {
          setActiveModal('exit-offline');
        } else {
          setIsOfflineMode(true);
        }
        setShowFeatures(false);
      } 
    },
  ];

  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'];

  const handleDeletePlot = (index: number) => {
    const newMsgs = [...offlineMessages];
    newMsgs.splice(index, 1);
    setOfflineMessages(newMsgs);
  };

  const handleEditPlot = (index: number, newContent: string) => {
    const newMsgs = [...offlineMessages];
    newMsgs[index] = { ...newMsgs[index], content: newContent };
    setOfflineMessages(newMsgs);
  };

  if (showSettings) {
    return (
      <>
        <ChatSettings 
          friend={friend} 
          messages={messages} 
          settings={settings}
          groups={groups}
          chats={chats}
          friends={friends}
          user={user}
          onBack={() => setShowSettings(false)} 
          onUpdateFriend={onUpdateFriend}
          onImportMessages={onImportMessages}
          summarizeContent={summarizeContent}
          onShowMomentSettings={onShowMomentSettings}
          activeModal={activeModal}
          setActiveModal={setActiveModal}
          onShowCreateGroup={onShowCreateGroup}
        />
        {/* Render modals even in settings view */}
        <AnimatePresence>
          {activeModal === 'image-preview' && previewImageUrl && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-4" onClick={() => setActiveModal(null)}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative max-w-full max-h-full flex flex-col items-center gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <img 
                  src={previewImageUrl} 
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" 
                  referrerPolicy="no-referrer"
                />
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleDownloadImage(previewImageUrl)}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center gap-2 backdrop-blur-md border border-white/20 transition-all active:scale-95"
                  >
                    <Download size={18} />
                    <span>保存到相册</span>
                  </button>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center gap-2 backdrop-blur-md border border-white/20 transition-all active:scale-95"
                  >
                    <X size={18} />
                    <span>关闭预览</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {activeModal === 'character-image-gen' && (
            <CharacterImageSettings 
              friend={friend} 
              onUpdateFriend={onUpdateFriend} 
              settings={settings} 
              onClose={() => setActiveModal(null)} 
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full transition-colors duration-500 relative overflow-hidden chat-window-container",
      settings.themeId === 'rainy-cat' ? "bg-black/10 backdrop-blur-xl" : (settings.appBackgroundUrl ? "bg-transparent" : "bg-[#f5f5f5]"),
      settings.isCuteRabbitThemeEnabled && "cute-rabbit-theme"
    )} style={{
      ...(() => {
        if (!settings.globalCustomCss) return {};
        try {
          const trimmed = settings.globalCustomCss.trim();
          if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            return JSON.parse(trimmed);
          }
          return {};
        } catch (e) {
          return {};
        }
      })(),
      color: settings.isDarkThemeEnabled ? 'white' : '#0f172a'
    }}>
      {isOfflineMode && offlineConfig.customCss && (
        <style dangerouslySetInnerHTML={{ __html: offlineConfig.customCss }} />
      )}
      {/* Context Menu Modal - Re-implemented for better positioning and size */}
      <AnimatePresence>
        {contextMenu && (
          <div 
            className="fixed inset-0 z-[999999] bg-black/5" 
            onClick={() => setContextMenu(null)}
          >
            {(() => {
              const messageElement = document.querySelector(`[data-message-index="${contextMenu.messageIndex}"]`);
              if (!messageElement) return null;
              
              const rect = messageElement.getBoundingClientRect();
              const menuWidth = 200; 
              
              // Decide if we show above or below
              const isTop = rect.top > 250;
              
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: "-50%", y: isTop ? 10 : -10 }}
                  animate={{ opacity: 1, scale: 1, x: "-50%", y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: "-50%", y: isTop ? 10 : -10 }}
                  onClick={(e) => e.stopPropagation()}
                  className="fixed pointer-events-auto"
                  style={{ 
                    left: '50%', 
                    top: isTop ? rect.top - 12 : rect.bottom + 12,
                    zIndex: 1000000,
                    width: menuWidth,
                    transformOrigin: isTop ? 'bottom center' : 'top center'
                  }}
                >
                  <div className={cn(
                    "bg-[#333333]/95 backdrop-blur-xl rounded-2xl shadow-2xl p-3.5 border border-white/10",
                    isTop ? "-translate-y-full" : ""
                  )}>
                    <div className="grid grid-cols-4 gap-y-5 gap-x-1">
                      {[
                        { label: '复制', icon: Copy, onClick: () => {
                          const msg = currentMessages[contextMenu.messageIndex];
                          navigator.clipboard.writeText(msg.content);
                          showToast('已复制');
                        }},
                        { label: '转发', icon: Forward, onClick: () => handleForward(contextMenu.messageIndex, 'single') },
                        { label: '收藏', icon: Star, onClick: () => handleFavorite(contextMenu.messageIndex) },
                        { label: '删除', icon: Trash2, onClick: () => handleDelete(contextMenu.messageIndex) },
                        { label: '翻译', icon: Globe, onClick: () => handleTranslate(contextMenu.messageIndex) },
                        { label: '引用', icon: Quote, onClick: () => handleReply(contextMenu.messageIndex) },
                        { label: isOfflineMode ? '编辑' : '心声', icon: isOfflineMode ? Edit3 : Brain, onClick: () => isOfflineMode ? handleStartEdit(contextMenu.messageIndex) : handleHeartfelt(contextMenu.messageIndex) },
                        { label: '多选', icon: ListChecks, onClick: () => {
                          setIsMultiSelectMode(true);
                          setSelectedMessages([contextMenu.messageIndex]);
                        }},
                      ].map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex flex-col items-center gap-1.5 active:opacity-50 transition-opacity cursor-pointer group"
                          onClick={() => {
                            item.onClick();
                            setContextMenu(null);
                          }}
                        >
                          <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 active:bg-white/10 transition-colors">
                            <item.icon size={19} style={{ color: 'white' }} className="fill-none" />
                          </div>
                          <span className="text-[10px] font-medium" style={{ color: 'white' }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div 
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2 border-[8px] border-transparent",
                      isTop ? "top-full -mt-0.5 border-t-[#333333]/95" : "bottom-full -mb-0.5 border-b-[#333333]/95"
                    )}
                  />
                </motion.div>
              );
            })()}
          </div>
        )}
      </AnimatePresence>
      {/* Global Styles for Long Press and Selection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .chat-bubble-container {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        .context-menu-item:active {
          background-color: rgba(255, 182, 193, 0.2);
        }
      `}} />
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,video/*" 
        onChange={handleFileUpload} 
      />
      
      {/* Header */}
      <div className={cn(
        "border-b px-3 py-2 flex items-center justify-between sticky top-0 z-10 transition-all duration-300 relative chat-window-header",
        settings.isDarkThemeEnabled ? "bg-black/40 backdrop-blur-md border-white/10 text-white" : 
        (settings.isCuteRabbitThemeEnabled ? "bg-pink-50/60 backdrop-blur-md border-pink-100 text-pink-600" : 
          (settings.themeId === 'rainy-cat' ? "bg-white/10 backdrop-blur-md border-white/10 text-white" : (settings.activeChatThemeId ? "bg-transparent border-transparent" : (settings.appBackgroundUrl ? "bg-white/10 backdrop-blur-md border-slate-200/20" : (isOfflineMode ? "bg-[#ededed] border-slate-300" : "bg-[#f5f5f5] border-slate-200")))))
      )} style={{
        ...(settings.fullScreenMode ? { paddingTop: settings.hideStatusBar ? 'env(safe-area-inset-top)' : 'max(env(safe-area-inset-top), 44px)' } : { paddingTop: settings.hideStatusBar ? '0px' : '4px' }),
        ...(settings.appBackgroundUrl && !settings.activeChatThemeId ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (settings.chatWallpaperOpacity ?? 0.8) * 0.2)})` } : {})
      }}>
        {settings.activeChatThemeId === 'imessage-v3' ? (
          /* iMessage Centered Header Layout */
          <div className="w-full flex items-center justify-between relative" style={{ height: '64px' }}>
            {/* Left Back Arrow (iMessage Blue) */}
            <button 
              onClick={() => isOfflineMode ? setActiveModal('exit-offline') : onBack()} 
              className="p-1 text-[#3a9cfd] hover:opacity-75 transition-opacity flex items-center gap-0.5"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
              <span className="text-[14px] font-normal hidden sm:inline">Back</span>
            </button>

            {/* Center: Avatar + Name + "iMessage" label */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 flex flex-col items-center justify-center text-center">
              <img 
                src={friend.avatar} 
                className="w-8 h-8 rounded-full object-cover border border-slate-200/50 shadow-sm mb-0.5" 
                referrerPolicy="no-referrer"
              />
              <span className="text-[12px] text-slate-800 font-semibold leading-tight flex items-center gap-0.5">
                {friend.alias || friend.name}
                <ChevronLeft size={10} className="transform -rotate-90 text-slate-400 mt-0.5" />
              </span>
              <span className="text-[8px] text-slate-400 font-normal tracking-wide uppercase mt-0.5">
                iMessage
              </span>
            </div>

            {/* Right Side Buttons (Native style) */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveModal('sparkle')}
                className="p-1.5 text-[#3a9cfd] hover:opacity-75 transition-opacity"
                title="心声"
              >
                <Sparkles size={20} />
              </button>
              <button 
                onClick={() => isOfflineMode ? setShowOfflineSettings(true) : setShowSettings(true)} 
                className="p-1.5 text-[#3a9cfd] hover:opacity-75 transition-opacity"
                title={isOfflineMode ? "线下剧情设置" : "聊天设置"}
              >
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Header Layout */
          <>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => isOfflineMode ? setActiveModal('exit-offline') : onBack()} 
                className="p-1 hover:bg-slate-200 rounded-full"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 text-base leading-tight">
                  {friend.alias || friend.name}
                  {isOfflineMode && <span className="ml-1 text-[10px] text-orange-600 font-normal bg-orange-50 px-1 rounded border border-orange-100">线下剧情</span>}
                </span>
                <button 
                  onClick={() => handleUpdateStatus()}
                  disabled={isLoading}
                  className="flex items-center gap-1 group active:opacity-60 transition-opacity"
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full bg-green-500", isLoading ? "animate-spin" : "animate-pulse")} />
                  <span className="text-[9px] text-slate-400 group-hover:text-slate-600 transition-colors">
                    {isOfflineMode ? '正在进行线下真实互动...' : (friend.mood || '在线')}
                  </span>
                </button>
              </div>
            </div>

            {isOfflineMode && (
              <div className="absolute left-1/2 -translate-x-1/2">
                <button 
                  onClick={handleOfflineHeartfelt}
                  disabled={isLoading}
                  className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <Heart size={20} className={isLoading ? "animate-pulse" : ""} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              {isOfflineMode ? (
                <button 
                  onClick={() => setShowOfflineSettings(true)}
                  className="p-1 hover:bg-slate-200 rounded-full"
                  title="线下剧情设置"
                >
                  <MoreHorizontal size={20} className="text-slate-600" />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => setActiveModal('sparkle')}
                    className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <Sparkles size={20} />
                  </button>
                  <button onClick={() => setShowSettings(true)} className="p-1 hover:bg-slate-200 rounded-full">
                    <MoreHorizontal size={20} className="text-slate-600" />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        onClick={() => {
          if (showEmojiPicker) setShowEmojiPicker(false);
          if (showFeatures) setShowFeatures(false);
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
        className={cn(
          "flex-1 overflow-y-auto overflow-x-hidden p-4 pb-[20px] space-y-4 transition-colors duration-300 relative chat-message-list",
          settings.isDarkThemeEnabled ? "bg-black" : 
          (settings.isCuteRabbitThemeEnabled ? "bg-pink-50/30" : (settings.themeId === 'rainy-cat' ? "bg-transparent" : (isOfflineMode ? (offlineConfig.bgImage ? "bg-transparent" : "bg-[#e5e5e5]") : (friend.chatBackground || settings.chatWallpaperUrl ? "bg-transparent" : "bg-[#f5f5f5]"))))
        )}
        style={(() => {
          let bgUrl = '';
          if (isOfflineMode) {
            bgUrl = offlineConfig.bgImage || '';
          } else {
            bgUrl = friend.chatBackground || settings.chatWallpaperUrl || '';
          }
          if (bgUrl) {
            return {
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            };
          }
          return {};
        })()}
      >
        {/* Background Overlay for better readability */}
        {((!isOfflineMode && (friend.chatBackground || settings.chatWallpaperUrl)) || (isOfflineMode && offlineConfig.bgImage)) && (
          <div className={cn(
            "absolute inset-0 pointer-events-none transition-colors duration-500",
            settings.themeId === 'rainy-cat' ? "bg-black/20" : (isOfflineMode ? "bg-black/0 backdrop-blur-none" : "bg-white/30 backdrop-blur-[2px]")
          )} />
        )}
        
        <div className="relative z-10 space-y-4">
          {currentMessages.length === 0 && isOfflineMode && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2 opacity-50">
              <MessageSquareText size={40} className="text-slate-400" />
              <p className="text-xs text-slate-500">开启一段线下剧情对话吧</p>
            </div>
          )}
          {currentMessages.map((msg, i) => {
            const msgKey = msg.id || `${msg.role}-${msg.timestamp}-${i}`;
            if (isOfflineMode) {
              if (msg.role === 'system') {
                return (
                  <div key={msgKey} className="flex justify-center my-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/5 text-white/40" : "bg-black/5 text-slate-400"
                    )}>
                      {msg.content}
                    </span>
                  </div>
                );
              }
              return (
                <OfflinePlotCard
                  key={msgKey}
                  message={msg}
                  friend={friend}
                  user={user}
                  index={i}
                  theme={offlineConfig.cardTheme}
                  isEditing={editingMessageIndex === i}
                  editingContent={editingContent}
                  setEditingContent={setEditingContent}
                  onStartEdit={() => {
                    setEditingMessageIndex(i);
                    setEditingContent(msg.content);
                    setIsEditingOffline(true);
                  }}
                  onSaveEdit={() => {
                    const newMsgs = [...offlineMessages];
                    newMsgs[i] = { ...newMsgs[i], content: editingContent };
                    setOfflineMessages(newMsgs);
                    setEditingMessageIndex(null);
                    setEditingContent('');
                    setIsEditingOffline(false);
                  }}
                  onCancelEdit={() => {
                    setEditingMessageIndex(null);
                    setEditingContent('');
                    setIsEditingOffline(false);
                  }}
                  onDelete={() => {
                    const newMsgs = offlineMessages.filter((_, idx) => idx !== i);
                    setOfflineMessages(newMsgs);
                  }}
                />
              );
            }
            if (msg.role === 'system') {
              return (
                <div key={msgKey} className="flex justify-center my-2">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "bg-white/5 text-white/40" : "bg-black/5 text-slate-400"
                  )}>
                    {msg.content}
                  </span>
                </div>
              );
            }
            if (msg.isSystemNotification) {
              if (msg.notificationType === 'date_summary') {
                return (
                  <div key={msgKey} className="flex justify-center my-4">
                    <div className="bg-[#FFF9F9] rounded-2xl p-4 shadow-sm border border-rose-50 mb-2 w-full max-w-[280px]">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                          <Camera className="w-4 h-4 text-rose-400" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-700">约会小结</div>
                          <div className="text-[10px] text-slate-400">{msg.location || '珍藏记忆'}</div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msgKey} className="flex justify-center my-4">
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl shadow-sm border flex flex-col items-center gap-3 text-center transition-all duration-300",
                    msg.notificationType === 'unlock_success' 
                      ? "bg-green-50/80 backdrop-blur-sm border-green-100 text-green-800" 
                      : "bg-red-50/80 backdrop-blur-sm border-red-200 text-red-800"
                  )}>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shadow-inner",
                      msg.notificationType === 'unlock_success' ? "bg-green-100" : "bg-red-100"
                    )}>
                      {msg.notificationType === 'unlock_success' ? <Smartphone className="text-green-600" size={20} /> : <ShieldAlert className="text-red-600" size={20} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider uppercase opacity-50 mb-1">
                        系统安全提醒
                      </p>
                      <p className="text-sm font-bold">
                        {msg.notificationData?.userName} 在尝试解锁你的手机，{msg.notificationType === 'unlock_success' ? '密码正确' : '密码错误'}
                      </p>
                      {msg.notificationType === 'unlock_success' && msg.notificationData?.isMaster && (
                        <p className="text-[10px] opacity-60 mt-1 italic">使用万能密码进入</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
            const prevMsg = i > 0 ? currentMessages[i - 1] : undefined;
            return (
              <div key={msg.id ? `msg-${msg.id}-${i}` : `msg-ts-${msg.timestamp}-${i}-${msg.role}`} className="flex flex-col w-full">
                {renderMessageTimestamp(msg, prevMsg)}
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <img 
                      src={msg.role === 'user' ? user.avatar : friend.avatar} 
                      alt="avatar" 
                      loading="lazy"
                      className="w-10 h-10 rounded-lg bg-slate-200 shrink-0 object-cover chat-avatar" 
                    />
                    <div 
                      data-message-index={i}
                      onClick={() => {
                        if (longPressTriggeredRef.current) {
                          longPressTriggeredRef.current = false;
                          return;
                        }
                        if (isMultiSelectMode) {
                          setSelectedMessages(prev => 
                            prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i]
                          );
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openMessageMenu(i);
                      }}
                      onPointerDown={(e) => {
                        longPressTriggeredRef.current = false;
                        longPressTimer.current = setTimeout(() => {
                          longPressTriggeredRef.current = true;
                          openMessageMenu(i);
                        }, 800);
                      }}
                      onPointerUp={() => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                      }}
                      onPointerLeave={() => {
                        if (longPressTimer.current) clearTimeout(longPressTimer.current);
                      }}
                      className={cn(
                        "p-2.5 rounded-lg text-sm shadow-sm relative break-all transition-all duration-300 group chat-bubble-container",
                        isMultiSelectMode && "cursor-pointer",
                        (settings.themeId === 'rainy-cat' || (isOfflineMode && (!msg.type || msg.type === 'text')) || msg.type === 'sticker' || getPureStickerUrl(msg.content, settings.customStickers || []) || settings.activeChatThemeId || settings.activeBubbleThemeId || settings.globalCustomCss || settings.bubbleCustomCss)
                          ? "bg-transparent shadow-none p-0" 
                          : (settings.isInsBubbleEnabled 
                              ? (msg.role === 'user' ? 'ins-bubble-user' : 'ins-bubble-assistant')
                              : (msg.role === 'user' ? 'bg-pink-100 text-pink-900 chat-bubble-user' : 'bg-white text-black chat-bubble-assistant')),
                        msg.type === 'image' || msg.type === 'video' ? 'p-1' : '',
                        settings.isInsBubbleEnabled && "ins-bubble-container"
                      )}
                    style={{ 
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none',
                      touchAction: 'pan-y'
                    }}
                  >
                    {isMultiSelectMode && (
                      <div className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedMessages.includes(i) 
                          ? "bg-green-500 border-green-500 text-white" 
                          : "bg-white border-slate-300"
                      )}
                      style={{ [msg.role === 'user' ? 'right' : 'left']: '-35px' }}
                      >
                        {selectedMessages.includes(i) && <Check size={12} strokeWidth={4} />}
                      </div>
                    )}
                  {msg.quote && (
                    <div className="mb-2 p-2 bg-black/5 rounded border-l-2 border-slate-300 text-[10px] opacity-60 italic">
                      {msg.quote.content}
                    </div>
                  )}
                  {msg.innerThought && (
                    <HeartVoiceCard content={msg.innerThought} avatar={friend.avatar} />
                  )}
                  {msg.type === 'offline-invitation' && msg.invitationData && (
                    <OfflineInvitationCard 
                      data={msg.invitationData} 
                      onAccept={() => {
                        if (onUpdateMessage) {
                          onUpdateMessage(friend.id, i, { 
                            invitationData: { ...msg.invitationData!, status: 'accepted' } 
                          });
                        }
                        if (onOpenApp) onOpenApp('dating', { friendId: friend.id, openingText: msg.invitationData!.openingText });
                      }}
                      onDecline={() => {
                        if (onUpdateMessage) {
                          onUpdateMessage(friend.id, i, { 
                            invitationData: { ...msg.invitationData!, status: 'declined' } 
                          });
                        }
                      }}
                      settings={settings}
                    />
                  )}
                  {msg.type === 'dice' ? (
                    <DiceAnimation value={parseInt(msg.content)} onComplete={() => console.log('Dice roll complete')} />
                  ) : isOfflineMode && (!msg.type || msg.type === 'text') ? (
                    <div className="flex flex-col gap-1 w-full min-w-[100px]">
                      {editingMessageIndex === i ? (
                        <div className="flex flex-col gap-2 p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-slate-200">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full min-h-[100px] p-2 text-xs bg-white text-black rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-green-400"
                            placeholder="修改对话或旁白..."
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => setEditingMessageIndex(null)}
                              className="px-3 py-1 text-[10px] bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors"
                            >
                              取消
                            </button>
                            <button 
                              onClick={handleSaveEdit}
                              className="px-3 py-1 text-[10px] bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : msg.isNarration ? (
                        <div className={cn(
                          "w-full flex justify-center py-2"
                        )}>
                          <span className="text-[10px] text-slate-500/60 bg-black/5 px-2 py-0.5 rounded italic">
                            {msg.content}
                          </span>
                        </div>
                      ) : (
                        (() => {
                          // WeChat Style Rule: Dialog in bubble, narration as small text
                          const parts = msg.content.split(/(“[^”]*”|"[^"]*")/g);
                          const hasNoQuotes = parts.length === 1;
                          return (
                            <div className={cn(
                              "flex flex-col gap-2",
                              msg.role === 'user' ? "items-end text-right" : "items-start text-left"
                            )}>
                              {parts.map((part, idx) => {
                                if (!part) return null;
                                const isQuote = /(“[^”]*”|"[^"]*")/.test(part);
                                if (isQuote || (hasNoQuotes && msg.role === 'user')) {
                                  // Strip leading/trailing quotes for cleaner look if needed, or keep them as per user pref
                                  const content = part; 
                                  return (
                                    <div key={idx} className={cn(
                                      "relative px-3 py-2 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] text-[15px] leading-relaxed break-words whitespace-pre-wrap w-fit max-w-full font-sans",
                                      (settings.activeChatThemeId || settings.activeBubbleThemeId || settings.globalCustomCss || settings.bubbleCustomCss)
                                        ? (msg.role === 'user' ? "message-bubble-user" : "message-bubble-assistant")
                                        : (msg.role === 'user' ? "bg-pink-100 text-pink-900 message-bubble-user" : "bg-white text-black border border-slate-100/50 message-bubble-assistant")
                                    )}>
                                      {content}
                                      {/* WeChat Triangle Tail */}
                                      <div className={cn(
                                        "absolute top-[14px] w-0 h-0 border-[5px] border-transparent",
                                        (settings.activeChatThemeId || settings.activeBubbleThemeId || settings.globalCustomCss || settings.bubbleCustomCss) && "hidden",
                                        msg.role === 'user' 
                                          ? "-right-[10px] border-l-pink-100" 
                                          : "-left-[10px] border-r-white"
                                      )} />
                                    </div>
                                  );
                                } else {
                                  const trimmed = part.trim();
                                  if (!trimmed) return null;
                                  return (
                                    <div key={idx} className={cn(
                                      "text-[10px] text-slate-500/80 max-w-[95%] leading-relaxed font-medium italic py-1",
                                      msg.role === 'user' ? "text-right ml-auto" : "text-left mr-auto"
                                    )}>
                                      {trimmed}
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          );
                        })()
                      )}
                      {msg.translation && !msg.hideTranslation && (
                        <div className="mt-1 max-w-[280px] bg-white/50 backdrop-blur-sm border border-black/5 rounded-lg px-3 py-2 text-[14px] text-slate-500 flex flex-col gap-1 relative group/trans">
                          <div className="flex items-center justify-between">
                            <span>{msg.translation}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleTranslate(i); }}
                              className="opacity-0 group-hover/trans:opacity-100 transition-opacity p-1 -mr-2"
                            >
                              <ChevronUp size={14} className="text-slate-300" />
                            </button>
                          </div>
                        </div>
                      )}
                      {msg.translation && msg.hideTranslation && (
                        <div 
                          className="mt-1 w-fit flex items-center gap-1 opacity-20 cursor-pointer hover:opacity-50"
                          onClick={(e) => { e.stopPropagation(); handleTranslate(i); }}
                        >
                          <div className="w-4 h-[1px] bg-black/30" />
                          <span className="text-[14px] leading-none">^</span>
                        </div>
                      )}
                      {isTranslating === i && (
                        <div className="mt-1 text-[12px] opacity-30 animate-pulse italic">正在翻译...</div>
                      )}
                    </div>
                  ) : settings.themeId === 'rainy-cat' && (!msg.type || msg.type === 'text') && !getPureStickerUrl(msg.content, settings.customStickers || []) ? (
                    <div className="flex flex-col gap-1">
                      <CatBubble isUser={msg.role === 'user'}>
                        {msg.content}
                      </CatBubble>
                      {msg.translation && !msg.hideTranslation && (
                        <div className={cn(
                          "mt-1 max-w-[280px] bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-[14px] text-white/70 flex flex-col gap-1 relative group/trans",
                          msg.role === 'user' ? "self-end" : "self-start"
                        )}>
                          <div className="flex items-center justify-between">
                            <span>{msg.translation}</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleTranslate(i); }}
                              className="opacity-0 group-hover/trans:opacity-100 transition-opacity p-1 -mr-2"
                            >
                              <ChevronUp size={14} className="text-white/50" />
                            </button>
                          </div>
                        </div>
                      )}
                      {msg.translation && msg.hideTranslation && (
                        <div 
                          className={cn(
                            "mt-1 w-fit flex items-center gap-1 opacity-20 cursor-pointer hover:opacity-50",
                            msg.role === 'user' ? "self-end" : "self-start"
                          )}
                          onClick={(e) => { e.stopPropagation(); handleTranslate(i); }}
                        >
                          <div className="w-4 h-[1px] bg-white/30" />
                          <span className="text-[14px] leading-none text-white">^</span>
                        </div>
                      )}
                      {isTranslating === i && (
                        <div className={cn(
                          "mt-1 text-[12px] opacity-30 animate-pulse italic text-white/50",
                          msg.role === 'user' ? "self-end" : "self-start"
                        )}>正在翻译...</div>
                      )}
                    </div>
                  ) : (
                    <>
                      {(!msg.type || msg.type === 'text') && !getPureStickerUrl(msg.content, settings.customStickers || []) && (
                        <div 
                          className={cn(
                            "flex flex-col gap-1", 
                            settings.bubbleCustomCss && "bubble-custom",
                            msg.role === 'user' ? "message-bubble-user" : "message-bubble-assistant"
                          )} 
                          style={(() => {
                            if (!settings.bubbleCustomCss) return {};
                            try {
                              const trimmed = settings.bubbleCustomCss.trim();
                              // Only parse if it's explicitly a JSON string
                              if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                                return JSON.parse(trimmed);
                              }
                            } catch (e) {
                              // Silently ignore if it's CSS
                            }
                            return {};
                          })()}
                        >
                          <div>{msg.content}</div>
                          {msg.translation && !msg.hideTranslation && (
                            <div 
                              className="mt-1 pt-1 border-t border-black/10 text-xs italic opacity-70 cursor-pointer hover:opacity-100"
                              onClick={() => handleTranslate(i)}
                            >
                              {msg.translation}
                            </div>
                          )}
                          {msg.translation && msg.hideTranslation && (
                            <div 
                              className="mt-1 flex items-center gap-1 opacity-40 cursor-pointer hover:opacity-70"
                              onClick={() => handleTranslate(i)}
                            >
                              <div className="w-4 h-[1px] bg-black/30" />
                              <span className="text-[10px]">已折叠翻译</span>
                            </div>
                          )}
                          {isTranslating === i && (
                            <div className="text-[10px] opacity-50 animate-pulse">正在翻译...</div>
                          )}
                        </div>
                      )}
                      {msg.type === 'photo_card' && (
                        <CCDPhotoCard 
                          content={msg.content} 
                          location={msg.location || friend.address}
                          date={msg.date}
                          timeLabel={msg.timeLabel}
                          className="max-w-[280px] -mx-2 my-1 shadow-md" 
                        />
                      )}
                      {msg.type === 'sticker' && msg.mediaUrl && (
                        <div 
                          className="px-1 py-1 cursor-pointer active:opacity-90 transition-all duration-300"
                          onClick={(e) => {
                            if (longPressTriggeredRef.current) {
                              e.stopPropagation();
                              longPressTriggeredRef.current = false;
                              return;
                            }
                            msg.description && setSelectedDescription(msg.description);
                          }}
                        >
                          <img src={msg.mediaUrl} alt="sticker" className="max-w-[120px] max-h-[120px] object-contain rounded-md" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      {msg.type === 'image' && (
                        <div 
                          className="space-y-1 cursor-pointer active:opacity-90 relative group"
                          onClick={(e) => {
                            if (longPressTriggeredRef.current) {
                              e.stopPropagation();
                              longPressTriggeredRef.current = false;
                              return;
                            }
                            if (msg.notificationData?.isFailed) return;
                            setPreviewImageUrl(msg.mediaUrl || null);
                            setActiveModal('image-preview');
                          }}
                        >
                          {msg.notificationData?.isFailed ? (
                            <PolaroidCard 
                              prompt={msg.description || '无提示词'} 
                              isRegenerating={isRegeneratingImage === i}
                              onRetry={() => handleRegenerateImage(i)}
                            />
                          ) : (
                            <>
                              <img src={msg.mediaUrl} alt="sent" className="max-w-full rounded-md shadow-sm" referrerPolicy="no-referrer" />
                              {msg.description && msg.content !== '[图片]' && (
                                <div className="text-[10px] opacity-70 px-1">{msg.description}</div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Search className="text-white w-5 h-5" />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {msg.type === 'video' && msg.mediaUrl && (
                        <video 
                          src={msg.mediaUrl} 
                          controls 
                          className="max-w-full rounded-md" 
                          onError={(e) => {
                            console.error("Video load error:", e);
                            (e.target as HTMLVideoElement).style.display = 'none';
                          }}
                        />
                      )}
                      {msg.type === 'voice' && (
                        <div className="flex flex-col gap-1">
                          <div 
                            className={cn(
                              "flex items-center gap-2 min-w-[60px] cursor-pointer active:opacity-70 relative group",
                              settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-md border border-white/10 p-2 rounded-xl" : "p-2"
                            )}
                            onClick={(e) => {
                              if (longPressTriggeredRef.current) {
                                e.stopPropagation();
                                longPressTriggeredRef.current = false;
                                return;
                              }
                              
                              if (playingMessageId === msg.timestamp) {
                                // Already playing this one, maybe stop? For now just return
                                return;
                              }

                              setPlayingMessageId(msg.timestamp);
                              speakText(msg.content, friend.voiceId, friend.voiceType, settings)
                                .catch(err => {
                                  console.error('TTS preview error:', err);
                                  alert('播放失败：' + (err instanceof Error ? err.message : '网络异常'));
                                })
                                .finally(() => {
                                  setPlayingMessageId(prev => prev === msg.timestamp ? null : prev);
                                });
                            }}
                          >
                            <Mic size={16} className={cn(
                              msg.role === 'user' ? (settings.themeId === 'rainy-cat' ? 'text-white' : 'text-black') : (settings.themeId === 'rainy-cat' ? 'text-white/60' : 'text-green-600'),
                              playingMessageId === msg.timestamp && "animate-spin"
                            )} />
                            <span className={settings.themeId === 'rainy-cat' ? "text-white/60" : ""}>{msg.duration}"</span>
                            
                            {/* Fold/Unfold translation toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedVoiceMessages(prev => ({
                                  ...prev,
                                  [msg.timestamp]: !prev[msg.timestamp]
                                }));
                              }}
                              className={cn(
                                "ml-auto p-0.5 rounded hover:bg-black/10 transition-colors",
                                settings.themeId === 'rainy-cat' ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-600"
                              )}
                              title={expandedVoiceMessages[msg.timestamp] ? "隐藏文本" : "翻译成文本"}
                            >
                              {expandedVoiceMessages[msg.timestamp] ? (
                                <ChevronUp size={14} />
                              ) : (
                                <span className="text-[14px] font-bold opacity-70 leading-none">^</span>
                              )}
                            </button>
                          </div>
                          
                          {/* Translation Text Display */}
                          {expandedVoiceMessages[msg.timestamp] && (
                            <div className={cn(
                              "mt-1 text-sm p-2 rounded-lg border border-dashed",
                              settings.themeId === 'rainy-cat' 
                                ? "bg-white/5 border-white/10 text-white/80" 
                                : "bg-slate-50 border-slate-200 text-slate-600"
                            )}>
                              {msg.content}
                            </div>
                          )}
                        </div>
                      )}
                      {msg.type === 'transfer' && (
                        <div className="flex flex-col gap-1">
                          <div className={cn(
                            "p-3 rounded-lg min-w-[200px] transition-colors message-type-transfer",
                            settings.themeId === 'rainy-cat' 
                              ? "bg-white/10 border border-white/10 text-white" 
                              : (msg.transferStatus === 'received' ? 'bg-orange-200 text-orange-800' : 'bg-orange-500 text-white')
                          )}>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Wallet size={20} />
                              </div>
                              <div>
                                <div className="text-[10px] opacity-80">
                                  {msg.transferStatus === 'pending' ? '待收款' : msg.transferStatus === 'received' ? '已收款' : '已退还'}
                                </div>
                                <div className="text-lg font-bold">￥{msg.amount}</div>
                                {msg.description && <div className="text-[10px] opacity-90 mt-0.5">{msg.description}</div>}
                              </div>
                            </div>
                            <div className="text-[10px] border-t border-white/20 pt-1 flex justify-between items-center">
                              <span>微信支付</span>
                              {msg.role === 'assistant' && msg.transferStatus !== 'received' && (
                                <button 
                                  onClick={() => handleReceiveTransfer(i, 'receive')}
                                  className="bg-white text-orange-500 px-2 py-0.5 rounded text-[10px] font-bold active:scale-95 transition-transform"
                                >
                                  确认收钱
                                </button>
                              )}
                              {msg.transferStatus === 'received' && <span className="opacity-60 italic">已收钱</span>}
                            </div>
                          </div>
                          {msg.content && !msg.content.startsWith('转账 ￥') && (
                            <div className={cn(
                              "text-[10px] px-1 italic opacity-70",
                              msg.role === 'user' ? "text-right" : "text-left"
                            )}>
                              (对方心声: {msg.content})
                            </div>
                          )}
                        </div>
                      )}
                      {msg.type === 'blindbox-gift' && msg.giftData && (
                        <div className={cn(
                          "p-3 rounded-xl border max-w-[240px] shadow-sm",
                          settings.themeId === 'rainy-cat' ? "bg-white/10 border-white/10" : "bg-white border-slate-100"
                        )}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                              <Gift size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className={cn(
                                "text-xs font-bold truncate",
                                settings.themeId === 'rainy-cat' ? "text-white" : "text-slate-800"
                              )}>{msg.giftData.boxName}</p>
                              <p className={cn(
                                "text-[10px]",
                                settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-400"
                              )}>来自好友的礼物</p>
                            </div>
                          </div>
                          <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-slate-50 relative">
                            <img src={msg.giftData.coverUrl} className="w-full h-full object-cover" alt="Gift" />
                            {msg.giftData.isOpened && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                                <div className="bg-white/90 text-pink-500 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm transform -rotate-12 border border-pink-100">
                                  已拆开
                                </div>
                              </div>
                            )}
                          </div>
                          <p className={cn(
                            "text-[11px] italic mb-3 line-clamp-2",
                            settings.themeId === 'rainy-cat' ? "text-white/80" : "text-slate-600"
                          )}>"{msg.giftData.message}"</p>
                          <div className={cn(
                            "flex items-center justify-between pt-2 border-t",
                            settings.themeId === 'rainy-cat' ? "border-white/10" : "border-slate-50"
                          )}>
                            <span className="text-[10px] font-bold text-pink-500">¥{msg.giftData.price}</span>
                            <button 
                              onClick={() => !msg.giftData?.isOpened && handleReceiveGift(i)}
                              disabled={msg.giftData.isOpened || isLoading}
                              className={cn(
                                "text-[10px] font-bold px-3 py-1 rounded-full transition-all",
                                msg.giftData.isOpened 
                                  ? "text-slate-400 bg-slate-100" 
                                  : "text-white bg-pink-500 hover:bg-pink-600 active:scale-95 shadow-sm shadow-pink-200"
                              )}
                            >
                              {msg.giftData.isOpened ? '已打开' : '接收'}
                            </button>
                          </div>
                        </div>
                      )}
                      {msg.type === 'shopping-receipt' && msg.giftData && (() => {
                        const isMeituan = msg.giftData.source === 'mt' || msg.content?.includes('美团');
                        const headerEn = isMeituan ? 'MEITUAN SHOP MAGAZINE' : 'TAOBAO SHOP MAGAZINE';
                        const headerZh = isMeituan ? '美 团 购 物 小 票' : '淘 宝 购 物 小 票';
                        return (
                          <div className="p-4 rounded-2xl border max-w-[280px] shadow-sm font-mono relative bg-[#fffdf9] text-slate-800 border-[#e5dfd3]">
                            <div className="text-center pb-2 border-b border-dashed border-slate-300">
                              <p className="text-[10px] tracking-widest font-black uppercase text-slate-500">{headerEn}</p>
                              <p className="text-xs font-black tracking-wider text-slate-900 mt-0.5">{headerZh}</p>
                              <p className="text-[9px] text-slate-400 mt-1">
                                {new Date(msg.timestamp).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          
                          <div className="py-2.5 space-y-1 text-xs border-b border-dashed border-slate-300">
                            <div className="flex justify-between font-bold text-slate-500 text-[10px]">
                              <span>商品名称</span>
                              <span>数量 / 金额</span>
                            </div>
                            <div className="flex justify-between items-start pt-1">
                              <span className="font-bold text-slate-900 truncate max-w-[150px]">{msg.giftData.boxName}</span>
                              <span className="font-bold text-slate-900">01 / ¥{msg.giftData.price}</span>
                            </div>
                            {msg.description && (
                              <p className="text-[10px] text-slate-500 truncate">{msg.description}</p>
                            )}
                          </div>

                          <div className="py-2 space-y-1 text-xs border-b border-dashed border-slate-300">
                            <div className="flex justify-between text-slate-600 text-[11px]">
                              <span>小计</span>
                              <span className="font-bold">¥{msg.giftData.price}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 text-[11px]">
                              <span>税收 / 运费 (0%)</span>
                              <span>¥0.00</span>
                            </div>
                            <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-dotted border-slate-200">
                              <span>账单总额</span>
                              <span className="text-orange-600">¥{msg.giftData.price}</span>
                            </div>
                          </div>

                          {msg.giftData.message && (
                            <div className="py-2 text-[11px] italic text-slate-600 border-b border-dashed border-slate-300 bg-amber-50/50 p-2 rounded-lg mt-2">
                              " {msg.giftData.message} "
                            </div>
                          )}

                          <div className="pt-3 flex justify-between items-end">
                            <div>
                              <p className="text-[9px] text-slate-400">SIGNATURE</p>
                              <p className="text-xs font-serif italic font-bold text-slate-800">Shop Magazine.</p>
                            </div>
                            <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded-full font-bold">已赠送</span>
                          </div>
                        </div>
                      );
                    })()}
                      {msg.type === 'location' && (
                        <div className={cn(
                          "rounded-lg overflow-hidden border transition-all duration-300 min-w-[200px]",
                          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white border-slate-100"
                        )}>
                          <div className="p-2">
                            <div className={cn(
                              "font-bold text-sm truncate transition-all duration-300",
                              settings.themeId === 'rainy-cat' ? "text-white" : "text-black"
                            )}>{msg.content}</div>
                            <div className={cn(
                              "text-[10px] transition-all duration-300",
                              settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-500"
                            )}>{msg.locationName}</div>
                          </div>
                          <div className={cn(
                            "h-24 flex items-center justify-center transition-all duration-300",
                            settings.themeId === 'rainy-cat' ? "bg-white/5" : "bg-slate-100"
                          )}>
                            <MapPin size={24} className={cn(
                              "transition-all duration-300",
                              settings.themeId === 'rainy-cat' ? "text-white/60" : "text-red-500"
                            )} />
                          </div>
                        </div>
                      )}
                      {msg.type === 'call' && (
                        <div className="flex items-center gap-3 py-1 px-2">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                            settings.themeId === 'rainy-cat' 
                              ? "bg-white/10 text-white/60" 
                              : (msg.callStatus === 'missed' || msg.callStatus === 'rejected' ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500')
                          )}>
                            {msg.callStatus === 'missed' || msg.callStatus === 'rejected' ? <PhoneOff size={16} /> : <Video size={16} />}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{msg.content}</span>
                            <span className={cn(
                              "text-[10px] transition-all duration-300",
                              settings.themeId === 'rainy-cat' ? "text-white/40" : "opacity-60"
                            )}>视频通话</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Bubble tail */}
                  <div className={cn(
                    "absolute top-3 w-2 h-2 rotate-45",
                    (settings.activeChatThemeId || settings.themeId === 'rainy-cat' || (isOfflineMode && (!msg.type || msg.type === 'text'))) ? "hidden" : (msg.role === 'user' ? "-right-1 bg-pink-100" : "-left-1 bg-white"),
                    (msg.type === 'image' || msg.type === 'video' || msg.type === 'transfer' || msg.type === 'location') && "hidden"
                  )} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
        {isLoading && (
            <div className="flex justify-start">
              <div className={cn(
                "p-2.5 rounded-lg shadow-sm flex gap-1.5 transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border border-white/10" : "bg-white"
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full animate-bounce transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-white/40" : "bg-slate-400"
                )} />
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full animate-bounce delay-150 transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-white/40" : "bg-slate-400"
                )} />
                <span className={cn(
                  "text-[10px] ml-1 transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
                )}>对方正在输入...</span>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Sparkle Modal */}
      <AnimatePresence>
        {activeModal === 'image-preview' && previewImageUrl && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-4" onClick={() => setActiveModal(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative max-w-full max-h-full flex flex-col items-center gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={previewImageUrl} 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" 
                referrerPolicy="no-referrer"
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => handleDownloadImage(previewImageUrl)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center gap-2 backdrop-blur-md border border-white/20 transition-all active:scale-95"
                >
                  <Download size={18} />
                  <span>保存到相册</span>
                </button>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center gap-2 backdrop-blur-md border border-white/20 transition-all active:scale-95"
                >
                  <X size={18} />
                  <span>关闭预览</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === 'character-image-gen' && (
          <CharacterImageSettings 
            friend={friend} 
            onUpdateFriend={onUpdateFriend} 
            settings={settings} 
            onClose={() => setActiveModal(null)} 
          />
        )}

        {activeModal === 'sparkle' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#FCFBF7] rounded-[2.5rem] w-full max-w-sm overflow-hidden border-4 border-[#2D2D2D] relative shadow-[8px_8px_0px_0px_rgba(45,45,45,1)]"
            >
              {/* Decorative top strip */}
              <div className="bg-[#2D2D2D] text-[#FCFBF7] text-[8px] font-black uppercase tracking-[0.2em] py-1 text-center font-mono">
                ✦ SPECIAL ISSUE // HEARTFELT DIARY ✦
              </div>
              
              <div className="p-6 relative z-10 space-y-5">
                {/* Header Row: Cute Magazine Profile Card */}
                <div className="flex items-center gap-4 border-b-2 border-dashed border-[#2D2D2D] pb-4">
                  <div className="relative shrink-0">
                    <img 
                      src={friend.avatar} 
                      className="w-18 h-18 rounded-3xl border-3 border-[#2D2D2D] object-cover shadow-[3px_3px_0px_0px_rgba(45,45,45,0.15)] bg-slate-100" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-[#FFF0F3] border-2 border-[#2D2D2D] p-1 rounded-full shadow-sm animate-pulse">
                      <Sparkles className="text-[#FF4D6D]" size={12} />
                    </div>
                  </div>
                  
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-xl font-extrabold text-[#2D2D2D] truncate">{friend.name}</h3>
                    <div className="inline-block px-2.5 py-0.5 bg-[#FFF0F3] border-2 border-[#2D2D2D] rounded-full text-[10px] font-black text-[#FF4D6D] shadow-[1px_1px_0px_0px_rgba(45,45,45,1)]">
                      {friend.mood || '今日晴朗'}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="space-y-4">
                  {/* Affection Level Section (Percentage-based, Cute Badge) */}
                  {(() => {
                    const currentAff = typeof friend.affection === 'number' ? friend.affection : getInitialAffection(friend, settings);
                    const lvlInfo = getAffectionLevelInfo(currentAff);
                    return (
                      <div className="bg-[#FFF0F3] border-3 border-[#2D2D2D] rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] relative overflow-hidden">
                        <div className="absolute top-1.5 right-2 bg-white/40 text-[9px] font-black uppercase text-[#FF4D6D] tracking-wide px-1.5 py-0.5 rounded-md border border-[#FF4D6D]/20">
                          Affection
                        </div>
                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="text-3xl font-black text-[#FF4D6D] font-mono tracking-tight">
                              {currentAff.toFixed(1)}%
                            </span>
                          </div>
                          <span className="text-[10px] font-black bg-[#2D2D2D] text-white px-2 py-0.5 rounded-md">
                            {lvlInfo.text}
                          </span>
                        </div>
                        <div className="mt-2.5 space-y-1">
                          <div className="h-4 bg-white rounded-lg overflow-hidden border-2 border-[#2D2D2D] p-0.5 relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(currentAff, 100)}%` }}
                              transition={{ type: 'spring', damping: 15 }}
                              className="h-full bg-gradient-to-r from-[#FF758F] to-[#FF4D6D] rounded-[4px]"
                            />
                          </div>
                          <div className="flex justify-between text-[8px] font-black text-[#FF4D6D] uppercase tracking-wider px-0.5">
                            <span>0%</span>
                            <span>{lvlInfo.name}</span>
                            <span>100%+</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bento Grid layout */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Mood Index Card */}
                    <div className="bg-[#FFF9E6] border-2 border-[#2D2D2D] rounded-xl p-3 shadow-[3px_3px_0px_0px_rgba(45,45,45,1)] flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[#2D2D2D]/60">
                        <Smile size={12} className="text-[#FFB703]" />
                        <span className="text-[9px] font-black uppercase tracking-wider">心情指数</span>
                      </div>
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#2D2D2D] font-mono">
                          {friend.moodIndex ?? 85}%
                        </span>
                        <span className="text-xs font-bold">
                          {(friend.moodIndex ?? 85) >= 80 ? '😆' : (friend.moodIndex ?? 85) >= 50 ? '🙂' : '🥺'}
                        </span>
                      </div>
                    </div>

                    {/* Currently Doing Card */}
                    <div className="bg-[#EAF4FF] border-2 border-[#2D2D2D] rounded-xl p-3 shadow-[3px_3px_0px_0px_rgba(45,45,45,1)] flex flex-col justify-between">
                      <div className="flex items-center gap-1.5 text-[#2D2D2D]/60">
                        <History size={12} className="text-[#3A86FF]" />
                        <span className="text-[9px] font-black uppercase tracking-wider">正在忙碌</span>
                      </div>
                      <p className="mt-1 text-[10px] font-black text-[#2D2D2D] leading-tight max-h-24 overflow-y-auto custom-scrollbar pr-1">
                        {(() => {
                          const schedule = characterSchedules[friend.id];
                          if (schedule && schedule.items) {
                            const now = new Date();
                            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                            const currentTask = schedule.items.find((item: any, idx: number) => {
                              const nextItem = schedule.items[idx + 1];
                              return currentTime >= item.time && (!nextItem || currentTime < nextItem.time);
                            });
                            return currentTask ? currentTask.task : '正在休息中...';
                          }
                          return '正在想你呢...';
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Inner Thoughts (内心想法 - Newly Added Cute Design Section!) */}
                  <div className="bg-white border-3 border-[#2D2D2D] rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] relative overflow-hidden">
                    <div className="absolute -top-1 right-2 bg-[#FF4D6D] text-white text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-b-md">
                      INNER THOUGHTS
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <span>内心独白</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    </div>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed italic bg-[#FCFBF7]/50 p-2.5 rounded-xl border border-dashed border-slate-200 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                      「 {friend.innerThoughts || '本来想约你一起去看落日的，但是感觉有点不好意思开口…… (o>_<o)'} 」
                    </p>
                  </div>
                </div>

                {/* Footer Action Button */}
                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-full py-3 bg-[#FF4D6D] text-white rounded-xl border-3 border-[#2D2D2D] font-black text-sm shadow-[3px_3px_0px_0px_rgba(45,45,45,1)] hover:translate-y-0.5 hover:shadow-[1.5px_1.5px_0px_0px_rgba(45,45,45,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                  太可爱了！
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quoted Message Preview */}
      {quotedMessage && (
        <div className="px-4 py-2 bg-white border-t flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0 border-l-4 border-pink-400 pl-3 py-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">引用自 {quotedMessage.role === 'user' ? '我' : friend.name}</p>
            <p className="text-xs text-slate-600 truncate">{quotedMessage.content}</p>
          </div>
          <button onClick={() => setQuotedMessage(null)} className="p-1 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Multi-select Bottom Bar */}
      <AnimatePresence>
        {isMultiSelectMode && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 p-4 pb-8 z-[100] flex justify-around items-center"
          >
            <button 
              onClick={() => {
                setIsMultiSelectMode(false);
                setSelectedMessages([]);
              }}
              className="flex flex-col items-center gap-1 text-slate-500"
            >
              <X size={20} />
              <span className="text-[10px]">取消</span>
            </button>
            <button 
              onClick={() => {
                if (selectedMessages.length === 0) return;
                handleForward(selectedMessages[0], 'merged');
                setIsMultiSelectMode(false);
                setSelectedMessages([]);
              }}
              className="flex flex-col items-center gap-1 text-slate-700"
            >
              <Forward size={20} />
              <span className="text-[10px]">合并转发</span>
            </button>
            <button 
              onClick={() => {
                if (selectedMessages.length === 0) return;
                // Simple bulk delete
                const newMsgs = currentMessages.filter((_, idx) => !selectedMessages.includes(idx));
                if (isOfflineMode) {
                  setOfflineMessages(newMsgs);
                } else {
                  // This would need a bulk delete API, for now just clear locally
                  showToast('多选删除成功');
                }
                setIsMultiSelectMode(false);
                setSelectedMessages([]);
              }}
              className="flex flex-col items-center gap-1 text-red-500"
            >
              <Trash2 size={20} />
              <span className="text-[10px]">删除</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar */}
      {!isMultiSelectMode && (
        <div className={cn(
          "border-t p-3 pb-6 relative transition-all duration-300 chat-window-footer",
          settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl border-white/10" : (settings.activeChatThemeId ? "bg-transparent border-transparent" : (settings.appBackgroundUrl ? "bg-white/10 backdrop-blur-md border-slate-200/20" : "bg-[#f7f7f7] border-slate-200"))
        )} style={settings.appBackgroundUrl && !settings.activeChatThemeId ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (settings.chatWallpaperOpacity ?? 0.8) * 0.2)})` } : {}}>
        {isRecording && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-4 rounded-2xl flex flex-col items-center gap-2 z-50">
            <Mic size={40} className="animate-pulse text-green-400" />
            <span className="text-sm font-medium">正在录音 {recordingTime}s</span>
            <span className="text-[10px] opacity-60">松开发送，上滑取消</span>
          </div>
        )}

        {isOfflineMode ? (
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => setShowOfflineRefreshMenu(!showOfflineRefreshMenu)}
              className={cn(
                "p-2 rounded-full transition-colors shrink-0",
                settings.themeId === 'rainy-cat' ? "text-white/60 hover:bg-white/10" : "text-slate-600 hover:bg-slate-200"
              )}
            >
              <RefreshCw size={22} />
            </button>
            
            <AnimatePresence>
              {showOfflineRefreshMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className={cn(
                    "absolute bottom-full left-0 mb-2 w-36 rounded-xl shadow-xl border overflow-hidden z-50",
                    settings.themeId === 'rainy-cat' ? "bg-black/80 backdrop-blur-xl border-white/10" : "bg-white border-slate-100"
                  )}
                >
                  <button
                    onClick={() => { setShowOfflineRefreshMenu(false); handleGenerate('continue'); }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2",
                      settings.themeId === 'rainy-cat' ? "text-white hover:bg-white/10" : "text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    <Type size={16} /> 继续生成
                  </button>
                  <button
                    onClick={() => { setShowOfflineRefreshMenu(false); handleGenerate('regenerate'); }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 border-t",
                      settings.themeId === 'rainy-cat' ? "text-white hover:bg-white/10 border-white/10" : "text-slate-800 hover:bg-slate-50 border-slate-100"
                    )}
                  >
                    <RefreshCw size={16} /> 重新生成
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                "p-2 rounded-full transition-all active:scale-95 shrink-0 flex flex-col items-center gap-0.5 disabled:opacity-40",
                settings.themeId === 'rainy-cat' 
                  ? "bg-white/10 text-white/80" 
                  : "text-slate-600 hover:bg-slate-200 hover:text-slate-800"
              )}
              title="发送剧情卡片"
            >
              <Send size={18} />
              <span className="text-[8px] font-bold">发送</span>
            </button>
            
            <div className={cn(
              "flex-1 flex flex-col rounded-xl transition-all duration-300 overflow-hidden",
              settings.isDarkThemeEnabled ? "bg-white/5 border border-white/10" : 
              (settings.isCuteRabbitThemeEnabled ? "bg-white border-2 border-pink-200" : (settings.themeId === 'rainy-cat' ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200"))
            )}>
              <div className="flex items-center px-3 py-1 gap-2 border-b border-slate-100/50">
                <button
                  onClick={() => setIsNarration(!isNarration)}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded transition-all",
                    isNarration 
                      ? "bg-orange-500 text-white shadow-sm" 
                      : (settings.themeId === 'rainy-cat' ? "bg-white/10 text-white/40 hover:bg-white/20" : "bg-slate-100 text-slate-400 hover:bg-slate-200")
                  )}
                  title={isNarration ? "当前为旁白模式（内容将自动添加括号）" : "当前为对话模式"}
                >
                  {isNarration ? "旁白模式 ON" : "对话模式"}
                </button>
                <div className="flex-1" />
                <span className="text-[9px] text-slate-300 italic">小说式创作模式</span>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 text-[15px] focus:outline-none bg-transparent min-w-0 resize-none h-[60px] custom-scrollbar leading-relaxed",
                  settings.themeId === 'rainy-cat' ? "text-white placeholder-white/30" : "text-black"
                )}
                placeholder={isNarration ? "输入环境、动作或心理活动描写..." : "在此输入你要写下的剧情对话或旁白..."}
                style={{ maxHeight: '150px' }}
              />
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className={cn(
                "p-2 rounded-full disabled:opacity-50 flex items-center justify-center transition-all active:scale-95 shrink-0 transition-colors",
                settings.themeId === 'rainy-cat' ? "text-white hover:bg-white/10" : "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
              )}
              title="生成回复"
            >
              <Sparkles size={20} className={cn(isLoading && "animate-pulse")} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsVoiceMode(!isVoiceMode)}
              className={cn(
                "p-1.5 rounded-full transition-colors shrink-0",
                settings.themeId === 'rainy-cat' ? "text-white/60 hover:bg-white/10" : "text-slate-600 hover:bg-slate-200"
              )}
            >
              {isVoiceMode ? <Keyboard size={24} /> : <Mic size={24} />}
            </button>
            
            <div className={cn(
              "flex-1 flex items-center rounded-md transition-all duration-300 overflow-hidden",
              settings.isDarkThemeEnabled ? "bg-white/5 border border-white/10" : 
              (settings.isCuteRabbitThemeEnabled ? "bg-white border-2 border-pink-200" : (settings.themeId === 'rainy-cat' ? "bg-white/5 border border-white/10" : "bg-white border border-slate-200"))
            )}>
              {isVoiceMode ? (
                <button
                  onMouseDown={handleVoiceStart}
                  onMouseUp={handleVoiceEnd}
                  onMouseLeave={handleVoiceEnd}
                  onTouchStart={(e) => { e.preventDefault(); handleVoiceStart(); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleVoiceEnd(); }}
                  className={cn(
                    "w-full py-1.5 text-sm font-bold transition-all active:bg-slate-100",
                    isRecording ? "bg-slate-200" : "bg-transparent",
                    settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-700"
                  )}
                >
                  {isRecording ? '松开发送' : '按住 说话'}
                </button>
              ) : (
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className={cn(
                    "w-full px-2 py-1.5 text-[16px] focus:outline-none bg-transparent min-w-0",
                    settings.themeId === 'rainy-cat' ? "text-white placeholder-white/30" : "text-black"
                  )}
                  placeholder=""
                />
              )}
            </div>

            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={cn("p-1 transition-colors shrink-0", 
                settings.themeId === 'rainy-cat' 
                  ? (showEmojiPicker ? "text-white" : "text-white/40") 
                  : (showEmojiPicker ? "text-green-600" : "text-slate-400")
              )}
            >
              <Smile size={20} />
            </button>

            <button 
              onClick={() => {
                setShowFeatures(!showFeatures);
                setShowEmojiPicker(false);
              }}
              className={cn(
                "p-1.5 rounded-full transition-all duration-300 shrink-0",
                settings.themeId === 'rainy-cat'
                  ? (showFeatures ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10")
                  : (showFeatures ? "bg-slate-200 text-slate-800" : "text-slate-600 hover:bg-slate-200")
              )}
            >
              <PlusCircle size={24} />
            </button>

            <button
              onClick={() => handleGenerate()}
              disabled={isLoading}
              className={cn(
                "p-1.5 rounded-full disabled:opacity-50 flex items-center justify-center transition-all active:scale-95 shrink-0 transition-colors",
                settings.themeId === 'rainy-cat' ? "text-white hover:bg-white/10" : "text-slate-600 hover:text-slate-800 hover:bg-slate-200"
              )}
              title="生成回复"
            >
              <Sparkles size={20} className={cn(isLoading && "animate-pulse")} />
            </button>

            {input.trim() && !isVoiceMode && (
              <button
                onClick={handleSend}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium active:opacity-80 transition-all duration-300 shrink-0",
                  settings.themeId === 'rainy-cat' ? "bg-white/20 text-white border border-white/20" : "bg-[#07c160] text-white"
                )}
              >
                发送
              </button>
            )}
          </div>
        )}

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 320, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "flex flex-col mt-2 rounded-t-xl transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl border-t border-white/10" : "bg-white"
              )}
            >
              {/* Tabs */}
              <div className={cn(
                "flex border-b",
                settings.themeId === 'rainy-cat' ? "border-white/10" : "border-slate-100"
              )}>
                <button 
                  onClick={() => setStickerTab('emoji')}
                  className={cn(
                    "flex-1 py-2 flex items-center justify-center transition-all", 
                    stickerTab === 'emoji' 
                      ? (settings.themeId === 'rainy-cat' ? "text-white border-b-2 border-white" : "text-green-600 border-b-2 border-green-600") 
                      : "text-slate-400"
                  )}
                >
                  <Smile size={20} />
                </button>
                <button 
                  onClick={() => setStickerTab('custom')}
                  className={cn(
                    "flex-1 py-2 flex items-center justify-center transition-all", 
                    stickerTab === 'custom' 
                      ? (settings.themeId === 'rainy-cat' ? "text-white border-b-2 border-white" : "text-pink-500 border-b-2 border-pink-500") 
                      : "text-slate-400"
                  )}
                >
                  <Heart size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {stickerTab === 'emoji' ? (
                  <div className="grid grid-cols-8 gap-2 p-4">
                    {emojis.map((emoji, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(prev => prev + emoji)}
                        className={cn(
                          "text-2xl rounded p-1 transition-colors",
                          settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-100"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex justify-between items-end mb-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowStickerImport('url')}
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold",
                              settings.themeId === 'rainy-cat' ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
                            )}
                          >
                            URL导入
                          </button>
                          <button 
                            onClick={() => stickerFileInputRef.current?.click()}
                            className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold",
                              settings.themeId === 'rainy-cat' ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600"
                            )}
                          >
                            相册导入
                          </button>
                        </div>
                        <span className="text-[9px] text-slate-400 opacity-60 ml-0.5">自定义表情所有角色通用</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (stickerDeleteMode) {
                            handleDeleteStickers();
                          } else {
                            setStickerDeleteMode(true);
                          }
                        }}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold",
                          stickerDeleteMode ? "bg-red-500 text-white" : (settings.themeId === 'rainy-cat' ? "bg-white/10 text-white" : "bg-slate-100 text-slate-600")
                        )}
                      >
                        {stickerDeleteMode ? `确认删除(${selectedStickers.length})` : '批量删除'}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <button 
                        onClick={() => stickerFileInputRef.current?.click()}
                        className={cn(
                          "aspect-square border-2 border-dashed rounded-xl flex items-center justify-center transition-all",
                          settings.themeId === 'rainy-cat' ? "border-white/20 text-white/40 hover:border-white/60 hover:text-white/60" : "border-slate-200 text-slate-400 hover:border-pink-300 hover:text-pink-300"
                        )}
                      >
                        <Plus size={24} />
                      </button>
                      {(settings.customStickers || []).map((sticker, idx) => (
                        <div key={`${sticker.id}-${idx}`} className="relative group aspect-square">
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
                              "w-full h-full rounded-xl overflow-hidden border-2 transition-all",
                              selectedStickers.includes(sticker.id) ? "border-red-500 scale-95" : "border-transparent"
                            )}
                          >
                            <img src={sticker.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
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

        {/* Feature Panel */}
        <AnimatePresence>
          {showFeatures && (
            <motion.div
              key="feature-panel-motion"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "overflow-hidden transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl border-t border-white/10" : ""
              )}
            >
              <div className="grid grid-cols-4 gap-4 p-4 mt-2">
                {features.map((feature, idx) => (
                  <button
                    key={idx}
                    onClick={feature.onClick}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all group-active:scale-95",
                      settings.themeId === 'rainy-cat' ? "bg-white/10 border border-white/10" : "bg-white group-active:bg-slate-100"
                    )}>
                      <feature.icon size={28} className={cn(
                        settings.themeId === 'rainy-cat' ? "text-white/60" : feature.color
                      )} />
                    </div>
                    <span className={cn(
                      "text-[11px]",
                      settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-600"
                    )}>{feature.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

        {/* Edit Message Modal */}
        <AnimatePresence>
          {activeModal === 'edit-message' && (
            <div key="edit-message-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-black/80 border-white/10 text-white" : "bg-white border-slate-200"
                )}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Edit3 size={18} className="text-blue-500" />
                  <h3 className="font-bold text-lg">编辑消息内容</h3>
                </div>
                <textarea 
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  rows={6}
                  className={cn(
                    "w-full px-4 py-3 rounded-2xl text-sm focus:outline-none border transition-all resize-none mb-6",
                    settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
                  )}
                  placeholder="编辑气泡内容或旁白文字..."
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    className={cn(
                      "flex-1 py-3 rounded-2xl font-bold transition-all active:scale-95 text-sm",
                      settings.themeId === 'rainy-cat' ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-3 rounded-2xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm"
                  >
                    保存修改
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Forward Modal */}
        <AnimatePresence>
          {showForwardModal && (
            <div key="forward-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-black/80 border-white/10 text-white" : "bg-white border-slate-200"
                )}
              >
                <div className="p-4 border-b flex justify-between items-center">
                  <span className="font-bold">选择转发对象</span>
                  <button onClick={() => setShowForwardModal(null)}><X size={20} /></button>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {friends.filter(f => f.id !== friend.id).map((f, idx) => (
                    <button
                      key={`${f.id}-${idx}`}
                      onClick={() => {
                        const msg = currentMessages[showForwardModal.messageIndex];
                        const forwardMsg: ChatMessage = {
                          ...msg,
                          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                          timestamp: Date.now(),
                          role: 'user',
                          isForwarded: true,
                          forwardFrom: friend.name
                        };
                        // Here we would normally call a global addMessage, but for now we'll just show a toast
                        showToast(`已转发给 ${f.name}`);
                        setShowForwardModal(null);
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors"
                    >
                      <img src={f.avatar} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="font-medium">{f.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Heartfelt Modal */}
        <AnimatePresence>
          {showHeartfelt && (
            <div key="heartfelt-overlay" className="fixed inset-0 z-[2000000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={() => setShowHeartfelt(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "w-full max-w-sm rounded-3xl p-6 shadow-2xl border relative transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-black/80 border-white/10 text-white" : "bg-white border-slate-200"
                )}
              >
                <button 
                  onClick={() => setShowHeartfelt(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
                >
                  <X size={20} className="opacity-40" />
                </button>

                <div className="flex items-center gap-2 mb-4">
                  <Brain size={20} className="text-purple-500" />
                  <h3 className="font-bold text-lg">{friend.name}的内心独白</h3>
                </div>
                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar pr-1 mb-6">
                  <p className="text-sm leading-relaxed italic opacity-80">
                    “{showHeartfelt.content}”
                  </p>
                </div>
                <button
                  onClick={() => setShowHeartfelt(null)}
                  className={cn(
                    "w-full py-3 rounded-2xl font-bold transition-all active:scale-95",
                    settings.themeId === 'rainy-cat' ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200"
                  )}
                >
                  我知道了
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Offline Settings Full Page View */}
        <AnimatePresence>
          {showOfflineSettings && (
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed inset-0 z-[1000] flex flex-col pt-8 sm:pt-6",
                settings.themeId === 'rainy-cat' ? "bg-black text-white" : "bg-white text-slate-800"
              )}
            >
              <div className="px-4 py-3 flex items-center justify-between border-b shrink-0 shadow-sm">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setShowOfflineSettings(false)}
                    className="p-1 hover:bg-black/5 rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-base leading-tight">线下剧情设置</h3>
                    <p className="text-[10px] opacity-50">自定义属于你们的线下小说交互设定</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={saveOfflineConfig}
                  className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                >
                  保存
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                  {/* Location & Opening */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">当前所在地点</label>
                      <input 
                        type="text" 
                        placeholder="例如：咖啡厅、游乐园..."
                        value={offlineConfig.location}
                        onChange={(e) => setOfflineConfig(prev => ({ ...prev, location: e.target.value }))}
                        className={cn(
                          "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all",
                          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500">剧情开场台词/设定</label>
                      <input 
                        type="text" 
                        placeholder="例如：你悄悄走到我身后拍了拍我..."
                        value={offlineConfig.openingLine}
                        onChange={(e) => setOfflineConfig(prev => ({ ...prev, openingLine: e.target.value }))}
                        className={cn(
                          "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all",
                          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200"
                        )}
                      />
                    </div>
                  </div>

                  {/* World Book Integration Control */}
                  <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-600">世界书携带控制</h4>
                        <p className="text-[10px] text-slate-400">线下剧情默认不携带世界书，开启后可自主勾选要注入的世界书</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setOfflineConfig(prev => ({ ...prev, worldBookEnabled: !prev.worldBookEnabled }))}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          offlineConfig.worldBookEnabled ? "bg-orange-500" : "bg-slate-300"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          offlineConfig.worldBookEnabled ? "right-1" : "left-1"
                        )} />
                      </button>
                    </div>

                    {offlineConfig.worldBookEnabled && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">选择线下剧情要读取的世界书条目</p>
                        {(!settings.worldBookEntries || settings.worldBookEntries.length === 0) ? (
                          <p className="text-xs text-slate-400 text-center py-4">暂无世界书条目，请先在“世界书”应用中添加设定。</p>
                        ) : (
                          <div className="space-y-2">
                            {settings.worldBookEntries.map(wb => {
                              const isSelected = (offlineConfig.selectedWorldBookIds || []).includes(wb.id);
                              return (
                                <div 
                                  key={wb.id}
                                  onClick={() => {
                                    const currentIds = offlineConfig.selectedWorldBookIds || [];
                                    const newIds = isSelected 
                                      ? currentIds.filter(id => id !== wb.id)
                                      : [...currentIds, wb.id];
                                    setOfflineConfig(prev => ({ ...prev, selectedWorldBookIds: newIds }));
                                  }}
                                  className={cn(
                                    "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                                    isSelected ? "bg-orange-50/50 border-orange-300" : "bg-white border-slate-200"
                                  )}
                                >
                                  <div className="pr-2 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-800">{wb.name}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">{wb.category}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{wb.content}</p>
                                  </div>
                                  <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center",
                                    isSelected ? "bg-orange-500 border-orange-500 text-white" : "border-slate-300"
                                  )}>
                                    {isSelected && <Check size={12} />}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Context Count Selection */}
                  <div className="space-y-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-extrabold text-slate-600">剧情卡片主题</label>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                          {offlineConfig.cardTheme === 'classic' ? '经典杂志' : 
                           offlineConfig.cardTheme === 'student' ? '学生卡' : 
                           offlineConfig.cardTheme === 'glass' ? '毛玻璃' : '时间轴'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'classic', name: '经典', Icon: LayoutTemplate },
                          { id: 'student', name: '学生', Icon: Contact },
                          { id: 'glass', name: '玻璃', Icon: Sparkles },
                          { id: 'time', name: '时间', Icon: Clock }
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setOfflineConfig(prev => ({ ...prev, cardTheme: t.id as any }))}
                            className={cn(
                              "flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all active:scale-95",
                              offlineConfig.cardTheme === t.id 
                                ? "bg-white border-blue-500 shadow-sm ring-4 ring-blue-500/10" 
                                : "bg-transparent border-transparent hover:bg-white/50"
                            )}
                          >
                            <div className={cn(
                              "transition-colors",
                              offlineConfig.cardTheme === t.id ? "text-blue-500" : "text-slate-400"
                            )}>
                              <t.Icon 
                                size={18} 
                                strokeWidth={2.5}
                                className={offlineConfig.cardTheme === t.id ? "text-blue-500" : "text-slate-400/60"} 
                              />
                            </div>
                            <span className={cn(
                              "text-[10px] font-black tracking-tight",
                              offlineConfig.cardTheme === t.id ? "text-blue-600" : "text-slate-500/80"
                            )}>{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-extrabold text-slate-600">读取线上聊天上下文条数</label>
                        <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                          {offlineConfig.onlineContextCount} 条
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      进入线下剧情后，角色会携带你设置的线上聊天记录作为前置记忆（上限200条）。
                    </p>
                    <input 
                      type="range" 
                      min="0" 
                      max="200" 
                      step="5"
                      value={offlineConfig.onlineContextCount}
                      onChange={(e) => setOfflineConfig(prev => ({ ...prev, onlineContextCount: parseInt(e.target.value) }))}
                      className="w-full accent-orange-500 mt-1"
                    />
                  </div>

                  {/* Perspective Selection */}
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-xs font-extrabold text-slate-600 block">旁白人称设定</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold">角色人称</span>
                        <select 
                          value={offlineConfig.characterPerspective}
                          onChange={(e) => setOfflineConfig(prev => ({ ...prev, characterPerspective: e.target.value }))}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all appearance-none bg-white",
                            settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "border-slate-200 text-slate-700"
                          )}
                        >
                          <option value="第一人称">第一人称 (我)</option>
                          <option value="第二人称">第二人称 (你)</option>
                          <option value="第三人称">第三人称 (他/她)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold">用户人称</span>
                        <select 
                          value={offlineConfig.userPerspective}
                          onChange={(e) => setOfflineConfig(prev => ({ ...prev, userPerspective: e.target.value }))}
                          className={cn(
                            "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all appearance-none bg-white",
                            settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "border-slate-200 text-slate-700"
                          )}
                        >
                          <option value="第一人称">第一人称 (我)</option>
                          <option value="第二人称">第二人称 (你)</option>
                          <option value="第三人称">第三人称 (他/她)</option>
                        </select>
                      </div>
                    </div>

                    {/* Perspective Live Example Preview */}
                    {(() => {
                      const charWord = offlineConfig.characterPerspective === '第一人称' ? '我' : (offlineConfig.characterPerspective === '第二人称' ? '你' : (friend.gender === 'female' ? '她' : '他'));
                      const userWord = offlineConfig.userPerspective === '第一人称' ? '我' : (offlineConfig.userPerspective === '第二人称' ? '你' : (friend.gender === 'female' ? '他' : '她'));
                      return (
                        <div className="mt-2 p-3 rounded-xl border text-xs font-serif bg-white border-slate-100 flex flex-col gap-1 shadow-inner">
                          <span className="font-sans font-bold text-slate-400 text-[10px]">旁白叙事预览：</span>
                          <span className="text-slate-700 font-medium">{charWord}看着{userWord}，摇了摇头：“没什么事。”</span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Writing Style Selection */}
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-600 block">剧情文风选择</label>
                      {offlineConfig.writingStyle && (
                        <button
                          type="button"
                          onClick={() => setOfflineConfig(prev => ({ ...prev, writingStyle: '' }))}
                          className="text-[10px] text-orange-600 hover:text-orange-700 font-bold underline"
                        >
                          取消当前文风 (恢复系统自由)
                        </button>
                      )}
                    </div>
                    
                    {/* Built-in Styles */}
                    <div className="grid grid-cols-2 gap-2">
                      {['白描文风', '现代口语化文风', '言情小说文风', '诗意古风文风'].map(style => (
                        <button
                          key={style}
                          type="button"
                          onClick={() => setOfflineConfig(prev => ({ 
                            ...prev, 
                            writingStyle: prev.writingStyle === style ? '' : style 
                          }))}
                          className={cn(
                            "py-2 px-3 rounded-xl text-xs font-bold transition-all border text-left flex flex-col gap-0.5",
                            offlineConfig.writingStyle === style
                              ? "bg-orange-500 border-orange-600 text-white shadow-md shadow-orange-500/20"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <span>{style}</span>
                          <span className={cn(
                            "text-[9px] font-normal leading-normal",
                            offlineConfig.writingStyle === style ? "text-orange-100" : "text-slate-400"
                          )}>
                            {style === '白描文风' && '极简写意，神态勾勒'}
                            {style === '现代口语化文风' && '松弛语气，朝气口语'}
                            {style === '言情小说文风' && '拉扯悸动，极致唯美'}
                            {style === '诗意古风文风' && '古雅画卷，含蓄隽永'}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Custom presets */}
                    {offlineConfig.writingStylePresets && offlineConfig.writingStylePresets.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold block">自定义文风预设 (点击应用/取消，支持编辑与删除)</span>
                        <div className="flex flex-wrap gap-2">
                          {offlineConfig.writingStylePresets.map((preset: any, idx: number) => (
                            <div 
                              key={idx}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer",
                                offlineConfig.writingStyle === preset.name
                                  ? "bg-orange-500 border-orange-600 text-white"
                                  : "bg-white border-slate-200 text-slate-600"
                              )}
                              onClick={() => setOfflineConfig(prev => ({ 
                                ...prev, 
                                writingStyle: prev.writingStyle === preset.name ? '' : preset.name 
                              }))}
                            >
                              <span>{preset.name}</span>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewPresetName(preset.name);
                                  setNewPresetDesc(preset.description);
                                  setEditingPresetIndex(idx);
                                }}
                                className={cn(
                                  "rounded-full p-0.5 transition-colors",
                                  offlineConfig.writingStyle === preset.name ? "hover:text-white text-orange-200" : "hover:text-blue-500 text-slate-400"
                                )}
                                title="编辑预设"
                              >
                                <Edit3 size={11} />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = (offlineConfig.writingStylePresets || []).filter((_: any, i: number) => i !== idx);
                                  setOfflineConfig(prev => ({ 
                                    ...prev, 
                                    writingStylePresets: updated,
                                    writingStyle: prev.writingStyle === preset.name ? '' : prev.writingStyle
                                  }));
                                  if (editingPresetIndex === idx) {
                                    setEditingPresetIndex(null);
                                    setNewPresetName('');
                                    setNewPresetDesc('');
                                  }
                                }}
                                className={cn(
                                  "rounded-full p-0.5 transition-colors",
                                  offlineConfig.writingStyle === preset.name ? "hover:text-white text-orange-200" : "hover:text-red-500 text-slate-400"
                                )}
                                title="删除预设"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Add / Edit Custom Preset Form */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-2 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-bold block">
                          {editingPresetIndex !== null ? `正在编辑预设 #${editingPresetIndex + 1}` : '保存全新文风预设'}
                        </span>
                        {editingPresetIndex !== null && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPresetIndex(null);
                              setNewPresetName('');
                              setNewPresetDesc('');
                            }}
                            className="text-[10px] text-slate-500 hover:text-slate-800 underline"
                          >
                            取消编辑
                          </button>
                        )}
                      </div>
                      <input 
                        type="text" 
                        placeholder="文风名称 (如：霸道总裁文风)"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none border border-slate-200"
                      />
                      <textarea 
                        placeholder="文风特征描述 (不限制输入字数，越详细AI写得越准确。例如：描述带有霸道的压迫感，多描写坚定的视线与无法拒绝的亲近。)"
                        value={newPresetDesc}
                        onChange={(e) => setNewPresetDesc(e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none border border-slate-200 resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newPresetName.trim() || !newPresetDesc.trim()) return;
                          const presets = [...(offlineConfig.writingStylePresets || [])];
                          if (editingPresetIndex !== null) {
                            presets[editingPresetIndex] = { name: newPresetName.trim(), description: newPresetDesc.trim() };
                            setEditingPresetIndex(null);
                          } else {
                            presets.push({ name: newPresetName.trim(), description: newPresetDesc.trim() });
                          }
                          setOfflineConfig(prev => ({
                            ...prev,
                            writingStylePresets: presets,
                            writingStyle: newPresetName.trim()
                          }));
                          setNewPresetName('');
                          setNewPresetDesc('');
                        }}
                        className="w-full py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                      >
                        {editingPresetIndex !== null ? '保存修改并应用' : '保存并设置为当前文风'}
                      </button>
                    </div>
                  </div>

                  {/* Offline Beautification */}
                  <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-xs font-extrabold text-slate-600 block">线下美化</label>
                    
                    {/* Background Image */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-bold">更换背景图</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="输入图片URL"
                          value={offlineConfig.bgImage}
                          onChange={(e) => setOfflineConfig(prev => ({ ...prev, bgImage: e.target.value }))}
                          className={cn(
                            "flex-1 px-3 py-1.5 rounded-xl text-xs focus:outline-none border transition-all bg-white",
                            settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "border-slate-200"
                          )}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setOfflineConfig(prev => ({ ...prev, bgImage: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap bg-white hover:bg-slate-50 border-slate-200 transition-all active:scale-95"
                        >
                          相册上传
                        </button>
                      </div>
                    </div>

                    {/* Custom CSS */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-400 font-bold">自定义 CSS 样式</span>
                        <span className="text-[9px] text-slate-400 font-mono">(支持网页样式覆盖)</span>
                      </div>
                      <textarea 
                        placeholder="例如：.chat-message-list { background-color: #f0f0f0 !important; }"
                        value={offlineConfig.customCss}
                        onChange={(e) => setOfflineConfig(prev => ({ ...prev, customCss: e.target.value }))}
                        rows={3}
                        className={cn(
                          "w-full px-3 py-2 rounded-xl text-xs focus:outline-none border transition-all resize-none font-mono bg-white",
                          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "border-slate-200"
                        )}
                      />
                    </div>
                  </div>

                  {/* Word Count limits */}
                  <div className="space-y-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <label className="text-xs font-extrabold text-slate-600 block">输出字数控制</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-400 font-bold">最少</span>
                        <input 
                          type="number" 
                          value={offlineConfig.minWords}
                          onChange={(e) => setOfflineConfig(prev => ({ ...prev, minWords: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full text-xs font-bold text-slate-700 bg-transparent focus:outline-none text-right"
                        />
                        <span className="text-xs text-slate-400 font-bold">字</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-400 font-bold">最多</span>
                        <input 
                          type="number" 
                          value={offlineConfig.maxWords}
                          onChange={(e) => setOfflineConfig(prev => ({ ...prev, maxWords: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-full text-xs font-bold text-slate-700 bg-transparent focus:outline-none text-right"
                        />
                        <span className="text-xs text-slate-400 font-bold">字</span>
                      </div>
                    </div>
                  </div>

              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t flex gap-3 shrink-0 bg-inherit shadow-lg">
                <button
                  type="button"
                  onClick={() => setShowOfflineSettings(false)}
                  className={cn(
                    "flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95",
                    settings.themeId === 'rainy-cat' ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  )}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={saveOfflineConfig}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30"
                >
                  保存并生效
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {selectedDescription && (
          <div key="description-modal" className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-6" onClick={() => setSelectedDescription(null)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "w-full max-w-xs rounded-2xl p-6 shadow-2xl relative transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedDescription(null)}
                className={cn(
                  "absolute top-4 right-4 transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <X size={20} />
              </button>
              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-white/10 text-white/60" : "bg-blue-50 text-blue-500"
                )}>
                  <Camera size={24} />
                </div>
                <h3 className="font-bold text-xl">照片描述</h3>
                <p className={cn(
                  "text-lg leading-relaxed text-center transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-600"
                )}>
                  {selectedDescription}
                </p>
                <button 
                  onClick={() => setSelectedDescription(null)}
                  className={cn(
                    "w-full mt-2 py-3 rounded-xl font-bold transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 active:bg-slate-200"
                  )}
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === 'transfer' && (
          <div key="transfer-modal" className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className={cn(
                "w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
              )}
            >
              <div className={cn(
                "p-4 border-b flex justify-between items-center",
                settings.themeId === 'rainy-cat' ? "border-white/10" : "border-slate-100"
              )}>
                <span className="font-bold">转账给 {friend.name}</span>
                <button onClick={() => setActiveModal(null)}><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <div className={cn(
                    "text-xs mb-1 transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
                  )}>转账金额</div>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-2xl font-bold">￥</span>
                    <input 
                      type="number" 
                      autoFocus 
                      className={cn(
                        "text-4xl font-bold w-32 text-center focus:outline-none bg-transparent transition-all duration-300",
                        settings.themeId === 'rainy-cat' ? "text-white placeholder-white/20" : "text-black"
                      )} 
                      placeholder="0.00" 
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={cn(
                    "text-[10px] transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
                  )}>支付方式</label>
                  <select
                    value={selectedPaymentMethod}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    className={cn(
                      "w-full p-2 rounded text-sm focus:outline-none border transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-100"
                    )}
                  >
                    <option value="wallet">零钱 (￥{user.balance || 0})</option>
                    {user.bankCards?.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.bankName} ({card.cardNumber.slice(-4)}) (￥{card.balance})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={cn(
                    "text-[10px] transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
                  )}>添加转账说明</label>
                  <input 
                    type="text" 
                    value={transferDescription}
                    onChange={(e) => setTransferDescription(e.target.value)}
                    className={cn(
                      "w-full p-2 rounded text-sm focus:outline-none border transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white placeholder-white/20" : "bg-slate-50 border-slate-100"
                    )} 
                    placeholder="恭喜发财，大吉大利" 
                  />
                </div>
                <button 
                  onClick={() => {
                    if (transferAmount) handleTransfer(transferAmount, transferDescription);
                  }}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : "bg-[#07c160] text-white"
                  )}
                >
                  转账
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === 'receive-transfer' && selectedTransferIndex !== null && (
          <div key="receive-transfer-modal" className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className={cn(
                "w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
              )}
            >
              <div className={cn(
                "p-4 border-b flex justify-between items-center",
                settings.themeId === 'rainy-cat' ? "border-white/10" : "border-slate-100"
              )}>
                <span className="font-bold">接收转账</span>
                <button onClick={() => setActiveModal(null)}><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6 text-center">
                <div className="text-4xl font-bold">￥{currentMessages[selectedTransferIndex].amount}</div>
                <div className={cn(
                  "text-sm",
                  settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-500"
                )}>
                  来自 {currentMessages[selectedTransferIndex].role === 'user' ? friend.name : '你'}
                  <br />
                  说明: {currentMessages[selectedTransferIndex].description || '无'}
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleReceiveTransfer(selectedTransferIndex, 'refund')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/10 text-white" : "bg-slate-200 text-slate-700"
                    )}
                  >
                    退还
                  </button>
                  <button 
                    onClick={() => handleReceiveTransfer(selectedTransferIndex, 'receive')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : "bg-[#07c160] text-white"
                    )}
                  >
                    收款
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <AnimatePresence key="toast-presence-internal">
          {toastMessage && (
            <motion.div
              key="toast-message-box"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm z-[200]"
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {activeModal === 'exit-offline' && (
          <div key="exit-offline-modal" className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className={cn(
                "w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
              )}
            >
              <div className={cn(
                "p-4 border-b flex justify-between items-center",
                settings.themeId === 'rainy-cat' ? "border-white/10" : "border-slate-100"
              )}>
                <span className="font-bold">结束线下剧情</span>
                <button onClick={() => setActiveModal(null)}><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <button 
                  onClick={() => handleEndOfflineMode()}
                  disabled={isEndingOffline}
                  className="w-full py-3 rounded-xl font-bold bg-[#07c160] text-white disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isEndingOffline ? <Loader2 className="animate-spin" size={20} /> : null}
                  {isEndingOffline ? '正在总结...' : '结束线下模式 (自动总结)'}
                </button>
                <button 
                  onClick={handleTemporarilyExit}
                  disabled={isEndingOffline}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold disabled:opacity-50 transition-all",
                    settings.themeId === 'rainy-cat' ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  )}
                >
                  暂时退出
                </button>
                <button 
                  onClick={() => setActiveModal('manual-summary')}
                  disabled={isEndingOffline}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold disabled:opacity-50 transition-all",
                    settings.themeId === 'rainy-cat' ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  )}
                >
                  手动总结
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === 'manual-summary' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={cn(
                "rounded-[32px] w-full max-w-md p-6 space-y-6 overflow-hidden",
                settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className={cn("text-lg font-bold", settings.themeId === 'rainy-cat' ? "text-white" : "text-slate-800")}>手动生成记忆总结</h3>
                <button onClick={() => setActiveModal(null)} className={cn("p-2 rounded-full", settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-100")}>
                  <X size={20} className={settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-400"} />
                </button>
              </div>

              <div className={cn(
                "p-4 rounded-2xl border flex items-start gap-3",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-100"
              )}>
                <RefreshCw size={20} className={settings.themeId === 'rainy-cat' ? "text-white/60" : "text-blue-500"} />
                <p className={cn("text-xs leading-relaxed", settings.themeId === 'rainy-cat' ? "text-white/80" : "text-blue-700")}>
                  当前对话总计 <strong>{currentMessages.length}</strong> 条。请选择你想要总结的消息范围。总结后的内容将存入该角色的长期记忆库，帮助角色“记住”你们的互动。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">起始消息 (1-{currentMessages.length})</label>
                  <input 
                    type="number" 
                    min="1"
                    max={currentMessages.length}
                    value={manualSummaryRange.start || Math.max(1, currentMessages.length - 50)}
                    onChange={(e) => setManualSummaryRange(prev => ({ ...prev, start: parseInt(e.target.value) }))}
                    className={cn(
                      "w-full border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all",
                      settings.themeId === 'rainy-cat' ? "bg-white/10 text-white placeholder:text-white/20" : "bg-slate-100 text-slate-900"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">结束消息 (1-{currentMessages.length})</label>
                  <input 
                    type="number" 
                    min="1"
                    max={currentMessages.length}
                    value={manualSummaryRange.end || currentMessages.length}
                    onChange={(e) => setManualSummaryRange(prev => ({ ...prev, end: parseInt(e.target.value) }))}
                    className={cn(
                      "w-full border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 transition-all",
                      settings.themeId === 'rainy-cat' ? "bg-white/10 text-white placeholder:text-white/20" : "bg-slate-100 text-slate-900"
                    )}
                  />
                </div>
              </div>

              <button 
                onClick={async () => {
                  const start = manualSummaryRange.start || Math.max(1, currentMessages.length - 50);
                  const end = manualSummaryRange.end || currentMessages.length;
                  if (start < 1 || end < start || end > currentMessages.length) {
                    showToast('无效的消息范围');
                    return;
                  }
                  setIsLoading(true);
                  try {
                    const targetMsgs = currentMessages.slice(start - 1, end);
                    const summary = await summarizeContent(friend, targetMsgs, isOfflineMode ? 'offline' : 'chat', friend.memorySettings?.summaryPrompt, { start, end });
                    if (summary) {
                      if (isOfflineMode) {
                        let plotTitle = '手动剧情总结';
                        const titleMatch = summary.match(/【剧情标题[：:]\s*([^】\n]+)】/);
                        if (titleMatch && titleMatch[1]) {
                          plotTitle = titleMatch[1].trim();
                        }
                        addOfflinePlot(friend.id, plotTitle, targetMsgs, summary);
                      } else {
                        addOnlineMemory(friend.id, summary, 'manual');
                      }
                      showToast('手动总结已存入记忆库');
                      setActiveModal(null);
                    }
                  } catch (err) {
                    console.error("Manual summarize error:", err);
                    showToast('总结失败，请重试');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 disabled:opacity-50 transition-all"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
                开始生成记忆
              </button>
            </motion.div>
          </div>
        )}

        {activeModal === 'text-photo' && (
          <div key="text-photo-modal" className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className={cn(
                "w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
              )}
            >
              <div className={cn(
                "p-4 border-b flex justify-between items-center",
                settings.themeId === 'rainy-cat' ? "border-white/10" : "border-slate-100"
              )}>
                <span className="font-bold">文字摄影</span>
                <button onClick={() => setActiveModal(null)}><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className={cn(
                    "text-xs",
                    settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
                  )}>描述你想拍摄的内容</label>
                  <textarea 
                    value={textPhotoContent}
                    onChange={(e) => setTextPhotoContent(e.target.value)}
                    className={cn(
                      "w-full h-32 p-3 rounded-xl text-lg focus:outline-none border transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white placeholder-white/20" : "bg-slate-50 border-slate-100"
                    )}
                    placeholder="例如：一张在咖啡馆窗边拍的照片，阳光洒在桌上的拿铁咖啡上，旁边还有一本翻开的书..."
                  />
                  <p className={cn(
                    "text-[10px] italic",
                    settings.themeId === 'rainy-cat' ? "text-white/30" : "text-slate-400"
                  )}>系统将模拟拍摄该场景，对方会将其视为真实照片进行互动。</p>
                </div>
                <button 
                  disabled={!textPhotoContent.trim()}
                  onClick={handleTextPhotoSend}
                  className={cn(
                    "w-full py-3 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : "bg-cyan-600 text-white"
                  )}
                >
                  <Camera size={18} />
                  模拟拍摄并发送
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === 'location' && (
          <div key="location-modal" className={cn(
            "fixed inset-0 z-[100] flex flex-col transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl text-white" : "bg-white"
          )}>
            <div className={cn(
              "p-4 border-b flex justify-between items-center",
              settings.themeId === 'rainy-cat' ? "border-white/10" : "border-slate-100"
            )}>
              <span className="font-bold">发送位置</span>
              <button onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <div className={cn(
              "flex-1 flex flex-col items-center justify-center p-10 text-center gap-4 transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "bg-white/5" : "bg-slate-100"
            )}>
              <MapPin size={64} className="text-red-500 animate-bounce" />
              <p className={cn(
                "transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-500"
              )}>模拟地图定位中...</p>
              <button 
                onClick={() => handleLocation('北京市朝阳区三里屯')} 
                className={cn(
                  "px-6 py-2 rounded-full font-bold transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : "bg-green-600 text-white"
                )}
              >
                发送当前位置
              </button>
            </div>
          </div>
        )}

        {activeModal === 'voice-input' && (
          <div key="voice-input-modal" className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              className={cn(
                "w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
              )}
            >
              <div className={cn(
                "p-4 border-b flex justify-between items-center",
                settings.themeId === 'rainy-cat' ? "border-white/10" : "border-slate-100"
              )}>
                <span className="font-bold">语音输入</span>
                <button onClick={() => setActiveModal(null)}><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className={cn(
                    "text-xs",
                    settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
                  )}>文字描述转语音</label>
                  <textarea 
                    value={voiceInputText}
                    onChange={(e) => setVoiceInputText(e.target.value)}
                    className={cn(
                      "w-full h-24 p-3 rounded-xl text-sm focus:outline-none border transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white placeholder-white/20" : "bg-slate-50 border-slate-100"
                    )}
                    placeholder="输入文字，将自动转换为语音发送..."
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <button 
                    disabled={!voiceInputText.trim() || isLoading}
                    onClick={() => handleTextToVoice(voiceInputText)}
                    className={cn(
                      "w-full py-3 rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : "bg-blue-600 text-white"
                    )}
                  >
                    {isLoading ? <Sparkles className="animate-spin" size={18} /> : <Send size={18} />}
                    生成并发送语音
                  </button>
                  
                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className={cn(
                        "w-full border-t",
                        settings.themeId === 'rainy-cat' ? "border-white/10" : "border-slate-100"
                      )}></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className={cn(
                        "px-2 transition-all duration-300",
                        settings.themeId === 'rainy-cat' ? "bg-black/20 text-white/40" : "bg-white text-slate-400"
                      )}>或者</span>
                    </div>
                  </div>

                  <button
                    className={cn(
                      "w-full py-3 rounded-xl font-bold border-2 transition-all select-none flex items-center justify-center gap-2",
                      isRecording 
                        ? (settings.themeId === 'rainy-cat' ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-red-50 border-red-200 text-red-600")
                        : (settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white/60 active:bg-white/10" : "bg-slate-50 border-slate-100 text-slate-600 active:bg-slate-100")
                    )}
                    onMouseDown={handleVoiceStart}
                    onMouseUp={handleVoiceEnd}
                    onMouseLeave={handleVoiceEnd}
                    onTouchStart={(e) => { e.preventDefault(); handleVoiceStart(); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleVoiceEnd(); }}
                  >
                    <Mic size={18} className={isRecording ? "animate-pulse" : ""} />
                    {isRecording ? "正在录音..." : "按住 录入真实语音"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {activeModal === 'music' && (
          <div key="music-modal" className={cn(
            "fixed inset-0 z-[100] flex flex-col transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl text-white" : "bg-pink-50"
          )}>
            <div className={cn(
              "p-4 border-b flex justify-between items-center",
              settings.themeId === 'rainy-cat' ? "border-white/10" : "border-pink-100"
            )}>
              <span className="font-bold">一起听歌</span>
              <button onClick={() => setActiveModal(null)}><X size={20} /></button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-6">
              <div className={cn(
                "w-48 h-48 rounded-full shadow-xl flex items-center justify-center animate-spin-slow transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-white/10 border border-white/20" : "bg-white"
              )}>
                <Music size={64} className={cn(
                  "transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "text-white/60" : "text-pink-500"
                )} />
              </div>
              <div>
                <h3 className="text-xl font-bold">正在搜索音乐...</h3>
                <p className={cn(
                  "transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
                )}>选择一首喜欢的歌和好友一起听吧</p>
              </div>
              <button 
                onClick={() => {
                  onSendMessage({ role: 'system', content: '你发起了一起听歌', timestamp: Date.now() });
                  setActiveModal(null);
                }} 
                className={cn(
                  "px-8 py-3 rounded-full font-bold shadow-lg transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : "bg-pink-500 text-white"
                )}
              >
                随机选一首
              </button>
            </div>
          </div>
        )}

        {activeModal === 'truth-or-dare' && (
          <TruthOrDarePopup 
            key="truth-or-dare-modal"
            onClose={() => setActiveModal(null)} 
            onSendMessage={onSendMessage}
            friend={friend}
          />
        )}

        {activeModal === 'blind-box' && (
          <motion.div
            key="blind-box-modal"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[100]"
          >
            <BlindBoxApp 
              settings={settings}
              onUpdateSettings={onUpdateSettings}
              onClose={() => setActiveModal(null)}
              onSendMessage={onSendMessage}
              targetFriendId={friend.id}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <input type="file" ref={stickerFileInputRef} className="hidden" accept="image/*" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setPendingStickerFile(event.target?.result as string);
            setShowStickerImport('file');
          };
          reader.readAsDataURL(file);
        }
      }} />

      {/* Sticker Import Modals */}
      <AnimatePresence>
        {showStickerImport === 'url' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-lg text-slate-800">批量导入表情包URL</h3>
              <p className="text-xs text-slate-400">每行输入一个图片链接，支持「描述 URL」格式</p>
              <textarea 
                value={stickerUrlInput}
                onChange={(e) => setStickerUrlInput(e.target.value)}
                className="w-full h-40 p-3 bg-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                placeholder="打屁股 https://example.com/sticker1.png&#10;委屈哭 https://example.com/sticker2.gif"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowStickerImport(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">取消</button>
                <button onClick={handleAddStickersByUrl} className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-bold">导入</button>
              </div>
            </motion.div>
          </div>
        )}

        {showStickerImport === 'file' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-lg text-slate-800">添加表情包</h3>
              <div className="aspect-square w-32 mx-auto rounded-2xl overflow-hidden border-2 border-pink-100">
                <img src={pendingStickerFile!} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">表情包描述 (让角色看懂它)</label>
                <input 
                  type="text"
                  value={stickerFileDescription}
                  onChange={(e) => setStickerFileDescription(e.target.value)}
                  placeholder="例如：一只害羞的小狗"
                  className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowStickerImport(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">取消</button>
                <button onClick={handleAddStickerByFile} className="flex-1 py-3 bg-pink-500 text-white rounded-xl font-bold">保存</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FriendProfile({ friend, settings, onBack, onStartChat, onViewMoments, onUpdate, onDelete, onToggleBlock }: { 
  friend: Friend, 
  settings: AppSettings,
  onBack: () => void, 
  onStartChat: () => void,
  onViewMoments: () => void,
  onUpdate: (updates: Partial<Friend>) => void,
  onDelete: () => void,
  onToggleBlock: () => void,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [isEditingPersona, setIsEditingPersona] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingVoice, setIsEditingVoice] = useState(false);
  const [isEditingLanguage, setIsEditingLanguage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tempValue, setTempValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPersonaExpanded, setIsPersonaExpanded] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = getAvailableVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handlePreviewVoice = async (voiceId: string, type: 'gemini' | 'minimax' = 'gemini') => {
    if (isPreviewing) return;
    setIsPreviewing(true);
    try {
      const text = "你好，我是" + friend.name + "，很高兴认识你。";
      speakText(text, voiceId, type, settings).catch(err => console.error('TTS error:', err));
      setTimeout(() => setIsPreviewing(false), 2000);
    } catch (err) {
      console.error("Preview error:", err);
      setIsPreviewing(false);
    }
  };

  const handleSyncProfile = () => {
    if (!friend.profileId) return;
    const profile = settings.characterProfiles?.find(p => p.id === friend.profileId);
    if (profile) {
      let gender: 'male' | 'female' | 'other' = 'other';
      if (profile.gender?.includes('男')) gender = 'male';
      else if (profile.gender?.includes('女')) gender = 'female';

      onUpdate({
        name: profile.name,
        avatar: profile.avatarUrl,
        persona: `【人设资料】\n${profile.persona}\n\n【个人经历】\n${profile.experience}\n\n【成长背景】\n${profile.background}\n\n【和user的关系】\n${profile.relationship}`,
        gender,
      });
      setShowMenu(false);
    }
  };

  const handleEdit = (type: 'alias' | 'persona' | 'address' | 'voice' | 'language') => {
    if (type === 'voice') {
      setIsEditingVoice(true);
      return;
    }
    if (type === 'language') {
      setIsEditingLanguage(true);
      setTempValue(friend.language || '普通话');
      return;
    }
    setTempValue(friend[type] || '');
    if (type === 'alias') setIsEditingAlias(true);
    if (type === 'persona') setIsEditingPersona(true);
    if (type === 'address') setIsEditingAddress(true);
    setShowMenu(false);
  };

  const saveEdit = (type: 'alias' | 'persona' | 'address' | 'language') => {
    onUpdate({ [type]: tempValue });
    setIsEditingAlias(false);
    setIsEditingPersona(false);
    setIsEditingAddress(false);
    setIsEditingLanguage(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full relative transition-colors duration-500",
      settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : "bg-slate-100"
    )}>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
      <div className={cn(
        "px-3 py-2 flex items-center justify-between sticky top-0 z-10 transition-all duration-300",
        settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl border-b border-white/10" : "bg-white"
      )}>
        <button 
          onClick={onBack} 
          className={cn(
            "p-1 rounded-full transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-200"
          )}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className={cn(
              "p-1 rounded-full transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-200"
            )}
          >
            <MoreHorizontal size={18} className={cn(
              "transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-500"
            )} />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className={cn(
                    "absolute right-0 mt-2 w-36 rounded-xl shadow-xl z-40 overflow-hidden transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10" : "bg-white border border-slate-100"
                  )}
                >
                  <button 
                    onClick={() => handleEdit('alias')} 
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "hover:bg-white/10 text-white" : "hover:bg-slate-50"
                    )}
                  >
                    修改备注
                  </button>
                  {friend.profileId && (
                    <button 
                      onClick={handleSyncProfile} 
                      className={cn(
                        "w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 transition-all duration-300",
                        settings.themeId === 'rainy-cat' ? "hover:bg-white/10 text-blue-400" : "hover:bg-slate-50 text-blue-600"
                      )}
                    >
                      同步角色资料
                    </button>
                  )}
                  <button 
                    onClick={() => { onToggleBlock(); setShowMenu(false); }} 
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "hover:bg-white/10 text-orange-400" : "hover:bg-slate-50 text-orange-600"
                    )}
                  >
                    {friend.isBlocked ? '取消拉黑' : '拉黑好友'}
                  </button>
                  <button 
                    onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }} 
                    className={cn(
                      "w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 border-t transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "hover:bg-white/10 text-red-400 border-white/10" : "hover:bg-slate-50 text-red-600 border-slate-50"
                    )}
                  >
                    删除好友
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={cn(
          "p-4 flex gap-4 mb-2 transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl" : "bg-white"
        )}>
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <img src={friend.avatar} className={cn("w-16 h-16 rounded-xl object-cover transition-all duration-300", settings.themeId === 'rainy-cat' ? "bg-white/10" : "bg-slate-200", friend.isBlocked && "grayscale opacity-50")} />
            <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Camera size={20} className="text-white" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{friend?.alias || friend?.name || '角色'}</h2>
              <span 
                onClick={() => {
                  const nextGender = friend.gender === 'male' ? 'female' : friend.gender === 'female' ? 'other' : 'male';
                  onUpdate({ gender: nextGender });
                }}
                className={cn(
                  "text-[10px] px-1 rounded font-bold transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95",
                  settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : 
                  friend.gender === 'male' ? "bg-blue-500 text-white" : 
                  friend.gender === 'female' ? "bg-pink-500 text-white" : 
                  "bg-slate-100 text-slate-600"
                )}
              >
                {friend.gender === 'male' ? '♂' : friend.gender === 'female' ? '♀' : '？'}
              </span>
              {friend.alias && <span className={cn(
                "text-[10px] font-normal transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )}>(昵称: {friend.name})</span>}
            </div>
            <p className={cn(
              "text-xs transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-500"
            )}>微信号: {friend.wechatId || friend.id}</p>
            <div className="flex items-center gap-1 group cursor-pointer" onClick={() => handleEdit('address')}>
              <p className={cn(
                "text-xs transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-500"
              )}>地区: {friend.address || '未知'}</p>
              <Plus size={10} className={cn(
                "opacity-0 group-hover:opacity-100 transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
              )} />
            </div>
          </div>
        </div>

        <div className={cn(
          "divide-y mb-2 transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl divide-white/10" : "bg-white divide-slate-50"
        )}>
          <div 
            className={cn(
              "p-3 flex items-center justify-between cursor-pointer group transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-50"
            )} 
            onClick={() => handleEdit('voice')}
          >
            <span className="text-sm font-medium">角色语音</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-xs transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-500"
              )}>
                {friend.voiceType === 'minimax' ? `MiniMax: ${friend.voiceId || '未设置'}` : '默认'}
              </span>
              <ChevronLeft size={16} className={cn(
                "rotate-180 transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
              )} />
            </div>
          </div>
          <div 
            className={cn(
              "p-3 flex items-center justify-between cursor-pointer group transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-50"
            )} 
            onClick={onViewMoments}
          >
            <span className="text-sm font-medium">朋友圈</span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {friend.moments?.[0]?.images?.[0] ? (
                  <img src={friend.moments[0].images[0]} className="w-8 h-8 rounded-sm object-cover" />
                ) : (
                  <div className={cn(
                    "w-8 h-8 rounded-sm transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "bg-white/10" : "bg-slate-100"
                  )} />
                )}
                <div className={cn(
                  "w-8 h-8 rounded-sm transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-white/10" : "bg-slate-100"
                )} />
              </div>
              <ChevronLeft size={16} className={cn(
                "rotate-180 transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
              )} />
            </div>
          </div>
          <div 
            className={cn(
              "p-3 cursor-pointer group transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-50"
            )} 
          >
            <div className="flex justify-between items-center mb-1" onClick={() => setIsPersonaExpanded(!isPersonaExpanded)}>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] font-bold uppercase transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "text-white/30" : "text-slate-400"
                )}>人设资料</span>
                <ChevronLeft size={12} className={cn(
                  "transition-all duration-300",
                  isPersonaExpanded ? "rotate-90" : "-rotate-90",
                  settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
                )} />
              </div>
              <span 
                onClick={(e) => { e.stopPropagation(); handleEdit('persona'); }}
                className={cn(
                  "text-[10px] opacity-0 group-hover:opacity-100 transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "text-white/60" : "text-blue-500"
                )}
              >
                点击修改
              </span>
            </div>
            <div className={cn(
              "overflow-hidden transition-colors duration-500",
              isPersonaExpanded ? "max-h-none opacity-100" : "max-h-12 opacity-80"
            )}>
              <p className={cn(
                "text-xs leading-relaxed whitespace-pre-wrap transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/60" : "text-slate-600"
              )}>
                {friend.persona}
              </p>
            </div>
            {!isPersonaExpanded && friend.persona && friend.persona.length > 50 && (
              <div 
                onClick={() => setIsPersonaExpanded(true)}
                className="text-[10px] text-blue-500 mt-1 text-center"
              >
                展开更多
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-6 space-y-3">
          <button 
            disabled={friend.isBlocked}
            onClick={onStartChat}
            className={cn(
              "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm border active:scale-95 transition-all disabled:opacity-50",
              settings.themeId === 'rainy-cat' ? "bg-white/20 border-white/10 text-white" : "bg-white text-blue-900 border-slate-100"
            )}
          >
            <MessageSquare size={18} /> 发消息
          </button>
          <button 
            disabled={friend.isBlocked} 
            className={cn(
              "w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm border active:scale-95 transition-all disabled:opacity-50",
              settings.themeId === 'rainy-cat' ? "bg-white/20 border-white/10 text-white" : "bg-white text-blue-900 border-slate-100"
            )}
          >
            <Camera size={18} /> 视频通话
          </button>
        </div>
      </div>

      {/* Edit Modals */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
              )}
            >
              <div className="p-6 text-center">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-500"
                )}>
                  <Trash2 size={24} />
                </div>
                <h3 className="text-base font-bold mb-2">确认删除好友？</h3>
                <p className={cn(
                  "text-xs mb-6 transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-500"
                )}>删除后将同时清理与该好友的所有聊天记录，此操作不可撤销。</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    取消
                  </button>
                  <button 
                    onClick={onDelete}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-red-500/40 text-white" : "bg-red-500 text-white"
                    )}
                  >
                    确认删除
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {(isEditingAlias || isEditingPersona || isEditingAddress || isEditingVoice || isEditingLanguage) && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
              )}
            >
              <div className={cn(
                "p-3 border-b flex justify-between items-center transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-slate-50"
              )}>
                <span className="font-bold text-sm">
                  {isEditingAlias && '修改备注'}
                  {isEditingPersona && '修改人设'}
                  {isEditingAddress && '修改地区'}
                  {isEditingVoice && '角色语音设置'}
                  {isEditingLanguage && '修改角色语言'}
                </span>
                <button 
                  onClick={() => { setIsEditingAlias(false); setIsEditingPersona(false); setIsEditingAddress(false); setIsEditingVoice(false); setIsEditingLanguage(false); }} 
                  className={cn(
                    "p-1 rounded-full transition-all duration-300",
                    settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-200"
                  )}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {isEditingVoice ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Mic size={10} /> Minimax 语音音色 ID
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={friend.voiceId || ''}
                          onChange={(e) => onUpdate({ voiceId: e.target.value, voiceType: 'minimax' })}
                          placeholder="输入 Minimax 音色 ID"
                          className={cn(
                            "flex-1 px-3 py-2 rounded-xl text-xs focus:outline-none border transition-all",
                            settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
                          )}
                        />
                        <button
                          onClick={() => handlePreviewVoice(friend.voiceId || '', 'minimax')}
                          disabled={isPreviewing || !friend.voiceId}
                          className={cn(
                            "p-2 rounded-xl transition-all flex items-center justify-center",
                            isPreviewing || !friend.voiceId ? "bg-slate-200 text-slate-400" : "bg-blue-500 text-white"
                          )}
                        >
                          <Music size={14} />
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed">在 Minimax 官网/后台配置克隆音色后，将音色 ID 填入此处。系统将调用您的 API Key 进行合成。</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        语音发送频率
                      </label>
                      <select
                        value={friend.voiceFrequency || 'never'}
                        onChange={(e) => onUpdate({ voiceFrequency: e.target.value as any })}
                        className={cn(
                          "w-full px-3 py-2 rounded-xl text-xs focus:outline-none border transition-all",
                          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
                        )}
                      >
                        <option value="never" className="text-black">仅文字</option>
                        <option value="always" className="text-black">每轮回复全部都发语音</option>
                        <option value="one_per_round" className="text-black">每轮回复抽一句发语音</option>
                        <option value="every_two" className="text-black">每两轮发送一次语音</option>
                        <option value="random" className="text-black">随机发送语音</option>
                      </select>
                      <p className="text-[9px] text-slate-400 leading-relaxed">设置该角色在聊天中发送语音消息的频率。需配合上方的音色 ID 使用。</p>
                    </div>
                  </div>
                ) : isEditingPersona ? (
                  <textarea 
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    rows={4}
                    className={cn(
                      "w-full p-2 rounded-lg text-xs focus:outline-none resize-none border transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-green-500"
                    )}
                  />
                ) : isEditingLanguage ? (
                  <div className="space-y-2">
                    <input 
                      type="text"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      placeholder="例如：普通话、粤语、英语、日语、韩语..."
                      className={cn(
                        "w-full p-2 rounded-lg text-xs focus:outline-none border transition-all duration-300",
                        settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-green-500"
                      )}
                    />
                  </div>
                ) : (
                  <input 
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className={cn(
                      "w-full p-2 rounded-lg text-xs focus:outline-none border transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-green-500"
                    )}
                  />
                )}
                {!isEditingVoice && (
                  <button 
                    onClick={() => {
                      if (isEditingAlias) saveEdit('alias');
                      if (isEditingPersona) saveEdit('persona');
                      if (isEditingAddress) saveEdit('address');
                      if (isEditingLanguage) saveEdit('language');
                    }}
                    className={cn(
                      "w-full py-2 rounded-lg text-sm font-bold active:scale-95 transition-all duration-300",
                      settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : "bg-green-600 text-white"
                    )}
                  >
                    保存修改
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FriendMoments({ 
  friend, settings, user, friends, onBack, onUpdateBackground, onToggleLike, onAddComment 
}: { 
  friend: Friend, 
  settings: AppSettings, 
  user: any,
  friends: Friend[],
  onBack: () => void, 
  onUpdateBackground: (url: string) => void,
  onToggleLike: (momentId: string, authorId: string) => void,
  onAddComment: (momentId: string, authorId: string, comment: any) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null);

  const handleBgClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateBackground(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendComment = (momentId: string, authorId: string) => {
    if (!commentText.trim()) return;
    const comment = { authorId: 'user', authorName: user?.name ?? '用户', content: commentText, replyToId: replyTo?.id, replyToName: replyTo?.name };
    onAddComment(momentId, authorId, comment);
    setCommentText(''); setActiveCommentId(null); setReplyTo(null);
  };

  return (
    <div className={cn("flex flex-col h-full relative transition-colors duration-500", settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : "bg-white")}>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="p-1.5 rounded-full pointer-events-auto bg-black/20 text-white"><ChevronLeft size={20} /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="relative h-64 mb-12">
          <img src={friend.momentsBackground || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000'} className="w-full h-full object-cover cursor-pointer" onClick={handleBgClick} />
          <div className="absolute bottom-[-20px] right-4 flex items-center gap-3">
            <span className="text-white font-bold drop-shadow-md text-sm mb-4">{friend?.alias || friend?.name || '角色'}</span>
            <img src={friend.avatar} className="w-16 h-16 rounded-xl border-2 border-white bg-slate-200 shadow-lg object-cover" />
          </div>
        </div>
        <div className="px-4 space-y-8 pb-10">
          {friend.moments && friend.moments.length > 0 ? friend.moments.map((post, idx) => (
            <div key={`${post.id}-${idx}`} className="flex gap-3">
              <img src={friend.avatar} className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1">
                <span className="font-bold text-sm block mb-1 text-blue-900">{friend?.alias || friend?.name || '角色'}</span>
                <p className="text-sm mb-2 text-slate-800">{post.content}</p>
                <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                  <span>{new Date(post.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )) : <div className="text-center py-20 text-slate-400">暂无动态</div>}
        </div>
      </div>
    </div>
  );
}

function DiscoverTab({ 
  user, friends, onUpdate, settings, getAllMoments, onToggleLike, onAddComment, onDeleteMoment, onShowMemoryApp 
}: { 
  user: any, friends: Friend[], onUpdate: (updates: any) => void, settings: AppSettings, getAllMoments: () => any[],
  onToggleLike: (momentId: string, authorId: string) => void, onAddComment: (momentId: string, authorId: string, comment: any) => void,
  onDeleteMoment: (momentId: string, authorId: string) => void, onShowMemoryApp: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const moments = getAllMoments() || [];

  const handleBgClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpdate({ momentsBackground: reader.result as string });
      reader.readAsDataURL(file);
    }
  };
  const handleSendComment = (momentId: string, authorId: string) => {
    if (!commentText.trim()) return;
    onAddComment(momentId, authorId, { authorId: 'user', authorName: user?.name ?? '用户', content: commentText, replyToId: replyTo?.id, replyToName: replyTo?.name });
    setCommentText(''); setActiveCommentId(null); setReplyTo(null);
  };

  return (
    <div className={cn("h-full flex flex-col transition-colors duration-500", settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : "bg-slate-100")}>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <div className="relative h-64">
          <img src={user.momentsBackground || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000'} className="w-full h-full object-cover cursor-pointer" onClick={handleBgClick} />
          <div className="absolute bottom-[-20px] right-4 flex items-center gap-3 z-10">
            <span className="text-white font-bold drop-shadow-lg text-base mb-4">{user?.name ?? '用户'}</span>
            <img src={user.avatar} className="w-16 h-16 rounded-xl border-4 border-white bg-slate-200 object-cover shadow-md" />
          </div>
        </div>
        <div className="bg-white pt-12 pb-20">
          {moments.map((moment, idx) => (
            <div key={`${moment.id}-${idx}`} className="p-4 flex gap-3 border-b border-slate-50">
              <img src={moment.authorAvatar} className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1">
                <span className="font-bold text-sm block mb-1 text-blue-900">{moment.authorName}</span>
                <p className="text-sm mb-2 text-slate-800">{moment.content}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                  <span>{new Date(moment.timestamp).toLocaleString()}</span>
                  <button onClick={() => setActiveCommentId(moment.id)} className="p-1 rounded bg-slate-100"><MessageSquare size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MeTab({ 
  user, onUpdate, settings, onViewFavorites, onViewPersonas, 
  onViewBeautification, onViewMoments, onViewPayment 
}: { 
  user: any, 
  onUpdate: (updates: any) => void, 
  settings: AppSettings,
  onViewFavorites: () => void,
  onViewPersonas: () => void,
  onViewBeautification: () => void,
  onViewMoments: () => void,
  onViewPayment: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const isRabbit = settings.isCuteRabbitThemeEnabled;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn(
      "h-full transition-colors duration-500",
      settings.isDarkThemeEnabled ? "bg-transparent text-white" : 
      (isRabbit ? "bg-transparent" : (settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : (settings.appBackgroundUrl ? "bg-transparent" : "bg-slate-100")))
    )}>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
      <div className={cn(
        "p-4 flex items-center gap-3 mb-2 transition-all duration-300 relative",
        settings.isDarkThemeEnabled ? "bg-white/5 backdrop-blur-md" : 
        (isRabbit ? "bg-white/40 backdrop-blur-sm" : (settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl" : (settings.appBackgroundUrl ? "bg-white/10 backdrop-blur-md" : "bg-white")))
      )} style={settings.appBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (settings.chatWallpaperOpacity ?? 0.8) * 0.2)})` } : {}}>
        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
          <img src={user?.avatar} className={cn(
            "w-12 h-12 rounded-lg object-cover transition-all duration-300",
            settings.themeId === 'rainy-cat' ? "bg-white/10" : "bg-slate-200"
          )} />
          <div className="absolute inset-0 bg-black/20 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera size={16} className="text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">{user?.wechatNickname || user?.name || '用户'}</h2>
          <p className={cn(
            "text-xs transition-colors",
            settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-500"
          )}>微信号: {user?.wechatId || user?.id || '未设置'}</p>
        </div>
        <button 
          onClick={() => setShowEditProfile(true)}
          className={cn(
            "p-2 rounded-full transition-all active:scale-95",
            settings.themeId === 'rainy-cat' ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200"
          )}
        >
          <Plus size={18} />
        </button>
      </div>

      <div className={cn(
        "divide-y transition-all duration-300",
        settings.isDarkThemeEnabled ? "bg-white/5 backdrop-blur-md divide-white/10" : 
        (isRabbit ? "bg-white/40 backdrop-blur-sm divide-pink-100" : (settings.themeId === 'rainy-cat' ? "bg-white/5 backdrop-blur-xl divide-white/10" : (settings.appBackgroundUrl ? "bg-transparent divide-white/10" : "bg-white divide-slate-50")))
      )} style={settings.appBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${Math.max(0, (settings.chatWallpaperOpacity ?? 0.8) * 0.1)})` } : {}}>
        <MenuItem icon={Camera} label="朋友圈" color="text-blue-500" settings={settings} onClick={onViewMoments} />
        <MenuItem icon={ShoppingBag} label="支付" color="text-green-500" settings={settings} onClick={onViewPayment} />
        <MenuItem icon={Heart} label="收藏" color="text-red-500" settings={settings} onClick={onViewFavorites} />
        <MenuItem icon={BookHeart} label="人设档案" color="text-pink-500" settings={settings} onClick={onViewPersonas} />
        <MenuItem icon={Palette} label="微信全局美化" color="text-pink-500" settings={settings} onClick={onViewBeautification} />
        <MenuItem icon={SettingsIcon} label="设置" color="text-slate-500" settings={settings} />
      </div>

      <AnimatePresence>
        {showEditProfile && (
          <UserProfileEditModal 
            user={user} 
            settings={settings} 
            onClose={() => setShowEditProfile(false)} 
            onUpdate={onUpdate} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const DEFAULT_CHAT_THEMES: ChatTheme[] = [
  {
    id: 'imessage-v3',
    name: '🔵 iMessage 极简 (高清直出)',
    css: `/* 【iMessage 极简大师模板】 */

/* 1. 顶部栏 (Header) */
.chat-window-header { 
  background: rgba(255, 255, 255, 0.75) !important; 
  backdrop-filter: blur(20px) saturate(190%) !important;
  height: 84px !important;
  border-bottom: 0.5px solid rgba(0,0,0,0.08) !important;
}

/* 2. 底部栏 (Footer) */
.chat-window-footer { 
  background: rgba(255,255,255,0.8) !important; 
  backdrop-filter: blur(20px);
  padding: 8px 16px 24px !important;
  border-top: none !important;
}
.chat-input-area { 
  background: #ffffff !important; 
  border: 1px solid #d1d1d6 !important; 
  border-radius: 22px !important;
}
.send-button { 
  background: #3a9cfd !important; 
  border-radius: 50% !important; 
}
.send-button::after { content: '↑'; color: #fff; font-weight: bold; }

/* 3. 头像 (Avatar) */
.chat-avatar { 
  border-radius: 50% !important; 
  border: 1px solid rgba(0,0,0,0.05) !important;
  width: 34px !important;
  height: 34px !important;
}

/* 4. 角色气泡 (Assistant Bubble) */
.message-bubble-assistant { 
  background-color: #e9e9eb !important; 
  color: #000000 !important; 
  border-radius: 18px !important;
  padding: 8px 14px !important;
  border: none !important;
  margin-left: 12px !important;
  position: relative !important;
  max-width: 85% !important;
  font-size: 15px !important;
  line-height: 1.4 !important;
  isolation: isolate !important;
}
.message-bubble-assistant::before {
  content: '' !important;
  position: absolute !important;
  bottom: -1px !important;
  left: -4px !important;
  width: 10px !important;
  height: 12px !important;
  background-color: #e9e9eb !important;
  border-bottom-right-radius: 10px 8px !important;
  z-index: -1 !important;
}

/* 5. 用户气泡 (User Bubble) */
.message-bubble-user { 
  background-color: #52a2f5 !important; 
  color: #ffffff !important; 
  border-radius: 18px !important;
  padding: 8px 14px !important;
  border: none !important;
  margin-right: 12px !important;
  position: relative !important;
  max-width: 85% !important;
  font-size: 15px !important;
  line-height: 1.4 !important;
  isolation: isolate !important;
}
.message-bubble-user::after {
  content: '' !important;
  position: absolute !important;
  bottom: -1px !important;
  right: -4px !important;
  width: 10px !important;
  height: 12px !important;
  background-color: #52a2f5 !important;
  border-bottom-left-radius: 10px 8px !important;
  z-index: -1 !important;
}

/* 6. 转账卡片 (Transfer Card) */
.message-type-transfer {
  background: #f2f2f7 !important;
  border-radius: 14px !important;
  color: #000 !important;
  border: 1px solid #d1d1d6 !important;
}
.message-type-transfer .text-orange-500 { color: #3a9cfd !important; }`
  },
  {
    id: 'wechat-v4',
    name: '🍏 微信全能 3.0 (极速版)',
    css: `/* 【微信 3.0 全能模板】 */

/* 1. 顶部栏 (Header) */
.chat-window-header { 
  background: #ededed !important; 
  height: 64px !important; 
  border-bottom: 0.5px solid #d6d6d6 !important; 
}
.chat-window-header h2 { font-size: 17px !important; font-weight: 600 !important; }

/* 2. 底部栏 (Footer) */
.chat-window-footer { 
  background: #f7f7f7 !important; 
  border-top: 0.5px solid #dcdcdc !important; 
}
.chat-input-area { background: #fff !important; border-radius: 4px !important; }
.send-button { background: #07c160 !important; color: #fff !important; border-radius: 4px !important; }

/* 3. 头像 (Avatar) */
.chat-avatar { 
  border-radius: 4px !important; 
  width: 44px !important; 
  height: 44px !important; 
}

/* 4. 角色气泡 (Assistant Bubble) */
.message-bubble-assistant { 
  background: #ffffff !important; 
  color: #000 !important; 
  border-radius: 6px !important; 
  position: relative !important;
  border: none !important;
  padding: 10px 14px !important;
  margin-left: 10px !important;
}
.message-bubble-assistant::after { 
  content: ''; position: absolute; left: -6px; top: 12px; border: 6px solid transparent; border-right-color: #ffffff; 
}

/* 5. 用户气泡 (User Bubble) */
.message-bubble-user { 
  background: #95ec69 !important; 
  color: #000 !important; 
  border-radius: 6px !important; 
  position: relative !important;
  border: none !important;
  padding: 10px 14px !important;
  margin-right: 10px !important;
}
.message-bubble-user::after { 
  content: ''; position: absolute; right: -6px; top: 12px; border: 6px solid transparent; border-left-color: #95ec69; 
}

/* 6. 转账卡片 (Transfer Card) */
.message-type-transfer {
  background: #fa9d3b !important; 
  border-radius: 12px !important;
  color: #ffffff !important;
}
.message-type-transfer .bg-orange-500 { background: transparent !important; }`
  },
  {
    id: 'cream-yellow-v3',
    name: '🍮 奶黄甜点大师 2.0',
    css: `/* 【奶黄甜点美化模板】 */

/* 1. 顶部栏 (Header) */
.chat-window-header { 
  background: #fff9db !important; 
  height: 72px !important; 
  border-bottom: 3px solid #ffec99 !important; 
}
.chat-window-header h2 { color: #856404 !important; font-family: serif !important; font-size: 20px !important; }

/* 2. 底部栏 (Footer) */
.chat-window-footer { 
  background: #fff9db !important; 
  border-top: 2px solid #ffec99 !important; 
}
.chat-input-area { background: #fff !important; border: 2px solid #ffec99 !important; border-radius: 14px !important; }
.send-button { background: #fab005 !important; border-radius: 10px !important; }

/* 3. 头像 (Avatar) */
.chat-avatar { 
  border-radius: 14px !important; 
  border: 4px solid #fff !important; 
  box-shadow: 0 0 0 2px #ffec99 !important; 
}

/* 4. 角色气泡 (Assistant Bubble) */
.message-bubble-assistant { 
  background: #ffffff !important; 
  color: #495057 !important; 
  border-radius: 20px 20px 20px 4px !important; 
  border: 2px solid #f1f3f5 !important; 
  padding: 10px 16px !important;
  box-shadow: 2px 2px 0px #f1f3f5 !important;
}

/* 5. 用户气泡 (User Bubble) */
.message-bubble-user { 
  background: #fff3bf !important; 
  color: #856404 !important; 
  border-radius: 20px 20px 4px 20px !important; 
  border: 2px solid #ffec99 !important; 
  padding: 10px 16px !important;
  box-shadow: -2px 2px 0px #ffec99 !important;
}

/* 6. 转账卡片 (Transfer Card) */
.message-type-transfer {
  background: #fff9db !important;
  border: 2px solid #ffec99 !important;
  border-radius: 16px !important;
  color: #856404 !important;
}
.message-type-transfer .bg-orange-500 { background: #fab005 !important; }`
  }
];

const DEFAULT_BUBBLE_THEMES: ChatTheme[] = [
  {
    id: 'bubble-wechat-v3',
    name: '🍏 微信经典',
    css: `/* 【微信 3.0 气泡中心模板】 */

/* 1. 角色气泡 (Assistant Bubble) */
.message-bubble-assistant { 
  background: #ffffff !important; 
  color: #000 !important; 
  border-radius: 6px !important; 
  position: relative !important;
  border: none !important;
  padding: 10px 14px !important;
  margin-left: 10px !important;
}
.message-bubble-assistant::after { 
  content: ''; position: absolute; left: -6px; top: 12px; border: 6px solid transparent; border-right-color: #ffffff; 
}

/* 2. 用户气泡 (User Bubble) */
.message-bubble-user { 
  background: #95ec69 !important; 
  color: #000 !important; 
  border-radius: 6px !important; 
  position: relative !important;
  border: none !important;
  padding: 10px 14px !important;
  margin-right: 10px !important;
}
.message-bubble-user::after { 
  content: ''; position: absolute; right: -6px; top: 12px; border: 6px solid transparent; border-left-color: #95ec69; 
}`
  },
  {
    id: 'bubble-qq-v2',
    name: '🐧 QQ 简约',
    css: `/* 【QQ 简约气泡模板】 */

/* 1. 角色气泡 (Assistant Bubble) */
.message-bubble-assistant { 
  background: #f1f2f6 !important; 
  color: #000 !important; 
  border-radius: 18px !important; 
  padding: 10px 16px !important;
  border: none !important;
}

/* 2. 用户气泡 (User Bubble) */
.message-bubble-user { 
  background: #0099ff !important; 
  color: #ffffff !important; 
  border-radius: 18px !important; 
  padding: 10px 16px !important;
  border: none !important;
}`
  }
];

function BeautificationPage({ settings, onBack, onUpdate }: { settings: AppSettings, onBack: () => void, onUpdate: (updates: Partial<AppSettings>) => void }) {
  const [tempSettings, setTempSettings] = useState<Partial<AppSettings>>(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showThemeGallery, setShowThemeGallery] = useState(true);
  const [showBubbleGallery, setShowBubbleGallery] = useState(true);

  // Use default themes if no custom ones exist or to show them initially
  const allThemes = [...DEFAULT_CHAT_THEMES, ...(tempSettings.chatThemes || [])];
  const allBubbleThemes = [...DEFAULT_BUBBLE_THEMES, ...(tempSettings.bubbleThemes || [])];

  const handleSave = () => {
    onUpdate(tempSettings);
    onBack();
  };

  const handleApplyTheme = (theme: ChatTheme) => {
    if (tempSettings.activeChatThemeId === theme.id) {
      // Toggle off: if clicking the active one, clear it
      const updates = {
        globalCustomCss: '',
        activeChatThemeId: '',
        bubbleCustomCss: '',
        activeBubbleThemeId: ''
      };
      setTempSettings({ ...tempSettings, ...updates });
      onUpdate(updates);
    } else {
      const updates = {
        globalCustomCss: theme.css,
        activeChatThemeId: theme.id,
        bubbleCustomCss: '',
        activeBubbleThemeId: ''
      };
      setTempSettings({ ...tempSettings, ...updates });
      onUpdate(updates);
    }
  };

  const handleApplyBubbleTheme = (theme: ChatTheme) => {
    if (tempSettings.activeBubbleThemeId === theme.id) {
      // Toggle off
      const updates = {
        bubbleCustomCss: '',
        activeBubbleThemeId: ''
      };
      setTempSettings({ ...tempSettings, ...updates });
      onUpdate(updates);
    } else {
      const updates = {
        bubbleCustomCss: theme.css,
        activeBubbleThemeId: theme.id,
        globalCustomCss: '',
        activeChatThemeId: ''
      };
      setTempSettings({ ...tempSettings, ...updates });
      onUpdate(updates);
    }
  };

  const handleCopyToInput = (theme: ChatTheme, type: 'global' | 'bubble') => {
    if (type === 'global') {
      setTempSettings({ ...tempSettings, globalCustomCss: theme.css, activeChatThemeId: '' });
    } else {
      setTempSettings({ ...tempSettings, bubbleCustomCss: theme.css, activeBubbleThemeId: '' });
    }
    // No alert needed, it's visible in the textarea
  };

  const handleAddPreset = (type: 'global' | 'bubble') => {
    const css = type === 'global' ? tempSettings.globalCustomCss : tempSettings.bubbleCustomCss;
    if (!css) return;
    const name = prompt(`请输入新${type === 'global' ? '主题' : '气泡'}预设的名称:`);
    if (name) {
      const newTheme: ChatTheme = {
        id: `custom-${Date.now()}`,
        name,
        css
      };
      if (type === 'global') {
        setTempSettings({
          ...tempSettings,
          chatThemes: [...(tempSettings.chatThemes || []), newTheme]
        });
      } else {
        setTempSettings({
          ...tempSettings,
          bubbleThemes: [...(tempSettings.bubbleThemes || []), newTheme]
        });
      }
    }
  };

  const handleDeleteTheme = (id: string, type: 'global' | 'bubble') => {
    if (confirm('确定要删除这个预设模板吗？')) {
      if (type === 'global') {
        setTempSettings({
          ...tempSettings,
          chatThemes: (tempSettings.chatThemes || []).filter(t => t.id !== id)
        });
      } else {
        setTempSettings({
          ...tempSettings,
          bubbleThemes: (tempSettings.bubbleThemes || []).filter(t => t.id !== id)
        });
      }
    }
  };

  const handleCopyCode = (css: string | undefined) => {
    if (!css) {
      alert('没有可复制的代码');
      return;
    }
    
    // Robust clipboard approach
    try {
      const textArea = document.createElement("textarea");
      textArea.value = css;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      alert('CSS 代码已成功复制到粘贴板');
    } catch (err) {
      navigator.clipboard.writeText(css).then(() => {
        alert('CSS 代码已成功复制到粘贴板');
      }).catch(() => {
        alert('复制失败，请尝试手动长按选择文本复制');
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempSettings({ ...tempSettings, appBackgroundUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={cn(
      "h-full flex flex-col overflow-hidden",
      tempSettings.isDarkThemeEnabled ? "bg-transparent text-white" : 
      (tempSettings.isCuteRabbitThemeEnabled ? "bg-transparent" : (settings.appBackgroundUrl ? "bg-transparent" : "bg-white text-slate-900"))
    )}>
      {/* Live Preview Style Injection */}
      <style>{`
        ${tempSettings.globalCustomCss || ''}
        ${tempSettings.bubbleCustomCss || ''}
      `}</style>

      {/* Header */}
      <div className={cn(
        "px-4 py-3 flex items-center gap-4 border-b transition-all duration-300",
        tempSettings.isDarkThemeEnabled ? "border-white/10 bg-black/80 backdrop-blur-md" : 
        (tempSettings.isCuteRabbitThemeEnabled ? "border-pink-100 bg-pink-50/80 backdrop-blur-md" : (settings.appBackgroundUrl ? "border-slate-100 bg-transparent backdrop-blur-md" : "border-slate-100 bg-white"))
      )} style={settings.appBackgroundUrl ? { backgroundColor: `rgba(255, 255, 255, ${tempSettings.chatWallpaperOpacity ?? tempSettings.backgroundOpacity ?? 0.7})` } : {}}>
        <button onClick={onBack} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-bold text-lg">微信全局美化</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Real-time Live Preview Box */}
        <div className={cn(
          "p-4 rounded-3xl space-y-3 border-2 transition-all",
          tempSettings.isDarkThemeEnabled ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200 shadow-sm"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-pink-500 animate-pulse" size={18} />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                实时效果预览 (Live Preview)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full font-mono">
              {tempSettings.activeChatThemeId ? '模版: ' + allThemes.find(t => t.id === tempSettings.activeChatThemeId)?.name : '自定义 CSS 代码已生效'}
            </span>
          </div>
          
          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-sm space-y-4 border border-slate-200/50 overflow-hidden relative" style={{ minHeight: '130px' }}>
            {/* Mock Chat Bubbles */}
            <div className="flex justify-start items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-300 chat-avatar shrink-0" />
              <div className="message-bubble-assistant text-sm leading-relaxed max-w-[75%] shadow-sm">
                这是对方发来的消息气泡效果 💬
              </div>
            </div>
            
            <div className="flex justify-end items-end gap-2">
              <div className="message-bubble-user text-sm leading-relaxed max-w-[75%] shadow-sm">
                这是你发出的消息气泡效果 ✨
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-400 chat-avatar shrink-0" />
            </div>
          </div>
        </div>
        {/* Theme Center Section */}
        <div className={cn(
          "p-4 rounded-3xl space-y-4 border-2 transition-all",
          tempSettings.isDarkThemeEnabled ? "bg-white/5 border-white/10" : "bg-gradient-to-br from-pink-50 to-white border-pink-100 shadow-sm"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="text-pink-500" size={20} />
              <h3 className="font-black text-sm uppercase tracking-wider">聊天主题中心</h3>
            </div>
            <button 
              onClick={() => setShowThemeGallery(!showThemeGallery)}
              className="text-xs font-bold text-pink-500 bg-pink-100 px-3 py-1 rounded-full"
            >
              {showThemeGallery ? '关闭预设' : '挑选预设模板'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showThemeGallery && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2 overflow-hidden"
              >
                {allThemes.map((theme) => (
                  <div key={theme.id} className="relative group">
                    <button
                      onClick={() => handleApplyTheme(theme)}
                      className={cn(
                        "w-full p-3 rounded-2xl text-left transition-all border-2",
                        tempSettings.activeChatThemeId === theme.id 
                          ? "bg-pink-500 border-pink-500 text-white shadow-md scale-[1.02]" 
                          : "bg-white border-slate-100 text-slate-800 hover:border-pink-300 shadow-sm"
                      )}
                    >
                      <div className="text-xs font-bold truncate">{theme.name}</div>
                      <div className="text-[9px] opacity-60 mt-1">
                        {tempSettings.activeChatThemeId === theme.id ? '正在使用 (点击取消)' : '点击预览并修改'}
                      </div>
                    </button>
                    <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCopyToInput(theme, 'global'); }}
                        className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        title="复制模板到输入框修改"
                      >
                        <Copy size={12} />
                      </button>
                      {theme.id.startsWith('custom-') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteTheme(theme.id, 'global'); }}
                          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400">当前 CSS 代码 (可手动修改)</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAddPreset('global')}
                  className="text-[10px] bg-pink-100 text-pink-600 px-2 py-1 rounded-md font-bold hover:bg-pink-200"
                >
                  存为预设
                </button>
                <button 
                  onClick={() => handleCopyCode(tempSettings.globalCustomCss)}
                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold hover:bg-slate-200"
                >
                  一键复制
                </button>
              </div>
            </div>
            <textarea
              value={tempSettings.globalCustomCss || ''}
              onChange={(e) => setTempSettings({ ...tempSettings, globalCustomCss: e.target.value, activeChatThemeId: '' })}
              className={cn(
                "w-full h-40 p-3 font-mono text-[10px] rounded-2xl outline-none border-2 transition-all",
                tempSettings.isDarkThemeEnabled ? "bg-white/5 border-pink-200/30 text-white" : "bg-white border-pink-100 text-slate-800 focus:border-pink-300 shadow-inner"
              )}
              placeholder="输入全局 CSS 样式... 或从上方挑选预设模板"
            />
          </div>
        </div>

        {/* Bubble Theme Center Section */}
        <div className={cn(
          "p-4 rounded-3xl space-y-4 border-2 transition-all",
          tempSettings.isDarkThemeEnabled ? "bg-white/5 border-white/10" : "bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="text-blue-500" size={20} />
              <h3 className="font-black text-sm uppercase tracking-wider">聊天气泡中心</h3>
            </div>
            <button 
              onClick={() => setShowBubbleGallery(!showBubbleGallery)}
              className="text-xs font-bold text-blue-500 bg-blue-100 px-3 py-1 rounded-full"
            >
              {showBubbleGallery ? '关闭预设' : '挑选气泡模板'}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {showBubbleGallery && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 gap-2 overflow-hidden"
              >
                {allBubbleThemes.map((theme) => (
                  <div key={theme.id} className="relative group">
                    <button
                      onClick={() => handleApplyBubbleTheme(theme)}
                      className={cn(
                        "w-full p-3 rounded-2xl text-left transition-all border-2",
                        tempSettings.activeBubbleThemeId === theme.id 
                          ? "bg-blue-500 border-blue-500 text-white shadow-md scale-[1.02]" 
                          : "bg-white border-slate-100 text-slate-800 hover:border-blue-300 shadow-sm"
                      )}
                    >
                      <div className="text-xs font-bold truncate">{theme.name}</div>
                      <div className="text-[9px] opacity-60 mt-1">
                        {tempSettings.activeBubbleThemeId === theme.id ? '正在使用 (点击取消)' : '点击应用气泡'}
                      </div>
                    </button>
                    <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCopyToInput(theme, 'bubble'); }}
                        className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        title="复制模板到输入框修改"
                      >
                        <Copy size={12} />
                      </button>
                      {theme.id.startsWith('custom-') && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteTheme(theme.id, 'bubble'); }}
                          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-400">当前气泡 CSS (可手动修改)</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAddPreset('bubble')}
                  className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-bold hover:bg-blue-200"
                >
                  存为预设
                </button>
                <button 
                  onClick={() => handleCopyCode(tempSettings.bubbleCustomCss)}
                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold hover:bg-slate-200"
                >
                  一键复制
                </button>
              </div>
            </div>
            <textarea
              value={tempSettings.bubbleCustomCss || ''}
              onChange={(e) => setTempSettings({ ...tempSettings, bubbleCustomCss: e.target.value, activeBubbleThemeId: '' })}
              className={cn(
                "w-full h-32 p-3 font-mono text-[10px] rounded-2xl outline-none border-2 transition-all",
                tempSettings.isDarkThemeEnabled ? "bg-white/5 border-blue-200/30 text-white" : "bg-white border-blue-100 text-slate-800 focus:border-blue-300 shadow-inner"
              )}
              placeholder="输入气泡 CSS 样式... 或从上方挑选气泡模板"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold">可爱小兔主题</label>
            <button
              onClick={() => setTempSettings({ ...tempSettings, isCuteRabbitThemeEnabled: !tempSettings.isCuteRabbitThemeEnabled })}
              className={cn("w-12 h-6 rounded-full transition-all relative", tempSettings.isCuteRabbitThemeEnabled ? "bg-pink-400" : "bg-slate-200")}
            >
              <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", tempSettings.isCuteRabbitThemeEnabled ? "right-1" : "left-1")} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-bold">深色主题</label>
            <button
              onClick={() => setTempSettings({ ...tempSettings, isDarkThemeEnabled: !tempSettings.isDarkThemeEnabled })}
              className={cn("w-12 h-6 rounded-full transition-all relative", tempSettings.isDarkThemeEnabled ? "bg-slate-700" : "bg-slate-200")}
            >
              <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", tempSettings.isDarkThemeEnabled ? "right-1" : "left-1")} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label className="text-sm font-bold">Ins 可爱气泡</label>
              <span className="text-[10px] text-slate-400">浅粉白效果 + 可爱图案</span>
            </div>
            <button
              onClick={() => setTempSettings({ ...tempSettings, isInsBubbleEnabled: !tempSettings.isInsBubbleEnabled })}
              className={cn("w-12 h-6 rounded-full transition-all relative", tempSettings.isInsBubbleEnabled ? "bg-pink-400" : "bg-slate-200")}
            >
              <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", tempSettings.isInsBubbleEnabled ? "right-1" : "left-1")} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">气泡自定义 CSS (旧版兼容)</label>
            <textarea
              value={tempSettings.bubbleCustomCss || ''}
              onChange={(e) => setTempSettings({ ...tempSettings, bubbleCustomCss: e.target.value, activeBubbleThemeId: '' })}
              className={cn(
                "w-full h-24 p-3 font-mono text-xs rounded-xl outline-none border-2 transition-all",
                tempSettings.isDarkThemeEnabled ? "bg-white/5 border-pink-200/30 text-white" : "bg-slate-50 border-pink-100 text-slate-800 focus:border-pink-300 shadow-inner"
              )}
              placeholder="输入聊天气泡 CSS 样式..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">全局背景图 (非对话界面)</label>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all",
                  tempSettings.isDarkThemeEnabled ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-slate-50 border-slate-100 hover:bg-slate-100"
                )}
              >
                从相册上传
              </button>
              {tempSettings.appBackgroundUrl && (
                <button 
                  onClick={() => setTempSettings({ ...tempSettings, appBackgroundUrl: '' })}
                  className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-sm font-bold"
                >
                  清除
                </button>
              )}
            </div>
            {tempSettings.appBackgroundUrl && (
              <div className="mt-2 relative rounded-xl overflow-hidden aspect-video border border-slate-200">
                <img src={tempSettings.appBackgroundUrl} className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">全局背景美化</h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-bold">背景模糊 (0=清晰, 100=模糊)</label>
                <span className="text-xs opacity-60">{Math.round((tempSettings.chatWallpaperBlur ?? 0) * 3.33)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={(tempSettings.chatWallpaperBlur ?? 0) * 3.33}
                onChange={(e) => {
                  const value = parseInt(e.target.value) / 3.33;
                  setTempSettings({ ...tempSettings, chatWallpaperBlur: value });
                }}
                className="w-full accent-pink-400"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-bold">背景遮罩 (0=清晰, 100=覆盖)</label>
                <span className="text-xs opacity-60">{Math.round((tempSettings.chatWallpaperOpacity ?? 0) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={tempSettings.chatWallpaperOpacity ?? 0}
                onChange={(e) => setTempSettings({ ...tempSettings, chatWallpaperOpacity: parseFloat(e.target.value) })}
                className="w-full accent-pink-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">全局字体颜色 (非对话界面)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={tempSettings.chatFontColor || (tempSettings.isDarkThemeEnabled ? '#ffffff' : '#0f172a')}
                  onChange={(e) => setTempSettings({ ...tempSettings, chatFontColor: e.target.value })}
                  className="w-12 h-10 rounded-lg cursor-pointer border-2 border-slate-100 bg-transparent"
                />
                <input
                  type="text"
                  value={tempSettings.chatFontColor || (tempSettings.isDarkThemeEnabled ? '#ffffff' : '#0f172a')}
                  onChange={(e) => setTempSettings({ ...tempSettings, chatFontColor: e.target.value })}
                  className={cn(
                    "flex-1 px-3 py-2 text-sm rounded-xl outline-none border-2 transition-all",
                    tempSettings.isDarkThemeEnabled ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-100 text-slate-800 focus:border-pink-300"
                  )}
                />
                <button 
                  onClick={() => setTempSettings({ ...tempSettings, chatFontColor: undefined })}
                  className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold"
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave} 
          className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-pink-200 active:scale-[0.98] transition-all"
        >
          保存并生效
        </button>
      </div>
    </div>
  );
}

function UserProfileEditModal({ user, settings, onClose, onUpdate }: { user: any, settings: AppSettings, onClose: () => void, onUpdate: (updates: any) => void }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    wechatNickname: user.wechatNickname || '',
    wechatId: user.wechatId || '',
    persona: user.persona || '',
    signature: user.signature || ''
  });

  const handleSave = () => {
    onUpdate(formData);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={cn(
          "w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col max-h-[90vh]",
          settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
        )}
      >
        <div className={cn(
          "p-4 border-b flex justify-between items-center transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-slate-50"
        )}>
          <span className="font-bold text-sm">编辑个人资料</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">真实姓名</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={cn(
                "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
              )}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">微信昵称</label>
            <input 
              type="text" 
              value={formData.wechatNickname}
              onChange={(e) => setFormData(prev => ({ ...prev, wechatNickname: e.target.value }))}
              className={cn(
                "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
              )}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">微信号</label>
            <input 
              type="text" 
              value={formData.wechatId}
              onChange={(e) => setFormData(prev => ({ ...prev, wechatId: e.target.value }))}
              className={cn(
                "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
              )}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">个性签名</label>
            <input 
              type="text" 
              value={formData.signature}
              onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
              className={cn(
                "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
              )}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">个人人设</label>
            <textarea 
              value={formData.persona}
              onChange={(e) => setFormData(prev => ({ ...prev, persona: e.target.value }))}
              className={cn(
                "w-full h-32 px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all resize-none",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
              )}
              placeholder="描述你的人设，角色会根据此信息与你互动..."
            />
          </div>
        </div>
        <div className="p-4 border-t">
          <button 
            onClick={handleSave}
            className={cn(
              "w-full py-3 rounded-xl font-bold active:scale-95 transition-all",
              settings.themeId === 'rainy-cat' ? "bg-white/20 hover:bg-white/30 text-white" : "bg-green-600 text-white"
            )}
          >
            保存资料
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FavoritesView({ user, settings, onBack, onDelete }: { user: any, settings: AppSettings, onBack: () => void, onDelete: (id: string) => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const favorites = user.favorites || [];
  const isDark = settings.isDarkThemeEnabled;
  const isRabbit = settings.isCuteRabbitThemeEnabled;
  
  const filteredFavorites = favorites.filter((fav: any) => 
    (fav.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (fav.friendName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn(
      "h-full flex flex-col transition-colors duration-500",
      isDark ? "bg-transparent text-white" : 
      (isRabbit ? "bg-transparent" : (settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : (settings.appBackgroundUrl ? "bg-transparent" : "bg-slate-100")))
    )}>
      <div className={cn(
        "px-3 py-2 flex items-center gap-2 border-b transition-all duration-300",
        isDark ? "bg-black border-white/10" : 
        (isRabbit ? "bg-pink-50/80 backdrop-blur-md border-pink-100" : (settings.appBackgroundUrl ? "bg-white/70 backdrop-blur-md border-slate-200" : "bg-white border-slate-100"))
      )} style={settings.fullScreenMode ? { paddingTop: settings.hideStatusBar ? 'env(safe-area-inset-top)' : 'max(env(safe-area-inset-top), 44px)' } : {}}>
        <button onClick={onBack} className="p-1 hover:bg-slate-200 rounded-full">
          <ChevronLeft size={20} />
        </button>
        <span className="font-bold text-base">我的收藏</span>
      </div>
      
      {/* Search Bar */}
      <div className={cn(
        "p-3 border-b transition-all duration-300",
        isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-100"
      )}>
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
          isDark ? "bg-white/10" : "bg-slate-100"
        )}>
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索收藏内容" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredFavorites.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Heart size={48} className="opacity-20" />
            <p className="text-sm">暂无收藏内容</p>
          </div>
        ) : (
          filteredFavorites.map((fav: any, idx: number) => (
            <div key={`${fav.id}-${idx}`} className={cn(
              "p-4 rounded-xl shadow-sm border transition-all duration-300 group",
              settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white border-slate-100"
            )}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold opacity-60">{fav.friendName}</span>
                  <span className="text-[10px] opacity-30">{new Date(fav.timestamp).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={() => onDelete(fav.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-sm leading-relaxed">{fav.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MyMomentsPage({ user, settings, onBack, onUpdate }: { user: any, settings: AppSettings, onBack: () => void, onUpdate: (updates: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingSignature, setIsEditingSignature] = useState(false);
  const [signature, setSignature] = useState(user.signature || '');

  const handleBgClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({ momentsBackground: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSignature = () => {
    onUpdate({ signature });
    setIsEditingSignature(false);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      <div className="relative h-64 shrink-0">
        <img 
          src={user.momentsBackground || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000'} 
          className="w-full h-full object-cover cursor-pointer" 
          onClick={handleBgClick}
          title="点击更换背景"
        />
        <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-all">
          <ChevronLeft size={20} />
        </button>
        <div className="absolute bottom-[-20px] right-4 flex items-center gap-3">
          <span className="text-white font-bold drop-shadow-lg text-lg mb-4">{user?.name ?? '用户'}</span>
          <img src={user.avatar} className="w-16 h-16 rounded-xl border-4 border-white bg-slate-200 object-cover shadow-lg" />
        </div>
      </div>

      <div className="mt-8 px-6 flex flex-col items-end">
        {isEditingSignature ? (
          <div className="flex flex-col items-end gap-2 w-full max-w-[200px]">
            <input 
              type="text" 
              value={signature} 
              onChange={(e) => setSignature(e.target.value)}
              className="text-right text-xs text-slate-500 border-b border-slate-200 focus:border-blue-400 outline-none w-full py-1"
              autoFocus
              onBlur={handleSaveSignature}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveSignature()}
            />
          </div>
        ) : (
          <p 
            className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors"
            onClick={() => setIsEditingSignature(true)}
          >
            {user.signature || '点击设置个性签名'}
          </p>
        )}
      </div>

      <div className="flex-1 p-6 space-y-8">
        {(!user.moments || user.moments.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 gap-4">
            <Camera size={48} className="opacity-20" />
            <p className="text-sm">还没有发过朋友圈哦</p>
          </div>
        ) : (
          user.moments.map((moment: any, idx: number) => (
            <div key={`${moment.id}-${idx}`} className="flex gap-4">
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                <img src={user.avatar} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <span className="font-bold text-blue-900 text-sm">{user?.name ?? '用户'}</span>
                <p className="text-sm text-slate-800 leading-relaxed">{moment.content}</p>
                {moment.images && moment.images.length > 0 && (
                  <div className={cn(
                    "grid gap-1",
                    moment.images.length === 1 ? "grid-cols-1" : moment.images.length <= 4 ? "grid-cols-2" : "grid-cols-3"
                  )}>
                    {moment.images.map((img: string, idx: number) => (
                      <img key={idx} src={img} className="rounded-sm w-full aspect-square object-cover" />
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-400">{new Date(moment.timestamp).toLocaleString()}</span>
                  <button className="p-1 bg-slate-50 rounded text-blue-600">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />
    </div>
  );
}

function PaymentPage({ user, settings, onBack, onUpdate, onAddTransaction, onAddBankCard, onDeleteBankCard, onUpdateBankCard }: { 
  user: any, 
  settings: AppSettings, 
  onBack: () => void, 
  onUpdate: (updates: any) => void,
  onAddTransaction: (t: any) => void,
  onAddBankCard: (card: any) => void,
  onDeleteBankCard: (id: string) => void,
  onUpdateBankCard: (id: string, updates: any) => void
}) {
  const [activeTab, setActiveTab] = useState<'wallet' | 'transactions' | 'manage-cards'>('wallet');
  const [showTopUp, setShowTopUp] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [backgroundModal, setBackgroundModal] = useState<{ type: 'balance' | 'card' | 'page', id?: string } | null>(null);
  const [bgUrl, setBgUrl] = useState('');
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [topUpAmount, setTopUpAmount] = useState('');
  
  const [newCard, setNewCard] = useState({
    bankName: '招商银行',
    cardNumber: '',
    balance: 0,
    cardType: '储蓄卡',
    theme: 'hello-kitty'
  });

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    onAddTransaction({
      type: 'topup',
      amount: amount,
      title: '余额充值'
    });
    
    setTopUpAmount('');
    setShowTopUp(false);
  };

  const handleAddCard = () => {
    if (!newCard.cardNumber) return;
    
    const themes: Record<string, string> = {
      'hello-kitty': 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=1000',
      'line-dog': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=1000',
      'kuromi': 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000',
      'genshin-impact': 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=1000'
    };

    onAddBankCard({
      ...newCard,
      cardNumber: `**** **** **** ${newCard.cardNumber.slice(-4)}`,
      backgroundUrl: themes[newCard.theme] || themes['hello-kitty']
    });
    
    setShowAddCard(false);
    setNewCard({
      bankName: '招商银行',
      cardNumber: '',
      balance: 0,
      cardType: '储蓄卡',
      theme: 'hello-kitty'
    });
  };

  const handleBgUpdate = (url: string) => {
    if (!backgroundModal) return;
    if (backgroundModal.type === 'balance') {
      onUpdate({ balanceBackground: url });
    } else if (backgroundModal.type === 'page') {
      onUpdate({ paymentBackground: url });
    } else if (backgroundModal.id) {
      onUpdateBankCard(backgroundModal.id, { backgroundUrl: url });
    }
    setBackgroundModal(null);
    setBgUrl('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleBgUpdate(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCardGradient = (theme: string) => {
    switch (theme) {
      case 'hello-kitty': return "bg-pink-100/40 backdrop-blur-xl border border-pink-200/50 text-pink-900 shadow-pink-100/20";
      case 'line-dog': return "bg-yellow-100/40 backdrop-blur-xl border border-yellow-200/50 text-yellow-900 shadow-yellow-100/20";
      case 'kuromi': return "bg-purple-100/40 backdrop-blur-xl border border-purple-200/50 text-purple-900 shadow-purple-100/20";
      case 'genshin-impact': return "bg-blue-100/40 backdrop-blur-xl border border-blue-200/50 text-blue-900 shadow-blue-100/20";
      default: return "bg-white/40 backdrop-blur-xl border border-white/30 text-slate-900 shadow-white/10";
    }
  };

  return (
    <div 
      className="flex flex-col h-full bg-slate-50 overflow-hidden relative"
      onClick={() => setBackgroundModal({ type: 'page' })}
    >
      {user.paymentBackground && (
        <img src={user.paymentBackground} className="absolute inset-0 w-full h-full object-cover opacity-100" />
      )}
      
      {/* Header */}
      <div className="px-4 py-3 bg-white/80 backdrop-blur-md border-b flex items-center justify-between relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <button onClick={() => activeTab === 'wallet' ? onBack() : setActiveTab('wallet')} className="p-1 hover:bg-slate-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold">
            {activeTab === 'wallet' ? '支付' : activeTab === 'transactions' ? '账单明细' : '管理卡片'}
          </span>
        </div>
        {activeTab === 'wallet' && (
          <button 
            onClick={() => setActiveTab('transactions')}
            className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
          >
            账单明细
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto relative z-10">
        {activeTab === 'wallet' ? (
          <div className="p-6 space-y-8">
            {/* Balance Card */}
            <div 
              onClick={(e) => { e.stopPropagation(); setBackgroundModal({ type: 'balance' }); }}
              className={cn(
                "p-8 rounded-[32px] shadow-2xl relative overflow-hidden group cursor-pointer transition-colors duration-500",
                user.balanceBackground 
                  ? "bg-slate-900 text-white" 
                  : "bg-white/80 backdrop-blur-xl border border-white/20 text-slate-900"
              )}
            >
              {user.balanceBackground && (
                <img src={user.balanceBackground} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              )}
              {!user.balanceBackground && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-all" />
              )}
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <p className={cn("text-xs font-bold uppercase tracking-widest", user.balanceBackground ? "text-white/60" : "text-slate-400")}>Wallet Balance</p>
                    <h2 className="text-4xl font-black tracking-tighter">￥{user.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                  </div>
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", user.balanceBackground ? "bg-white/10 backdrop-blur-md" : "bg-slate-900/5")}>
                    <Wallet size={24} className={user.balanceBackground ? "text-white" : "text-slate-900"} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowTopUp(true); }}
                    className={cn(
                      "flex-1 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all shadow-sm",
                      user.balanceBackground ? "bg-white text-slate-900" : "bg-slate-900 text-white"
                    )}
                  >
                    立即充值
                  </button>
                  <button 
                    onClick={(e) => e.stopPropagation()}
                    className={cn(
                      "flex-1 py-3 rounded-2xl font-bold text-sm active:scale-95 transition-all",
                      user.balanceBackground ? "bg-white/10 backdrop-blur-md text-white" : "bg-slate-900/5 text-slate-900"
                    )}
                  >
                    提现
                  </button>
                </div>
              </div>
            </div>

            {/* Bank Cards Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className={cn("text-sm font-black uppercase tracking-widest", user.paymentBackground ? "text-white" : "text-slate-900")}>My Bank Cards</h3>
                <button onClick={(e) => { e.stopPropagation(); setActiveTab('manage-cards'); }} className="text-[10px] font-bold text-blue-600 bg-white/50 backdrop-blur-sm px-2 py-1 rounded-full">管理卡片</button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 px-1 snap-x no-scrollbar">
                {(user.bankCards || []).map((card: any, idx: number) => (
                  <div 
                    key={`${card.id}-${idx}`}
                    onClick={(e) => { e.stopPropagation(); setBackgroundModal({ type: 'card', id: card.id }); }}
                    className={cn(
                      "min-w-[280px] h-[180px] rounded-[24px] p-6 snap-center relative overflow-hidden shadow-xl transition-colors duration-500 cursor-pointer group",
                      card.backgroundUrl ? "bg-slate-900 text-white" : getCardGradient(card.theme)
                    )}
                  >
                    {card.backgroundUrl && (
                      <img src={card.backgroundUrl} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    )}
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={cn("text-xs font-bold", card.backgroundUrl ? "opacity-60" : "opacity-80")}>{card.bankName}</p>
                          <p className={cn("text-[10px]", card.backgroundUrl ? "opacity-40" : "opacity-60")}>{card.cardType}</p>
                        </div>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.backgroundUrl ? "bg-white/20" : "bg-black/5")}>
                          <CreditCard size={16} />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <p className={cn("text-xs tracking-widest", card.backgroundUrl ? "opacity-60" : "opacity-80")}>{card.cardNumber}</p>
                        <p className="text-xl font-black">￥{card.balance?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowAddCard(true); }}
                  className="min-w-[100px] h-[180px] rounded-[24px] border-2 border-dashed border-slate-200 bg-white/20 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-all"
                >
                  <Plus size={24} />
                  <span className="text-[10px] font-bold">添加卡片</span>
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'transactions' ? (
          <div className="p-4 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Transaction History</h3>
            <div className="space-y-2">
              {(!user.transactions || user.transactions.length === 0) ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-300 gap-2">
                  <History size={48} className="opacity-20" />
                  <p className="text-sm">暂无交易记录</p>
                </div>
              ) : (
                user.transactions.map((t: any, idx: number) => (
                  <div key={`${t.id}-${idx}`} onClick={(e) => e.stopPropagation()} className="bg-white/60 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between shadow-sm border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        t.type === 'topup' ? "bg-green-50 text-green-600" : 
                        t.type === 'spend' ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {t.type === 'topup' ? <ArrowUpRight size={20} /> : 
                         t.type === 'spend' ? <ShoppingBag size={20} /> : <ArrowDownLeft size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{t.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(t.timestamp).toLocaleString()}
                          {t.paymentMethodId && t.paymentMethodId !== 'wallet' && (
                            <span className="ml-2">
                              (银行卡: {user.bankCards?.find((c: any) => c.id === t.paymentMethodId)?.bankName || '未知银行'})
                            </span>
                          )}
                          {(!t.paymentMethodId || t.paymentMethodId === 'wallet') && (
                            <span className="ml-2">(零钱)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-black text-sm",
                      (t.type === 'topup' || t.type === 'transfer-in') ? "text-green-600" : "text-slate-900"
                    )}>
                      {(t.type === 'topup' || t.type === 'transfer-in') ? '+' : '-'}￥{t.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Manage Bank Cards</h3>
              <button 
                onClick={() => setShowAddCard(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full"
              >
                <Plus size={12} /> 添加新卡
              </button>
            </div>
            <div className="space-y-3">
              {(user.bankCards || []).map((card: any, idx: number) => (
                <div key={`${card.id}-${idx}`} onClick={(e) => e.stopPropagation()} className="bg-white/60 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between shadow-sm border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-8 rounded-md flex items-center justify-center text-white", getCardGradient(card.theme))}>
                      <CreditCard size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{card.bankName}</p>
                      <p className="text-[10px] text-slate-400">{card.cardNumber} · {card.cardType}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteBankCard(card.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      <AnimatePresence>
        {showTopUp && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTopUp(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6">充值余额</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">输入金额</label>
                  <div className="flex items-center gap-2 border-b-2 border-slate-100 focus-within:border-blue-500 transition-all py-2">
                    <span className="text-2xl font-black text-slate-900">￥</span>
                    <input 
                      type="number" 
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="flex-1 text-3xl font-black outline-none bg-transparent"
                      placeholder="0.00"
                      autoFocus
                    />
                  </div>
                </div>
                <button 
                  onClick={handleTopUp}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-xl shadow-slate-200"
                >
                  确认充值
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCard && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddCard(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-black text-slate-900 mb-6">添加银行卡</h3>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">银行名称</label>
                    <select 
                      value={newCard.bankName}
                      onChange={(e) => setNewCard({...newCard, bankName: e.target.value})}
                      className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-blue-400 text-sm font-bold"
                    >
                      <option>招商银行</option>
                      <option>建设银行</option>
                      <option>工商银行</option>
                      <option>农业银行</option>
                      <option>中国银行</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">卡号 (最后4位)</label>
                    <input 
                      type="text" 
                      maxLength={4}
                      value={newCard.cardNumber}
                      onChange={(e) => setNewCard({...newCard, cardNumber: e.target.value})}
                      className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-blue-400 text-sm font-bold"
                      placeholder="例如: 8888"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">卡片余额</label>
                    <input 
                      type="number" 
                      value={newCard.balance}
                      onChange={(e) => setNewCard({...newCard, balance: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-blue-400 text-sm font-bold"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">选择主题</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'hello-kitty', name: 'Hello Kitty', color: 'bg-pink-400' },
                        { id: 'line-dog', name: '线条小狗', color: 'bg-yellow-200' },
                        { id: 'kuromi', name: '库洛米', color: 'bg-purple-600' },
                        { id: 'genshin-impact', name: '原神联名', color: 'bg-blue-600' }
                      ].map(theme => (
                        <button 
                          key={theme.id}
                          onClick={() => setNewCard({...newCard, theme: theme.id, cardType: `${theme.name} 联名卡`})}
                          className={cn(
                            "p-3 rounded-xl border-2 transition-all flex items-center gap-2",
                            newCard.theme === theme.id ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-white"
                          )}
                        >
                          <div className={cn("w-4 h-4 rounded-full", theme.color)} />
                          <span className="text-xs font-bold">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleAddCard}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold active:scale-95 transition-all shadow-xl shadow-slate-200"
                >
                  确认添加
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background Customization Modal */}
      <AnimatePresence>
        {backgroundModal && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBackgroundModal(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="relative w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-900 mb-2">更换背景图</h3>
              <p className="text-xs text-slate-400 mb-6">让你的钱包和银行卡更具个性化</p>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">使用网络图片链接</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={bgUrl}
                      onChange={(e) => setBgUrl(e.target.value)}
                      className="flex-1 p-3 bg-slate-50 rounded-xl outline-none border border-slate-100 focus:border-blue-400 text-sm"
                      placeholder="粘贴图片 URL 链接..."
                    />
                    <button 
                      onClick={() => handleBgUpdate(bgUrl)}
                      className="px-4 bg-slate-900 text-white rounded-xl font-bold text-xs active:scale-95 transition-all"
                    >
                      应用
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold">
                    <span className="bg-white px-2 text-slate-300">或者</span>
                  </div>
                </div>

                <button 
                  onClick={() => bgFileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-all"
                >
                  <Plus size={24} />
                  <span className="text-xs font-bold">从手机相册选择</span>
                </button>

                <input 
                  type="file" 
                  ref={bgFileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                <button 
                  onClick={() => handleBgUpdate('')}
                  className="w-full py-3 text-slate-400 text-xs font-bold hover:text-slate-600 transition-all"
                >
                  恢复默认背景
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonaArchiveView({ 
  user, settings, onBack, onUpdate, onToggle, onSelect, onDelete, onAdd, onEdit 
}: { 
  user: any, 
  settings: AppSettings, 
  onBack: () => void, 
  onUpdate: (updates: any) => void,
  onToggle: (id: string) => void,
  onSelect: (id: string) => void,
  onDelete: (id: string) => void,
  onAdd: (p: any) => void,
  onEdit: (id: string, p: any) => void
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingPersona, setEditingPersona] = useState<any | null>(null);
  const personas = user.personas || [];
  const isDark = settings.isDarkThemeEnabled;
  const isRabbit = settings.isCuteRabbitThemeEnabled;

  return (
    <div className={cn(
      "h-full flex flex-col transition-colors duration-500",
      isDark ? "bg-transparent text-white" : 
      (isRabbit ? "bg-transparent" : (settings.themeId === 'rainy-cat' ? "bg-black/20 backdrop-blur-xl text-white" : (settings.appBackgroundUrl ? "bg-transparent" : "bg-slate-100")))
    )}>
      <div className={cn(
        "px-3 py-2 flex items-center justify-between border-b transition-all duration-300",
        isDark ? "bg-black border-white/10" : 
        (isRabbit ? "bg-pink-50/80 backdrop-blur-md border-pink-100" : (settings.appBackgroundUrl ? "bg-white/70 backdrop-blur-md border-slate-200" : "bg-white border-slate-100"))
      )} style={settings.fullScreenMode ? { paddingTop: settings.hideStatusBar ? 'env(safe-area-inset-top)' : 'max(env(safe-area-inset-top), 44px)' } : {}}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 hover:bg-slate-200 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <span className="font-bold text-base">人设档案</span>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className={cn(
            "p-1.5 rounded-full transition-all active:scale-95",
            settings.themeId === 'rainy-cat' ? "bg-white/10 hover:bg-white/20" : "bg-slate-100 hover:bg-slate-200"
          )}
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {personas.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <BookHeart size={48} className="mx-auto mb-4 opacity-20" />
            <p>还没有创建人设档案哦</p>
          </div>
        ) : (
          personas.map((p: any, idx: number) => (
            <div 
              key={`${p.id}-${idx}`} 
              className={cn(
                "p-4 rounded-2xl shadow-sm border transition-all duration-300 relative overflow-hidden",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-white border-slate-100",
                user.activePersonaId === p.id && (settings.themeId === 'rainy-cat' ? "border-white/40" : "border-green-500 ring-1 ring-green-500")
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{p.name}</h3>
                  <p className="text-[10px] opacity-40">微信号: {p.wechatId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onToggle(p.id)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold transition-all",
                      p.isEnabled 
                        ? (settings.themeId === 'rainy-cat' ? "bg-white/20 text-white" : "bg-green-100 text-green-700")
                        : (settings.themeId === 'rainy-cat' ? "bg-white/5 text-white/40" : "bg-slate-100 text-slate-400")
                    )}
                  >
                    {p.isEnabled ? '已启用' : '已禁用'}
                  </button>
                  <button 
                    onClick={() => onSelect(p.id)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold transition-all",
                      user.activePersonaId === p.id
                        ? (settings.themeId === 'rainy-cat' ? "bg-white/40 text-white" : "bg-green-600 text-white")
                        : (settings.themeId === 'rainy-cat' ? "bg-white/10 text-white/60" : "bg-slate-200 text-slate-600")
                    )}
                  >
                    {user.activePersonaId === p.id ? '当前使用' : '使用此人设'}
                  </button>
                </div>
              </div>
              <p className="text-xs opacity-60 line-clamp-3 mb-4">{p.persona}</p>
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button 
                  onClick={() => setEditingPersona(p)}
                  className="text-[10px] font-bold opacity-40 hover:opacity-100 transition-opacity"
                >编辑</button>
                <button 
                  onClick={() => onDelete(p.id)}
                  className="text-[10px] font-bold text-red-400 opacity-40 hover:opacity-100 transition-opacity"
                >删除</button>
              </div>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {(showAdd || editingPersona) && (
          <PersonaEditModal 
            settings={settings}
            persona={editingPersona}
            onClose={() => { setShowAdd(false); setEditingPersona(null); }}
            onSave={(data) => {
              if (editingPersona) {
                onEdit(editingPersona.id, data);
              } else {
                onAdd(data);
              }
              setShowAdd(false);
              setEditingPersona(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PersonaEditModal({ settings, persona, onClose, onSave }: { settings: AppSettings, persona?: any, onClose: () => void, onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: persona?.name || '',
    wechatId: persona?.wechatId || '',
    persona: persona?.persona || '',
    signature: persona?.signature || ''
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={cn(
          "w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col max-h-[90vh]",
          settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
        )}
      >
        <div className={cn(
          "p-4 border-b flex justify-between items-center transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-slate-50"
        )}>
          <span className="font-bold text-sm">{persona ? '编辑人设' : '新增人设'}</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">人设名称</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如：霸道总裁、温柔学妹"
              className={cn(
                "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
              )}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">微信号</label>
            <input 
              type="text" 
              value={formData.wechatId}
              onChange={(e) => setFormData(prev => ({ ...prev, wechatId: e.target.value }))}
              className={cn(
                "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
              )}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">个性签名</label>
            <input 
              type="text" 
              value={formData.signature}
              onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
              className={cn(
                "w-full px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
              )}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">人设详细设定</label>
            <textarea 
              value={formData.persona}
              onChange={(e) => setFormData(prev => ({ ...prev, persona: e.target.value }))}
              className={cn(
                "w-full h-40 px-3 py-2 rounded-xl text-sm focus:outline-none border transition-all resize-none",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200"
              )}
              placeholder="详细描述此人设的性格、说话方式、背景等..."
            />
          </div>
        </div>
        <div className="p-4 border-t">
          <button 
            onClick={() => onSave(formData)}
            className={cn(
              "w-full py-3 rounded-xl font-bold active:scale-95 transition-all",
              settings.themeId === 'rainy-cat' ? "bg-white/20 hover:bg-white/30 text-white" : "bg-green-600 text-white"
            )}
          >
            保存人设
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MenuItem({ icon: Icon, label, color, settings, onClick }: { icon: any, label: string, color: string, settings: AppSettings, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-3 cursor-pointer transition-all duration-300",
        settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : (settings.appBackgroundUrl ? "hover:bg-white/10" : "hover:bg-slate-50")
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={18} className={cn(
          "transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "text-white/60" : color
        )} />
        <span className="font-medium text-sm">{label}</span>
      </div>
      <ChevronLeft size={16} className={cn(
        "rotate-180 transition-all duration-300",
        settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-300"
      )} />
    </div>
  );
}

function ProfileSelectorModal({ onClose, onAdd, settings }: { onClose: () => void, onAdd: (f: Omit<Friend, 'id' | 'lastMessage' | 'lastTime' | 'createdAt'>) => void, settings: AppSettings }) {
  const profiles = settings.characterProfiles || [];
  const [isLocating, setIsLocating] = useState<string | null>(null);

  const fetchLocation = async () => {
    try {
      const res = await fetch('https://api.vvhan.com/api/getIpInfo');
      const data = await res.json();
      if (data.success && data.info) {
        return `${data.info.prov} ${data.info.city}`;
      }
    } catch (e) {}
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];
    return cities[Math.floor(Math.random() * cities.length)];
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={cn(
          "w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col max-h-[80vh]",
          settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
        )}
      >
        <div className={cn(
          "p-4 border-b flex justify-between items-center transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-slate-50"
        )}>
          <span className="font-bold text-sm">选择角色</span>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {profiles.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              还没有在角色资料手账中创建角色哦
            </div>
          ) : (
            profiles.map((profile, idx) => (
              <button
                key={`${profile.id}-${idx}`}
                disabled={!!isLocating}
                onClick={async () => {
                  setIsLocating(profile.id);
                  const location = await fetchLocation();
                  onAdd({
                    name: profile.name,
                    avatar: profile.avatarUrl,
                    persona: `【人设资料】\n${profile.persona}\n\n【个人经历】\n${profile.experience}\n\n【成长背景】\n${profile.background}\n\n【和user的关系】\n${profile.relationship}`,
                    gender: profile.gender?.includes('男') ? 'male' : profile.gender?.includes('女') ? 'female' : 'other',
                    address: location,
                    profileId: profile.id,
                    wechatId: (function(name: string) {
                      const initials = name
                        .split('')
                        .filter(char => /[a-zA-Z0-9\u4e00-\u9fa5]/.test(char))
                        .slice(0, 3)
                        .map(char => {
                          if (/[a-zA-Z]/.test(char)) return char.toLowerCase();
                          return char; 
                        })
                        .join('');
                      
                      const luckyNumbers = ['6', '8', '9'];
                      const randomNumbers = Array.from({ length: 4 }, () => luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)]).join('');
                      
                      return `${initials}_${randomNumbers}`;
                    })(profile.name)
                  });
                  setIsLocating(null);
                }}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left relative",
                  settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-50 border border-slate-100",
                  isLocating === profile.id && "opacity-50"
                )}
              >
                <img src={profile.avatarUrl} alt={profile.name} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1 overflow-hidden">
                  <div className="font-bold text-sm truncate">{profile.name}</div>
                  <div className="text-xs text-slate-500 truncate mt-1">{profile.persona}</div>
                </div>
                {isLocating === profile.id && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/20 backdrop-blur-[1px] rounded-xl">
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AddFriendModal({ onClose, onAdd, settings }: { onClose: () => void, onAdd: (f: Omit<Friend, 'id' | 'lastMessage' | 'lastTime' | 'createdAt'>) => void, settings: AppSettings }) {
  const [name, setName] = useState('');
  const [persona, setPersona] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('female');
  const [avatarSeed, setAvatarSeed] = useState(Math.random().toString(36).substring(7));

  const fetchLocation = async () => {
    try {
      const res = await fetch('https://api.vvhan.com/api/getIpInfo');
      const data = await res.json();
      if (data.success && data.info) {
        return `${data.info.prov} ${data.info.city}`;
      }
    } catch (e) {}
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '重庆'];
    return cities[Math.floor(Math.random() * cities.length)];
  };

  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className={cn(
          "w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
        )}
      >
        <div className={cn(
          "p-3 border-b flex justify-between items-center transition-all duration-300",
          settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-slate-50"
        )}>
          <span className="font-bold text-sm">添加新好友</span>
          <button 
            onClick={onClose} 
            className={cn(
              "p-1 rounded-full transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "hover:bg-white/10" : "hover:bg-slate-200"
            )}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex flex-col items-center gap-1.5">
            <img src={avatarUrl} className={cn(
              "w-16 h-16 rounded-xl border transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "bg-white/10 border-white/10" : "bg-slate-100 border-slate-200"
            )} alt="preview" />
            <button 
              onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}
              className={cn(
                "text-[10px] font-medium transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40 hover:text-white/60" : "text-blue-600"
              )}
            >
              随机生成头像
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={cn(
                "text-[10px] font-bold uppercase transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )}>昵称</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="名字"
                className={cn(
                  "w-full p-2 rounded-lg text-xs focus:outline-none border transition-all duration-300",
                  settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-green-500"
                )}
              />
            </div>
            <div className="space-y-1">
              <label className={cn(
                "text-[10px] font-bold uppercase transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )}>性别</label>
              <div className={cn(
                "flex rounded-lg p-0.5 border transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"
              )}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={cn(
                      "flex-1 py-1 text-[10px] rounded-md transition-all duration-300",
                      gender === g 
                        ? (settings.themeId === 'rainy-cat' ? "bg-white/20 text-white font-bold" : "bg-white shadow-sm text-slate-900 font-bold")
                        : (settings.themeId === 'rainy-cat' ? "text-white/20" : "text-slate-400")
                    )}
                  >
                    {g === 'male' ? '男' : g === 'female' ? '女' : '其他'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className={cn(
                "text-[10px] font-bold uppercase transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
              )}>地区</label>
              <button 
                onClick={async () => {
                  const location = await fetchLocation();
                  setAddress(location);
                }}
                className="text-[10px] text-blue-500 hover:underline"
              >
                自动识别
              </button>
            </div>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="例如：上海 浦东"
              className={cn(
                "w-full p-2 rounded-lg text-xs focus:outline-none border transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-green-500"
              )}
            />
          </div>

          <div className="space-y-1">
            <label className={cn(
              "text-[10px] font-bold uppercase transition-all duration-300",
              settings.themeId === 'rainy-cat' ? "text-white/40" : "text-slate-400"
            )}>人设 (AI指令)</label>
            <textarea 
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="例如：你是一个傲娇的女生..."
              rows={2}
              className={cn(
                "w-full p-2 rounded-lg text-xs focus:outline-none resize-none border transition-all duration-300",
                settings.themeId === 'rainy-cat' ? "bg-white/5 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-slate-200 focus:ring-2 focus:ring-green-500"
              )}
            />
          </div>

          <button 
            disabled={!name || !persona}
            onClick={() => onAdd({ name, persona, address, avatar: avatarUrl, gender })}
            className={cn(
              "w-full py-2.5 rounded-lg text-sm font-bold shadow-lg disabled:opacity-50 transition-all active:scale-95 duration-300",
              settings.themeId === 'rainy-cat' ? "bg-white/20 text-white shadow-none" : "bg-green-600 text-white shadow-green-100"
            )}
          >
            确认添加
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

async function handleAICommentOnMoment(friend: Friend, moment: any, onAddComment: (momentId: string, authorId: string, comment: any) => void, settings: AppSettings) {
  // Rule: each character only once per post
  const hasCommented = (moment.comments || []).some((c: any) => c.authorId === friend.id);
  if (hasCommented) return;

  const prompt = `你现在是 ${friend?.name ?? '角色'}。你的性格是：${friend?.persona ?? '伙伴'}。
你的好友 ${moment?.authorName ?? '好友'} 刚刚发布了一条朋友圈：
内容：${moment?.content ?? ''}
${moment?.location ? `地点：${moment.location}` : ''}
${moment.isTextCard ? `附图描述：${moment.imageDescription}` : ''}

请根据你的性格和你们的关系，给这条朋友圈写一条简短、自然、口语化的评论。
要求：
1. 字数在20字以内。
2. 像真实人类一样说话，不要有AI感。
3. 如果朋友圈有文字照片卡片描述，请针对照片内容进行自然互动。
4. 回复时必须使用当前设定的语言：${friend.language || '普通话'}。
5. 不要使用“作为AI”之类的话。
直接输出评论内容即可。`;

  try {
    const response = await callAI(prompt, [{ role: 'user', content: '请生成评论。' } as ChatMessage], settings);
    if (response) {
      onAddComment(moment.id, moment.authorId === 'user' ? 'user' : moment.authorId, {
        authorId: friend?.id ?? '',
        authorName: friend?.name ?? '角色',
        content: response,
      });
    }
  } catch (err: any) {
    if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
      console.warn("AI Comment skipped: Quota exceeded.");
    } else if (err.message?.includes('余额不足')) {
      console.warn("AI Comment skipped: Insufficient balance.");
    } else {
      console.error("AI Comment error:", err);
    }
  }
}

async function handleAIReplyToComment(friend: Friend, user: any, commentContent: string, onReply: (content: string) => void, settings: AppSettings) {
  const prompt = `你现在是 ${friend?.name ?? '角色'}。你的性格是：${friend?.persona ?? '伙伴'}。
你在朋友圈看到了一条动态，并进行了互动。现在有人回复了你的评论，或者在你的动态下评论了你。
评论/回复内容：${commentContent}

请根据你的性格和你们的关系，给这条内容写一个简短、自然、口语化的回复。
要求：
1. 字数在20字以内。
2. 像真实人类一样说话，不要有AI感。
3. 回复时必须使用当前设定的语言：${friend.language || '普通话'}。
4. 可以带一点语气词（呀、啦、哈等）。
5. 直接输出回复内容即可，不要包含任何前缀。`;

  try {
    const response = await callAI(prompt, [{ role: 'user', content: '请生成回复。' } as ChatMessage], settings);
    if (response) {
      onReply(response);
    }
  } catch (err: any) {
    console.error("AI Reply error:", err);
    if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
       // Silent skip
    } else if (err.message?.includes('余额不足')) {
      if (!(window as any)._lastBalanceError || Date.now() - (window as any)._lastBalanceError > 60000) {
        (window as any)._lastBalanceError = Date.now();
        alert("AI服务提示：您的API余额不足，部分自动回复功能已暂停。");
      }
    }
  }
}

function PostMomentModal({ user, friends, settings, onClose, onPost }: { user: any, friends: Friend[], settings: AppSettings, onClose: () => void, onPost: (content: string, images: string[], location: string, visibility: any, visibleTo: string[], hiddenFrom: string[]) => void }) {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'selected' | 'excluded'>('public');
  const [visibleTo, setVisibleTo] = useState<string[]>([]);
  const [hiddenFrom, setHiddenFrom] = useState<string[]>([]);
  const [showVisibilitySelector, setShowVisibilitySelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string]);
        };
        if (file) {
          reader.readAsDataURL(file as Blob);
        }
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col"
    >
      <div className="px-4 py-3 flex justify-between items-center border-b">
        <button onClick={onClose} className="text-sm">取消</button>
        <button 
          disabled={!content.trim() && images.length === 0}
          onClick={() => onPost(content, images, location, visibility, visibleTo, hiddenFrom)}
          className="px-4 py-1.5 bg-[#07c160] text-white rounded font-bold text-sm disabled:opacity-50"
        >
          发表
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <textarea 
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="这一刻的想法..."
          className="w-full h-32 text-base outline-none resize-none"
        />

        <div className="grid grid-cols-3 gap-2">
          {images.map((img, idx) => (
            <div key={idx} className="relative aspect-square">
              <img src={img} className="w-full h-full object-cover rounded" />
              <button 
                onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                className="absolute -top-2 -right-2 bg-black/50 text-white rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {images.length < 9 && (
            <button 
              onClick={handleAddImage}
              className="aspect-square bg-slate-100 rounded flex items-center justify-center text-slate-400"
            >
              <Plus size={32} />
            </button>
          )}
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />

        <div className="divide-y border-t border-b">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <MapPin size={18} className="text-slate-400" />
              <input 
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="所在位置"
                className="outline-none"
              />
            </div>
            <ChevronLeft size={16} className="rotate-180 text-slate-300" />
          </div>
          <button 
            onClick={() => setShowVisibilitySelector(true)}
            className="w-full py-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 text-sm">
              <User size={18} className="text-slate-400" />
              <span>谁可以看</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>
                {visibility === 'public' && '公开'}
                {visibility === 'selected' && '部分可见'}
                {visibility === 'excluded' && '不给谁看'}
              </span>
              <ChevronLeft size={16} className="rotate-180 text-slate-300" />
            </div>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showVisibilitySelector && (
          <VisibilitySelectorModal
            friends={friends}
            visibility={visibility}
            visibleTo={visibleTo}
            hiddenFrom={hiddenFrom}
            onClose={() => setShowVisibilitySelector(false)}
            onSave={(v, vt, hf) => {
              setVisibility(v);
              setVisibleTo(vt);
              setHiddenFrom(hf);
              setShowVisibilitySelector(false);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function VisibilitySelectorModal({ friends, visibility, visibleTo, hiddenFrom, onClose, onSave }: { friends: Friend[], visibility: any, visibleTo: string[], hiddenFrom: string[], onClose: () => void, onSave: (v: any, vt: string[], hf: string[]) => void }) {
  const [tempV, setTempV] = useState(visibility);
  const [tempVT, setTempVT] = useState(visibleTo);
  const [tempHF, setTempHF] = useState(hiddenFrom);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-[110] bg-white flex flex-col"
    >
      <div className="px-4 py-3 flex justify-between items-center border-b">
        <button onClick={onClose} className="text-sm">取消</button>
        <button 
          onClick={() => onSave(tempV, tempVT, tempHF)}
          className="px-4 py-1.5 bg-[#07c160] text-white rounded font-bold text-sm"
        >
          完成
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="divide-y">
          <button onClick={() => setTempV('public')} className="w-full p-4 flex items-center justify-between">
            <span className="text-sm">公开</span>
            {tempV === 'public' && <div className="w-4 h-4 bg-[#07c160] rounded-full flex items-center justify-center"><Plus size={10} className="text-white" /></div>}
          </button>
          <button onClick={() => setTempV('selected')} className="w-full p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">部分可见</span>
              {tempV === 'selected' && <div className="w-4 h-4 bg-[#07c160] rounded-full flex items-center justify-center"><Plus size={10} className="text-white" /></div>}
            </div>
            {tempV === 'selected' && (
              <div className="flex flex-wrap gap-2">
                {friends.map((f, idx) => (
                  <button 
                    key={`${f.id}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempVT(prev => (prev || []).includes(f.id) ? prev.filter(id => id !== f.id) : [...(prev || []), f.id]);
                    }}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] border transition-all",
                      (tempVT || []).includes(f.id) ? "bg-green-50 border-green-200 text-green-600" : "bg-slate-50 border-slate-200 text-slate-500"
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </button>
          <button onClick={() => setTempV('excluded')} className="w-full p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm">不给谁看</span>
              {tempV === 'excluded' && <div className="w-4 h-4 bg-[#07c160] rounded-full flex items-center justify-center"><Plus size={10} className="text-white" /></div>}
            </div>
            {tempV === 'excluded' && (
              <div className="flex flex-wrap gap-2">
                {friends.map((f, idx) => (
                  <button 
                    key={`${f.id}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTempHF(prev => (prev || []).includes(f.id) ? prev.filter(id => id !== f.id) : [...(prev || []), f.id]);
                    }}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] border transition-all",
                      (tempHF || []).includes(f.id) ? "bg-red-50 border-red-200 text-red-600" : "bg-slate-50 border-slate-200 text-slate-500"
                    )}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function MomentSettingsModal({ friend, settings, onClose, onUpdate, onManualMoment }: { friend: Friend, settings: AppSettings, onClose: () => void, onUpdate: (updates: any) => void, onManualMoment: () => Promise<any> }) {
  const [autoPost, setAutoPost] = useState(friend.momentsSettings?.autoPostEnabled ?? true);
  const [frequency, setFrequency] = useState(friend.momentsSettings?.frequency ?? 1);
  const [times, setTimes] = useState(friend.momentsSettings?.scheduledTimes ?? ["10:00"]);
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-6"
    >
      <div className={cn(
        "w-full max-w-xs rounded-2xl overflow-hidden shadow-2xl transition-all duration-300",
        settings.themeId === 'rainy-cat' ? "bg-black/60 backdrop-blur-xl border border-white/10 text-white" : "bg-white"
      )}>
        <div className="p-4 border-b flex justify-between items-center">
          <span className="font-bold text-sm">朋友圈设置 - {friend.name}</span>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm">自动发送朋友圈</span>
            <button 
              onClick={() => setAutoPost(!autoPost)}
              className={cn("w-10 h-5 rounded-full relative transition-all", autoPost ? "bg-[#07c160]" : "bg-slate-200")}
            >
              <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all", autoPost ? "right-0.5" : "left-0.5")} />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>发送频率</span>
              <span>每天 {frequency} 条</span>
            </div>
            <input 
              type="range" min="1" max="5" step="1"
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value))}
              className="w-full accent-[#07c160]"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs block">定时发送时间</span>
            <div className="flex flex-wrap gap-2">
              {times.map((t, i) => (
                <div key={`${t}-${i}`} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-[10px]">
                  <input 
                    type="time" 
                    value={t} 
                    onChange={(e) => {
                      const newTimes = [...times];
                      newTimes[i] = e.target.value;
                      setTimes(newTimes);
                    }}
                    className="bg-transparent outline-none"
                  />
                  <button onClick={() => setTimes(times.filter((_, idx) => idx !== i))}><X size={10} /></button>
                </div>
              ))}
              {times.length < frequency && (
                <button 
                  onClick={() => setTimes([...times, "12:00"])}
                  className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-400"
                >
                  + 添加时间
                </button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button 
              disabled={isGenerating}
              onClick={async () => {
                setIsGenerating(true);
                try {
                  await onManualMoment();
                } catch (e) {
                  console.error("Manual moment failed:", e);
                } finally {
                  setIsGenerating(false);
                }
              }}
              className="w-full py-2.5 bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
              {isGenerating ? '生成中...' : '立即让角色发送朋友圈'}
            </button>
            <p className="text-[10px] text-slate-400 mt-2 text-center">点击后AI将根据当前情境即时生成并发布一条朋友圈</p>
          </div>

          <button 
            onClick={() => {
              onUpdate({ autoPostEnabled: autoPost, frequency, scheduledTimes: times });
              onClose();
            }}
            className="w-full py-2.5 bg-[#07c160] text-white rounded-xl font-bold text-sm"
          >
            保存设置
          </button>
        </div>
      </div>
    </motion.div>
  );
}
