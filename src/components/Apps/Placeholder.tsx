import React from 'react';
import { ChevronLeft, Construction } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { cn } from '../../lib/utils';

export default function PlaceholderApp({ name, onBack }: { name: string; onBack: () => void }) {
  const { settings } = useSettings();
  const isRainy = settings.themeId === 'rainy-cat';

  return (
    <div className={cn(
      "flex flex-col h-full transition-all duration-500",
      isRainy ? "bg-black/20 backdrop-blur-xl text-white" : "bg-white"
    )}>
      <div className={cn(
        "border-b px-4 py-3 flex items-center gap-3",
        isRainy ? "bg-white/10 backdrop-blur-md border-white/10" : "bg-white border-slate-100"
      )}>
        <button onClick={onBack} className={cn(
          "p-1 rounded-full transition-colors",
          isRainy ? "hover:bg-white/10" : "hover:bg-slate-100"
        )}>
          <ChevronLeft size={24} />
        </button>
        <span className={cn(
          "font-bold",
          isRainy ? "text-white" : "text-slate-800"
        )}>{name}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className={cn(
          "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500",
          isRainy ? "bg-white/10 backdrop-blur-md text-white/40 border border-white/10" : "bg-slate-100 text-slate-400"
        )}>
          <Construction size={40} />
        </div>
        <div className="space-y-2">
          <h2 className={cn(
            "text-xl font-bold transition-colors",
            isRainy ? "text-white" : "text-slate-800"
          )}>{name} 正在开发中</h2>
          <p className={cn(
            "text-sm transition-colors",
            isRainy ? "text-white/60" : "text-slate-500"
          )}>
            这个功能模块即将上线，敬请期待！
          </p>
        </div>
        <button
          onClick={onBack}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-300",
            isRainy 
              ? "bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/20" 
              : "bg-slate-800 text-white hover:bg-slate-700"
          )}
        >
          返回主页
        </button>
      </div>
    </div>
  );
}
