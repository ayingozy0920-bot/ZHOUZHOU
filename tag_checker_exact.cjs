const fs = require('fs');

const code = fs.readFileSync('./src/components/Apps/Chat.tsx', 'utf8');

// Helper to replace text with spaces of same length, preserving newlines
function cleanPreservingLength(str, regex) {
  return str.replace(regex, (match) => {
    return match.split('\n').map(line => ' '.repeat(line.length)).join('\n');
  });
}

let cleanCode = code;

// Clean comments
cleanCode = cleanPreservingLength(cleanCode, /\/\*[\s\S]*?\*\//g);
cleanCode = cleanPreservingLength(cleanCode, /\/\/.*$/gm);

// Clean string literals
cleanCode = cleanPreservingLength(cleanCode, /`(?:\\`|[\s\S])*?`/g);
cleanCode = cleanPreservingLength(cleanCode, /'(?:\\'|[^'])*?'/g);
cleanCode = cleanPreservingLength(cleanCode, /"(?:\\"|[^"])*?"/g);

const tagRegex = /<(\/)?([a-zA-Z0-9.:_-]+)([^>]*?)>/g;
let match;
const tags = [];

// We only want matches in the 4940-5600 range
while ((match = tagRegex.exec(cleanCode)) !== null) {
  const isClosing = !!match[1];
  const tagName = match[2];
  const attributes = match[3];

  const offset = match.index;
  const lineNum = code.substring(0, offset).split('\n').length;

  if (lineNum < 4833 || lineNum > 5600) {
    continue;
  }

  const isSelfClosing = attributes.trim().endsWith('/') || ['img', 'input', 'br', 'hr', 'video', 'audio'].includes(tagName.toLowerCase());

  tags.push({ tagName, isClosing, isSelfClosing, lineNum });
}

// Match them!
const stack = [];
for (const tag of tags) {
  if (tag.isSelfClosing && !tag.isClosing) {
    console.log(`Line ${tag.lineNum}: <${tag.tagName} /> (Self-closing)`);
    continue;
  }

  if (tag.isClosing) {
    if (stack.length === 0) {
      console.log(`Line ${tag.lineNum}: UNMATCHED closing tag </${tag.tagName}>`);
    } else {
      const last = stack.pop();
      if (last.tagName === tag.tagName) {
        console.log(`Line ${tag.lineNum}: </${tag.tagName}> matches <${last.tagName}> from line ${last.lineNum}`);
      } else {
        console.log(`Line ${tag.lineNum}: Tag MISMATCH! Closed </${tag.tagName}> but expected <${last.tagName}> from line ${last.lineNum}`);
        stack.push(last); // keep the last on stack
      }
    }
  } else {
    console.log(`Line ${tag.lineNum}: <${tag.tagName}> (Opening)`);
    stack.push(tag);
  }
}

console.log("\nUnclosed tags stack at end of map:");
console.log(stack);
