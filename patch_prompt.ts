const fs = require('fs');
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldPromptBlock = `      const recentMsgs = messages.slice(-30);
      const historyText = recentMsgs.map(m => {
        if (m.role === 'user') return \`\${user.name} (用户): \${m.content}\`;
        if (m.isSystemNotification) return \`[系统通知]: \${m.content}\`;
        return \`\${m.description || '群成员'}: \${m.content}\`;
      }).join('\\n');

      const systemPrompt = \`你现在正在模拟一个真实微信群聊。群成员和用户拥有以下头衔（QQ风格）：\\n\${memberTitlesDesc}\\n\\n群里有以下成员：\\n\${memberPersonasDesc}\${worldBookPrompt}\\n\\n最近的群聊记录：\\n\${historyText}\\n\\n请模拟群内活跃的2到3个不同角色分别发言，总共生成2到4条连续的回复消息。各角色可以感知并讨论彼此或用户头衔内容，也可以谈论抢红包或互相发红包。让各角色根据人设、上文氛围进行自然、生动、符合性格的对话、吐槽或互动。\\n要求：必须严格输出合法的JSON数组格式（不要包含markdown代码块语法，纯JSON数组），每个元素包含：\\n- "characterId": 说话角色的ID\\n- "characterName": 说话角色的名字\\n- "content": 说话内容\\n数组长度在2到4之间。\`;`;

const newPromptBlock = `      let privateChatHistoryPrompt = '';
      if (allChats) {
        privateChatHistoryPrompt = '\\n\\n【群成员与用户的专属私聊记录 (最近30条上下文)】\\n(各角色需结合自己与用户的私聊记忆在群聊中作出反应)\\n';
        groupMembers.forEach(member => {
          const privateMsgs = (allChats[member.id] || []).filter(m => m.role !== 'system').slice(-30);
          if (privateMsgs.length > 0) {
            privateChatHistoryPrompt += \`\\n--- 与 \${member.name} 的私聊 ---\\n\`;
            privateChatHistoryPrompt += privateMsgs.map(m => {
              const isUser = m.role === 'user';
              return \`\${isUser ? user.name + ' (用户)' : member.name}: \${m.content}\`;
            }).join('\\n');
          }
        });
      }

      const recentMsgs = messages.slice(-30);
      const historyText = recentMsgs.map(m => {
        if (m.role === 'user') return \`\${user.name} (用户): \${m.content}\`;
        if (m.isSystemNotification) return \`[系统通知]: \${m.content}\`;
        return \`\${m.description || '群成员'}: \${m.content}\`;
      }).join('\\n');

      const systemPrompt = \`你现在正在模拟一个真实活跃的大型社交群聊。群成员和用户拥有以下头衔（QQ风格）：\\n\${memberTitlesDesc}\\n\\n群里有以下成员：\\n\${memberPersonasDesc}\${worldBookPrompt}\${privateChatHistoryPrompt}\\n\\n最近的群聊记录：\\n\${historyText}\\n\\n【群聊回复核心规则】
1. 模仿真人群聊：去掉AI机械感，模仿真人大型社交群聊聊天风格，可以分享日常八卦、工作、学习等。不围着user转，角色之间也可以相互互动聊天，但是也不能完全忽略user，这就是一个正常的活跃群聊。
2. 抢话与穿插回复：群聊里角色可以进行抢话，不死板规定是必须这个角色回复完成后再到另外一个角色回复。比如角色A回复了一句，角色B接着回复，角色A再回复，再到角色C等等，就是模仿真人群聊很多人的情况下，每个人打字速度快慢不同的穿插交替回复效果。
3. 消息数量与形式：输出总共4到10条左右的连续回复消息。每个活跃角色可以输出2-4条。可以是语音消息（文本），文本消息，表情包互动（发送表情包请用 [表情: 描述] 的格式）。
4. 各角色可以感知并讨论彼此或用户头衔内容，也可以谈论抢红包或互相发红包。请结合各角色与用户的私聊记忆（如有）以及群聊上下文，进行自然、生动的互动。

要求：必须严格输出合法的JSON数组格式（不要包含markdown代码块语法，纯JSON数组），每个元素包含：
- "characterId": 说话角色的ID
- "characterName": 说话角色的名字
- "content": 说话内容\`;`;

content = content.replace(oldPromptBlock, newPromptBlock);
fs.writeFileSync(file, content);
console.log('done');
