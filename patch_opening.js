import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const anchor1 = `  const [openingContent, setOpeningContent] = useState('');`;
const insert1 = `  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);`;

content = content.replace(anchor1, anchor1 + '\n' + insert1);

const sendOpening = `  const handleSendOpening = () => {
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
    
    onUpdateGroup({
      activeOpening: {
        id: Date.now().toString(),
        title: openingTitle.trim(),
        startTimestamp: msg.timestamp
      },
      isNarrationMode: true // automatically enable narration mode
    });

    setShowOpeningModal(false);
    setOpeningTitle('');
    setOpeningContent('');
  };`;

const oldSendOpening = content.match(/  const handleSendOpening = \(\) => \{[\s\S]*?setOpeningContent\(''\);\n  \};\n/)[0];
content = content.replace(oldSendOpening, sendOpening + '\n');

fs.writeFileSync(file, content);
console.log('patched handleSendOpening');
