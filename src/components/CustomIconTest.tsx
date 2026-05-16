// CustomIconFrame.tsx
import React from 'react';
import { cn } from '../lib/utils';

export const CustomIconFrame = ({ icon: Icon, color, className, name }: { icon: any, color: string, className?: string, name: string }) => {
  return (
    <div className={cn("flex flex-col items-center gap-1 w-full h-full pt-1", className)}>
      <div className="relative w-[68px] h-[68px] flex items-center justify-center">
        {/* Hanger/Handle decoration */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 border-2 border-slate-400 rounded-t-full border-b-0 z-0" />
        
        {/* Icon Frame */}
        <div className={cn(
          "relative w-[50px] h-[50px] rounded-[15px] flex items-center justify-center z-10 overflow-hidden shadow-md",
          color
        )}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <span className="text-[10px] font-medium drop-shadow-md truncate w-full text-center mt-1 text-white">
        {name}
      </span>
    </div>
  );
};
