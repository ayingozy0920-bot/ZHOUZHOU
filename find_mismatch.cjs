const fs = require('fs');

const code = fs.readFileSync('./src/components/Apps/Chat.tsx', 'utf8');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;
let inString = null;
let inComment = false;

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  const oldString = inString;
  const oldComment = inComment;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const nextChar = line[j + 1];

    if (inComment) {
      if (char === '*' && nextChar === '/') {
        inComment = false;
        j++;
      }
      continue;
    }

    if (inString) {
      if (char === '\\') {
        j++;
      } else if (char === inString) {
        inString = null;
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

    if (char === '{') {
      braceCount++;
    } else if (char === '}') {
      braceCount--;
      if (braceCount < 0) {
        console.log(`Error: Extra } at line ${lineNum}, col ${j + 1}`);
        braceCount = 0;
      }
    } else if (char === '(') {
      parenCount++;
    } else if (char === ')') {
      parenCount--;
      if (parenCount < 0) {
        console.log(`Error: Extra ) at line ${lineNum}, col ${j + 1}`);
        parenCount = 0;
      }
    } else if (char === '[') {
      bracketCount++;
    } else if (char === ']') {
      bracketCount--;
      if (bracketCount < 0) {
        console.log(`Error: Extra ] at line ${lineNum}, col ${j + 1}`);
        bracketCount = 0;
      }
    }
  }

  if (oldString !== inString) {
    console.log(`Line ${lineNum}: inString changed from ${oldString} to ${inString}`);
  }
  if (oldComment !== inComment) {
    console.log(`Line ${lineNum}: inComment changed from ${oldComment} to ${inComment}`);
  }
}

console.log(`Final state: braces=${braceCount}, parens=${parenCount}, brackets=${bracketCount}`);
