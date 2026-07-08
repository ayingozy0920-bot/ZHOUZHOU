const fs = require('fs');

const code = fs.readFileSync('./src/components/Apps/Chat.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 4832; i < 5600; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  // Search for <div or </div
  let pos = 0;
  while (true) {
    const idxOpen = line.indexOf('<div', pos);
    const idxClose = line.indexOf('</div', pos);

    if (idxOpen === -1 && idxClose === -1) {
      break;
    }

    if (idxOpen !== -1 && (idxClose === -1 || idxOpen < idxClose)) {
      // Check if it's </div
      if (line[idxOpen + 1] === '/') {
        console.log(`Line ${lineNum}: </div`);
        pos = idxOpen + 5;
      } else {
        console.log(`Line ${lineNum}: <div`);
        pos = idxOpen + 4;
      }
    } else {
      console.log(`Line ${lineNum}: </div`);
      pos = idxClose + 5;
    }
  }
}
