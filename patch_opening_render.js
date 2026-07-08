import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const anchor = `                {msg.isSystemNotification ? (
                  <div className="w-full text-center my-2">
                    <span className="inline-block px-3 py-1 bg-black/10 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] rounded-full">
                      {msg.content}
                    </span>
                  </div>
                ) : (`;

const newRender = `                {msg.isSystemNotification ? (
                  <div className="w-full text-center my-2">
                    <span className="inline-block px-3 py-1 bg-black/10 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[10px] rounded-full">
                      {msg.content}
                    </span>
                  </div>
                ) : msg.type === 'opening-card' && msg.openingData ? (
                  <div className="w-full flex justify-center my-6">
                    <div className="w-[280px] bg-white p-3 pb-8 rounded-sm shadow-xl border border-slate-200 relative rotate-1">
                      <div className="w-full aspect-square bg-[#f8f9fa] border border-slate-200 flex items-center justify-center p-6 relative">
                         <p className="text-slate-700 text-sm font-medium leading-relaxed whitespace-pre-wrap text-center z-10">{msg.openingData.content}</p>
                         <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                      </div>
                      <div className="absolute bottom-2 left-4 text-slate-800 font-bold font-serif text-lg">
                        {msg.openingData.title}
                      </div>
                      <div className="absolute bottom-2 right-4 text-slate-400 text-[10px] font-mono">
                        {msg.openingData.dateStr}
                      </div>
                    </div>
                  </div>
                ) : (`;

if (content.includes(anchor)) {
  content = content.replace(anchor, newRender);
  fs.writeFileSync(file, content);
  console.log('Successfully added opening card render');
} else {
  console.log('Failed to find anchor');
}
