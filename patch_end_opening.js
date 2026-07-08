import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const anchor = `  const handleSend = () => {`;
const insert = `  const handleEndOpening = async () => {
    if (!group.activeOpening || isGeneratingSummary) return;
    setIsGeneratingSummary(true);

    const relevantMsgs = messages.filter(m => m.timestamp >= group.activeOpening!.startTimestamp);
    const historyText = relevantMsgs.map(m => {
        if (m.type === 'opening-card' && m.openingData) return \`[开场白 - \${m.openingData.title}]: \${m.openingData.content}\`;
        if (m.isNarration) return \`\${m.description || '群成员'} (旁白): \${m.content}\`;
        if (m.role === 'user') return \`\${user.name} (用户): \${m.content}\`;
        if (m.isSystemNotification) return \`[系统通知]: \${m.content}\`;
        return \`\${m.description || '群成员'}: \${m.content}\`;
    }).join('\\n');

    const prompt = \`你是一个出色的文案大师。请根据以下角色的线下互动聊天记录，以第三方叙事角度，客观总结并评价此次线下多人互动的发生的重要事件。总结字数大约500字。
    
聊天记录：
\${historyText}\`;

    try {
      const data = await apiFetch({
        endpoint: '/api/chat',
        body: {
          system_prompt: prompt,
          messages: [{ role: 'user', parts: [{ text: '请生成记忆总结' }] }],
          settings: {
            baseUrl: settings.baseUrl,
            apiKey: settings.apiKey,
            modelName: settings.modelName,
          }
        }
      });
      let rawText = '';
      if (data && typeof data === 'object') {
        rawText = data.text || data.response || data.content || JSON.stringify(data);
      } else if (typeof data === 'string') {
        rawText = data;
      }
      const summary = rawText.replace(/\`\`\`/g, '').trim();
      
      const now = new Date();
      const dateStr = \`\${now.getFullYear()}.\${String(now.getMonth() + 1).padStart(2, '0')}.\${String(now.getDate()).padStart(2, '0')} \${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}\`;
      
      const memory = {
        id: group.activeOpening.id,
        title: group.activeOpening.title,
        dateStr,
        summary,
        timestamp: Date.now()
      };
      
      onUpdateGroup({
        activeOpening: undefined,
        isNarrationMode: false,
        openingMemories: [...(group.openingMemories || []), memory]
      });
      
    } catch (err) {
      console.error(err);
      alert('生成记忆总结失败');
    } finally {
      setIsGeneratingSummary(false);
    }
  };
`;

content = content.replace(anchor, insert + '\n' + anchor);
fs.writeFileSync(file, content);
console.log('patched handleEndOpening');
