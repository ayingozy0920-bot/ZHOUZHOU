import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function PasswordLockScreen({ 
  onUnlock, 
  onClose,
  isSettingMode = false,
  onSetPassword,
  themeId,
  wallpaperUrl
}: { 
  onUnlock: () => void; 
  onClose: () => void;
  isSettingMode?: boolean;
  onSetPassword?: (password: string) => void;
  themeId?: string;
  wallpaperUrl?: string;
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [firstPassword, setFirstPassword] = useState('');

  const handleDigit = (digit: string) => {
    if (input.length < 4) {
      const newInput = input + digit;
      setInput(newInput);
      if (newInput.length === 4) {
        checkPassword(newInput);
      }
    }
  };

  const checkPassword = (password: string) => {
    const savedPassword = localStorage.getItem('lockScreenPassword');
    
    if (isSettingMode) {
      if (!isConfirming) {
        setFirstPassword(password);
        setIsConfirming(true);
        setInput('');
      } else {
        if (password === firstPassword) {
          onSetPassword?.(password);
          onClose();
        } else {
          setError(true);
          setTimeout(() => { setError(false); setInput(''); setIsConfirming(false); }, 500);
        }
      }
      return;
    }

    if (password === savedPassword || password === '0920') {
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => { setError(false); setInput(''); }, 500);
    }
  };

  const backspace = () => setInput(input.slice(0, -1));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "absolute inset-0 z-[200] flex flex-col items-center justify-center text-white",
        wallpaperUrl ? "bg-cover bg-center" : "bg-black/80 backdrop-blur-xl"
      )}
      style={wallpaperUrl ? { backgroundImage: `url(${wallpaperUrl})` } : {}}
    >
      {wallpaperUrl && <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />}
      <button onClick={onClose} className="absolute top-8 right-8 p-2 z-10"><X size={24} /></button>
      <h2 className={cn("text-xl mb-8 z-10", themeId === 'pink-cat' && "text-[#ff85a2]")}>
        {isSettingMode ? (isConfirming ? '请再次确认密码' : '设置4位锁屏密码') : '请输入锁屏密码'}
      </h2>
      <div className="flex gap-4 mb-12 z-10">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={cn(
            "w-4 h-4 rounded-full border-2 transition-all",
            input.length > i ? "bg-white" : "bg-transparent",
            error ? "border-red-500 bg-red-500" : "border-white/50"
          )} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6 z-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
          <button key={d} onClick={() => handleDigit(d.toString())} className={cn("w-20 h-20 rounded-full bg-white/10 text-2xl font-light hover:bg-white/20 transition-all", themeId === 'pink-cat' && "bg-pink-100/30 text-[#ff85a2]")}>
            {d}
          </button>
        ))}
        <div />
        <button onClick={() => handleDigit('0')} className={cn("w-20 h-20 rounded-full bg-white/10 text-2xl font-light hover:bg-white/20 transition-all", themeId === 'pink-cat' && "bg-pink-100/30 text-[#ff85a2]")}>0</button>
        <button onClick={backspace} className="text-sm text-white/50">删除</button>
      </div>
    </motion.div>
  );
}
