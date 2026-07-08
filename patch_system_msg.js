import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldSystemMsg = `    // Send system message
    const systemMsg: ChatMessage = {
      role: 'assistant',
      content: trimmedTitle ? \`\${user.name} 为 \${selectedMemberForTitle.name} 修改头衔「\${trimmedTitle}」\` : \`\${user.name} 取消了 \${selectedMemberForTitle.name} 的头衔\`,
      description: '系统通知',
      timestamp: Date.now(),
    };`;

const newSystemMsg = `    // Send system message
    const systemMsg: ChatMessage = {
      role: 'assistant',
      content: trimmedTitle ? \`\${user.name} 为 \${selectedMemberForTitle.name} 修改头衔「\${trimmedTitle}」\` : \`\${user.name} 取消了 \${selectedMemberForTitle.name} 的头衔\`,
      description: '系统通知',
      isSystemNotification: true,
      timestamp: Date.now(),
    };`;

if (content.includes(oldSystemMsg)) {
  content = content.replace(oldSystemMsg, newSystemMsg);
  fs.writeFileSync(file, content);
  console.log('Successfully patched systemMsg');
} else {
  console.log('Failed to find oldSystemMsg');
}
