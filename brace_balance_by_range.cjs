const fs = require('fs');

const code = fs.readFileSync('./src/components/Apps/Chat.tsx', 'utf8');
const lines = code.split('\n');

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
cleanCode = cleanPreservingLength(cleanCode, /"/g); // simplify quote stripping

const cleanLines = cleanCode.split('\n');

let diffSum = 0;
let lastSum = 0;
for (let i = 0; i < cleanLines.length; i++) {
  const line = cleanLines[i];
  let lineDiff = 0;
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') lineDiff++;
    if (line[j] === '}') lineDiff--;
  }
  diffSum += lineDiff;
  if (diffSum !== lastSum) {
    console.log(`Line ${i + 1}: runningSum changed from ${lastSum} to ${diffSum} | ${lines[i].trim().slice(0, 50)}`);
    lastSum = diffSum;
  }
}
