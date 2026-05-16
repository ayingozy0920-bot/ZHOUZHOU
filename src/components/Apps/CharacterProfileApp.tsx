import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, MoreVertical, Plus, Image as ImageIcon, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AppSettings, CharacterProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useFriends } from '../../hooks/useFriends';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onBack: () => void;
}

const DEFAULT_PROFILE: CharacterProfile = {
  id: '',
  avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  name: '新角色',
  gender: '女',
  persona: '输入人设资料...',
  experience: '输入个人经历...',
  background: '输入成长背景...',
  relationship: '输入和user的关系...',
};

export default function CharacterProfileApp({ settings, onSave, onBack }: Props) {
  const { friends, updateFriend } = useFriends();
  const profiles = settings.characterProfiles || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<CharacterProfile | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const currentProfile = profiles[currentIndex] || DEFAULT_PROFILE;

  const handleDragEnd = (event: any, info: any) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleAdd = () => {
    const newProfile = { ...DEFAULT_PROFILE, id: Date.now().toString() };
    setEditForm(newProfile);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleEdit = () => {
    setEditForm(currentProfile);
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (profiles.length === 0) return;
    const newProfiles = profiles.filter((_, i) => i !== currentIndex);
    onSave({ ...settings, characterProfiles: newProfiles });
    setCurrentIndex(Math.max(0, currentIndex - 1));
    setShowMenu(false);
  };

  const generateWechatId = (name: string) => {
    // Basic pinyin approximation for common characters - using just the latin chars if present, or initials
    const luckyNumbers = ['6', '8', '9'];
    const randomDigits = Array.from({ length: 4 }, () => luckyNumbers[Math.floor(Math.random() * luckyNumbers.length)]).join('');
    
    // Simple logic to extract "initials" - if it's alphanumeric, take first 3 chars. 
    // If it's Chinese, we can't easily get pinyin without a library, so we use placeholders or just 'wx' prefix if no latin chars.
    let prefix = name
      .split('')
      .filter(char => /[a-zA-Z0-9]/.test(char))
      .join('')
      .toLowerCase();
    
    if (!prefix) {
      // Fallback for purely Chinese names if no pinyin library: use a generic prefix or try to represent it
      prefix = 'id'; 
    }
    
    return `${prefix.slice(0, 3)}_${randomDigits}`;
  };

  const handleSave = () => {
    if (!editForm) return;
    let newProfiles = [...profiles];
    if (editForm.id) {
      const index = newProfiles.findIndex(p => p.id === editForm.id);
      if (index >= 0) {
        newProfiles[index] = editForm;
      } else {
        newProfiles.push(editForm);
        setCurrentIndex(newProfiles.length - 1);
      }
      
      // Sync to friends
      const linkedFriends = friends.filter(f => f.profileId === editForm.id);
      linkedFriends.forEach(friend => {
        updateFriend(friend.id, {
          name: editForm.name,
          avatar: editForm.avatarUrl,
          persona: `【人设资料】\n${editForm.persona}\n\n【个人经历】\n${editForm.experience}\n\n【成长背景】\n${editForm.background}\n\n【和user的关系】\n${editForm.relationship}`,
          gender: editForm.gender === '男' ? 'male' : editForm.gender === '女' ? 'female' : 'other',
          wechatId: friend.wechatId || generateWechatId(editForm.name)
        });
      });
    } else {
      editForm.id = Date.now().toString();
      newProfiles.push(editForm);
      setCurrentIndex(newProfiles.length - 1);
    }
    onSave({ ...settings, characterProfiles: newProfiles });
    setIsEditing(false);
    setEditForm(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditForm({ ...editForm, avatarUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderSection = (title: string, key: keyof CharacterProfile) => {
    const isExpanded = expandedSections[key];
    const content = isEditing ? editForm?.[key] : currentProfile[key];
    
    return (
      <div className="mb-4 relative">
        <div className="bg-[#FFF5F5] rounded-2xl p-4 border-2 border-[#FFE4E1] shadow-sm relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="bg-[#FFDAB9] text-[#8B4513] px-3 py-1 rounded-full text-sm font-bold shadow-sm border border-[#FFE4E1]">
              {title}
            </div>
            {!isEditing && (
              <button 
                onClick={() => toggleSection(key)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#FFB6C1] shadow-sm border border-[#FFE4E1] hover:bg-[#FFF0F5] transition-colors"
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            )}
          </div>
          
          {isEditing ? (
            <textarea
              value={content as string}
              onChange={(e) => setEditForm(prev => prev ? { ...prev, [key]: e.target.value } : null)}
              className="w-full bg-white/50 rounded-xl p-3 text-[#5C4033] text-sm border-none focus:ring-2 focus:ring-[#FFB6C1] outline-none min-h-[80px] resize-none"
              placeholder={`输入${title}...`}
            />
          ) : (
            <div className="text-[#5C4033] text-sm leading-relaxed px-1">
              {isExpanded ? (
                <div className="whitespace-pre-wrap">{content}</div>
              ) : (
                <div className="truncate text-[#8B4513]/70">{content}</div>
              )}
            </div>
          )}
        </div>
        {/* Decorative elements for the card */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-10 bg-[#FFE4E1] rounded-r-lg -z-10 border-y-2 border-r-2 border-[#FFC0CB]" />
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-4 h-6 bg-white rounded-full -z-10 shadow-inner" />
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[#FFFBF0] relative overflow-hidden font-sans">
      {/* Paper texture overlay */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />
      
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-white/40 backdrop-blur-md border-b border-[#FFE4E1]">
        <button onClick={onBack} className="p-2 text-[#8B4513] hover:bg-white/50 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <span className="font-bold text-[#8B4513] text-lg tracking-wider">角色资料</span>
        <div className="relative">
          {isEditing ? (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="p-2 text-red-400 hover:bg-white/50 rounded-full transition-colors">
                <X size={20} />
              </button>
              <button onClick={handleSave} className="p-2 text-green-500 hover:bg-white/50 rounded-full transition-colors">
                <Check size={20} />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-[#8B4513] hover:bg-white/50 rounded-full transition-colors">
              <MoreVertical size={20} />
            </button>
          )}

          {/* Menu */}
          <AnimatePresence>
            {showMenu && !isEditing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 top-full mt-2 w-32 bg-white rounded-2xl shadow-xl border border-[#FFE4E1] overflow-hidden z-50"
              >
                <button onClick={handleEdit} className="w-full px-4 py-3 text-left text-sm text-[#8B4513] hover:bg-[#FFF0F5] transition-colors border-b border-[#FFE4E1]">
                  编辑当前角色
                </button>
                <button onClick={handleAdd} className="w-full px-4 py-3 text-left text-sm text-[#8B4513] hover:bg-[#FFF0F5] transition-colors border-b border-[#FFE4E1]">
                  新增角色
                </button>
                <button onClick={handleDelete} className="w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50 transition-colors">
                  删除角色
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative z-10 flex">
        {/* Left binding / buttons */}
        <div className="w-12 border-r-2 border-[#FFE4E1] bg-white/20 flex flex-col items-center py-8 gap-12 relative z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="w-6 h-6 rounded-full bg-[#DEB887] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.1)] border-2 border-[#D2B48C] flex items-center justify-center relative">
               <div className="w-2 h-2 rounded-full bg-[#8B4513] opacity-80" />
               <div className="absolute w-8 h-[2px] bg-[#FFE4E1] -right-5 -z-10" />
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              drag={isEditing ? false : "x"}
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 overflow-y-auto p-6 pb-24 scroll-smooth"
              style={{ touchAction: 'pan-y' }}
            >
              {profiles.length === 0 && !isEditing ? (
            <div className="h-full flex flex-col items-center justify-center text-[#8B4513]/50">
              <div className="w-24 h-24 bg-[#FFF0F5] rounded-full flex items-center justify-center mb-4">
                <ImageIcon size={40} className="text-[#FFB6C1]" />
              </div>
              <p>还没有角色资料哦</p>
              <button 
                onClick={handleAdd}
                className="mt-4 px-6 py-2 bg-[#FFB6C1] text-white rounded-full shadow-md hover:bg-[#FFC0CB] transition-colors"
              >
                创建第一个角色
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto relative">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-8 relative">
                {/* Decorative stars/hearts */}
                <div className="absolute top-0 left-4 text-[#FFD700] text-xl rotate-12">✨</div>
                <div className="absolute top-10 right-4 text-[#FFB6C1] text-xl -rotate-12">❤️</div>
                
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full p-2 bg-white shadow-lg border-4 border-[#FFE4E1] relative z-10">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-dashed border-[#FFB6C1]">
                      <img 
                        src={isEditing ? editForm?.avatarUrl : currentProfile.avatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  {/* Lace border effect (simplified with CSS) */}
                  <div className="absolute -inset-4 border-[8px] border-dotted border-[#FFC0CB] rounded-full opacity-50 -z-10 animate-[spin_60s_linear_infinite]" />
                  
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <ImageIcon className="text-white" size={32} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>

                {/* Name & Gender */}
                <div className="mt-6 text-center relative">
                  <div className="flex items-center justify-center gap-4">
                    <div className="h-[2px] w-8 bg-[#8B4513] rounded-full" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm?.name || ''}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="text-2xl font-black text-[#8B4513] bg-transparent border-b-2 border-[#FFB6C1] text-center w-32 outline-none"
                        placeholder="姓名"
                      />
                    ) : (
                      <h2 className="text-3xl font-black text-[#8B4513] tracking-widest drop-shadow-sm" style={{ WebkitTextStroke: '1px white' }}>
                        {currentProfile.name}
                      </h2>
                    )}
                    <div className="h-[2px] w-8 bg-[#8B4513] rounded-full" />
                  </div>
                  
                  <div className="mt-3 inline-block">
                    {isEditing ? (
                      <select
                        value={editForm?.gender || '女'}
                        onChange={(e) => setEditForm(prev => prev ? { ...prev, gender: e.target.value } : null)}
                        className="px-4 py-1 bg-[#FFF0F5] border-2 border-[#FFB6C1] rounded-full text-[#8B4513] font-bold text-sm outline-none appearance-none text-center"
                      >
                        <option value="女">女</option>
                        <option value="男">男</option>
                        <option value="其他">其他</option>
                      </select>
                    ) : (
                      <div className="px-6 py-1 bg-[#FFF0F5] border-2 border-[#FFB6C1] rounded-full text-[#8B4513] font-bold text-sm shadow-sm">
                        {currentProfile.gender}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Sections */}
              <div className="space-y-6">
                {renderSection('人设资料', 'persona')}
                {renderSection('个人经历', 'experience')}
                {renderSection('成长背景', 'background')}
                {renderSection('和user的关系', 'relationship')}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  </div>

      {/* Paging Controls (only show when not editing and have multiple profiles) */}
      {!isEditing && profiles.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-30 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-[#FFE4E1]">
          <button 
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="p-2 text-[#8B4513] disabled:opacity-30 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-[#8B4513]">
            {currentIndex + 1} / {profiles.length}
          </span>
          <button 
            onClick={() => setCurrentIndex(prev => Math.min(profiles.length - 1, prev + 1))}
            disabled={currentIndex === profiles.length - 1}
            className="p-2 text-[#8B4513] disabled:opacity-30 transition-opacity rotate-180"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
