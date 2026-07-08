import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const anchor = `      let replies: Array<{ characterId: string; characterName: string; content: string }> = [];`;
const newAnchor = `      let replies: Array<{ characterId: string; characterName: string; content: string; messageType?: string }> = [];`;
content = content.replace(anchor, newAnchor);

const anchor2 = `          const groupMsg: ChatMessage = {
            role: 'assistant',
            content: rep.content,
            description: member.name,
            mediaUrl: member.avatar,
            timestamp: Date.now() + i * 500,
          };`;

const newAnchor2 = `          const groupMsg: ChatMessage = {
            role: 'assistant',
            content: rep.content,
            description: member.name,
            mediaUrl: member.avatar,
            isNarration: rep.messageType === 'narration',
            timestamp: Date.now() + i * 500,
          };`;

content = content.replace(anchor2, newAnchor2);

fs.writeFileSync(file, content);
console.log('Successfully patched replies');
