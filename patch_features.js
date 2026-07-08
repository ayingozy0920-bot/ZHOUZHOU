import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldFeatures = `                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                    isRainy ? "bg-white/10" : "bg-white"
                  )}>
                    <Gift size={22} className="text-[#fa5151]" />
                  </div>
                  <span className="text-[10px] opacity-70">发红包</span>
                </button>`;

const newFeatures = oldFeatures + `
                <button
                  onClick={() => {
                    setShowOpeningModal(true);
                    setShowFeatures(false);
                  }}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                    isRainy ? "bg-white/10" : "bg-white"
                  )}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8a2be2]"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                  </div>
                  <span className="text-[10px] opacity-70">开场白</span>
                </button>`;

if (content.includes(oldFeatures)) {
  content = content.replace(oldFeatures, newFeatures);
  fs.writeFileSync(file, content);
  console.log('Successfully patched features');
} else {
  console.log('Failed to find oldFeatures');
}
