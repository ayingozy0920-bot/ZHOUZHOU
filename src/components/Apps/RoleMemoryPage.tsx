import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Brain, BookOpen, History, MessageSquare, Sparkles } from 'lucide-react';
import { Friend, ChatMessage, OnlineMemoryEntry, OfflinePlotEntry } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RoleMemoryPageProps {
  friend: Friend;
  memory: {
    onlineMemories: OnlineMemoryEntry[];
    offlinePlots: OfflinePlotEntry[];
  };
  onBack: () => void;
}

export default function RoleMemoryPage({ friend, memory, onBack }: RoleMemoryPageProps) {
  const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');
  const [activeOnlineSubTab, setActiveOnlineSubTab] = useState<'chat' | 'weibo'>('chat');
  const [activeOfflineSubTab, setActiveOfflineSubTab] = useState<'summary' | 'logs'>('summary');
  const [selectedPlot, setSelectedPlot] = useState<OfflinePlotEntry | null>(null);
  const [selectedOnlineMemory, setSelectedOnlineMemory] = useState<OnlineMemoryEntry | null>(null);
  const [modalTab, setModalTab] = useState<'summary' | 'logs'>('summary');
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setModalRoot(document.getElementById('modal-root'));
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#FFF9F9] text-[#4A4A4A] font-sans">
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between sticky top-0 z-10 bg-[#FFF9F9]/80 backdrop-blur-md">
        <button onClick={onBack} className="p-2 hover:bg-pink-100 rounded-full transition-colors">
          <ChevronLeft size={24} className="text-pink-400" />
        </button>
        <h1 className="text-lg font-bold text-pink-500">{friend?.name ?? '未知角色'} 的记忆库</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Tabs */}
      <div className="px-6 py-2">
        <div className="bg-white/50 p-1 rounded-2xl flex shadow-sm border border-pink-50">
          <button
            onClick={() => setActiveTab('online')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
              activeTab === 'online' ? "bg-pink-400 text-white shadow-md" : "text-pink-300"
            )}
          >
            <Sparkles size={16} /> 线上记忆
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2",
              activeTab === 'offline' ? "bg-pink-400 text-white shadow-md" : "text-pink-300"
            )}
          >
            <BookOpen size={16} /> 线下记忆
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          {activeTab === 'online' ? (
            <motion.div
              key="online"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Online Sub-tabs */}
              <div className="flex border-b border-pink-100 mb-4">
                <button
                  onClick={() => setActiveOnlineSubTab('chat')}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold transition-all relative",
                    activeOnlineSubTab === 'chat' ? "text-pink-500" : "text-slate-300"
                  )}
                >
                  聊天App
                  {activeOnlineSubTab === 'chat' && (
                    <motion.div layoutId="online-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveOnlineSubTab('weibo')}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold transition-all relative",
                    activeOnlineSubTab === 'weibo' ? "text-pink-500" : "text-slate-300"
                  )}
                >
                  微博App
                  {activeOnlineSubTab === 'weibo' && (
                    <motion.div layoutId="online-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
                  )}
                </button>
              </div>

              {memory.onlineMemories.filter(m => activeOnlineSubTab === 'weibo' ? m.source === 'weibo' : (m.source === 'chat' || !m.source)).length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto">
                    <Brain size={40} className="text-pink-200" />
                  </div>
                  <p className="text-sm text-pink-300">还没有产生{activeOnlineSubTab === 'chat' ? '聊天' : '微博'}记忆哦~</p>
                </div>
              ) : (
                memory.onlineMemories
                  .filter(m => activeOnlineSubTab === 'weibo' ? m.source === 'weibo' : (m.source === 'chat' || !m.source))
                  .map((entry) => (
                  <div 
                    key={entry.id} 
                    onClick={() => setSelectedOnlineMemory(entry)}
                    className="bg-white p-4 rounded-3xl shadow-sm border border-pink-50 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-pink-200" />
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                        entry.type === 'auto' ? "bg-blue-50 text-blue-400" : "bg-purple-50 text-purple-400"
                      )}>
                        {entry.type === 'auto' ? '自动总结' : '手动总结'}
                      </span>
                      <span className="text-[10px] text-slate-300">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600 line-clamp-3 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="offline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              {/* Offline Sub-tabs */}
              <div className="flex border-b border-pink-100 mb-4">
                <button
                  onClick={() => setActiveOfflineSubTab('summary')}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold transition-all relative",
                    activeOfflineSubTab === 'summary' ? "text-pink-500" : "text-slate-300"
                  )}
                >
                  剧情总结
                  {activeOfflineSubTab === 'summary' && (
                    <motion.div layoutId="offline-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
                  )}
                </button>
                <button
                  onClick={() => setActiveOfflineSubTab('logs')}
                  className={cn(
                    "flex-1 py-2 text-sm font-bold transition-all relative",
                    activeOfflineSubTab === 'logs' ? "text-pink-500" : "text-slate-300"
                  )}
                >
                  完整聊天记录
                  {activeOfflineSubTab === 'logs' && (
                    <motion.div layoutId="offline-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />
                  )}
                </button>
              </div>

              {memory.offlinePlots.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto">
                    <History size={40} className="text-pink-200" />
                  </div>
                  <p className="text-sm text-pink-300">还没有线下剧情记录哦~</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {memory.offlinePlots.map((plot) => (
                    <div 
                      key={plot.id} 
                      onClick={() => {
                        setSelectedPlot(plot);
                        setModalTab(activeOfflineSubTab);
                      }}
                      className="bg-white p-4 rounded-3xl shadow-sm border border-pink-50 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <div className={cn(
                        "absolute top-0 left-0 w-1 h-full",
                        activeOfflineSubTab === 'summary' ? "bg-pink-400" : "bg-blue-400"
                      )} />
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-700 text-sm whitespace-normal break-all leading-snug flex-1 mr-2">{plot.title || '未命名剧情'}</h4>
                        <span className="text-[10px] text-slate-300 shrink-0">
                          {new Date(plot.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600 line-clamp-3 whitespace-pre-wrap">
                        {activeOfflineSubTab === 'summary' ? plot.summary : (plot.logs[plot.logs.length - 1]?.content || '无内容')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Plot Detail Modal */}
      {modalRoot && createPortal(
        <AnimatePresence>
          {selectedPlot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 pointer-events-auto overflow-y-auto pt-16 sm:pt-6"
            >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFF9F9] w-full max-w-lg h-[80vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative my-auto"
            >
              <div className="p-6 flex items-center justify-between border-b border-pink-50">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setModalTab('summary')}
                    className={cn(
                      "text-sm font-bold transition-all relative pb-1",
                      modalTab === 'summary' ? "text-pink-500" : "text-slate-300"
                    )}
                  >
                    剧情总结
                    {modalTab === 'summary' && <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />}
                  </button>
                  <button 
                    onClick={() => setModalTab('logs')}
                    className={cn(
                      "text-sm font-bold transition-all relative pb-1",
                      modalTab === 'logs' ? "text-pink-500" : "text-slate-300"
                    )}
                  >
                    完整记录
                    {modalTab === 'logs' && <motion.div layoutId="modal-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500" />}
                  </button>
                </div>
                <button 
                  onClick={() => setSelectedPlot(null)}
                  className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-pink-400"
                >
                  <ChevronLeft size={24} className="rotate-[-90deg]" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {modalTab === 'summary' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-pink-400 mb-2">
                      <Sparkles size={18} />
                      <span className="font-bold text-sm">剧情总结内容</span>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-pink-50 leading-relaxed text-slate-600 text-sm whitespace-pre-wrap">
                      {selectedPlot.summary}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-pink-400 mb-2">
                      <MessageSquare size={18} />
                      <span className="font-bold text-sm">完整对话</span>
                    </div>
                    {selectedPlot.logs.map((msg, i) => (
                      <div key={i} className={cn(
                        "flex flex-col gap-1",
                        msg.role === 'user' ? "items-end" : "items-start"
                      )}>
                        <span className="text-[10px] text-slate-300 px-2">
                          {msg.role === 'user' ? '我' : friend.name}
                        </span>
                        <div className={cn(
                          "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                          msg.role === 'user' ? "bg-pink-400 text-white rounded-tr-none" : "bg-white text-slate-600 rounded-tl-none border border-pink-50"
                        )}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        modalRoot
      )}

      {/* Online Memory Detail Modal */}
      {modalRoot && createPortal(
        <AnimatePresence>
          {selectedOnlineMemory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 pointer-events-auto overflow-y-auto pt-16 sm:pt-6"
            >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#FFF9F9] w-full max-w-lg h-[80vh] rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative my-auto"
            >
              <div className="p-6 flex items-center justify-between border-b border-pink-50">
                <h3 className="font-bold text-pink-500 truncate pr-4">线上记忆详情</h3>
                <button 
                  onClick={() => setSelectedOnlineMemory(null)}
                  className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-pink-400"
                >
                  <ChevronLeft size={24} className="rotate-[-90deg]" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-pink-400 mb-2">
                    <Sparkles size={18} />
                    <span className="font-bold text-sm">记忆总结内容</span>
                  </div>
                  <div className="bg-white p-6 rounded-[32px] shadow-sm border border-pink-50 leading-relaxed text-slate-600 text-sm whitespace-pre-wrap">
                    {selectedOnlineMemory.content}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
        modalRoot
      )}
    </div>
  );
}
