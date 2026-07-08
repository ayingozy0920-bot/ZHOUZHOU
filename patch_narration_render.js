import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const anchor = `                ) : msg.type === 'opening-card' && msg.openingData ? (`;

const newRender = `                ) : msg.isNarration ? (
                  <div className="w-full flex justify-center my-3 px-8">
                    <span className="inline-block px-4 py-2 bg-black/20 dark:bg-black/40 backdrop-blur-md text-white text-[11px] leading-relaxed rounded-2xl text-center shadow-sm">
                      {msg.content}
                    </span>
                  </div>
                ) : msg.type === 'opening-card' && msg.openingData ? (`;

if (content.includes(anchor)) {
  content = content.replace(anchor, newRender);
  fs.writeFileSync(file, content);
  console.log('Successfully added narration render');
} else {
  console.log('Failed to find anchor');
}
