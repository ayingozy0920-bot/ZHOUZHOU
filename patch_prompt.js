import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const anchor = `      const historyText = recentMsgs.map(m => {
        if (m.role === 'user') return \`\${user.name} (用户): \${m.content}\`;
        if (m.isSystemNotification) return \`[系统通知]: \${m.content}\`;
        return \`\${m.description || '群成员'}: \${m.content}\`;
      }).join('\\n');`;

const newHistory = `      const historyText = recentMsgs.map(m => {
        if (m.type === 'opening-card' && m.openingData) return \`[开场白 - \${m.openingData.title}]: \${m.openingData.content}\`;
        if (m.isNarration) return \`\${m.description || '群成员'} (旁白): \${m.content}\`;
        if (m.role === 'user') return \`\${user.name} (用户): \${m.content}\`;
        if (m.isSystemNotification) return \`[系统通知]: \${m.content}\`;
        return \`\${m.description || '群成员'}: \${m.content}\`;
      }).join('\\n');`;

content = content.replace(anchor, newHistory);

const anchor2 = `要求：必须严格输出合法的JSON数组格式（不要包含markdown代码块语法，纯JSON数组），每个元素包含：
- "characterId": 说话角色的ID
- "characterName": 说话角色的名字
- "content": 说话内容\`;`;

const newAnchor2 = `要求：必须严格输出合法的JSON数组格式（不要包含markdown代码块语法，纯JSON数组），每个元素包含：
- "characterId": 说话角色的ID
- "characterName": 说话角色的名字
- "content": 说话内容
\${group.isNarrationMode ? '- "messageType": "narration" 或者 "dialogue"（旁白填narration，对话填dialogue）\\n注：处于旁白模式时，请进行线下演绎，为每个角色穿插生成旁白和对话。' : ''}\`;`;

content = content.replace(anchor2, newAnchor2);

fs.writeFileSync(file, content);
console.log('Successfully patched prompt');
