const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

const fixLines = [133, 148, 176, 336, 352, 392, 530, 839];
fixLines.forEach(l => {
  lines[l-1] = lines[l-1].replace('});', '}, []);');
});
fs.writeFileSync('src/App.tsx', lines.join('\n'));
