import fs from 'fs';
let c = fs.readFileSync('src/components/Apps/Chat.tsx', 'utf-8');
c = c.replace(/你现在是人工智能恋爱模拟专家，专门为恋爱角色【\$\{friend.name\}】设计安全的心理独白。/g, "你是【${friend.name}】。绝对不要说自己是AI或语言模型。");
c = c.replace(/你（\$\{friend.name\}）/g, "你");
c = c.replace(/以及你对玩家的好感，生成你此时此刻在心声日记（Heartfelt Card）中应当展现的数据。/g, "生成你此时此刻内心的真实心理活动（写在心声日记里的内容）。");
fs.writeFileSync('src/components/Apps/Chat.tsx', c);
