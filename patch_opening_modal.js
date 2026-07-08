import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const anchor = `{showRedPacketModal && (`;
const modal = `        {showOpeningModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
            <motion.div 
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <button onClick={() => setShowOpeningModal(false)} className="px-3 py-1 text-slate-500 font-medium">取消</button>
                <div className="font-bold text-slate-800 dark:text-slate-200">生成开场白</div>
                <button 
                  onClick={handleSendOpening} 
                  className={cn("px-3 py-1 font-medium text-white rounded-full transition-colors", openingTitle.trim() && openingContent.trim() ? "bg-[#07c160]" : "bg-[#07c160]/50")}
                  disabled={!openingTitle.trim() || !openingContent.trim()}
                >发送</button>
              </div>
              <div className="p-5 flex flex-col gap-4">
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
              </div>
            </motion.div>
          </div>
        )}
        `;

if (content.includes(anchor)) {
  content = content.replace(anchor, modal + anchor);
  fs.writeFileSync(file, content);
  console.log('Successfully added modal');
} else {
  console.log('Failed to find anchor');
}
