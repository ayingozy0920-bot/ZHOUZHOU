import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const anchor = `  const handleSend = () => {`;
const helper = `  const handleSendOpening = () => {
    if (!openingTitle.trim() || !openingContent.trim()) return;
    
    const now = new Date();
    const dateStr = \`\${now.getFullYear()}.\${String(now.getMonth() + 1).padStart(2, '0')}.\${String(now.getDate()).padStart(2, '0')}\`;

    const msg: ChatMessage = {
      role: 'user',
      content: '开场白',
      type: 'opening-card',
      openingData: {
        title: openingTitle.trim(),
        content: openingContent.trim(),
        dateStr
      },
      timestamp: Date.now(),
    };
    onSendMessage(msg);
    setShowOpeningModal(false);
    setOpeningTitle('');
    setOpeningContent('');
  };
`;

if (content.includes(anchor)) {
  content = content.replace(anchor, helper + '\n' + anchor);
  fs.writeFileSync(file, content);
  console.log('Successfully added handleSendOpening');
} else {
  console.log('Failed to find handleSend');
}
