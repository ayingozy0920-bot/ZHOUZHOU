const fs = require('fs');

const code = fs.readFileSync('./src/components/Apps/Chat.tsx', 'utf8');
const lines = code.split('\n');

let inString = null;
let inComment = null; // 'single' or 'multi'

const tags = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

  if (lineNum < 4537 || lineNum > 7628) {
    continue;
  }

  // To simplify: let's look for tags by basic scanning, but we must ignore strings and comments
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const nextChar = line[j + 1];

    if (inComment === 'multi') {
      if (char === '*' && nextChar === '/') {
        inComment = null;
        j++;
      }
      continue;
    }

    if (inComment === 'single') {
      continue; // Wait, single line comment ends at the end of the line
    }

    if (inString) {
      if (char === '\\') {
        j++;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    // Check comments
    if (char === '/' && nextChar === '/') {
      inComment = 'single';
      break;
    }
    if (char === '/' && nextChar === '*') {
      inComment = 'multi';
      j++;
      continue;
    }

    // Check strings
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }

    // If we are not in comment or string, let's look for tags!
    if (char === '<') {
      // Could be a tag start or closing tag start
      const isClosing = nextChar === '/';
      const startIdx = isClosing ? j + 2 : j + 1;
      
      // Extract tag name (letters, numbers, dots, hyphens)
      let tagName = '';
      let k = startIdx;
      while (k < line.length && /[a-zA-Z0-9.:_-]/.test(line[k])) {
        tagName += line[k];
        k++;
      }

      if (tagName.length > 0) {
        // Find the matching '>' on this line or subsequent lines, but ignoring quotes/comments
        // To be simple and robust: we can just find the next '>' on the same line,
        // and check if it ends with '/' before '>'.
        // Let's search from k to find the closing '>'
        let isSelfClosing = false;
        let foundClosing = false;
        let lastCharOfAttr = '';
        
        let tempInString = null;
        let m = k;
        while (m < line.length) {
          const c = line[m];
          if (tempInString) {
            if (c === '\\') m++;
            else if (c === tempInString) tempInString = null;
          } else {
            if (c === '"' || c === "'") {
              tempInString = c;
            } else if (c === '>') {
              foundClosing = true;
              isSelfClosing = (lastCharOfAttr === '/');
              break;
            } else if (!/\s/.test(c)) {
              lastCharOfAttr = c;
            }
          }
          m++;
        }

        if (foundClosing) {
          // Known self-closing tags
          if (['img', 'input', 'br', 'hr', 'video', 'audio'].includes(tagName.toLowerCase())) {
            isSelfClosing = true;
          }
          tags.push({ tagName, isClosing, isSelfClosing, lineNum });
          j = m; // skip past the tag
        }
      }
    }
  }

  if (inComment === 'single') {
    inComment = null;
  }
}

// Let's run stack validation!
const stack = [];
for (const tag of tags) {
  if (tag.isSelfClosing && !tag.isClosing) {
    continue;
  }

  if (tag.isClosing) {
    if (stack.length === 0) {
      console.log(`Line ${tag.lineNum}: UNMATCHED closing tag </${tag.tagName}>`);
    } else {
      const last = stack.pop();
      if (last.tagName === tag.tagName) {
        // console.log(`Line ${tag.lineNum}: </${tag.tagName}> matches <${last.tagName}> from line ${last.lineNum}`);
      } else {
        console.log(`Line ${tag.lineNum}: Tag MISMATCH! Closed </${tag.tagName}> but expected <${last.tagName}> from line ${last.lineNum}`);
        stack.push(last); // keep last on stack
      }
    }
  } else {
    stack.push(tag);
  }
}

console.log("\nUnclosed tags stack at end of ChatWindow:");
console.log(stack);
