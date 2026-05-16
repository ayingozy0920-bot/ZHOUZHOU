import React, { useState } from 'react';
import { ChevronLeft, MoreVertical, X } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { AppSettings, Friend } from '../../../types';
import { motion } from 'motion/react';
import { useFriends } from '../../../hooks/useFriends';

interface Props {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onBack: () => void;
  onSelectFriend: (friend: Friend) => void;
}

export default function DiaryHome({ settings, onSave, onBack, onSelectFriend }: Props) {
  const { friends, updateFriend } = useFriends();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [newSignature, setNewSignature] = useState('');
  const isRainy = settings.themeId === 'rainy-cat';

  const handleSaveSignature = () => {
    if (selectedFriendId) {
      updateFriend(selectedFriendId, { persona: newSignature });
      setShowSettings(false);
    }
  };

  return (
    <div className={cn("h-full flex flex-col relative", isRainy ? "bg-black/20 text-white" : "bg-pink-50")}>
      <div className="px-6 py-4 flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full"><ChevronLeft size={24} /></button>
        <h2 className="font-bold text-lg">心动日记</h2>
        <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-black/5 rounded-full"><MoreVertical size={24} /></button>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-pink-300 opacity-50 font-serif text-4xl rotate-12">love</div>
      <div className="absolute bottom-20 right-10 text-blue-300 opacity-50 font-serif text-4xl -rotate-12">ins</div>
      
      {/* Cat and Rabbit Line Art */}
      <div className="absolute top-10 right-6 text-pink-400 opacity-60">
        {/* Simplified Cat Icon */}
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10c0-3-2-5-6-5s-6 2-6 5c0 2 1 3 2 4s1 2 1 4h8c0-2 1-3 2-4s2-1 2-4z" />
          <path d="M8 5L6 2M16 5L18 2" />
          <path d="M9 10h.01M15 10h.01" />
        </svg>
      </div>
      <div className="absolute bottom-10 left-6 text-blue-400 opacity-60">
        {/* Simplified Rabbit Icon */}
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4c-2 0-3 1-3 3v4c0 2 1 3 3 3s3-1 3-3V7c0-2-1-3-3-3z" />
          <path d="M9 4L7 1M15 4L17 1" />
          <path d="M10 9h.01M14 9h.01" />
          <path d="M12 12c-1 0-2 1-2 2h4c0-1-1-2-2-2z" />
        </svg>
      </div>

      <div className="flex-1 overflow-hidden relative flex items-center">
        <motion.div 
          className="flex gap-6 px-6"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        >
          {[...friends, ...friends].map((friend, index) => (
            <button 
              key={`${friend.id}-${index}`}
              onClick={() => onSelectFriend(friend)}
              className="flex flex-col items-center gap-3 min-w-[200px] p-4 bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 transition-transform hover:scale-105"
            >
              <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-md">
                <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex flex-col items-center gap-1 w-full">
                <span className="text-base font-bold text-pink-500">{friend.name}</span>
                <span className="text-xs text-slate-500 italic text-center line-clamp-2 px-2">{friend.persona}</span>
              </div>
            </button>
          ))}
        </motion.div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-slate-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">自定义签名</h3>
              <button onClick={() => setShowSettings(false)}><X size={20} /></button>
            </div>
            <select 
              onChange={(e) => setSelectedFriendId(e.target.value)}
              className="w-full p-2 mb-4 border rounded-lg"
            >
              <option value="">选择角色</option>
              {friends.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <textarea 
              value={newSignature} 
              onChange={(e) => setNewSignature(e.target.value)}
              className="w-full h-24 p-2 border rounded-lg mb-4"
              placeholder="输入个性签名..."
            />
            <button onClick={handleSaveSignature} className="w-full py-2 bg-pink-400 text-white rounded-lg">保存</button>
          </div>
        </div>
      )}
    </div>
  );
}
