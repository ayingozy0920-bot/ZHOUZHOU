import fs from 'fs';
const file = 'src/components/Apps/GroupChatWindow.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /      const systemPrompt = \`你现在正在模拟一个真实活跃的大型社交群聊。群成员和用户拥有以下头衔（QQ风格）：\\n\$\{memberTitlesDesc\}\\n\\n群里有以下成员：\\n\$\{memberPersonasDesc\}\$\{worldBookPrompt\}\$\{privateChatHistoryPrompt\}\\n\\n最近的群聊记录：\\n\$\{historyText\}\\n\\n【群聊回复核心规则】/;

const newPromptStart = `
      let openingMemoriesPrompt = '';
      if (group.openingMemories && group.openingMemories.length > 0) {
        openingMemoriesPrompt = \`\\n\\n【过往线下演绎记忆】\\n\` + group.openingMemories.map(m => \`[\${m.title} (\${m.dateStr})]: \${m.summary}\`).join('\\n');
      }

      const systemPrompt = \`你现在正在模拟一个真实活跃的大型社交群聊。群成员和用户拥有以下头衔（QQ风格）：\\n\$\{memberTitlesDesc\}\\n\\n群里有以下成员：\\n\$\{memberPersonasDesc\}\$\{worldBookPrompt\}\$\{privateChatHistoryPrompt\}\$\{openingMemoriesPrompt\}\\n\\n最近的群聊记录：\\n\$\{historyText\}\\n\\n【群聊回复核心规则】`;

content = content.replace(regex, newPromptStart);
fs.writeFileSync(file, content);
console.log('patched system prompt');
