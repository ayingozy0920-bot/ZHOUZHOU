import React, { useState } from 'react';
import { ChevronLeft, Search, Check } from 'lucide-react';
import { Friend, AppSettings } from '../../types';
import { cn } from '../../lib/utils';

interface CreateGroupPageProps {
  friends: Friend[];
  onBack: () => void;
  onCreateGroup: (memberIds: string[], name?: string) => void;
  settings: AppSettings;
}

export const CreateGroupPage: React.FC<CreateGroupPageProps> = ({
  friends,
  onBack,
  onCreateGroup,
  settings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isNaming, setIsNaming] = useState(false);

  const filteredFriends = friends.filter(f => 
    !f.isBlocked && (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || (f.alias && f.alias.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDone = () => {
    if (selectedIds.length === 0) return;
    if (isNaming) {
      onCreateGroup(selectedIds, groupName.trim() || undefined);
    } else {
      setIsNaming(true);
    }
  };

  const isRainy = settings.themeId === 'rainy-cat';

  if (isNaming) {
    return (
      <div className={cn(
        "flex flex-col h-full transition-all duration-300",
        isRainy ? "bg-black/30 backdrop-blur-xl text-white" : "bg-[#f5f5f5] text-slate-800"
      )}>
        <div className={cn(
          "px-3 py-2 flex items-center justify-between border-b sticky top-0 z-10",
          isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
        )} style={settings.fullScreenMode ? { paddingTop: settings.hideStatusBar ? 'env(safe-area-inset-top)' : 'max(env(safe-area-inset-top), 44px)' } : {}}>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsNaming(false)} className="p-1 rounded-full hover:bg-slate-200/20">
              <ChevronLeft size={22} />
            </button>
            <span className="font-bold text-base">设置群聊名称</span>
          </div>
          <button 
            onClick={handleDone}
            className="px-4 py-1.5 bg-[#07c160] text-white rounded-lg text-sm font-medium hover:bg-[#06ad56] transition-all"
          >
            完成 ({selectedIds.length})
          </button>
        </div>

        <div className="p-4 flex-1">
          <div className={cn(
            "p-4 rounded-xl border",
            isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}>
            <label className="block text-xs font-medium text-slate-400 mb-2">群聊名称（可选）</label>
            <input 
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="请输入群聊名称，如：神仙打架局"
              className={cn(
                "w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all",
                isRainy ? "bg-white/10 border-white/20 text-white placeholder-white/30" : "bg-slate-50 border-slate-200 text-slate-800"
              )}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full transition-all duration-300 select-none",
      isRainy ? "bg-black/30 backdrop-blur-xl text-white" : "bg-[#f5f5f5] text-slate-800"
    )}>
      {/* Top Bar */}
      <div className={cn(
        "px-3 py-2 flex items-center justify-between border-b sticky top-0 z-10",
        isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
      )} style={settings.fullScreenMode ? { paddingTop: settings.hideStatusBar ? 'env(safe-area-inset-top)' : 'max(env(safe-area-inset-top), 44px)' } : {}}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 rounded-full hover:bg-slate-200/20">
            <ChevronLeft size={22} />
          </button>
          <span className="font-bold text-base">发起群聊</span>
        </div>
        <button 
          onClick={handleDone}
          disabled={selectedIds.length === 0}
          className={cn(
            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
            selectedIds.length > 0 ? "bg-[#07c160] text-white hover:bg-[#06ad56]" : "bg-slate-200 text-slate-400 cursor-not-allowed"
          )}
        >
          完成 {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border",
          isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
        )}>
          <Search size={16} className="text-slate-400" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索"
            className="w-full bg-transparent text-sm outline-none placeholder-slate-400"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100/10">
        {filteredFriends.map(friend => {
          const isSelected = selectedIds.includes(friend.id);
          return (
            <div 
              key={friend.id}
              onClick={() => toggleSelect(friend.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                isRainy ? "hover:bg-white/5" : "hover:bg-slate-100"
              )}
            >
              {/* Checkbox */}
              <div className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                isSelected ? "bg-[#07c160] border-[#07c160] text-white" : "border-slate-300 bg-transparent"
              )}>
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>

              <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-lg object-cover bg-slate-200" />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm truncate block">{friend.alias || friend.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className={cn(
        "px-4 py-3 border-t flex items-center justify-between",
        isRainy ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
      )} style={settings.fullScreenMode ? { paddingBottom: 'env(safe-area-inset-bottom)' } : {}}>
        <button 
          onClick={() => {
            // share chat history stub or selection action
          }}
          className="text-[#07c160] text-sm font-medium hover:underline"
        >
          分享聊天记录
        </button>
        <button 
          onClick={handleDone}
          disabled={selectedIds.length === 0}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
            selectedIds.length > 0 ? "bg-[#07c160] text-white hover:bg-[#06ad56]" : "bg-slate-200 text-slate-400 cursor-not-allowed"
          )}
        >
          完成 {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
        </button>
      </div>
    </div>
  );
};
