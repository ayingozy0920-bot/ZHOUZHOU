const fs = require('fs');

const code = fs.readFileSync('./src/components/Apps/Chat.tsx', 'utf8');

// Strip single line comments
let cleanCode = code.replace(/\/\/.*$/gm, '');

// Strip multiline comments
cleanCode = cleanCode.replace(/\/\*[\s\S]*?\*\//g, '');

// Strip string literals to avoid matching tags inside strings
// Replace backticks, single quotes, double quotes
// Be careful with escaped quotes inside strings
cleanCode = cleanCode.replace(/`(?:\\`|[\s\S])*?`/g, '""');
cleanCode = cleanCode.replace(/'(?:\\'|[^'])*?'/g, '""');
cleanCode = cleanCode.replace(/"(?:\\"|[^"])*?"/g, '""');

// Let's find tags!
const tagRegex = /<(\/)?([a-zA-Z0-9.:_-]+)([^>]*?)>/g;
const stack = [];
let match;

// We also want to know if the tag is self-closing (ends with '/>' or is a known self-closing tag)
while ((match = tagRegex.exec(cleanCode)) !== null) {
  const fullTag = match[0];
  const isClosing = !!match[1];
  const tagName = match[2];
  const attributes = match[3];

  const isSelfClosing = attributes.trim().endsWith('/') || ['img', 'input', 'br', 'hr', 'video', 'audio'].includes(tagName.toLowerCase());

  // Let's get the line number of this match
  const offset = match.index;
  const lineNum = code.substring(0, offset).split('\n').length;

  if (isSelfClosing && !isClosing) {
    // Self-closing tags don't get pushed or popped
    continue;
  }

  if (isClosing) {
    if (stack.length === 0) {
      console.log(`Unmatched closing tag: </${tagName}> at line ${lineNum}`);
    } else {
      const last = stack.pop();
      if (last.tagName !== tagName) {
        console.log(`Tag mismatch at line ${lineNum}: closed </${tagName}> but expected to close <${last.tagName}> from line ${last.lineNum}`);
        // Put last back on stack to continue parsing
        stack.push(last);
      }
    }
  } else {
    stack.push({ tagName, lineNum });
  }
}

console.log("\nRemaining unclosed tags in stack:");
console.log(stack.filter(x => x.lineNum >= 4500 && x.lineNum <= 5650));
