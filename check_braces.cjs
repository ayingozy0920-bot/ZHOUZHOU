const fs = require('fs');

const content = fs.readFileSync('./src/components/Apps/Chat.tsx', 'utf8');
const lines = content.split('\n');

const tagStack = [];
let inComment = false;
let inString = null;

for (let i = 4945; i < 5598; i++) {
  const line = lines[i];
  const currentLineNum = i + 1;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const nextChar = line[j + 1];

    if (inString) {
      if (char === '\\') {
        j++;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (inComment) {
      if (char === '*' && nextChar === '/') {
        inComment = false;
        j++;
      }
      continue;
    }

    if (char === '/' && nextChar === '/') {
      break;
    }
    if (char === '/' && nextChar === '*') {
      inComment = true;
      j++;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }

    if (char === '<') {
      if (nextChar === '!') continue;
      
      // Closing tag
      if (nextChar === '/') {
        let tagEnd = line.indexOf('>', j);
        if (tagEnd === -1) continue;
        const tagName = line.substring(j + 2, tagEnd).trim().split(/[ \t>]/)[0];
        if (tagName === 'img' || tagName === 'video' || tagName === 'Mic' || tagName === 'PhoneOff' || tagName === 'Video' || tagName === 'Wallet' || tagName === 'Gift' || tagName === 'ChevronUp' || tagName === 'Search' || tagName === 'ChevronDown' || tagName === 'PolaroidCard' || tagName === 'DiceAnimation' || tagName === 'CCDPhotoCard') {
          j = tagEnd;
          continue;
        }
        
        console.log(`Line ${currentLineNum}: Closing </${tagName}>`);
        const idx = tagStack.lastIndexOf(tagName);
        if (idx !== -1) {
          tagStack.splice(idx, 1);
        }
        j = tagEnd;
        continue;
      }

      // Opening tag
      let tagEnd = line.indexOf('>', j);
      if (tagEnd === -1) continue;
      
      let actualTagEnd = tagEnd;
      let openBracesCount = 0;
      for (let k = j; k < line.length; k++) {
        if (line[k] === '{') openBracesCount++;
        if (line[k] === '}') openBracesCount--;
        if (line[k] === '>' && openBracesCount === 0) {
          if (line[k-1] !== '=') {
            actualTagEnd = k;
            break;
          }
        }
      }
      tagEnd = actualTagEnd;

      if (line[tagEnd - 1] === '/') {
        j = tagEnd;
        continue; // self closing
      }

      const tagContent = line.substring(j + 1, tagEnd).trim();
      const tagName = tagContent.split(/[ \t\/>]/)[0];
      
      if (!tagName || tagName.startsWith('{') || tagName.startsWith('(') || tagName.includes('.') && tagName.toLowerCase() === tagName) {
        continue;
      }
      if (tagName === 'img' || tagName === 'video' || tagName === 'Mic' || tagName === 'PhoneOff' || tagName === 'Video' || tagName === 'Wallet' || tagName === 'Gift' || tagName === 'ChevronUp' || tagName === 'Search' || tagName === 'ChevronDown' || tagName === 'PolaroidCard' || tagName === 'DiceAnimation' || tagName === 'CCDPhotoCard' || tagName === 'br') {
        j = tagEnd;
        continue;
      }

      console.log(`Line ${currentLineNum}: Opening <${tagName}>`);
      tagStack.push(tagName);
      j = tagEnd;
    }
  }
}

console.log("\nUnclosed tags inside range:");
console.log(tagStack);
