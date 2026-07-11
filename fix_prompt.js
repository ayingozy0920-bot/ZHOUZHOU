const fs = require('fs');
let content = fs.readFileSync('src/components/Apps/Chat.tsx', 'utf-8');

const badPrompt = `          const safeThoughtsPrompt = \`你现在是人工智能恋爱模拟专家，专门为恋爱角色【\${friend.name}】设计安全的心理独白。
刚刚，你（\${friend.name}）给玩家（\${user?.name || '我'}）发送了这样一条回复：
“\${cleanContentForPrompt.slice(0, 200)}”

任务：根据此回复，以及你对玩家的好感，生成你此时此刻在心声日记（Heartfelt Card）中应当展现的数据。`;

const goodPrompt = `          const safeThoughtsPrompt = \`你是【\${friend.name}】。
刚刚，你给玩家（\${user?.name || '我'}）发送了这样一条回复：
“\${cleanContentForPrompt.slice(0, 200)}”

任务：根据此回复，生成你此时此刻内心的真实心理活动（写在心声日记里的内容）。`;

content = content.replace(badPrompt, goodPrompt);
fs.writeFileSync('src/components/Apps/Chat.tsx', content);
