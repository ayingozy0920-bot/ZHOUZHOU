import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Send, Plus, Image as ImageIcon, Smile, Sparkles, 
  MoreHorizontal, Users, Trash2, Camera, Palette, Globe, Type, Mic, Heart, X, Award, Gift, CircleDollarSign,
  Cpu, BookOpen, Check, RefreshCw, Bell, Crown, Code
} from 'lucide-react';
import { GroupChat, Friend, ChatMessage, UserProfile, AppSettings, Sticker } from '../../types';
import { apiFetch } from '../../lib/apiHelper';
import { cn } from '../../lib/utils';

function repairAndParseJson(str: string): any {
  let clean = str.replace(/```json/gi, '').replace(/```/gi, '').trim();
  const firstBracket = clean.indexOf('[');
  if (firstBracket !== -1) {
    clean = clean.substring(firstBracket);
  }
  
  let repaired = "";
  let inString = false;
  let escape = false;
  const bracesStack: string[] = [];
  
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    
    if (inString) {
      if (escape) {
        repaired += char;
        escape = false;
      } else if (char === '\\') {
        repaired += char;
        escape = true;
      } else if (char === '"') {
        repaired += char;
        inString = false;
      } else if (char === '\n' || char === '\r') {
        repaired += '\\n';
      } else {
        repaired += char;
      }
    } else {
      if (char === '"') {
        inString = true;
        repaired += char;
      } else if (char === '[') {
        bracesStack.push('[');
        repaired += char;
      } else if (char === '{') {
        bracesStack.push('{');
        repaired += char;
      } else if (char === ']') {
        const wasEmptyBefore = bracesStack.length === 0;
        if (bracesStack.length > 0 && bracesStack[bracesStack.length - 1] === '[') {
          bracesStack.pop();
        }
        repaired += char;
        if (!wasEmptyBefore && bracesStack.length === 0) {
          break;
        }
      } else if (char === '}') {
        if (bracesStack.length > 0 && bracesStack[bracesStack.length - 1] === '{') {
          bracesStack.pop();
        }
        repaired += char;
      } else {
        repaired += char;
      }
    }
  }
  
  if (inString) {
    if (escape) {
      repaired = repaired.slice(0, -1);
    }
    repaired += '"';
  }
  
  while (bracesStack.length > 0) {
    const lastOpen = bracesStack.pop();
    if (lastOpen === '{') {
      repaired += '}';
    } else if (lastOpen === '[') {
      repaired += ']';
    }
  }
  
  return JSON.parse(repaired);
}

interface GroupChatWindowProps {
  group: GroupChat;
  user: UserProfile;
  friends: Friend[];
  messages: ChatMessage[];
  allChats?: Record<string, ChatMessage[]>;
  settings: AppSettings;
  onBack: () => void;
  onSendMessage: (msg: ChatMessage) => void;
  onUpdateMessage?: (index: number, updates: Partial<ChatMessage>) => void;
  onUpdateGroup: (updates: Partial<GroupChat>) => void;
  onClearMessages: () => void;
  onAddMember: (friendId: string) => void;
  onRemoveMember: (friendId: string) => void;
  onDeleteGroup?: () => void;
  onUpdateSettings?: (updates: Partial<AppSettings>) => void;
}

const EMOJIS = ['😊', '😂', '🥹', '😍', '🥰', '😘', '😋', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😢', '😭', '❤️', '👍', '🔥', '✨', '🎉', '💩', '👻', '🐱', '🌹', '☕', '🍻'];
const TITLE_COLORS = [
  { name: '红', value: '#ef4444' },
  { name: '橙', value: '#f97316' },
  { name: '黄', value: '#eab308' },
  { name: '绿', value: '#22c55e' },
  { name: '青', value: '#06b6d4' },
  { name: '蓝', value: '#3b82f6' },
  { name: '紫', value: '#a855f7' },
  { name: '粉', value: '#ec4899' },
  { name: '灰', value: '#64748b' },
];

const renderMessageContent = (content: string, customStickers: Sticker[] = []) => {
  if (!content) return null;

  // 1. Handle HTML cards first
  const htmlReg = /===HTML_CARD_START===\s*([\s\S]+?)\s*===HTML_CARD_END===/g;
  const sections: { type: 'text' | 'html', content: string }[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = htmlReg.exec(content)) !== null) {
    if (match.index > lastIndex) {
      sections.push({ type: 'text', content: content.substring(lastIndex, match.index) });
    }
    sections.push({ type: 'html', content: match[1] });
    lastIndex = htmlReg.lastIndex;
  }
  
  if (lastIndex < content.length) {
    sections.push({ type: 'text', content: content.substring(lastIndex) });
  }

  if (sections.length === 0) {
    sections.push({ type: 'text', content });
  }

  return sections.map((sec, idx) => {
    if (sec.type === 'html') {
      return (
        <div 
          key={idx} 
          className="my-3 flex justify-center w-full overflow-x-auto custom-scrollbar" 
        >
          <div 
            className="shrink-0 shadow-xl"
            style={{ width: '320px' }}
            dangerouslySetInnerHTML={{ __html: sec.content }} 
          />
        </div>
      );
    }

    // 2. Original logic for text and stickers
    const parts = sec.content.split(/(\[表情:\s*.*?\])/g);
    return parts.map((part, i) => {
      const matchEmoji = part.match(/\[表情:\s*(.*?)\]/);
      if (matchEmoji) {
        const desc = matchEmoji[1];
        const foundSticker = customStickers.find(s => s.description.includes(desc) || desc.includes(s.description));
        if (foundSticker) {
           return <img key={`${idx}-${i}`} src={foundSticker.url} alt={desc} className="inline-block h-24 w-auto rounded-lg object-cover mx-1 bg-transparent" />;
        }
        return <span key={`${idx}-${i}`} className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-1 rounded-md mx-1">[{desc}]</span>;
      }
      return <span key={`${idx}-${i}`} className="whitespace-pre-wrap break-words">{part}</span>;
    });
  });
};

const getPureStickerUrl = (content: string, customStickers: Sticker[] = []) => {
  if (!content) return null;
  const trimmed = content.trim();
  const match = trimmed.match(/^\[表情:\s*(.*?)\]$/);
  if (match) {
    const desc = match[1];
    const foundSticker = customStickers.find(s => s.description.includes(desc) || desc.includes(s.description));
    if (foundSticker) {
      return { url: foundSticker.url, desc };
    }
  }
  return null;
};

const renderMessageTimestamp = (msg: ChatMessage, prevMsg?: ChatMessage) => {
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

export const GroupChatWindow: React.FC<GroupChatWindowProps> = ({
  group,
  user,
  friends,
  messages,
  allChats,
  settings,
  onBack,
  onSendMessage,
  onUpdateMessage,
  onUpdateGroup,
  onClearMessages,
  onAddMember,
  onRemoveMember,
  onDeleteGroup,
  onUpdateSettings,
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSubView, setSettingsSubView] = useState<'main' | 'tokens' | 'world-books' | 'announcement'>('main');
  const [noticeText, setNoticeText] = useState(group.groupNotice || '');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState(group.name);

  // Title editing modal state
  const [selectedMemberForTitle, setSelectedMemberForTitle] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [titleColor, setTitleColor] = useState('#3b82f6');

  // Red packet states
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [openingTitle, setOpeningTitle] = useState('');
  const [openingContent, setOpeningContent] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [showRedPacketModal, setShowRedPacketModal] = useState(false);
  const [redPacketType, setRedPacketType] = useState<'random' | 'normal' | 'exclusive'>('random');
  const [redPacketCount, setRedPacketCount] = useState<string>('3');
  const [redPacketAmount, setRedPacketAmount] = useState<string>('10.00');
  const [redPacketMessage, setRedPacketMessage] = useState<string>('恭喜发财，大吉大利');
  const [redPacketTargetId, setRedPacketTargetId] = useState<string>('');
  const [selectedRedPacketMsg, setSelectedRedPacketMsg] = useState<ChatMessage | null>(null);

  // Delete group confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sticker & Feature panels
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [stickerTab, setStickerTab] = useState<'emoji' | 'custom'>('emoji');
  const [showStickerImport, setShowStickerImport] = useState<'url' | 'file' | null>(null);
  const [stickerDeleteMode, setStickerDeleteMode] = useState(false);
  const [selectedStickers, setSelectedStickers] = useState<string[]>([]);
  const [stickerUrlInput, setStickerUrlInput] = useState('');
  const [stickerFileDescription, setStickerFileDescription] = useState('');
  const [pendingStickerFile, setPendingStickerFile] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickerFileInputRef = useRef<HTMLInputElement>(null);
  const chatImageInputRef = useRef<HTMLInputElement>(null);

  const groupMembers = friends.filter(f => group.memberIds.includes(f.id));
  const availableFriends = friends.filter(f => !f.isBlocked && !group.memberIds.includes(f.id));

  const lastMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messagesEndRef.current) {
      // Always use instant behavior to ensure it feels like "正常切入" (normal entry)
      messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
    }
    lastMessagesLength.current = messages.length;
  }, [messages.length, showEmojiPicker, showFeatures]);

  // Handle character auto-claiming red packets when a new one is sent
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.type === 'red-packet' && lastMsg.redPacketData && lastMsg.redPacketData.remainingCount > 0) {
      // Simulate multiple characters grabbing the red packet with random delays
      const d = lastMsg.redPacketData;
      const otherMembers = groupMembers.filter(m => m.id !== d.senderId);
      
      const grabCount = Math.min(d.remainingCount, Math.floor(Math.random() * 2) + 1); 
      const selectedClaimers = [...otherMembers].sort(() => 0.5 - Math.random()).slice(0, grabCount);

      selectedClaimers.forEach((claimer, index) => {
        const delay = 800 + Math.random() * 2000;
        setTimeout(() => {
          // Note: This check might be against stale 'messages' but in this UI it's mostly for flavor
          // Re-finding the packet in the current (possibly updated) messages list
          // However, we don't have access to the *very latest* messages here easily without a ref.
          // For now, we'll use the functional update if onUpdateMessage supports it or just fire and hope.
          
          // Better: skip the useEffect claim for now if it's too complex to sync, 
          // and rely on handleGenerateGroupReplies which runs whenever AI responds.
          // BUT the user wants them to grab "user's red packet" too.
          // Let's implement a simple one-claimer grab in useEffect for immediate feedback.
          
          if (index === 0) { // Only first one grabs immediately via timer
             handleCharacterGrab(lastMsg, claimer);
          }
        }, delay);
      });
    }
  }, [messages.length]);

  const handleCharacterGrab = (pktMsg: ChatMessage, claimer: Friend) => {
    const d = pktMsg.redPacketData;
    if (!d || d.remainingCount <= 0 || d.claims.some(c => c.memberId === claimer.id)) return;
    if (d.packetType === 'exclusive' && d.targetMemberId && d.targetMemberId !== claimer.id) return;

    let amount = 0;
    if (d.remainingCount === 1) {
      amount = parseFloat(d.remainingAmount.toFixed(2));
    } else {
      if (d.packetType === 'normal') {
        amount = parseFloat((d.totalAmount / d.count).toFixed(2));
      } else {
        const maxPossible = d.remainingAmount - (d.remainingCount - 1) * 0.01;
        amount = parseFloat((Math.random() * (maxPossible - 0.01) + 0.01).toFixed(2));
        if (amount <= 0) amount = 0.01;
      }
    }
    if (amount > d.remainingAmount) amount = d.remainingAmount;

    d.remainingAmount = parseFloat((d.remainingAmount - amount).toFixed(2));
    d.remainingCount -= 1;
    d.claims.push({
      memberId: claimer.id,
      memberName: claimer.name,
      amount,
      timestamp: Date.now()
    });

    onSendMessage({
      role: 'assistant',
      content: `${claimer.name} 领取了红包`,
      description: '系统通知',
      isSystemNotification: true,
      timestamp: Date.now(),
    });

    const msgIndex = messages.findIndex(m => m.timestamp === pktMsg.timestamp);
    if (msgIndex !== -1 && onUpdateMessage) {
      onUpdateMessage(msgIndex, { redPacketData: { ...d } });
    }
  };

  const handleSendOpening = () => {
    if (!openingTitle.trim() || !openingContent.trim()) return;
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

    const msg: ChatMessage = {
      role: 'user',
      content: '开场白',
      type: 'opening-card',
      openingData: {
        title: openingTitle.trim(),
        content: openingContent.trim(),
        dateStr
      },
      timestamp: Date.now(),
    };
    onSendMessage(msg);
    
    onUpdateGroup({
      activeOpening: {
        id: Date.now().toString(),
        title: openingTitle.trim(),
        startTimestamp: msg.timestamp
      },
      isNarrationMode: true // automatically enable narration mode
    });

    setShowOpeningModal(false);
    setOpeningTitle('');
    setOpeningContent('');
  };

  const handleEndOpening = async () => {
    if (!group.activeOpening || isGeneratingSummary) return;
    setIsGeneratingSummary(true);

    const relevantMsgs = messages.filter(m => m.timestamp >= group.activeOpening!.startTimestamp);
    const historyText = relevantMsgs.map(m => {
        if (m.type === 'opening-card' && m.openingData) return `[开场白 - ${m.openingData.title}]: ${m.openingData.content}`;
        if (m.isNarration) return `${m.description || '群成员'} (旁白): ${m.content}`;
        if (m.role === 'user') return `${user.name} (用户): ${m.content}`;
        if (m.isSystemNotification) return `[系统通知]: ${m.content}`;
        return `${m.description || '群成员'}: ${m.content}`;
    }).join('\n');

    const prompt = `你是一个出色的文案大师。请根据以下角色的线下互动聊天记录，以第三方叙事角度，客观总结并评价此次线下多人互动的发生的重要事件。总结字数大约500字。
    
聊天记录：
${historyText}`;

    try {
      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: prompt,
          messages: [{ role: 'user', parts: [{ text: '请生成记忆总结' }] }],
          settings: {
            baseUrl: settings.baseUrl,
            apiKey: settings.apiKey,
            modelName: settings.modelName,
          }
        }
      });
      let rawText = '';
      if (data && typeof data === 'object') {
        rawText = data.text || data.response || data.content || JSON.stringify(data);
      } else if (typeof data === 'string') {
        rawText = data;
      }
      const summary = rawText.replace(/```/g, '').trim();
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const memory = {
        id: group.activeOpening.id,
        title: group.activeOpening.title,
        dateStr,
        summary,
        timestamp: Date.now()
      };
      
      onUpdateGroup({
        activeOpening: undefined,
        isNarrationMode: false,
        openingMemories: [...(group.openingMemories || []), memory]
      });
      
    } catch (err) {
      console.error(err);
      alert('生成记忆总结失败');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    const msg: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };
    onSendMessage(msg);
    setInputText('');
    setShowEmojiPicker(false);
    setShowFeatures(false);
  };

  const handleSendSticker = (sticker: Sticker) => {
    const msg: ChatMessage = {
      role: 'user',
      content: `[表情: ${sticker.description}]`,
      type: 'sticker',
      stickerUrl: sticker.url,
      timestamp: Date.now(),
    };
    onSendMessage(msg);
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
        const description = line.replace(url, '').trim() || '批量导入的表情包';
        return {
          id: Math.random().toString(36).substr(2, 9),
          url,
          description,
          addedAt: Date.now()
        };
      }
      return null;
    }).filter(s => s !== null) as Sticker[];

    if (newStickers.length === 0) {
      alert('未识别到有效的图片链接');
      return;
    }

    const updatedStickers = [...(settings.customStickers || []), ...newStickers];
    onUpdateSettings?.({ customStickers: updatedStickers });
    setStickerUrlInput('');
    setShowStickerImport(null);
  };

  const handleAddStickerByFile = () => {
    if (!pendingStickerFile) return;
    const newSticker: Sticker = {
      id: Math.random().toString(36).substr(2, 9),
      url: pendingStickerFile,
      description: stickerFileDescription || '自定义表情包',
      addedAt: Date.now()
    };
    const updatedStickers = [...(settings.customStickers || []), newSticker];
    onUpdateSettings?.({ customStickers: updatedStickers });
    setPendingStickerFile(null);
    setStickerFileDescription('');
    setShowStickerImport(null);
  };

  const handleDeleteStickers = () => {
    if (selectedStickers.length === 0) {
      setStickerDeleteMode(false);
      return;
    }
    const updatedStickers = (settings.customStickers || []).filter(s => !selectedStickers.includes(s.id));
    onUpdateSettings?.({ customStickers: updatedStickers });
    setSelectedStickers([]);
    setStickerDeleteMode(false);
  };

  const handleSaveMemberTitle = () => {
    if (!selectedMemberForTitle) return;
    const trimmedTitle = titleInput.trim();
    const updatedTitles = { ...(group.memberTitles || {}) };
    if (trimmedTitle) {
      updatedTitles[selectedMemberForTitle.id] = { title: trimmedTitle, color: titleColor };
    } else {
      delete updatedTitles[selectedMemberForTitle.id];
    }

    onUpdateGroup({ memberTitles: updatedTitles });

    // Send system message
    const systemMsg: ChatMessage = {
      role: 'assistant',
      content: trimmedTitle ? `${user.name} 为 ${selectedMemberForTitle.name} 修改头衔「${trimmedTitle}」` : `${user.name} 取消了 ${selectedMemberForTitle.name} 的头衔`,
      description: '系统通知',
      isSystemNotification: true,
      timestamp: Date.now(),
    };
    onSendMessage(systemMsg);
    setSelectedMemberForTitle(null);
  };

  // Generate multi-character replies for group chat (2-4 messages at once)
  const handleGenerateGroupReplies = async () => {
    if (isLoading || groupMembers.length === 0) return;
    setIsLoading(true);

    try {
      // Auto-claim logic integrated into generation:
      // Characters try to grab any open red packets
      const activePackets = messages.filter(m => m.type === 'red-packet' && m.redPacketData && m.redPacketData.remainingCount > 0);
      
      for (const pktMsg of activePackets) {
        const d = pktMsg.redPacketData!;
        const availableMembers = groupMembers.filter(m => !d.claims.some(c => c.memberId === m.id));
        
        if (availableMembers.length > 0 && d.remainingCount > 0) {
          // Multiple characters can grab it in one "round"
          const maxGrabs = Math.min(d.remainingCount, Math.floor(Math.random() * 3) + 1); 
          const currentClaimers = [...availableMembers].sort(() => 0.5 - Math.random()).slice(0, maxGrabs);

          for (const claimer of currentClaimers) {
            if (d.remainingCount <= 0) break;
            if (d.packetType === 'exclusive' && d.targetMemberId && d.targetMemberId !== claimer.id) continue;

            let amount = 0;
            if (d.remainingCount === 1) {
              amount = parseFloat(d.remainingAmount.toFixed(2));
            } else {
              if (d.packetType === 'normal') {
                amount = parseFloat((d.totalAmount / d.count).toFixed(2));
              } else {
                const maxPossible = d.remainingAmount - (d.remainingCount - 1) * 0.01;
                amount = parseFloat((Math.random() * (maxPossible - 0.01) + 0.01).toFixed(2));
                if (amount <= 0) amount = 0.01;
              }
            }
            if (amount > d.remainingAmount) amount = d.remainingAmount;

            d.remainingAmount = parseFloat((d.remainingAmount - amount).toFixed(2));
            d.remainingCount -= 1;
            d.claims.push({
              memberId: claimer.id,
              memberName: claimer.name,
              amount,
              timestamp: Date.now()
            });

            // Center centered notification
            onSendMessage({
              role: 'assistant',
              content: `${claimer.name} 领取了红包`,
              description: '系统通知',
              isSystemNotification: true,
              timestamp: Date.now() + 10,
            });

            const msgIndex = messages.findIndex(m => m === pktMsg || m.timestamp === pktMsg.timestamp);
            if (msgIndex !== -1 && onUpdateMessage) {
              onUpdateMessage(msgIndex, { redPacketData: { ...d } });
            }
          }
        }
      }

      const memberTitlesDesc = group.memberTitles 
        ? Object.entries(group.memberTitles).map(([id, t]) => {
            const memberObj = id === 'user' ? { name: user.name } : groupMembers.find(m => m.id === id);
            return memberObj ? `- ${memberObj.name} 的头衔是「${t.title}」` : '';
          }).filter(Boolean).join('\n') 
        : '';

      const memberPersonasDesc = groupMembers.map(m => `角色ID: ${m.id}, 角色名: ${m.name}, 人设: ${m.persona}`).join('\n');
      
      let worldBookPrompt = '';
      if (group.worldBookEnabled && group.selectedWorldBookIds && group.selectedWorldBookIds.length > 0) {
        const allWbs = settings.worldBookEntries || [];
        const selectedWbs = allWbs.filter(wb => group.selectedWorldBookIds?.includes(wb.id) && wb.isEnabled);
        if (selectedWbs.length > 0) {
          worldBookPrompt = '\n\n【群聊世界书设定】\n' + selectedWbs.map(wb => `[${wb.category}] ${wb.name}\n${wb.content}`).join('\n');
        }
      }

      let privateChatHistoryPrompt = '';
      if (allChats) {
        privateChatHistoryPrompt = '\n\n【群成员与用户的专属私聊记录 (最近30条上下文)】\n(各角色需结合自己与用户的私聊记忆在群聊中作出反应)\n';
        groupMembers.forEach(member => {
          const privateMsgs = (allChats[member.id] || []).filter(m => m.role !== 'system').slice(-30);
          if (privateMsgs.length > 0) {
            privateChatHistoryPrompt += `\n--- 与 ${member.name} 的私聊 ---\n`;
            privateChatHistoryPrompt += privateMsgs.map(m => {
              const isUser = m.role === 'user';
              return `${isUser ? user.name + ' (用户)' : member.name}: ${m.content}`;
            }).join('\n');
          }
        });
      }

      const recentMsgs = messages.slice(-30);
      const historyText = recentMsgs.map(m => {
        if (m.type === 'opening-card' && m.openingData) return `[开场白 - ${m.openingData.title}]: ${m.openingData.content}`;
        if (m.isNarration) return `${m.description || '群成员'} (旁白): ${m.content}`;
        if (m.role === 'user') return `${user.name} (用户): ${m.content}`;
        if (m.isSystemNotification) return `[系统通知]: ${m.content}`;
        return `${m.description || '群成员'}: ${m.content}`;
      }).join('\n');


      let openingMemoriesPrompt = '';
      if (group.openingMemories && group.openingMemories.length > 0) {
        openingMemoriesPrompt = `\n\n【过往线下演绎记忆】\n` + group.openingMemories.map(m => `[${m.title} (${m.dateStr})]: ${m.summary}`).join('\n');
      }

      // Add group announcement info to the prompt if present
      const latestAnnouncement = [...messages].reverse().find(m => m.type === 'group-announcement');
      let announcementPrompt = '';
      if (latestAnnouncement && latestAnnouncement.announcementData) {
        announcementPrompt = `\n\n【最新发布群公告 - 重要反应指标】\n发布内容："${latestAnnouncement.announcementData.content}"\n请各位群成员针对该公告进行反应与讨论。在输出的JSON对象中，可以额外添加 "announcementDecision": "confirm" (确认) 或 "decline" (不确认) 字段来表达你的态度。一旦添加此字段，系统将会自动向群里展示你的态度通知。每个角色只能决策一次，且应该完全根据角色人设进行考虑和讨论。目前已确认：${latestAnnouncement.announcementData.confirms?.join(', ') || '无'}，已不确认：${latestAnnouncement.announcementData.declines?.join(', ') || '无'}。\n`;
      }

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

      const timeContextPrompt = `\n\n【当前北京实时时间】\n${beijingTimeStr}\n请对北京时间保持高度敏感，当群里提到时间、问起几点几分，或者发现距离上一次聊天时间过去很久时，能自然在对话里体现对时间的认知。\n\n`;

      const stickerDesc = (settings.customStickers || []).map(s => `${s.description}: ${s.url}`).join('\n');
      
      const htmlCardPrompt = group.isHtmlCardEnabled !== false ? `\n\n【群聊行为规则：HTML卡片互动】
日常对话里，你可以主动自发地插入HTML卡片，不需要等待用户下达指令，不需要用户提醒，聊到对应场景就主动发送界面卡片，丰富互动画面。
卡片包裹标记（严格遵守，标记独占单独一行）：
===HTML_CARD_START===
卡片HTML内容（全部使用内联style样式，不使用class、不引入外部文件、不写JavaScript）
===HTML_CARD_END===
卡片创作要求：
① 优先自制手机微信聊天截图、手机锁屏、备忘录、消息弹窗、纸质信件、工作单据这类界面卡片，自由发挥，没有固定模板。
② 所有CSS全部写在标签style属性里，保证代码能直接渲染。
③ 卡片宽度固定320px，外层可以加上黑色圆角手机外壳边框，贴合手机截图效果。
④ 普通口语文字可以放在卡片前后，文字和卡片穿插在一起，不要通篇全是代码。
⑤ 把卡片当成“截图分享”：就像现实里聊天随手截一张手机聊天记录、电脑弹窗发给对方。情绪到位、剧情有画面的时候再甩出截图卡片，平淡闲聊只用纯文字。
⑥ 严禁生成包含敏感话题、人身攻击或任何违反安全准则的内容。
触发时机（自主把握）：当你发送消息、发送邀约、发送提醒、发送内心思绪、发送消息记录、发送文件通知时，主动配上对应界面卡片。
限制条件：不要每一句话都带卡片，3～6轮对话再主动生成一张卡片，避免刷屏。关闭卡片仅在用户明确说出“停止发送卡片”时执行，其余时刻保持自由创作。` : "";

      const systemPrompt = `你现在正在模拟一个真实活跃的大型社交群聊。群成员和用户拥有以下头衔（QQ风格）：\n${memberTitlesDesc}\n\n群里有以下成员：\n${memberPersonasDesc}${worldBookPrompt}${privateChatHistoryPrompt}${openingMemoriesPrompt}${announcementPrompt}${timeContextPrompt}\n\n用户可用的自定义表情包列表（URL）：\n${stickerDesc}\n\n最近的群聊记录：\n${historyText}${htmlCardPrompt}\n\n【群聊回复核心规则】
1. 模仿真人群聊：去掉AI机械感，模仿真人聊天风格。角色之间可以互动，也可以抢话、穿插回复。
2. 消息数量：输出总共4到10条连续回复。
3. 表情包互动：角色可以使用表情包。若要发送表情包，请将 messageType 设为 "sticker"，并在 mediaUrl 中填入上方列表中的对应 URL。表情包应单独发送。
4. 红包功能：角色可以发红包。请将 messageType 设为 "red-packet"，并提供 redPacketData。
5. 各角色可以感知并讨论彼此或用户头衔内容，可以讨论表情包或抢红包。

要求：必须严格输出合法的JSON数组格式（不要包含markdown代码块语法，纯JSON数组），每个元素包含：
- "characterName": 说话角色的名字
- "content": 说话内容（如果是表情包，content填"[表情]"）
- "messageType": 可选，"text" (默认), "sticker" (发送表情包), "red-packet" (发送红包), "narration" (旁白，仅在旁白模式生效)
- "mediaUrl": 仅在 messageType 为 "sticker" 时提供，填入对应的图片 URL
- "redPacketData": 仅在 messageType 为 "red-packet" 时提供，包含：
    - "amount": 红包总金额 (如 10.5)
    - "count": 红包个数
    - "message": 红包祝福语
- "announcementDecision": 可选，"confirm" 或 "decline" (用于对群公告表态)`;

      const data = await apiFetch({
        body: {
          system_prompt: systemPrompt,
          messages: [{ role: 'user', parts: [{ text: '请根据群聊天记录，让群成员们开始聊天或回复。' }] }],
          settings: {
            baseUrl: settings.baseUrl,
            apiKey: settings.apiKey,
            modelName: settings.modelName,
          }
        },
        endpoint: '/api/chat'
      });

      let rawText = '';
      if (data && typeof data === 'object') {
        rawText = data.text || data.response || data.content || JSON.stringify(data);
      } else if (typeof data === 'string') {
        rawText = data;
      }

      let replies: Array<{ characterId: string; characterName: string; content: string; messageType?: string; announcementDecision?: 'confirm' | 'decline' }> = [];
      try {
        replies = repairAndParseJson(rawText);
      } catch (e) {
        console.warn('Failed to repair and parse group chat replies:', e);
        try {
          const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const match = cleanedText.match(/\[[\s\S]*\]/);
          if (match) {
            replies = JSON.parse(match[0]);
          }
        } catch (innerError) {
          console.error('Group chat regex fallback parsing also failed:', innerError);
        }
      }

      if (!Array.isArray(replies) || replies.length === 0) {
        const randomMember = groupMembers[Math.floor(Math.random() * groupMembers.length)];
        replies = [
          {
            characterId: randomMember.id,
            characterName: randomMember.name,
            content: '大家都在聊什么呢？算我一个！'
          }
        ];
      }

      for (let i = 0; i < replies.length; i++) {
        const rep = replies[i] as any;
        const member = groupMembers.find(m => m.id === rep.characterId || m.name === rep.characterName) || groupMembers[0];
        if (member) {
          const isRedPacket = rep.messageType === 'red-packet' && rep.redPacketData;
          const isSticker = rep.messageType === 'sticker' && rep.mediaUrl;
          
          const groupMsg: ChatMessage = {
            role: 'assistant',
            content: isRedPacket ? `[红包] ${rep.redPacketData.message}` : (isSticker ? '[表情]' : rep.content),
            description: member.name,
            mediaUrl: member.avatar,
            stickerUrl: isSticker ? rep.mediaUrl : undefined,
            isNarration: rep.messageType === 'narration',
            type: isRedPacket ? 'red-packet' : (isSticker ? 'sticker' : 'text'),
            timestamp: Date.now() + i * 500,
            redPacketData: isRedPacket ? {
              id: Math.random().toString(36).substr(2, 9),
              packetType: 'random',
              totalAmount: parseFloat(rep.redPacketData.amount) || 10,
              count: parseInt(rep.redPacketData.count) || 3,
              remainingAmount: parseFloat(rep.redPacketData.amount) || 10,
              remainingCount: parseInt(rep.redPacketData.count) || 3,
              message: rep.redPacketData.message || '恭喜发财',
              senderId: member.id,
              senderName: member.name,
              claims: []
            } : undefined
          };
          onSendMessage(groupMsg);

          // If there is an announcementDecision, update the latest group-announcement message
          if (rep.announcementDecision) {
            const latestAnnIdx = [...messages].reverse().findIndex(m => m.type === 'group-announcement');
            if (latestAnnIdx !== -1) {
              const actualIdx = messages.length - 1 - latestAnnIdx;
              const annMsg = messages[actualIdx];
              if (annMsg && annMsg.announcementData) {
                const dec = rep.announcementDecision;
                const currentConfirms = annMsg.announcementData.confirms ? [...annMsg.announcementData.confirms] : [];
                const currentDeclines = annMsg.announcementData.declines ? [...annMsg.announcementData.declines] : [];
                
                if (dec === 'confirm' && !currentConfirms.includes(member.name) && !currentDeclines.includes(member.name)) {
                  currentConfirms.push(member.name);
                  annMsg.announcementData.confirms = currentConfirms;
                  if (onUpdateMessage) {
                    onUpdateMessage(actualIdx, { announcementData: { ...annMsg.announcementData } });
                  }
                  
                  // Send system notification
                  onSendMessage({
                    role: 'assistant',
                    isSystemNotification: true,
                    content: `${member.name} 确认了群公告`,
                    timestamp: Date.now() + i * 500 + 100,
                  });
                } else if (dec === 'decline' && !currentDeclines.includes(member.name) && !currentConfirms.includes(member.name)) {
                  currentDeclines.push(member.name);
                  annMsg.announcementData.declines = currentDeclines;
                  if (onUpdateMessage) {
                    onUpdateMessage(actualIdx, { announcementData: { ...annMsg.announcementData } });
                  }
                  
                  // Send system notification
                  onSendMessage({
                    role: 'assistant',
                    isSystemNotification: true,
                    content: `${member.name} 不确认群公告`,
                    timestamp: Date.now() + i * 500 + 100,
                  });
                }
              }
            }
          }

          if (i < replies.length - 1) {
            await new Promise(r => setTimeout(r, 800));
          }
        }
      }
    } catch (err: any) {
      console.error('Group chat generation error:', err);
      const isSafetyBlock = err.message?.includes('PROHIBITED_CONTENT') || err.message?.includes('safety');
      const randomMember = groupMembers[Math.floor(Math.random() * groupMembers.length)];
      if (randomMember) {
        onSendMessage({
          role: 'assistant',
          content: isSafetyBlock ? '（生成内容因安全策略被拦截，请尝试换个话题。）' : '（似乎正在思考该说些什么……）',
          description: randomMember.name,
          mediaUrl: randomMember.avatar,
          timestamp: Date.now(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isRainy = settings.themeId === 'rainy-cat';

  if (showSettings) {
    if (settingsSubView === 'announcement') {
      return (
        <div className={cn(
          "flex flex-col h-full transition-colors duration-500",
          isRainy ? "bg-black/40 backdrop-blur-xl text-white" : "bg-slate-50 text-slate-800"
        )}>
          <div className={cn(
            "px-3 py-2 flex items-center gap-2 border-b",
            isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}>
            <button onClick={() => setSettingsSubView('main')} className="p-1">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold shrink-0 whitespace-nowrap">发布群公告</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold opacity-60">群公告内容</label>
              <textarea
                value={noticeText}
                onChange={(e) => setNoticeText(e.target.value)}
                placeholder="请输入需要发布的群聊公告内容..."
                rows={6}
                className={cn(
                  "w-full rounded-2xl p-4 text-sm outline-none resize-none shadow-inner border transition-all",
                  isRainy ? "bg-white/10 border-white/15 text-white placeholder-white/30" : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
                )}
              />
            </div>

            <button
              onClick={() => {
                if (!noticeText.trim()) {
                  return;
                }
                
                // 1. Update the group notice in parent state
                onUpdateGroup({ groupNotice: noticeText.trim() });
                
                // 2. Dispatch the special announcement message
                const annMsg: ChatMessage = {
                  role: 'user',
                  content: `[公告] ${noticeText.trim()}`,
                  type: 'group-announcement',
                  timestamp: Date.now(),
                  announcementData: {
                    content: noticeText.trim(),
                    author: user.name,
                    timestamp: Date.now(),
                    confirms: [],
                    declines: []
                  }
                };
                
                onSendMessage(annMsg);
                
                // 3. Return to settings main subview and close settings
                setSettingsSubView('main');
                setShowSettings(false);
              }}
              className="w-full py-3.5 bg-[#07c160] hover:bg-[#06ad56] text-white font-bold rounded-2xl shadow-lg transition-all text-sm"
            >
              发布群公告
            </button>
          </div>
        </div>
      );
    }

    if (settingsSubView === 'tokens') {
      const worldBookEntries = settings.worldBookEntries || [];
      let wbText = '';
      if (group.worldBookEnabled && group.selectedWorldBookIds && group.selectedWorldBookIds.length > 0) {
        const selectedWbs = worldBookEntries.filter(wb => group.selectedWorldBookIds?.includes(wb.id) && wb.isEnabled);
        selectedWbs.forEach(wb => {
          wbText += `[${wb.category}] ${wb.name}\n${wb.content}\n`;
        });
      }
      const wbChars = wbText.length;
      const wbTokens = Math.round(wbChars * 1.4);

      const personaText = groupMembers.map(m => `角色: ${m.name}\n人设: ${m.persona}`).join('\n') + `\n用户: ${user.name}`;
      const personaChars = personaText.length;
      const personaTokens = Math.round(personaChars * 1.4);

      const recentMsgs = messages.slice(-30);
      const contextText = recentMsgs.map(m => `${m.description || m.role}: ${m.content}`).join('\n');
      const contextChars = contextText.length;
      const contextTokens = Math.round(contextChars * 1.4);

      const totalTokens = wbTokens + personaTokens + contextTokens;
      const isHeavy = totalTokens > 8000;

      return (
        <div className={cn(
          "flex flex-col h-full transition-colors duration-500",
          isRainy ? "bg-black/40 backdrop-blur-xl text-white" : "bg-slate-50 text-slate-800"
        )}>
          <div className={cn(
            "px-3 py-2 flex items-center gap-2 border-b",
            isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}>
            <button onClick={() => setSettingsSubView('main')} className="p-1">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold">群聊 Tokens 消耗与负载面板</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                  <Cpu size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base">群聊 Token 实时负载分析</h3>
                  <p className="text-xs opacity-50">用于评估当前群聊中角色人设、世界书及上下文的 Token 消耗</p>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-4 rounded-2xl border transition-all",
              isHeavy 
                ? (isRainy ? "bg-amber-500/20 border-amber-500/40 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-800")
                : (isRainy ? "bg-blue-500/20 border-blue-500/40 text-blue-200" : "bg-blue-50 border-blue-100 text-blue-900")
            )}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">当前群聊总 Token 预估</span>
                <span className="text-xl font-black font-mono">{totalTokens.toLocaleString()} tokens</span>
              </div>
              <div className="text-xs opacity-90 leading-relaxed">
                {isHeavy ? (
                  <p>⚠️ <strong>负载偏高提示</strong>：当前总 Token 超过 8000。由于输入文本较长，生成回复可能需要较长时间，建议精简世界书或减少勾选设定。</p>
                ) : (
                  <p>✨ <strong>负载健康</strong>：当前 Token 处于适宜范围，大模型可以快速响应群内角色互动。</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold opacity-60 uppercase tracking-wider">Token 三维度构成明细</h4>
              
              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between",
                isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">📖 世界书 (World Book)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-bold">
                      {group.worldBookEnabled ? `已勾选: ${group.selectedWorldBookIds?.length || 0} 个` : '未开启 (默认不携带)'}
                    </span>
                  </div>
                  <p className="text-[10px] opacity-50">群聊默认不携带世界书，可在世界书设置中自主勾选注入</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-purple-600">~{wbTokens.toLocaleString()}</span>
                  <p className="text-[10px] opacity-40">{wbChars} 字符</p>
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between",
                isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">👤 角色专属人设 (Persona)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">成员: {groupMembers.length} 人</span>
                  </div>
                  <p className="text-[10px] opacity-50">群聊中所有参与角色的专属人设文本及用户资料</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-blue-600">~{personaTokens.toLocaleString()}</span>
                  <p className="text-[10px] opacity-40">{personaChars} 字符</p>
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-xl border flex items-center justify-between",
                isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
              )}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">🧠 聊天上下文 (Context)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">最新 {recentMsgs.length} 条</span>
                  </div>
                  <p className="text-[10px] opacity-50">群聊中最近的 30 条对话上下文记录</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-green-600">~{contextTokens.toLocaleString()}</span>
                  <p className="text-[10px] opacity-40">{contextChars} 字符</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (settingsSubView === 'world-books') {
      const worldBookEntries = settings.worldBookEntries || [];
      const worldBookEnabled = group.worldBookEnabled || false;
      const selectedIds = group.selectedWorldBookIds || [];

      const toggleWorldBook = (id: string) => {
        const newIds = selectedIds.includes(id) 
          ? selectedIds.filter(item => item !== id)
          : [...selectedIds, id];
        onUpdateGroup({ selectedWorldBookIds: newIds });
      };

      return (
        <div className={cn(
          "flex flex-col h-full transition-colors duration-500",
          isRainy ? "bg-black/40 backdrop-blur-xl text-white" : "bg-slate-50 text-slate-800"
        )}>
          <div className={cn(
            "px-3 py-2 flex items-center gap-2 border-b",
            isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}>
            <button onClick={() => setSettingsSubView('main')} className="p-1">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold">群聊世界书设置 (独立勾选)</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base">世界书携带控制</h3>
                  <p className="text-xs opacity-50">群聊默认不携带世界书，开启后可自主勾选要注入的角色世界书</p>
                </div>
              </div>
              <button 
                onClick={() => onUpdateGroup({ worldBookEnabled: !worldBookEnabled })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative",
                  worldBookEnabled ? "bg-[#07c160]" : "bg-slate-300"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                  worldBookEnabled ? "right-1" : "left-1"
                )} />
              </button>
            </div>

            {worldBookEnabled && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold opacity-60 uppercase tracking-wider">选择群聊要读取的世界书条目</h4>
                {worldBookEntries.length === 0 ? (
                  <p className="text-xs opacity-50 text-center py-6">暂无世界书条目，请先在“世界书”应用中添加设定。</p>
                ) : (
                  <div className="space-y-2">
                    {worldBookEntries.map(entry => {
                      const isSelected = selectedIds.includes(entry.id);
                      return (
                        <div 
                          key={entry.id}
                          onClick={() => toggleWorldBook(entry.id)}
                          className={cn(
                            "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all",
                            isSelected 
                              ? (isRainy ? "bg-purple-500/20 border-purple-500/50" : "bg-purple-50 border-purple-200")
                              : (isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200")
                          )}
                        >
                          <div className="space-y-1 flex-1 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold">{entry.name}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">{entry.category}</span>
                            </div>
                            <p className="text-[10px] opacity-60 line-clamp-1">{entry.content}</p>
                          </div>
                          <div className={cn(
                            "w-5 h-5 rounded-md flex items-center justify-center border transition-all",
                            isSelected ? "bg-purple-600 border-purple-600 text-white" : "border-slate-300"
                          )}>
                            {isSelected && <Check size={14} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={cn(
        "flex flex-col h-full transition-colors duration-300 relative",
        isRainy ? "bg-black/40 backdrop-blur-xl text-white" : "bg-[#f5f5f5] text-slate-800"
      )}>
        {/* Settings Header */}
        <div className={cn(
          "px-3 py-2 flex items-center justify-between border-b sticky top-0 z-10",
          isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
        )} style={settings.fullScreenMode ? { paddingTop: settings.hideStatusBar ? 'env(safe-area-inset-top)' : 'max(env(safe-area-inset-top), 44px)' } : {}}>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(false)} className="p-1 rounded-full hover:bg-slate-200/20">
              <ChevronLeft size={22} />
            </button>
            <span className="font-bold text-base">聊天信息 ({group.memberIds.length + 1})</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 py-3">
          {/* Members Grid */}
          <div className={cn(
            "px-4 py-4 grid grid-cols-4 sm:grid-cols-5 gap-4",
            isRainy ? "bg-white/5" : "bg-white"
          )}>
            <div 
              className="flex flex-col items-center gap-1 cursor-pointer group"
              onClick={() => {
                setSelectedMemberForTitle({ id: 'user', name: user.name, avatar: user.avatar });
                const userTitle = group.memberTitles?.['user'];
                setTitleInput(userTitle?.title || '');
                setTitleColor(userTitle?.color || '#3b82f6');
              }}
            >
              <div className="relative">
                <img src={user.avatar} className="w-14 h-14 rounded-lg object-cover bg-slate-200" />
                {group.memberTitles?.['user'] && (
                  <span 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded text-[8px] font-bold text-white whitespace-nowrap shadow-sm"
                    style={{ backgroundColor: group.memberTitles['user'].color }}
                  >
                    {group.memberTitles['user'].title}
                  </span>
                )}
              </div>
              <span className="text-[10px] truncate w-14 text-center opacity-60">{user.name}</span>
            </div>
            {groupMembers.map(member => {
              const memberTitle = group.memberTitles?.[member.id];
              return (
                <div key={member.id} className="flex flex-col items-center gap-1 relative group cursor-pointer" onClick={() => {
                  setSelectedMemberForTitle(member);
                  setTitleInput(memberTitle?.title || '');
                  setTitleColor(memberTitle?.color || '#3b82f6');
                }}>
                  <div className="relative">
                    <img src={member.avatar} className="w-14 h-14 rounded-lg object-cover bg-slate-200" />
                    {memberTitle && (
                      <span 
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 py-0.5 rounded text-[8px] font-bold text-white whitespace-nowrap shadow-sm"
                        style={{ backgroundColor: memberTitle.color }}
                      >
                        {memberTitle.title}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] truncate w-14 text-center opacity-60">{member.name}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveMember(member.id);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="移出群聊"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            <button 
              onClick={() => setShowAddMemberModal(true)}
              className={cn(
                "w-14 h-14 border-2 border-dashed rounded-lg flex items-center justify-center transition-all",
                isRainy ? "border-white/20 text-white/40 hover:border-white/40" : "border-slate-300 text-slate-400 hover:border-slate-500"
              )}
              title="添加群成员"
            >
              <Plus size={24} />
            </button>
          </div>
          <div className="px-4 text-[10px] opacity-50 text-center">点击群成员头像可为角色设置/修改 QQ 风格专属头衔</div>

          {/* Group Options */}
          <div className={cn(
            "border-y divide-y",
            isRainy ? "bg-white/5 border-white/10 divide-white/10" : "bg-white border-slate-200 divide-slate-100"
          )}>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm">群聊名称</span>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    className="px-2 py-1 text-sm bg-slate-100 rounded text-slate-800 outline-none"
                  />
                  <button 
                    onClick={() => {
                      onUpdateGroup({ name: groupNameInput.trim() || group.name });
                      setIsEditingName(false);
                    }}
                    className="text-xs bg-[#07c160] text-white px-2 py-1 rounded"
                  >
                    保存
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditingName(true)} className="text-sm opacity-60 flex items-center gap-1">
                  {group.name} &gt;
                </button>
              )}
            </div>

            <button 
              onClick={() => {
                setNoticeText(group.groupNotice || '');
                setSettingsSubView('announcement');
              }}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100/10 transition-colors text-left"
            >
              <span className="text-sm shrink-0 whitespace-nowrap">群公告</span>
              <div className="flex items-center gap-1.5 ml-auto max-w-[70%]">
                <span className="text-sm opacity-60 truncate text-right block">
                  {group.groupNotice || '未设置'}
                </span>
                <span className="text-xs opacity-45">&gt;</span>
              </div>
            </button>

            <button 
              onClick={() => setSettingsSubView('world-books')}
              className="w-full px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="text-purple-500" />
                <span className="text-sm">群聊世界书设置</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] opacity-40">
                  {group.worldBookEnabled ? `已开启 (${group.selectedWorldBookIds?.length || 0})` : '未开启 (默认)'}
                </span>
                <span className="text-xs opacity-40">&gt;</span>
              </div>
            </button>

            <button 
              onClick={() => setSettingsSubView('tokens')}
              className="w-full px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Cpu size={18} className="text-blue-500" />
                <span className="text-sm">Tokens 负载与消耗面板</span>
              </div>
              <span className="text-xs opacity-40">&gt;</span>
            </button>
          </div>

          {/* Chat Background & Clear */}
          <div className={cn(
            "border-y divide-y",
            isRainy ? "bg-white/5 border-white/10 divide-white/10" : "bg-white border-slate-200 divide-slate-100"
          )}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm">设置当前聊天背景</span>
                {group.chatBackground && (
                  <img src={group.chatBackground} className="w-6 h-6 rounded object-cover border" />
                )}
              </div>
              <span className="text-xs opacity-40">&gt;</span>
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    onUpdateGroup({ chatBackground: reader.result as string });
                  };
                  reader.readAsDataURL(file);
                }
              }} 
            />

            <button 
              onClick={() => {
                if (window.confirm('确定要清空所有群聊记录吗？')) {
                  onClearMessages();
                }
              }}
              className="w-full px-4 py-3 flex items-center justify-between text-red-500"
            >
              <span className="text-sm">清空聊天记录</span>
            </button>
          </div>

          {/* Delete Group / Disband Button */}
          <div className="px-4 pt-4">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95"
            >
              删除并解散群聊
            </button>
          </div>
        </div>

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={cn(
              "w-full max-w-sm rounded-2xl p-4 shadow-xl border",
              isRainy ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
            )}>
              <h3 className="font-bold text-base mb-3">添加群成员</h3>
              <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                {availableFriends.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">没有可添加的好友了</p>
                ) : (
                  availableFriends.map(friend => (
                    <div 
                      key={friend.id}
                      onClick={() => {
                        onAddMember(friend.id);
                        setShowAddMemberModal(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                        isRainy ? "hover:bg-white/10" : "hover:bg-slate-100"
                      )}
                    >
                      <img src={friend.avatar} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-sm font-medium">{friend.alias || friend.name}</span>
                    </div>
                  ))
                )}
              </div>
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-medium"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        {/* Member Title Setting Modal */}
        {selectedMemberForTitle && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={cn(
              "w-full max-w-sm rounded-3xl p-6 shadow-2xl border space-y-4",
              isRainy ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
            )}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Award size={20} className="text-amber-500" />
                  设置专属头衔
                </h3>
                <button onClick={() => setSelectedMemberForTitle(null)} className="p-1 rounded-full opacity-60 hover:opacity-100">
                  <X size={18} />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/10 border border-slate-200/20">
                <img src={selectedMemberForTitle.avatar} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <div className="font-bold text-sm">{selectedMemberForTitle.name}</div>
                  <div className="text-[10px] opacity-60">设置后将在群聊中显示QQ风格彩色头衔</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold opacity-60">头衔文字 (留空则清除)</label>
                <input 
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="例如：群宠、智囊、御前带刀侍卫"
                  className={cn(
                    "w-full px-3 py-2.5 rounded-xl text-sm border outline-none",
                    isRainy ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold opacity-60">头衔颜色 (调色盘 / 自定义)</label>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="color" 
                      value={titleColor}
                      onChange={(e) => setTitleColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-[10px] font-mono opacity-60">{titleColor}</span>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {TITLE_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setTitleColor(c.value)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center",
                        titleColor === c.value ? "ring-2 ring-white scale-105" : "opacity-80 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c.value }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setSelectedMemberForTitle(null)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveMemberTitle}
                  className="flex-1 py-3 bg-[#07c160] text-white rounded-xl font-bold text-sm shadow-md"
                >
                  保存设置
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Group Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className={cn(
              "w-full max-w-sm rounded-3xl p-6 shadow-2xl border space-y-4 text-center",
              isRainy ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
            )}>
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <h3 className="font-bold text-lg">解散群聊确认</h3>
              <p className="text-xs opacity-60 leading-relaxed">
                确定要解散/删除该群聊吗？所有聊天记录将被清空，且无法恢复。
              </p>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDeleteGroup?.();
                    onBack?.();
                  }}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm shadow-md"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full transition-colors duration-300 relative",
      isRainy ? "bg-black/30 backdrop-blur-xl text-white" : "bg-[#f5f5f5] text-slate-800"
    )} style={group.chatBackground ? {
      backgroundImage: `url(${group.chatBackground})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    } : {}}>
      {/* Top Bar with Centered Group Name */}
      <div className={cn(
        "px-3 py-2 flex items-center justify-between border-b sticky top-0 z-10 backdrop-blur-md",
        isRainy ? "bg-white/5 border-white/10" : "bg-[#f5f5f5]/90 border-slate-200"
      )} style={settings.fullScreenMode ? { paddingTop: 'env(safe-area-inset-top)' } : {}}>
        <button onClick={onBack} className="p-1 rounded-full hover:bg-slate-200/20">
          <ChevronLeft size={22} />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-base leading-tight">{group.name}</span>
          <span className="text-[10px] opacity-65">({group.memberIds.length + 1})</span>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-1 rounded-full hover:bg-slate-200/20">
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* Messages List */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onClick={() => {
          if (showEmojiPicker) setShowEmojiPicker(false);
          if (showFeatures) setShowFeatures(false);
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-10 opacity-40 text-xs">
            群聊创建成功，开始和大家聊天吧！点击下方 ✨ 按钮可一键生成群成员回复。
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const matchedMember = groupMembers.find(m => m.name === msg.description || m.id === msg.description);
            const userTitle = group.memberTitles?.['user'];
            const charTitle = matchedMember && group.memberTitles?.[matchedMember.id];
            const memberTitle = isUser ? userTitle : charTitle;
            const prevMsg = idx > 0 ? messages[idx - 1] : undefined;

            return (
              <div key={msg.id || idx} className="w-full">
                {renderMessageTimestamp(msg, prevMsg)}
                {msg.isSystemNotification ? (
                  <div className="w-full text-center my-2">
                    <span className="inline-block px-3 py-1 bg-black/10 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] rounded-full">
                      {msg.content}
                    </span>
                  </div>
                ) : msg.isNarration ? (
                  <div className="w-full flex justify-center my-3 px-8">
                    <span className="inline-block px-4 py-2 bg-black/20 dark:bg-black/40 backdrop-blur-md text-white text-[11px] leading-relaxed rounded-2xl text-center shadow-sm">
                      {msg.content}
                    </span>
                  </div>
                ) : msg.type === 'opening-card' && msg.openingData ? (
                  <div className="w-full flex justify-center my-6">
                    <div className="w-[280px] bg-white p-3 pb-8 rounded-sm shadow-xl border border-slate-200 relative rotate-1">
                      <div className="w-full aspect-square bg-[#f8f9fa] border border-slate-200 flex items-center justify-center p-6 relative">
                         <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap text-center z-10">{msg.openingData.content}</p>
                         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                      </div>
                      <div className="absolute bottom-2 left-4 text-slate-800 font-bold font-serif text-lg">
                        {msg.openingData.title}
                      </div>
                      <div className="absolute bottom-2 right-4 text-slate-400 text-[10px] font-mono">
                        {msg.openingData.dateStr}
                      </div>
                    </div>
                  </div>
                ) : msg.type === 'group-announcement' && msg.announcementData ? (
                  <div className="w-full flex justify-center my-6 px-4">
                    <div className="w-full max-w-[300px] rounded-2xl bg-white/10 dark:bg-black/20 border border-white/20 backdrop-blur-md p-4 text-center shadow-lg space-y-3 relative group">
                      <div className="flex items-center justify-center gap-1.5 text-amber-500 font-bold text-[11px] uppercase tracking-wider italic">
                        <Bell size={12} className="animate-bounce" />
                        群公告
                      </div>
                      <div className="text-xs leading-relaxed italic font-medium text-slate-700 dark:text-slate-200 break-words whitespace-pre-wrap">
                        {msg.announcementData.content}
                      </div>
                      
                      <div className="flex justify-center gap-4 pt-2 border-t border-slate-200/20">
                        {(() => {
                          const confirms = msg.announcementData.confirms || [];
                          const declines = msg.announcementData.declines || [];
                          const isConfirmed = confirms.includes('user') || confirms.includes(user.name);
                          const isDeclined = declines.includes('user') || declines.includes(user.name);
                          
                          return (
                            <>
                              <button
                                disabled={isConfirmed || isDeclined}
                                onClick={() => {
                                  const updatedConfirms = [...confirms, user.name];
                                  const updatedAnnData = { ...msg.announcementData!, confirms: updatedConfirms };
                                  if (onUpdateMessage) {
                                    onUpdateMessage(idx, { announcementData: updatedAnnData });
                                  }
                                  
                                  // Send system notification
                                  onSendMessage({
                                    role: 'user',
                                    isSystemNotification: true,
                                    content: `${user.name} 确认了群公告`,
                                    timestamp: Date.now(),
                                  });
                                }}
                                className={cn(
                                  "px-4 py-1.5 rounded-full text-[11px] font-bold transition-all",
                                  isConfirmed 
                                    ? "bg-[#07c160] text-white" 
                                    : (isDeclined ? "bg-slate-300 text-slate-400 cursor-not-allowed opacity-50" : "bg-white/20 hover:bg-white/40 text-slate-700 dark:text-white border border-slate-300/30")
                                )}
                              >
                                {isConfirmed ? '已确认 ✓' : '确认'}
                              </button>
                              <button
                                disabled={isConfirmed || isDeclined}
                                onClick={() => {
                                  const updatedDeclines = [...declines, user.name];
                                  const updatedAnnData = { ...msg.announcementData!, declines: updatedDeclines };
                                  if (onUpdateMessage) {
                                    onUpdateMessage(idx, { announcementData: updatedAnnData });
                                  }
                                  
                                  // Send system notification
                                  onSendMessage({
                                    role: 'user',
                                    isSystemNotification: true,
                                    content: `${user.name} 不确认群公告`,
                                    timestamp: Date.now(),
                                  });
                                }}
                                className={cn(
                                  "px-4 py-1.5 rounded-full text-[11px] font-bold transition-all",
                                  isDeclined 
                                    ? "bg-red-500 text-white" 
                                    : (isConfirmed ? "bg-slate-300 text-slate-400 cursor-not-allowed opacity-50" : "bg-white/20 hover:bg-white/40 text-slate-700 dark:text-white border border-slate-300/30")
                                )}
                              >
                                {isDeclined ? '已拒绝 ✗' : '不确认'}
                              </button>
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* Show confirmers and decliners */}
                      {((msg.announcementData.confirms && msg.announcementData.confirms.length > 0) || (msg.announcementData.declines && msg.announcementData.declines.length > 0)) && (
                        <div className="text-[10px] space-y-1 pt-1.5 opacity-60 text-left border-t border-slate-200/10">
                          {msg.announcementData.confirms && msg.announcementData.confirms.length > 0 && (
                            <div className="truncate text-[#07c160]">
                              ✓ 已确认: {msg.announcementData.confirms.join(', ')}
                            </div>
                          )}
                          {msg.announcementData.declines && msg.announcementData.declines.length > 0 && (
                            <div className="truncate text-red-400">
                              ✗ 不确认: {msg.announcementData.declines.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
                    <img 
                      src={isUser ? user.avatar : (msg.mediaUrl || group.avatar)} 
                      className="w-10 h-10 rounded-lg object-cover bg-slate-200 shrink-0" 
                      alt="avatar"
                    />
                    <div className={cn("max-w-[70%] flex flex-col", isUser ? "items-end" : "items-start")}>
                      {((!isUser && msg.description) || (isUser && memberTitle)) && (
                        <div className={cn("flex items-center gap-1.5 mb-0.5", isUser ? "flex-row-reverse mr-1" : "flex-row ml-1")}>
                          {!isUser && <span className="text-[10px] opacity-60">{msg.description}</span>}
                          {memberTitle && (
                            <span 
                              className="px-1.5 py-0.2 rounded text-[8px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: memberTitle.color }}
                            >
                              {memberTitle.title}
                            </span>
                          )}
                        </div>
                      )}
                      {getPureStickerUrl(msg.content, settings.customStickers || []) ? (() => {
                        const stickerInfo = getPureStickerUrl(msg.content, settings.customStickers || []);
                        return (
                          <div className="max-w-[140px] rounded-xl overflow-hidden bg-transparent">
                            <img src={stickerInfo!.url} className="w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        );
                      })() : msg.type === 'sticker' && (msg.stickerUrl || msg.mediaUrl) ? (
                        <div className="max-w-[140px] rounded-xl overflow-hidden shadow-sm bg-transparent">
                          <img src={msg.stickerUrl || msg.mediaUrl} className="w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ) : msg.type === 'red-packet' && msg.redPacketData ? (
                        <div 
                          onClick={() => setSelectedRedPacketMsg(msg)}
                          className="w-60 h-24 relative cursor-pointer overflow-hidden rounded-lg shadow-md hover:brightness-95 transition-all"
                        >
                          {/* Background Image Red Packet Card */}
                          <div 
                            className="absolute inset-0 bg-cover bg-center" 
                            style={{ backgroundImage: 'url(https://iili.io/ClMfdF9.png)', backgroundPosition: 'center -10px' }}
                          />
                          <div className="absolute inset-0 bg-black/5" />
                          <div className="relative h-full flex flex-col justify-between p-3.5 pt-4">
                            <div className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                                <Gift size={18} className="text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium truncate drop-shadow-sm">{msg.redPacketData.message}</div>
                                <div className="text-[10px] text-white/80 mt-0.5">
                                  {msg.redPacketData.packetType === 'random' ? '微信红包' : msg.redPacketData.packetType === 'exclusive' ? '专属红包' : '普通红包'}
                                </div>
                              </div>
                            </div>
                            <div className="text-[10px] text-white/60 font-medium">
                              {msg.redPacketData.remainingCount === 0 ? '已被领完' : '微信红包'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className={cn(
                          "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-all",
                          isUser 
                            ? "bg-[#95ec69] text-black rounded-tr-none" 
                            : (isRainy ? "bg-white/10 text-white rounded-tl-none backdrop-blur-md" : "bg-white text-slate-800 rounded-tl-none")
                        )}>
                          {renderMessageContent(msg.content, settings.customStickers || [])}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Bar - WeChat Style */}
      <div className={cn(
        "p-2.5 border-t flex flex-col backdrop-blur-md overflow-x-hidden",
        isRainy ? "bg-white/5 border-white/10" : "bg-[#f7f7f7] border-slate-200"
      )} style={settings.fullScreenMode ? { paddingBottom: 'env(safe-area-inset-bottom)' } : {}}>
        <div className="flex items-center gap-1.5">
          {/* Left: Voice button */}
          <button 
            onClick={() => alert('语音通话功能已就绪')}
            className={cn(
              "p-1 rounded-full transition-colors shrink-0",
              isRainy ? "text-white/60 hover:bg-white/10" : "text-slate-500 hover:bg-slate-200/60"
            )}
            title="语音消息"
          >
            <Mic size={20} strokeWidth={1.8} />
          </button>

          {/* Middle: Input field */}
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="发送消息..."
            className={cn(
              "flex-1 min-w-0 px-3 py-1.5 rounded-lg border text-sm outline-none transition-all",
              isRainy ? "bg-white/10 border-white/20 text-white placeholder-white/40" : "bg-white border-slate-200 text-slate-800"
            )}
          />

          {/* Right side: Emoji/Sticker, Plus, Sparkles, Send */}
          <button 
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowFeatures(false);
            }}
            className={cn(
              "p-1 rounded-full transition-colors shrink-0",
              showEmojiPicker ? "text-[#07c160]" : (isRainy ? "text-white/60 hover:bg-white/10" : "text-slate-500 hover:bg-slate-200/60")
            )}
            title="表情包"
          >
            <Smile size={20} strokeWidth={1.8} />
          </button>

          <button 
            onClick={() => {
              setShowFeatures(!showFeatures);
              setShowEmojiPicker(false);
            }}
            className={cn(
              "p-1 rounded-full transition-colors shrink-0",
              showFeatures ? "text-[#07c160]" : (isRainy ? "text-white/60 hover:bg-white/10" : "text-slate-500 hover:bg-slate-200/60")
            )}
            title="更多功能"
          >
            <Plus size={20} strokeWidth={1.8} />
          </button>

          {/* Sparkles Generate AI Group Replies */}
          <button 
            onClick={handleGenerateGroupReplies}
            disabled={isLoading}
            className={cn(
              "p-1 rounded-full transition-colors shrink-0 text-[#07c160] hover:bg-[#07c160]/10",
              isLoading && "opacity-60 animate-spin"
            )}
            title="生成群聊成员回复"
          >
            <Sparkles size={20} strokeWidth={1.8} />
          </button>

          {inputText.trim() ? (
            <button 
              onClick={handleSend}
              className="px-2.5 py-1.5 bg-[#07c160] text-white rounded-lg text-xs font-medium hover:bg-[#06ad56] transition-all shrink-0"
            >
              发送
            </button>
          ) : null}
        </div>

        {/* Emoji / Sticker Picker Panel */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 280, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "flex flex-col mt-3 rounded-2xl overflow-hidden transition-colors duration-300 border",
                isRainy ? "bg-white/10 backdrop-blur-xl border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
              )}
            >
              {/* Tabs */}
              <div className={cn(
                "flex border-b",
                isRainy ? "border-white/10" : "border-slate-100"
              )}>
                <button 
                  onClick={() => setStickerTab('emoji')}
                  className={cn(
                    "flex-1 py-2 flex items-center justify-center transition-all", 
                    stickerTab === 'emoji' 
                      ? "text-[#07c160] border-b-2 border-[#07c160]" 
                      : "opacity-40"
                  )}
                >
                  <Smile size={18} />
                </button>
                <button 
                  onClick={() => setStickerTab('custom')}
                  className={cn(
                    "flex-1 py-2 flex items-center justify-center transition-all", 
                    stickerTab === 'custom' 
                      ? "text-[#07c160] border-b-2 border-[#07c160]" 
                      : "opacity-40"
                  )}
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
                        onClick={() => setInputText(prev => prev + emoji)}
                        className={cn(
                          "text-xl rounded p-1 transition-colors flex items-center justify-center",
                          isRainy ? "hover:bg-white/10" : "hover:bg-slate-100"
                        )}
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
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#07c160] text-white"
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
                            handleDeleteStickers();
                          } else {
                            setStickerDeleteMode(true);
                          }
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[10px] font-bold",
                          stickerDeleteMode ? "bg-red-500 text-white" : "bg-slate-200 text-slate-700"
                        )}
                      >
                        {stickerDeleteMode ? `确认删除(${selectedStickers.length})` : '批量删除'}
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <button 
                        onClick={() => stickerFileInputRef.current?.click()}
                        className={cn(
                          "aspect-square border-2 border-dashed rounded-xl flex items-center justify-center transition-all",
                          isRainy ? "border-white/20 text-white/40" : "border-slate-200 text-slate-400"
                        )}
                      >
                        <Plus size={20} />
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
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden transition-colors duration-300 mt-2"
            >
              <div className="grid grid-cols-4 gap-4 p-3">
                <button
                  onClick={() => chatImageInputRef.current?.click()}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                    isRainy ? "bg-white/10" : "bg-white"
                  )}>
                    <ImageIcon size={22} className="text-[#07c160]" />
                  </div>
                  <span className="text-[10px] opacity-70">相册图片</span>
                </button>
                <button
                  onClick={() => {
                    setShowRedPacketModal(true);
                    setShowFeatures(false);
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                    isRainy ? "bg-white/10" : "bg-white"
                  )}>
                    <Gift size={22} className="text-[#fa5151]" />
                  </div>
                  <span className="text-[10px] opacity-70">发红包</span>
                </button>
                <button
                  onClick={() => {
                    setShowOpeningModal(true);
                    setShowFeatures(false);
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                    isRainy ? "bg-white/10" : "bg-white"
                  )}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8a2be2]"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                  </div>
                  <span className="text-[10px] opacity-70">开场白</span>
                </button>
                <button
                  onClick={() => {
                    onUpdateGroup({ isHtmlCardEnabled: group.isHtmlCardEnabled === false });
                    setShowFeatures(false);
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden",
                    isRainy ? "bg-white/10" : "bg-white"
                  )}>
                    <div className={cn(
                      "absolute inset-0 transition-opacity",
                      group.isHtmlCardEnabled === false ? "bg-slate-500/20" : "bg-[#007aff]/10"
                    )} />
                    <Code size={22} className={group.isHtmlCardEnabled === false ? "text-slate-400" : "text-[#007aff]"} />
                  </div>
                  <span className="text-[10px] opacity-70">HTML卡片</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={chatImageInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              onSendMessage({
                role: 'user',
                content: '[图片]',
                type: 'image',
                mediaUrl: reader.result as string,
                timestamp: Date.now(),
              });
              setShowFeatures(false);
            };
            reader.readAsDataURL(file);
          }
        }} 
      />

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
              setPendingStickerFile(event.target?.result as string);
              setShowStickerImport('file');
            };
            reader.readAsDataURL(file);
          }
        }} 
      />

      {/* Sticker Import & Red Packet Modals */}
      <AnimatePresence>
        {showStickerImport === 'url' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm bg-white text-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-lg">批量导入表情包URL</h3>
              <p className="text-xs text-slate-400">每行输入一个图片链接，支持「描述 URL」格式</p>
              <textarea 
                value={stickerUrlInput}
                onChange={(e) => setStickerUrlInput(e.target.value)}
                className="w-full h-40 p-3 bg-slate-100 rounded-2xl text-sm focus:outline-none"
                placeholder="打屁股 https://example.com/sticker1.png&#10;委屈哭 https://example.com/sticker2.gif"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowStickerImport(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">取消</button>
                <button onClick={handleAddStickersByUrl} className="flex-1 py-3 bg-[#07c160] text-white rounded-xl font-bold">导入</button>
              </div>
            </motion.div>
          </div>
        )}

        {showStickerImport === 'file' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-sm bg-white text-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
              <h3 className="font-bold text-lg">添加表情包</h3>
              <div className="aspect-square w-32 mx-auto rounded-2xl overflow-hidden border-2 border-slate-100">
                <img src={pendingStickerFile!} className="w-full h-full object-cover" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">表情包描述</label>
                <input 
                  type="text"
                  value={stickerFileDescription}
                  onChange={(e) => setStickerFileDescription(e.target.value)}
                  placeholder="例如：打屁股"
                  className="w-full px-4 py-2 bg-slate-100 rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowStickerImport(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold">取消</button>
                <button onClick={handleAddStickerByFile} className="flex-1 py-3 bg-[#07c160] text-white rounded-xl font-bold">保存</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Red Packet Creation Modal */}
        {showOpeningModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full sm:w-[400px] h-[80%] sm:h-[600px] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800 shrink-0">
                <button onClick={() => { setShowOpeningModal(false); setSelectedMemory(null); }} className="px-3 py-1 text-slate-500 font-medium">关闭</button>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedMemory ? '记忆总结' : '开场白与记忆库'}
                </div>
                <div className="w-10"></div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                {selectedMemory ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-bold text-lg">{selectedMemory.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{selectedMemory.dateStr}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedMemory.summary}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Active Opening */}
                    {group.activeOpening && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            当前演绎中
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="font-medium truncate mr-2">{group.activeOpening.title}</div>
                          <button
                            onClick={handleEndOpening}
                            disabled={isGeneratingSummary}
                            className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600 disabled:opacity-50 shrink-0"
                          >
                            {isGeneratingSummary ? '总结中...' : '结束演绎'}
                          </button>
                        </div>
                      </div>
                    )}

                    {!group.activeOpening && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">旁白模式</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">开启后，角色回复将包含动作旁白描述</div>
                          </div>
                          <button 
                            onClick={() => onUpdateGroup({ isNarrationMode: !group.isNarrationMode })}
                            className={cn(
                              "w-12 h-7 rounded-full p-1 transition-colors relative",
                              group.isNarrationMode ? "bg-[#07c160]" : "bg-slate-200 dark:bg-slate-700"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
                              group.isNarrationMode ? "translate-x-5" : "translate-x-0"
                            )} />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 ml-1">标题</label>
                          <input 
                            type="text"
                            value={openingTitle}
                            onChange={e => setOpeningTitle(e.target.value)}
                            placeholder="如：第一场戏 / 下午茶时光"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#07c160]/30"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 ml-1">正文</label>
                          <textarea 
                            value={openingContent}
                            onChange={e => setOpeningContent(e.target.value)}
                            placeholder="描述一下现在的场景..."
                            className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#07c160]/30 resize-none"
                          />
                        </div>
                        <button 
                          onClick={handleSendOpening} 
                          className={cn("w-full py-3 font-bold text-white rounded-xl transition-colors", openingTitle.trim() && openingContent.trim() ? "bg-[#07c160]" : "bg-[#07c160]/50")}
                          disabled={!openingTitle.trim() || !openingContent.trim()}
                        >
                          发送开场白
                        </button>
                      </div>
                    )}

                    {/* Memories List */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-500 mb-3">历史记忆库</h4>
                      {!group.openingMemories || group.openingMemories.length === 0 ? (
                        <div className="text-center py-6 text-sm text-slate-400">暂无演绎记录</div>
                      ) : (
                        <div className="space-y-2">
                          {[...group.openingMemories].reverse().map(memory => (
                            <div 
                              key={memory.id}
                              onClick={() => setSelectedMemory(memory)}
                              className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <div>
                                <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{memory.title}</div>
                                <div className="text-[10px] text-slate-400">{memory.dateStr}</div>
                              </div>
                              <button className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">查看</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
        {showRedPacketModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-md bg-[#ededed] dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-[#ededed] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <button onClick={() => setShowRedPacketModal(false)} className="text-slate-600 dark:text-slate-300 font-medium text-sm">取消</button>
                <span className="font-bold text-slate-800 dark:text-white text-base">发红包</span>
                <div className="w-10" />
              </div>

              <div className="p-4 space-y-4">
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    type="button"
                    onClick={() => setRedPacketType('random')}
                    className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", redPacketType === 'random' ? "bg-white dark:bg-slate-700 text-[#fa5151] shadow-sm" : "text-slate-600 dark:text-slate-400")}
                  >
                    拼手速红包
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRedPacketType('normal')}
                    className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", redPacketType === 'normal' ? "bg-white dark:bg-slate-700 text-[#fa5151] shadow-sm" : "text-slate-600 dark:text-slate-400")}
                  >
                    普通红包
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRedPacketType('exclusive')}
                    className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", redPacketType === 'exclusive' ? "bg-white dark:bg-slate-700 text-[#fa5151] shadow-sm" : "text-slate-600 dark:text-slate-400")}
                  >
                    专属红包
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
                  {redPacketType === 'exclusive' && (
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">指定成员</span>
                      <select 
                        value={redPacketTargetId || groupMembers[0]?.id}
                        onChange={(e) => setRedPacketTargetId(e.target.value)}
                        className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white text-xs px-3 py-1.5 rounded-lg outline-none"
                      >
                        {groupMembers.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">红包个数</span>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        min="1" 
                        max={groupMembers.length + 1}
                        value={redPacketCount}
                        onChange={(e) => setRedPacketCount(e.target.value)}
                        className="w-20 text-right bg-transparent text-sm font-bold text-slate-800 dark:text-white outline-none"
                      />
                      <span className="text-xs text-slate-500">个</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {redPacketType === 'normal' ? '单个金额' : '总金额'}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">¥</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={redPacketAmount}
                        onChange={(e) => setRedPacketAmount(e.target.value)}
                        className="w-28 text-right bg-transparent text-xl font-bold text-slate-800 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <input 
                      type="text" 
                      value={redPacketMessage}
                      onChange={(e) => setRedPacketMessage(e.target.value)}
                      placeholder="恭喜发财，大吉大利"
                      className="w-full bg-slate-100 dark:bg-slate-900 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="text-center py-2">
                  <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
                    ¥{redPacketType === 'normal' ? (parseFloat(redPacketAmount || '0') * parseInt(redPacketCount || '1')).toFixed(2) : parseFloat(redPacketAmount || '0').toFixed(2)}
                  </div>
                </div>

                <button 
                  onClick={() => {
                    const count = parseInt(redPacketCount) || 1;
                    const total = redPacketType === 'normal' ? parseFloat(redPacketAmount || '0') * count : parseFloat(redPacketAmount || '0');
                    if (total <= 0) {
                      alert('请输入有效的金额');
                      return;
                    }
                    const targetId = redPacketTargetId || groupMembers[0]?.id;
                    const targetMember = groupMembers.find(m => m.id === targetId);

                    const redPacketMsg: ChatMessage = {
                      role: 'user',
                      content: `[红包] ${redPacketMessage}`,
                      type: 'red-packet',
                      timestamp: Date.now(),
                      redPacketData: {
                        id: Math.random().toString(36).substr(2, 9),
                        packetType: redPacketType,
                        totalAmount: total,
                        count: count,
                        remainingAmount: total,
                        remainingCount: count,
                        message: redPacketMessage || '恭喜发财，大吉大利',
                        senderId: 'user',
                        senderName: user.name,
                        targetMemberId: redPacketType === 'exclusive' ? targetId : undefined,
                        targetMemberName: redPacketType === 'exclusive' ? targetMember?.name : undefined,
                        claims: []
                      }
                    };

                    onSendMessage(redPacketMsg);
                    setShowRedPacketModal(false);
                    setShowFeatures(false);
                  }}
                  className="w-full py-3.5 bg-[#fa5151] hover:bg-[#e64340] text-white font-bold rounded-2xl shadow-lg transition-all text-sm"
                >
                  塞钱进红包
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Red Packet Detail / Claim Modal */}
        {selectedRedPacketMsg && selectedRedPacketMsg.redPacketData && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-[320px] h-[520px] bg-[#f44336] rounded-[32px] overflow-hidden shadow-2xl flex flex-col relative"
            >
              {/* Top Banner with Background Image */}
              <div 
                className="h-[65%] w-full relative bg-cover bg-center"
                style={{ backgroundImage: 'url(https://iili.io/ClEUj6u.png)', backgroundPosition: 'center 0' }}
              >
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedRedPacketMsg(null)}
                  className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-white/80 hover:text-white"
                >
                  <X size={20} />
                </button>

                {/* Sender Info */}
                <div className="absolute top-16 inset-x-0 flex flex-col items-center px-6">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg mb-3">
                    <img src={selectedRedPacketMsg.redPacketData.senderId === 'user' ? user.avatar : (groupMembers.find(m => m.id === selectedRedPacketMsg.redPacketData?.senderId)?.avatar || group.avatar)} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-white font-medium drop-shadow-md text-sm">{selectedRedPacketMsg.redPacketData.senderName}</div>
                  <div className="text-white/70 text-[11px] mt-1 italic drop-shadow-sm">给你发了一个红包</div>
                  <div className="text-white text-lg font-bold mt-6 text-center line-clamp-2 px-2 drop-shadow-md">{selectedRedPacketMsg.redPacketData.message}</div>
                </div>

                {/* Open Button Circle */}
                <div className="absolute bottom-[-45px] inset-x-0 flex justify-center">
                  {(() => {
                    const data = selectedRedPacketMsg.redPacketData!;
                    const userClaimed = data.claims.find(c => c.memberId === 'user');
                    const isExclusiveForOther = data.packetType === 'exclusive' && data.targetMemberId && data.targetMemberId !== 'user';
                    const isFinished = data.remainingCount <= 0 || data.remainingAmount <= 0;

                    if (userClaimed || isFinished || isExclusiveForOther) {
                      return (
                        <button 
                          onClick={() => {
                            // Show detail view or message
                          }}
                          className="text-amber-200 text-xs font-bold hover:underline"
                        >
                          {userClaimed ? '查看领取详情 >' : '红包已领完 >'}
                        </button>
                      );
                    }

                    return (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          const msg = selectedRedPacketMsg;
                          if (!msg.redPacketData) return;
                          const d = msg.redPacketData;
                          if (d.remainingCount <= 0 || d.claims.some(c => c.memberId === 'user')) return;

                          let amount = 0;
                          if (d.remainingCount === 1) {
                            amount = parseFloat(d.remainingAmount.toFixed(2));
                          } else {
                            if (d.packetType === 'normal') {
                              amount = parseFloat((d.totalAmount / d.count).toFixed(2));
                            } else {
                              const maxPossible = d.remainingAmount - (d.remainingCount - 1) * 0.01;
                              amount = parseFloat((Math.random() * (maxPossible - 0.01) + 0.01).toFixed(2));
                              if (amount <= 0) amount = 0.01;
                            }
                          }
                          if (amount > d.remainingAmount) amount = d.remainingAmount;

                          d.remainingAmount = parseFloat((d.remainingAmount - amount).toFixed(2));
                          d.remainingCount -= 1;
                          d.claims.push({
                            memberId: 'user',
                            memberName: user.name,
                            amount,
                            timestamp: Date.now()
                          });

                          onSendMessage({
                            role: 'assistant',
                            content: `${user.name} 领取了红包`,
                            description: '系统通知',
                            isSystemNotification: true,
                            timestamp: Date.now(),
                          });

                          const msgIndex = messages.findIndex(m => m === msg || m.timestamp === msg.timestamp);
                          if (msgIndex !== -1 && onUpdateMessage) {
                            onUpdateMessage(msgIndex, { redPacketData: { ...d } });
                          }
                          setSelectedRedPacketMsg({ ...msg });
                        }}
                        className="w-24 h-24 rounded-full bg-[#eec36e] shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center justify-center text-[#3c2a13] font-extrabold text-3xl border-[3px] border-[#d4ac5e]"
                      >
                        開
                      </motion.button>
                    );
                  })()}
                </div>
              </div>

              {/* Bottom White Area (Detail View) */}
              <div className="flex-1 bg-white flex flex-col min-h-0 relative">
                {(() => {
                  const data = selectedRedPacketMsg.redPacketData!;
                  const userClaimed = data.claims.find(c => c.memberId === 'user');
                  const isFinished = data.remainingCount <= 0 || data.remainingAmount <= 0;
                  
                  if (userClaimed || isFinished) {
                    const maxAmount = data.claims.length > 0 ? Math.max(...data.claims.map(c => c.amount)) : 0;

                    return (
                      <div className="flex-1 flex flex-col min-h-0">
                        <div className="text-center py-6 shrink-0">
                          {userClaimed && (
                            <div className="animate-in zoom-in-95 duration-500">
                              <span className="text-[10px] text-slate-400">已领到</span>
                              <div className="text-4xl font-black text-[#fa5151] mt-1.5 flex items-baseline justify-center">
                                <span className="text-xl font-bold mr-1">¥</span>
                                {userClaimed.amount.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
                          <div className="text-[11px] text-slate-400 font-medium py-3 border-b border-slate-50/50">
                            已领取 {data.count - data.remainingCount}/{data.count} 个，共 ¥{(data.totalAmount - data.remainingAmount).toFixed(2)}/{data.totalAmount.toFixed(2)}
                          </div>
                          <div className="space-y-0">
                            {data.claims.map((claim, idx) => {
                              const memberObj = claim.memberId === 'user' ? user : groupMembers.find(m => m.id === claim.memberId);
                              const isMax = isFinished && claim.amount === maxAmount && data.claims.length > 1;

                              return (
                                <div key={idx} className="flex items-center justify-between py-4 border-b border-slate-50/50 last:border-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                  <div className="flex items-center gap-3">
                                    <img src={memberObj?.avatar || group.avatar} className="w-10 h-10 rounded-lg object-cover bg-slate-100 shadow-sm" />
                                    <div className="flex flex-col">
                                      <div className="text-[13px] font-bold text-slate-800 leading-tight">{claim.memberName}</div>
                                      <div className="text-[10px] text-slate-400 mt-1.5">{new Date(claim.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <div className="text-[14px] font-black text-slate-800">¥ {claim.amount.toFixed(2)}</div>
                                    {isMax && (
                                      <div className="flex items-center gap-0.5 mt-1 animate-in fade-in zoom-in-50 duration-500">
                                        <Crown size={10} className="text-orange-500 fill-orange-500" />
                                        <span className="text-[9px] text-orange-500 font-bold">手气最佳</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="flex-1 flex items-center justify-center p-8 text-center pt-10">
                      <p className="text-slate-400 text-sm italic font-medium animate-pulse">
                        快点开红包，看看手气如何！
                      </p>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
