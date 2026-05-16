import React from 'react';
import { cn } from '../../lib/utils';
import { Heart, Play, SkipBack, SkipForward, Music } from 'lucide-react';

export function CatBattery({ level }: { level: number }) {
  return (
    <div className="relative flex items-center gap-2 group">
      <div className="relative w-10 h-5 bg-pink-100/50 backdrop-blur-md rounded-lg overflow-hidden border border-pink-200">
        <div 
          className="h-full bg-pink-300/60 transition-all duration-500" 
          style={{ width: `${level}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
           <span className="text-[8px] font-bold text-pink-900/80">{level}%</span>
        </div>
      </div>
    </div>
  );
}

export function CatTime({ time }: { time: Date }) {
  return (
    <div className="relative flex flex-col items-center">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-pink-900/80 tracking-widest">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      </div>
    </div>
  );
}

export function CatProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative w-full h-1.5 bg-pink-100/50 backdrop-blur-md rounded-full overflow-hidden border border-pink-200">
      <div 
        className="h-full bg-pink-300/60 transition-all duration-500 relative"
        style={{ width: `${progress}%` }}
      >
        {/* Cat Paw at the end of progress */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-pink-400/60 rounded-full shadow-sm" />
      </div>
    </div>
  );
}

export function CatBubble({ children, isUser }: { children: React.ReactNode; isUser: boolean }) {
  return (
    <div className={cn(
      "relative max-w-[85%] p-4 rounded-[24px] backdrop-blur-xl border transition-all shadow-sm",
      isUser 
        ? "bg-pink-200/50 border-pink-300/50 rounded-tr-none ml-auto text-pink-900" 
        : "bg-white/60 border-pink-100 rounded-tl-none mr-auto text-pink-800"
    )}>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function CatMusicPlayer() {
  return (
    <div className="w-full bg-pink-100/50 backdrop-blur-2xl rounded-[32px] p-4 border border-pink-200 flex items-center gap-4 shadow-2xl">
      <div className="relative w-16 h-16 rounded-full bg-pink-200 flex items-center justify-center border-4 border-pink-300/20 animate-spin-slow">
        <div className="w-12 h-12 rounded-full border border-pink-300/20 flex items-center justify-center overflow-hidden">
           <img src="https://picsum.photos/seed/cat/100/100" className="w-full h-full object-cover opacity-60" />
        </div>
        <div className="absolute w-2 h-2 bg-pink-300/20 rounded-full" />
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <p className="text-xs font-bold text-pink-900/80 truncate">耳机里播放电子止痛药</p>
            <p className="text-[10px] text-pink-900/40 truncate">猫咪电台</p>
          </div>
          <Heart size={14} className="text-pink-900/40" />
        </div>
        
        <div className="space-y-1">
          <div className="h-1 bg-pink-200/50 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-pink-300/60" />
          </div>
          <div className="flex justify-between text-[8px] text-pink-900/30">
            <span>01:23</span>
            <span>03:45</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <SkipBack size={16} className="text-pink-900/40" />
          <div className="w-8 h-8 rounded-full bg-pink-200/50 flex items-center justify-center">
            <Play size={16} className="text-pink-900/80 fill-pink-900/20" />
          </div>
          <SkipForward size={16} className="text-pink-900/40" />
        </div>
      </div>
    </div>
  );
}
