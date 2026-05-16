import React from 'react';
import { cn } from '../../lib/utils';
import { Sparkles, MapPin, Camera } from 'lucide-react';

interface CCDPhotoCardProps {
  content: string;
  location?: string;
  date?: string;
  timeLabel?: string;
  metadata?: {
    location: string;
    date: string;
    timeLabel: string;
  };
  className?: string;
  isDark?: boolean;
  backgroundImage?: string;
  title?: string;
  showCameraIcon?: boolean;
}

export const CCDPhotoCard: React.FC<CCDPhotoCardProps> = ({ 
  content, 
  location,
  date,
  timeLabel,
  metadata, 
  className,
  isDark = false,
  backgroundImage,
  title,
  showCameraIcon = false
}) => {
  // Fallback metadata
  const now = new Date();
  const defaultLocation = "深圳";
  const defaultDate = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.');
  
  const getHourLabel = (date: Date) => {
    const hour = date.getHours();
    if (hour < 6) return "凌晨";
    if (hour < 9) return "清晨";
    if (hour < 12) return "上午";
    if (hour < 14) return "中午";
    if (hour < 17) return "下午";
    if (hour < 19) return "傍晚";
    return "深夜";
  };
  const defaultTimeLabel = getHourLabel(now);

  const displayLocation = location || metadata?.location || defaultLocation;
  const displayDate = date || metadata?.date || defaultDate;
  const displayTimeLabel = timeLabel || metadata?.timeLabel || defaultTimeLabel;

  return (
    <div className={cn(
      "relative group overflow-hidden transition-all duration-500",
      "bg-white p-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border-[10px] border-white ring-1 ring-black/5 rounded-[2px]",
      "w-[260px] aspect-[3/4] flex flex-col",
      className
    )}>
      {/* 3:4 Aspect Ratio Container */}
      <div className="relative flex-1 overflow-hidden bg-[#fafafa] shadow-[inset_0_4px_12px_rgba(0,0,0,0.08)] rounded-[1px] border border-black/5">
        {backgroundImage && (
          <img 
            src={backgroundImage} 
            className="absolute inset-0 w-full h-full object-cover opacity-100" 
            alt="background"
            referrerPolicy="no-referrer"
          />
        )}

        <div className="absolute inset-0 p-5 overflow-y-auto z-10 no-scrollbar overscroll-contain touch-pan-y">
          {(title || showCameraIcon) && (
            <div className="flex items-center gap-2 mb-3 shrink-0">
              {showCameraIcon && <Camera size={14} className="text-pink-500 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" />}
              {title && <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest" style={{ textShadow: '0 0 6px #fff, 0 0 10px #fff' }}>{title}</span>}
            </div>
          )}
          <p className={cn(
            "leading-[1.9] text-[13px] font-bold tracking-wider whitespace-pre-wrap pb-4",
            backgroundImage ? "text-slate-900" : "text-slate-700",
            !backgroundImage && "first-letter:text-xl first-letter:font-serif first-letter:text-pink-400 first-letter:mr-1"
          )} style={backgroundImage ? { textShadow: '0 0 4px #fff, 0 0 8px #fff, 0 0 12px #fff, 1px 1px 2px #fff' } : undefined}>
            {content}
          </p>
        </div>
      </div>

      {/* Retro Bottom Margin Metadata */}
      <div className="flex items-center justify-between mt-3 px-0.5 pb-2 relative z-0">
        <div className="flex items-center gap-1 opacity-10">
          <Sparkles size={10} className="text-pink-400" />
          <div className="w-4 h-[0.5px] bg-slate-400" />
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            <MapPin size={7} className="text-slate-300" />
            <span>{displayLocation}</span>
            <span className="mx-0.5 opacity-30">·</span>
            <span>{displayDate}</span>
          </div>
          <div className="text-[8px] font-serif italic text-pink-300 tracking-tighter mt-0.5 leading-none">
            {displayTimeLabel}
          </div>
        </div>
      </div>
    </div>
  );
};
