import React, { useState, useMemo } from 'react';
import { ChevronLeft, Brain, Sparkles, Heart } from 'lucide-react';
import { Friend, AppSettings } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useMemory } from '../../hooks/useMemory';
import RoleMemoryPage from './RoleMemoryPage';

interface MemoryAppProps {
  friends: Friend[];
  settings: AppSettings;
  onBack: () => void;
}

export default function MemoryApp({ friends, settings, onBack }: MemoryAppProps) {
  const { getFriendMemory } = useMemory();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  // Use only friends from main chat app
  const allRoles = useMemo(() => {
    return friends.map(f => ({ ...f, type: 'friend' as const }));
  }, [friends]);

  const selectedFriend = allRoles.find(f => f.id === selectedFriendId);

  if (selectedFriend) {
    return (
      <RoleMemoryPage
        friend={selectedFriend as unknown as Friend}
        memory={getFriendMemory(selectedFriend.id)}
        onBack={() => setSelectedFriendId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#FFF9F9] text-[#4A4A4A] font-sans overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-pink-100/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-pink-100/30 rounded-full blur-3xl animate-pulse" />

      {/* Header */}
      <div className="px-6 pt-12 pb-6 flex flex-col items-center gap-2 relative z-10">
        <div className="w-full flex justify-between items-center mb-4">
          <button onClick={onBack} className="p-2 hover:bg-pink-100 rounded-full transition-colors">
            <ChevronLeft size={24} className="text-pink-400" />
          </button>
          <div className="w-10" />
        </div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-4xl font-black text-pink-500 tracking-tighter mb-1">记忆库</h1>
          <div className="flex items-center gap-2">
            <div className="h-[1px] w-8 bg-pink-200" />
            <span className="text-xs font-bold text-pink-300 tracking-[0.2em]">温馨回忆</span>
            <div className="h-[1px] w-8 bg-pink-200" />
          </div>
        </motion.div>
      </div>

      {/* Grid of Characters */}
      <div className="flex-1 overflow-y-auto px-6 pb-10 relative z-10">
        <div className="grid grid-cols-2 gap-6">
          {allRoles.map((friend, i) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedFriendId(friend.id)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden shadow-xl shadow-pink-100/50 bg-white p-2 border-4 border-white">
                {/* Floating Effect Background */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, 0]
                  }}
                  transition={{ 
                    duration: 5, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-br from-pink-50 to-white opacity-50" 
                />
                
                <img 
                  src={friend?.avatar} 
                  alt={friend?.name ?? '未知角色'}
                  className="w-full h-full object-cover rounded-[32px] relative z-10"
                />
                
                {/* Overlay with Name */}
                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/20 to-transparent z-20">
                  <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-sm inline-flex items-center gap-1.5">
                    <Heart size={10} className="text-pink-400 fill-pink-400" />
                    <span className="text-[10px] font-black text-slate-700 truncate max-w-[60px]">{friend?.name ?? '未知角色'}</span>
                  </div>
                </div>

                {/* Sparkle Effects */}
                <motion.div
                  animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  className="absolute top-4 right-4 z-30 text-pink-300"
                >
                  <Sparkles size={16} />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
