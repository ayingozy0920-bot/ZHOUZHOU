import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, Send, Plus, Image as ImageIcon, Smile, Sparkles, 
  MoreHorizontal, Users, Trash2, Camera, Palette, Globe, Type, Mic, Heart, X, Award, Gift, CircleDollarSign,
  Cpu, BookOpen, Check, RefreshCw
} from 'lucide-react';
import { GroupChat, Friend, ChatMessage, UserProfile, AppSettings, Sticker } from '../../types';
import { apiFetch } from '../../lib/apiHelper';
import { cn } from '../../lib/utils';

interface GroupChatWindowProps {
  group: GroupChat;
  user: UserProfile;
  friends: Friend[];
  messages: ChatMessage[];
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

const EMOJIS = ['😊', '😂', '🥹', '😍', '🥰', '😘', '😋', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', 'worried', '😢', '😭', '❤️', '👍', '🔥', '✨', '🎉', '💩', '👻', '🐱', '🌹', '☕', '🍻'];
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

export const GroupChatWindow: React.FC<GroupChatWindowProps> = ({
  group,
  user,
  friends,
  messages,
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
  const [settingsSubView, setSettingsSubView] = useState<'main' | 'tokens' | 'world-books'>('main');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState(group.name);

  // Title editing modal state
  const [selectedMemberForTitle, setSelectedMemberForTitle] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [titleColor, setTitleColor] = useState('#3b82f6');

  // Red packet states
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showEmojiPicker, showFeatures]);

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
      mediaUrl: sticker.url,
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
      // Auto-claim active red packets
      const activePackets = messages.filter(m => m.type === 'red-packet' && m.redPacketData && m.redPacketData.remainingCount > 0);
      for (const pktMsg of activePackets) {
        const d = pktMsg.redPacketData!;
        const availableMembers = groupMembers.filter(m => !d.claims.some(c => c.memberId === m.id));
        if (availableMembers.length > 0 && d.remainingCount > 0 && Math.random() > 0.2) {
          const claimer = availableMembers[Math.floor(Math.random() * availableMembers.length)];
          if (d.packetType === 'exclusive' && d.targetMemberId && d.targetMemberId !== claimer.id) {
            continue;
          }

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
            content: `${claimer.name} 领取了 ${d.senderName} 的红包：¥${amount.toFixed(2)}`,
            description: '系统通知',
            isSystemNotification: true,
            timestamp: Date.now(),
          });

          const msgIndex = messages.findIndex(m => m === pktMsg || m.timestamp === pktMsg.timestamp);
          if (msgIndex !== -1 && onUpdateMessage) {
            onUpdateMessage(msgIndex, { redPacketData: { ...d } });
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

      const recentMsgs = messages.slice(-30);
      const historyText = recentMsgs.map(m => {
        if (m.role === 'user') return `${user.name} (用户): ${m.content}`;
        if (m.isSystemNotification) return `[系统通知]: ${m.content}`;
        return `${m.description || '群成员'}: ${m.content}`;
      }).join('\n');

      const systemPrompt = `你现在正在模拟一个真实微信群聊。群成员和用户拥有以下头衔（QQ风格）：\n${memberTitlesDesc}\n\n群里有以下成员：\n${memberPersonasDesc}${worldBookPrompt}\n\n最近的群聊记录：\n${historyText}\n\n请模拟群内活跃的2到3个不同角色分别发言，总共生成2到4条连续的回复消息。各角色可以感知并讨论彼此或用户头衔内容，也可以谈论抢红包或互相发红包。让各角色根据人设、上文氛围进行自然、生动、符合性格的对话、吐槽或互动。\n要求：必须严格输出合法的JSON数组格式（不要包含markdown代码块语法，纯JSON数组），每个元素包含：\n- "characterId": 说话角色的ID\n- "characterName": 说话角色的名字\n- "content": 说话内容\n数组长度在2到4之间。`;

      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: systemPrompt,
          messages: [{ role: 'user', parts: [{ text: '请根据群聊天记录，让群成员们开始聊天或回复。' }] }],
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

      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      let replies: Array<{ characterId: string; characterName: string; content: string }> = [];
      try {
        replies = JSON.parse(cleanedText);
      } catch (e) {
        const match = cleanedText.match(/\[[\s\S]*\]/);
        if (match) {
          replies = JSON.parse(match[0]);
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
        const rep = replies[i];
        const member = groupMembers.find(m => m.id === rep.characterId || m.name === rep.characterName) || groupMembers[0];
        if (member) {
          const groupMsg: ChatMessage = {
            role: 'assistant',
            content: rep.content,
            description: member.name,
            mediaUrl: member.avatar,
            timestamp: Date.now() + i * 500,
          };
          onSendMessage(groupMsg);
          if (i < replies.length - 1) {
            await new Promise(r => setTimeout(r, 800));
          }
        }
      }
    } catch (err: any) {
      console.error('Group chat generation error:', err);
      const randomMember = groupMembers[Math.floor(Math.random() * groupMembers.length)];
      if (randomMember) {
        onSendMessage({
          role: 'assistant',
          content: '（似乎正在思考该说些什么……）',
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
          "flex flex-col h-full transition-all duration-500",
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
          "flex flex-col h-full transition-all duration-500",
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
        "flex flex-col h-full transition-all duration-300 relative",
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

            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm">群公告</span>
              <input 
                type="text"
                placeholder="未设置"
                value={group.groupNotice || ''}
                onChange={(e) => onUpdateGroup({ groupNotice: e.target.value })}
                className="text-sm bg-transparent text-right outline-none opacity-60"
              />
            </div>

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
      "flex flex-col h-full transition-all duration-300 relative",
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
      )} style={settings.fullScreenMode ? { paddingTop: settings.hideStatusBar ? 'env(safe-area-inset-top)' : 'max(env(safe-area-inset-top), 44px)' } : {}}>
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-10 opacity-40 text-xs">
            群聊创建成功，开始和大家聊天吧！点击下方 ✨ 按钮可一键生成群成员回复。
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const matchedMember = groupMembers.find(m => m.name === msg.description || m.id === msg.description);
            const memberTitle = matchedMember && group.memberTitles?.[matchedMember.id];

            return (
              <div key={msg.id || idx} className="w-full">
                {msg.isSystemNotification ? (
                  <div className="w-full text-center my-2">
                    <span className="inline-block px-3 py-1 bg-black/10 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] rounded-full">
                      {msg.content}
                    </span>
                  </div>
                ) : (
                  <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
                    <img 
                      src={isUser ? user.avatar : (msg.mediaUrl || group.avatar)} 
                      className="w-10 h-10 rounded-lg object-cover bg-slate-200 shrink-0" 
                      alt="avatar"
                    />
                    <div className={cn("max-w-[70%] flex flex-col", isUser ? "items-end" : "items-start")}>
                      {!isUser && msg.description && (
                        <div className="flex items-center gap-1.5 mb-0.5 ml-1">
                          <span className="text-[10px] opacity-60">{msg.description}</span>
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
                      {msg.type === 'sticker' && msg.mediaUrl ? (
                        <div className="max-w-[140px] rounded-xl overflow-hidden shadow-sm bg-transparent">
                          <img src={msg.mediaUrl} className="w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ) : msg.type === 'red-packet' && msg.redPacketData ? (
                        <div 
                          onClick={() => setSelectedRedPacketMsg(msg)}
                          className="flex items-center gap-3 bg-[#fa5151] hover:bg-[#e64340] text-white p-3.5 rounded-2xl cursor-pointer shadow-md transition-all w-64 max-w-full relative overflow-hidden group select-none"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#ffb11b] flex items-center justify-center shrink-0 shadow-inner text-amber-900">
                            <Gift size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{msg.redPacketData.message}</div>
                            <div className="text-[10px] text-red-100 opacity-90 mt-0.5">
                              {msg.redPacketData.packetType === 'random' ? '拼手速红包' : msg.redPacketData.packetType === 'exclusive' ? '专属红包' : '普通红包'}
                              {msg.redPacketData.remainingCount === 0 ? ' (已被抢光)' : ''}
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
                          {msg.content}
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
                "flex flex-col mt-3 rounded-2xl overflow-hidden transition-all duration-300 border",
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
              className="overflow-hidden transition-all duration-300 mt-2"
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs bg-[#f44336] text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col relative"
            >
              <button 
                onClick={() => setSelectedRedPacketMsg(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white z-10"
              >
                <X size={18} />
              </button>

              <div className="p-6 text-center flex flex-col items-center relative overflow-hidden bg-gradient-to-b from-[#ff5252] to-[#d32f2f]">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 mb-2 shadow">
                  <img src={selectedRedPacketMsg.redPacketData.senderId === 'user' ? user.avatar : (groupMembers.find(m => m.id === selectedRedPacketMsg.redPacketData?.senderId)?.avatar || group.avatar)} className="w-full h-full object-cover" />
                </div>
                <div className="text-xs opacity-90">{selectedRedPacketMsg.redPacketData.senderName} 的红包</div>
                <div className="text-sm font-bold mt-1 px-4">{selectedRedPacketMsg.redPacketData.message}</div>
                
                <div className="my-8">
                  {(() => {
                    const data = selectedRedPacketMsg.redPacketData!;
                    const userClaimed = data.claims.find(c => c.memberId === 'user');
                    const isExclusiveForOther = data.packetType === 'exclusive' && data.targetMemberId && data.targetMemberId !== 'user';

                    if (userClaimed) {
                      return (
                        <div className="text-center">
                          <div className="text-xs opacity-80">你已领取</div>
                          <div className="text-2xl font-extrabold text-amber-200 mt-1">¥{userClaimed.amount.toFixed(2)}</div>
                        </div>
                      );
                    }

                    if (data.remainingCount <= 0 || data.remainingAmount <= 0) {
                      return (
                        <div className="text-xs opacity-80 py-4 font-bold bg-black/10 px-4 rounded-xl">
                          手慢了，红包已被抢光
                        </div>
                      );
                    }

                    if (isExclusiveForOther) {
                      return (
                        <div className="text-xs opacity-80 py-4 font-bold bg-black/10 px-4 rounded-xl">
                          此红包专属发给 {data.targetMemberName}，你无法领取
                        </div>
                      );
                    }

                    return (
                      <button
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
                            content: `${user.name} 领取了 ${d.senderName} 的红包：¥${amount.toFixed(2)}`,
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
                        className="w-20 h-20 rounded-full bg-[#ffb11b] hover:bg-[#ffca28] text-amber-950 font-extrabold text-2xl shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 mx-auto"
                      >
                        开
                      </button>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white p-4 max-h-48 overflow-y-auto space-y-3">
                <div className="text-[10px] opacity-50">
                  已领取 {selectedRedPacketMsg.redPacketData.count - selectedRedPacketMsg.redPacketData.remainingCount}/{selectedRedPacketMsg.redPacketData.count} 个，共 ¥{(selectedRedPacketMsg.redPacketData.totalAmount - selectedRedPacketMsg.redPacketData.remainingAmount).toFixed(2)}/{selectedRedPacketMsg.redPacketData.totalAmount.toFixed(2)}
                </div>
                <div className="space-y-2">
                  {selectedRedPacketMsg.redPacketData.claims.map((claim, idx) => {
                    const memberObj = claim.memberId === 'user' ? user : groupMembers.find(m => m.id === claim.memberId);
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <img src={memberObj?.avatar || group.avatar} className="w-7 h-7 rounded-md object-cover bg-slate-200" />
                          <div>
                            <div className="font-bold">{claim.memberName}</div>
                            <div className="text-[9px] opacity-40">{new Date(claim.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                          </div>
                        </div>
                        <div className="font-bold text-slate-800 dark:text-white">¥{claim.amount.toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
