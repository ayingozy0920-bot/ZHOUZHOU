const fs = require('fs');

const code = fs.readFileSync('./src/components/Apps/Chat.tsx', 'utf8');

function cleanPreservingLength(str, regex) {
  return str.replace(regex, (match) => {
    return match.split('\n').map(line => ' '.repeat(line.length)).join('\n');
  });
}

let cleanCode = code;
cleanCode = cleanPreservingLength(cleanCode, /\/\*[\s\S]*?\*\//g);
cleanCode = cleanPreservingLength(cleanCode, /\/\/.*$/gm);
cleanCode = cleanPreservingLength(cleanCode, /`(?:\\`|[\s\S])*?`/g);
cleanCode = cleanPreservingLength(cleanCode, /'(?:\\'|[^'])*?'/g);
cleanCode = cleanPreservingLength(cleanCode, /"/g);

const cleanLines = cleanCode.split('\n');

const functions = [
  { name: 'ChatApp start', line: 99 },
  { name: 'NavButton start', line: 757 },
  { name: 'ChatSettings start', line: 768 },
  { name: 'PolaroidCard start', line: 1785 },
  { name: 'CharacterImageSettings start', line: 1822 },
  { name: 'OfflineInvitationCard start', line: 1987 },
  { name: 'ChatWindow start', line: 2155 },
  { name: 'FriendProfile start', line: 7630 },
  { name: 'FriendMoments start', line: 8204 },
  { name: 'DiscoverTab start', line: 8276 },
  { name: 'MeTab start', line: 8336 },
  { name: 'BeautificationPage start', line: 8723 },
  { name: 'UserProfileEditModal start', line: 9271 },
  { name: 'FavoritesView start', line: 9387 },
  { name: 'MyMomentsPage start', line: 9468 },
  { name: 'PaymentPage start', line: 9582 },
  { name: 'PersonaArchiveView start', line: 10114 },
  { name: 'PersonaEditModal start', line: 10244 },
  { name: 'MenuItem start', line: 10343 },
  { name: 'ProfileSelectorModal start', line: 10367 },
  { name: 'AddFriendModal start', line: 10471 },
  { name: 'handleAICommentOnMoment start', line: 10645 },
  { name: 'handleAIReplyToComment start', line: 10685 },
  { name: 'PostMomentModal start', line: 10716 },
  { name: 'VisibilitySelectorModal start', line: 10850 },
  { name: 'MomentSettingsModal start', line: 10934 }
];

let diffSum = 0;
let funcIdx = 0;
for (let i = 0; i < cleanLines.length; i++) {
  const line = cleanLines[i];
  let lineDiff = 0;
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') lineDiff++;
    if (line[j] === '}') lineDiff--;
  }
  diffSum += lineDiff;

  const currentLine = i + 1;
  while (funcIdx < functions.length && functions[funcIdx].line === currentLine) {
    console.log(`[Function Check] At Line ${currentLine} (${functions[funcIdx].name}): runningSum = ${diffSum}`);
    funcIdx++;
  }
}
console.log(`[End of File] At Line ${cleanLines.length}: runningSum = ${diffSum}`);
