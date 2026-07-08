import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert renderMessageContent
const helperCode = `const renderMessageContent = (content: string, customStickers: Sticker[] = []) => {
  if (!content) return null;
  const parts = content.split(/(\\[表情:\\s*.*?\\])/g);
  return parts.map((part, i) => {
    const match = part.match(/\\[表情:\\s*(.*?)\\]/);
    if (match) {
      const desc = match[1];
      const foundSticker = customStickers.find(s => s.description.includes(desc) || desc.includes(s.description));
      if (foundSticker) {
         return <img key={i} src={foundSticker.url} alt={desc} className="inline-block h-24 w-auto rounded-lg object-cover mx-1 bg-transparent" />;
      }
      return <span key={i} className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-1 rounded-md mx-1">[{desc}]</span>;
    }
    return <span key={i}>{part}</span>;
  });
};`;

if (!content.includes('renderMessageContent')) {
  // Find where to insert
  content = content.replace('export const GroupChatWindow: React.FC<GroupChatWindowProps> = ({', helperCode + '\n\nexport const GroupChatWindow: React.FC<GroupChatWindowProps> = ({');
}

// Replace {msg.content} with {renderMessageContent(msg.content, settings.customStickers || [])} inside the text render area
const textRenderArea = `<div className={cn(
                          "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-all",
                          isUser 
                            ? "bg-[#95ec69] text-black rounded-tr-none" 
                            : (isRainy ? "bg-white/10 text-white rounded-tl-none backdrop-blur-md" : "bg-white text-slate-800 rounded-tl-none")
                        )}>
                          {msg.content}
                        </div>`;

const newTextRenderArea = `<div className={cn(
                          "px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-all",
                          isUser 
                            ? "bg-[#95ec69] text-black rounded-tr-none" 
                            : (isRainy ? "bg-white/10 text-white rounded-tl-none backdrop-blur-md" : "bg-white text-slate-800 rounded-tl-none")
                        )}>
                          {renderMessageContent(msg.content, settings.customStickers || [])}
                        </div>`;

if (content.includes(textRenderArea)) {
  content = content.replace(textRenderArea, newTextRenderArea);
  fs.writeFileSync(file, content);
  console.log('Successfully patched renderMessageContent');
} else {
  console.log('Failed to find textRenderArea');
}
