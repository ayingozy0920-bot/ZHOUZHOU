import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /                \{showOpeningModal && \([\s\S]*?        \{showRedPacketModal && \(/;

const modalContent = `        {showOpeningModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full sm:w-[400px] h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800 shrink-0">
                <button onClick={() => { setShowOpeningModal(false); setSelectedMemory(null); }} className="px-3 py-1 text-slate-500 font-medium">关闭</button>
                <div className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedMemory ? '记忆总结' : '开场白与记忆库'}
                </div>
                <div className="w-10"></div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                {selectedMemory ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="font-bold text-lg">{selectedMemory.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">{selectedMemory.dateStr}</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {selectedMemory.summary}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Active Opening */}
                    {group.activeOpening && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-2xl p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-sm">
                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                            当前演绎中
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="font-medium truncate mr-2">{group.activeOpening.title}</div>
                          <button
                            onClick={handleEndOpening}
                            disabled={isGeneratingSummary}
                            className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-bold hover:bg-purple-600 disabled:opacity-50 shrink-0"
                          >
                            {isGeneratingSummary ? '总结中...' : '结束演绎'}
                          </button>
                        </div>
                      </div>
                    )}

                    {!group.activeOpening && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">旁白模式</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">开启后，角色回复将包含动作旁白描述</div>
                          </div>
                          <button 
                            onClick={() => onUpdateGroup({ isNarrationMode: !group.isNarrationMode })}
                            className={cn(
                              "w-12 h-7 rounded-full p-1 transition-colors relative",
                              group.isNarrationMode ? "bg-[#07c160]" : "bg-slate-200 dark:bg-slate-700"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 bg-white rounded-full shadow-sm transition-transform",
                              group.isNarrationMode ? "translate-x-5" : "translate-x-0"
                            )} />
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 ml-1">标题</label>
                          <input 
                            type="text"
                            value={openingTitle}
                            onChange={e => setOpeningTitle(e.target.value)}
                            placeholder="如：第一场戏 / 下午茶时光"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#07c160]/30"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500 ml-1">正文</label>
                          <textarea 
                            value={openingContent}
                            onChange={e => setOpeningContent(e.target.value)}
                            placeholder="描述一下现在的场景..."
                            className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#07c160]/30 resize-none"
                          />
                        </div>
                        <button 
                          onClick={handleSendOpening} 
                          className={cn("w-full py-3 font-bold text-white rounded-xl transition-colors", openingTitle.trim() && openingContent.trim() ? "bg-[#07c160]" : "bg-[#07c160]/50")}
                          disabled={!openingTitle.trim() || !openingContent.trim()}
                        >
                          发送开场白
                        </button>
                      </div>
                    )}

                    {/* Memories List */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-500 mb-3">历史记忆库</h4>
                      {!group.openingMemories || group.openingMemories.length === 0 ? (
                        <div className="text-center py-6 text-sm text-slate-400">暂无演绎记录</div>
                      ) : (
                        <div className="space-y-2">
                          {[...group.openingMemories].reverse().map(memory => (
                            <div 
                              key={memory.id}
                              onClick={() => setSelectedMemory(memory)}
                              className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                              <div>
                                <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{memory.title}</div>
                                <div className="text-[10px] text-slate-400">{memory.dateStr}</div>
                              </div>
                              <button className="text-xs text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">查看</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
        {showRedPacketModal && (`;

if (regex.test(content)) {
  content = content.replace(regex, modalContent);
  fs.writeFileSync(file, content);
  console.log('patched modal using regex');
} else {
  console.log('regex failed to match');
}
