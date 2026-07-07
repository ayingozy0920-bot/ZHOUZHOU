import React, { useState, useEffect } from 'react';
import { Friend, ChatMessage } from '../../types';
import { cn } from '../../lib/utils';
import { Edit2, Check, X, Calendar, Smile, Trash2, Clock, MapPin, User, Shirt, BookOpen, Heart, Sparkles } from 'lucide-react';

// Predefined list of beautiful, romantic, and cozy signatures for the magazine header
const BEAUTIFUL_SIGNATURES = [
  "幸福就是~猫吃鱼，狗吃肉，奥特曼打小怪兽~",
  "生活在温柔的晨光与你的笑容里",
  "岁月静好，只想和你虚度时光",
  "风吹过林梢，那是风在对你低语",
  "两颗星在夜空中，偶尔擦肩，终成永恒",
  "最美的风景，在有你的每一个角落",
  "有些心动，藏在欲言又止的细节里",
  "我们把日常写成诗，把余生过成画",
  "指尖微凉，却在触碰你时有了温度",
  "晨曦初照，看日光穿透薄雾落在你眼底",
  "星河滚烫，你是人间值得的温柔",
  "时间漫长，愿与你共享此刻的平静",
  "有些默契无需多言，眼神已说明了一切",
  "长街落满树影，每一步都走向有你的明天",
  "在这个喧嚣的世界，你是我心底的偏爱",
  "指尖碰触的微小电流，是春风也吹不散的心动",
  "红茶在午后散发袅袅香气，而你就在身享",
  "岁月的流沙里，唯有你的笑脸如此清晰",
  "如果心动有声音，那一定是风穿过麦浪的声音",
  "你在身边的每一秒，都是被揉碎的暖阳",
  "愿所有温柔与美好，都如期而至在有你的时光"
];

const BEAUTIFUL_USER_SIGNATURES = [
  "风过长街，你是我落笔时的第一行诗",
  "在这个温柔的世界里，有你便有归宿",
  "把温热的誓言，写在起风的季节",
  "岁月漫长，我们慢慢书写彼此的故事",
  "每一次落笔，都是对未来的轻声呼唤",
  "在故事的扉页，刻下我们共同的轮廓",
  "有些心动，藏在欲言又止的细节里",
  "指尖微凉，却在触碰你时有了温度",
  "在这个喧嚣的世界，你是我心底的偏爱",
  "你的名字，是我听过最动人的情话",
  "指尖碰触的微小电流，是春风也吹不散的心动"
];

interface OfflinePlotCardProps {
  message: ChatMessage;
  friend: Friend;
  user: any;
  index: number;
  theme?: 'classic' | 'student' | 'glass' | 'time';
  isEditing: boolean;
  editingContent: string;
  setEditingContent: (val: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete?: () => void;
}

export const OfflinePlotCard: React.FC<OfflinePlotCardProps> = ({
  message,
  friend,
  user,
  index,
  theme = 'classic',
  isEditing,
  editingContent,
  setEditingContent,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete
}) => {
  const isUser = message.role === 'user';
  const roundNum = index + 1;

  const [currentDate, setCurrentDate] = useState(() => {
    const date = new Date(message.timestamp || Date.now());
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  });

  // Helper for edit/delete buttons
  const ActionButtons = ({ className }: { className?: string }) => (
    <div className={cn("flex gap-1 pointer-events-auto", className)}>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onStartEdit();
        }}
        className="p-1 bg-white/80 border border-slate-200 text-slate-500 hover:text-blue-600 rounded-md hover:shadow-sm transition-all z-20 backdrop-blur-sm active:scale-95"
        title="编辑"
      >
        <Edit2 size={10} strokeWidth={3} />
      </button>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1 bg-white/80 border border-slate-200 text-slate-400 hover:text-red-600 rounded-md hover:shadow-sm transition-all z-20 backdrop-blur-sm active:scale-95"
        title="删除"
      >
        <Trash2 size={10} strokeWidth={3} />
      </button>
    </div>
  );

  const renderEditForm = () => (
    <div className="space-y-3 w-full">
      <textarea 
        autoFocus
        value={editingContent}
        onChange={e => setEditingContent(e.target.value)}
        onClick={e => e.stopPropagation()}
        onFocus={(e) => {
          // Ensure cursor is at the end of text
          const val = e.target.value;
          e.target.value = '';
          e.target.value = val;
        }}
        className={cn(
          "w-full min-h-[160px] p-4 text-sm rounded-2xl focus:outline-none focus:ring-2 font-sans transition-all",
          theme === 'student' ? "bg-white/80 text-blue-900 border-blue-200 focus:ring-blue-400" :
          theme === 'glass' ? "bg-white/20 text-white border-white/30 focus:ring-white/50 backdrop-blur-md" :
          theme === 'time' ? "bg-slate-800 text-slate-100 border-slate-700 focus:ring-slate-500" :
          "bg-white text-stone-900 border-slate-200 focus:ring-pink-400"
        )}
        placeholder="修改剧情内容..."
      />
      <div className="flex gap-2 justify-end">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onCancelEdit();
          }}
          className="px-3 py-1.5 text-[10px] bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 font-black"
        >
          <X size={12} /> 取消
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSaveEdit();
          }}
          className="px-3 py-1.5 text-[10px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1 font-black shadow-lg shadow-blue-500/20"
        >
          <Check size={12} /> 保存
        </button>
      </div>
    </div>
  );

  const parseNovelFormat = (text: string) => {
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    
    return paragraphs.map((p, pIdx) => {
      const isDialogue = /(“[^”]*”|"[^"]*")/.test(p);
      
      const renderWithHighlights = (rawText: string) => {
        const parts = rawText.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            const innerText = part.slice(2, -2);
            return (
              <span 
                key={partIdx} 
                className={cn(
                  "font-black px-1 rounded-sm mx-0.5 shadow-sm inline-block transform hover:scale-[1.05] transition-transform duration-200 cursor-help",
                  theme === 'student' ? "bg-blue-300/40 text-blue-900 border-b border-blue-400" :
                  theme === 'glass' ? "bg-white/30 text-white border-b border-white/50" :
                  theme === 'time' ? "bg-white/20 text-white border-b border-white/30" :
                  "bg-yellow-300/40 text-amber-900 border-b border-amber-400"
                )}
              >
                {innerText}
              </span>
            );
          }
          return part;
        });
      };

      if (isDialogue) {
        const dialogueParts = p.split(/(“[^”]*”|"[^"]*")/g);
        return (
          <div key={pIdx} className={cn(
            "mb-4 pl-4 border-l-2 leading-relaxed text-base tracking-wide font-semibold",
            theme === 'student' ? "border-blue-300/40 text-blue-900" :
            theme === 'glass' ? "border-white/20 text-white" :
            theme === 'time' ? "border-white/10 text-white" :
            "border-[#D6CBB3]/40 text-[#2B1D12]"
          )}>
            {dialogueParts.map((part, dIdx) => {
              const isQuote = /(“[^”]*”|"[^"]*")/.test(part);
              if (isQuote) {
                return <span key={dIdx} className={cn(
                  "font-bold",
                  (theme === 'glass' || theme === 'time') ? "text-white" : "text-slate-900"
                )}>{renderWithHighlights(part)}</span>;
              } else {
                return <span key={dIdx} className={cn(
                  "text-xs font-medium italic mx-1",
                  theme === 'student' ? "text-blue-500/70" :
                  (theme === 'glass' || theme === 'time') ? "text-white/60" :
                  "text-[#6B5E4F]"
                )}>{renderWithHighlights(part)}</span>;
              }
            })}
          </div>
        );
      } else {
        return (
          <p key={pIdx} className={cn(
            "indent-8 leading-relaxed tracking-wider font-normal mb-4 font-serif text-justify",
            theme === 'student' ? "text-blue-800/80" :
            (theme === 'glass' || theme === 'time') ? "text-white/80" :
            "text-[#5A4F43]"
          )}>
            {renderWithHighlights(p)}
          </p>
        );
      }
    });
  };

  const ThemeCard = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("w-full flex justify-start px-2 py-4 relative group", className)}>
      {children}
    </div>
  );

  // Student Card Theme (Avatar Left, Info Right)
  if (theme === 'student') {
    return (
      <ThemeCard>
        <div className="bg-[#E6F3F7] text-slate-700 p-6 rounded-[32px] shadow-xl max-w-2xl mx-auto w-full relative overflow-hidden border-4 border-white">
          <div className="flex justify-between items-center mb-6 border-b border-blue-200/50 pb-3">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md tracking-tighter italic shadow-sm">STUDENT ID</div>
              <div className="text-[10px] font-mono text-blue-400 font-bold tracking-widest uppercase">
                PAGE_{roundNum.toString().padStart(3, '0')} // {currentDate.split(' ')[1]}
              </div>
            </div>
            <div className="text-[10px] font-bold text-blue-400/60 uppercase tracking-widest">
              {currentDate.split(' ')[0]}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex gap-6">
              <div className="shrink-0">
                <div className="w-[120px] h-[160px] rounded-xl border-4 border-white overflow-hidden shadow-lg bg-white rotate-[-1deg] relative">
                   <img 
                    src={isUser ? (user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name || 'user'}`) : friend.avatar} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="text-2xl font-black text-blue-900 tracking-tighter uppercase italic leading-none mb-1">
                    {isUser ? (user?.wechatNickname || user?.name || 'USER') : (friend.alias || friend.name)}
                  </div>
                  <div className="text-[10px] font-bold text-blue-400/60 tracking-widest uppercase mb-3">ID: OFL-{friend.id.slice(0, 8)}</div>
                  <ActionButtons className="mb-4" />
                  {!isUser && message.innerMonologue && (
                    <div className="bg-blue-100/40 rounded-xl p-3 border border-blue-200/30 max-h-[100px] overflow-y-auto custom-scrollbar">
                      <div className="flex items-center gap-1.5 mb-1 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                        <Heart size={10} className="fill-blue-400 text-blue-400" /> Inner Monologue
                      </div>
                      <div className="text-[11px] text-blue-800/70 italic leading-relaxed font-medium">
                        {message.innerMonologue}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white/60 rounded-[24px] p-6 border-2 border-white shadow-inner min-h-[180px]">
              {isEditing ? renderEditForm() : (
                <div className="text-sm md:text-base leading-relaxed font-medium font-sans text-blue-900/90 whitespace-pre-wrap">
                  {parseNovelFormat(message.content)}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center px-2 opacity-60">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-lg border-2 border-blue-100 flex items-center justify-center bg-blue-50/50">
                 <Smile size={20} className="text-blue-300" />
               </div>
               <div className="flex flex-col">
                 <span className="text-[8px] uppercase font-bold text-blue-400">Status</span>
                 <span className="text-[10px] font-black text-blue-600 italic">Reality Sync</span>
               </div>
             </div>
             <div className="h-6 w-32 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#3b82f6_2px,#3b82f6_3px)]" />
          </div>
        </div>
      </ThemeCard>
    );
  }

  // Frosted Glass Theme (Avatar Right, Info Left)
  if (theme === 'glass') {
    return (
      <ThemeCard>
        <div className="relative max-w-2xl mx-auto w-full rounded-[40px] overflow-hidden border border-white/40 shadow-2xl bg-white/10 backdrop-blur-3xl">
          <div className="absolute -top-20 -left-20 w-48 h-48 bg-pink-500/20 rounded-full blur-[80px]" />
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-blue-500/20 rounded-full blur-[80px]" />

          <div className="p-8 relative z-10 flex flex-col gap-6">
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-md mb-1">
                    {isUser ? (user?.wechatNickname || user?.name || 'ME') : (friend.alias || friend.name)}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-white/70 tracking-[0.2em] font-black uppercase mb-4">
                     <Clock size={10} className="text-white/60" />
                     {currentDate} • PAGE {roundNum}
                  </div>
                  <ActionButtons className="mb-4" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
                    <div className="flex flex-col">
                      <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">Current Status</span>
                      <span className="text-[11px] text-white/90 font-bold italic">此时此刻正在想念你</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                    <div className="flex flex-col">
                      <span className="text-[8px] text-white/40 font-black uppercase tracking-widest">Outfit</span>
                      <span className="text-[11px] text-white/90 font-bold italic">简约白色衬衫与浅色牛仔裤</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <div className="w-24 h-24 rounded-3xl border-2 border-white/50 overflow-hidden shadow-2xl bg-white/20 transform rotate-3">
                   <img src={isUser ? (user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.name || 'user'}`) : friend.avatar} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {!isUser && message.innerMonologue && (
              <div className="bg-white/10 rounded-2xl p-4 border border-white/20 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-white/50 uppercase tracking-[0.3em]">
                  <Sparkles size={10} className="text-pink-300" /> CHARACTER REFLECTION
                </div>
                <div className="text-xs text-white/80 italic leading-relaxed font-medium">
                  {message.innerMonologue}
                </div>
              </div>
            )}

            <div className="bg-black/15 rounded-[32px] p-6 md:p-8 border border-white/10 shadow-inner">
              {isEditing ? renderEditForm() : (
                <div className="text-white/95 leading-loose text-base tracking-wide font-serif text-justify selection:bg-pink-500/30">
                  {parseNovelFormat(message.content)}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-[9px] font-black text-white/40 tracking-[0.4em] uppercase">
               <span>OFFLINE_DOSSIER // {isUser ? 'USER_INPUT' : 'CHAR_PLOT'}</span>
               <span>ROUND {roundNum}</span>
            </div>
          </div>
        </div>
      </ThemeCard>
    );
  }

  // Time Card Theme (Large Clock + Polaroid Avatar Full Width)
  if (theme === 'time') {
    return (
      <ThemeCard>
        <div className="bg-[#0A0A0A] text-slate-100 rounded-[40px] shadow-2xl max-w-2xl mx-auto w-full relative overflow-hidden border border-white/5">
           <div className="py-12 flex flex-col items-center justify-center bg-gradient-to-b from-white/10 to-transparent relative">
              <div className="text-7xl md:text-8xl font-black tracking-tighter text-white font-mono opacity-95 drop-shadow-[0_10px_20px_rgba(255,255,255,0.1)]">
                 {currentDate.split(' ')[1]}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20" />
                <span className="text-[10px] font-black tracking-[0.6em] text-white/40 uppercase">{currentDate.split(' ')[0]}</span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20" />
              </div>
           </div>

           <div className="px-6 -mt-2 mb-8">
              <div className="bg-white p-4 pb-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-sm transform rotate-1 relative z-10 mx-auto w-full">
                 <div className="w-full aspect-[16/9] bg-slate-900 overflow-hidden relative rounded-[2px]">
                    <img 
                      src={isUser ? (user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=user`) : friend.avatar} 
                      className="w-full h-full object-cover opacity-90 contrast-110 brightness-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                       <MapPin size={14} className="text-white" />
                       <span className="text-[11px] text-white font-black tracking-widest uppercase drop-shadow-md">{friend.address || 'CURRENT LOCATION'}</span>
                    </div>
                 </div>
                 <div className="absolute bottom-4 right-6 flex flex-col items-end">
                    <span className="text-xl font-black text-slate-800 italic tracking-tighter">
                      {isUser ? (user?.wechatNickname || user?.name || 'ME') : (friend.alias || friend.name)}
                    </span>
                    <ActionButtons />
                 </div>
              </div>
           </div>

           <div className="px-8 md:px-12 py-10 pt-4">
              <div className="mb-8 flex items-center gap-4">
                 <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                 <div className="flex items-center gap-2 px-4 py-1 bg-white/5 rounded-full border border-white/10">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] italic">
                     FRAGMENT {roundNum}
                   </span>
                 </div>
                 <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {!isUser && message.innerMonologue && (
                <div className="mb-8 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <div className="text-xs text-white/50 italic font-medium leading-relaxed text-center">
                    "{message.innerMonologue}"
                  </div>
                </div>
              )}

              {isEditing ? renderEditForm() : (
                <div className="text-white/90 leading-loose text-lg tracking-wide font-serif text-justify drop-shadow-md">
                   {parseNovelFormat(message.content)}
                </div>
              )}
           </div>

           <div className="py-6 px-10 text-[9px] font-mono text-white/10 tracking-[0.8em] uppercase text-center border-t border-white/5 bg-white/[0.01]">
              TEMPORAL FRAGMENT // REALITY SYNCHRONIZED
           </div>
        </div>
      </ThemeCard>
    );
  }

  // Classic / Magazine Theme (Fallback)
  return (
    <ThemeCard>
      <div 
        className={cn(
          "bg-[#FAF7F2] text-stone-800 p-5 md:p-6 rounded-[32px] border-[3px] border-[#E2D9C5] shadow-lg max-w-2xl mx-auto w-full relative font-sans overflow-hidden",
          "hover:shadow-xl transition-all duration-300"
        )}
      >
        <div className="absolute inset-2 border border-dashed border-[#D6CBB3]/65 rounded-[24px] pointer-events-none z-0" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-4 border-b border-[#E2D9C5] pb-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="font-serif italic text-[#8B5A2B] text-xs md:text-sm font-bold tracking-wide leading-tight pr-4">
                {isUser ? (BEAUTIFUL_USER_SIGNATURES[roundNum % BEAUTIFUL_USER_SIGNATURES.length]) : (BEAUTIFUL_SIGNATURES[roundNum % BEAUTIFUL_SIGNATURES.length])}
              </div>
              <div className="border-2 border-[#E2D9C5] bg-[#FCFAF7] rounded-xl px-3 py-2 flex flex-wrap items-center gap-3 text-[10px] md:text-xs font-mono text-[#5C4033] w-fit">
                <div className="flex items-center gap-1">
                  <Smile size={12} className="text-amber-600" />
                  <span className="font-bold">{isUser ? '我的心情: 嘴角上扬' : '心情: 有点小开心'}</span>
                </div>
                <div className="w-[1px] h-3 bg-[#E2D9C5]" />
                <div className="flex items-center gap-1">
                  <Calendar size={12} className="text-amber-600" />
                  <span>{currentDate}</span>
                </div>
                <div className="w-[1px] h-3 bg-[#E2D9C5]" />
                <span className="bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.5 rounded text-[9px]">PAGE {roundNum}</span>
              </div>
            </div>

            <div className="flex flex-col items-center shrink-0 gap-1">
              <div className="w-14 h-14 rounded-full border-2 border-[#D6CBB3] overflow-hidden bg-white shadow-md">
                <img src={isUser ? (user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=user`) : friend.avatar} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-extrabold text-[#5C4033] bg-[#E2D9C5]/40 px-2 py-0.5 rounded-full border border-[#E2D9C5]/65">
                  {isUser ? (user?.wechatNickname || user?.name || '我') : (friend.alias || friend.name)}
                </span>
                <ActionButtons />
              </div>
            </div>
          </div>

          <div className="border border-[#E2D9C5]/70 bg-[#FCFAF7]/90 rounded-2xl p-5 shadow-inner min-h-[140px]">
            {isEditing ? renderEditForm() : (
              <div className="space-y-1 select-text">
                {parseNovelFormat(message.content)}
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeCard>
  );
};
