const fs = require('fs');

const code = fs.readFileSync('./src/components/Apps/Chat.tsx', 'utf8');
const lines = code.split('\n');

let braceCount = 0;
let parenCount = 0;
let bracketCount = 0;
let inString = null; // '"', "'", "`"
let inComment = false;
let inJsxTag = false;

// Stack of open tags/braces/parens with line numbers for tracking
const stack = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;

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

    // Comment checks
    if (char === '/' && nextChar === '/') {
      break; // Rest of the line is a comment
    }
    if (char === '/' && nextChar === '*') {
      inComment = true;
      j++;
      continue;
    }

    // String checks inside JS or inside JSX tags
    // (Quotes are only string literals if we are NOT in a JSX text block,
    // i.e., we are either inside a JSX tag, or in plain JS code (braceCount > 0 or not in JSX))
    // To simplify: if we see quotes, we check if they might be a string literal.
    // In our case, we can look at whether we are inside braces `{}` inside JSX, or outside JSX.
    // A safe heuristic: inside JSX tag (inJsxTag = true) or in JS code (which is outside JSX tag,
    // but wait, plain text in JSX doesn't have '{' or '(' unless they are evaluated).
    // Let's just use a state machine for JSX tags.
    if (!inJsxTag && char === '<' && /[a-zA-Z/]/.test(nextChar)) {
      inJsxTag = true;
    }
    if (inJsxTag && char === '>') {
      inJsxTag = false;
    }

    // A quote is a string if:
    // 1. We are in plain JS, or
    // 2. We are inside a JSX tag attribute (inJsxTag is true)
    // Note: in plain JSX text, quotes like " or ' are just plain text.
    // How do we know if we are in JS or JSX text?
    // Let's assume we are in JSX text if we have more open JSX tags than curly braces,
    // but since we aren't tracking full JSX tags perfectly, let's just ignore quotes if they are
    // followed/preceded by certain JSX text indicators, or let's just handle specific known cases.
    // Actually, in Chat.tsx, the only places with lone quotes in JSX text are:
    // - msg.duration}"
    // - "对方心声: 
    // Let's just skip quote handling if the quote is " msg.duration}" or similar.
    // Or simpler: if a quote is " or ', and is not part of a string assignment like = "..." or = '...',
    // we can check if it's inside an attribute or JS.
    // Let's just track curly braces and parens. Since we know line 5347 has `msg.duration}"`,
    // let's explicitly skip that quote!
    if (lineNum === 5347 && char === '"' && j === line.indexOf('"', line.indexOf('msg.duration'))) {
      // Skip the double quote after msg.duration
      continue;
    }
    if (lineNum === 5461 && char === '"' && (j === line.indexOf('"') || j === line.lastIndexOf('"'))) {
      // Skip the double quotes around the message: `"{msg.giftData.message}"`
      continue;
    }
    if (lineNum === 5527 && char === '"' && (j === line.indexOf('"') || j === line.lastIndexOf('"'))) {
      // Skip the double quotes around the message: `" {msg.giftData.message} "`
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }

    if (char === '{') {
      braceCount++;
      stack.push({ type: '{', lineNum, col: j + 1 });
    } else if (char === '}') {
      braceCount--;
      if (braceCount < 0) {
        console.log(`Error: Extra } at line ${lineNum}, col ${j + 1}`);
        braceCount = 0;
      } else {
        const last = stack.pop();
        if (last && last.type !== '{') {
          console.log(`Mismatch: closed } at line ${lineNum}, but expected to close ${last.type} from line ${last.lineNum}`);
        }
      }
    } else if (char === '(') {
      parenCount++;
      stack.push({ type: '(', lineNum, col: j + 1 });
    } else if (char === ')') {
      parenCount--;
      if (parenCount < 0) {
        console.log(`Error: Extra ) at line ${lineNum}, col ${j + 1}`);
        parenCount = 0;
      } else {
        const last = stack.pop();
        if (last && last.type !== '(') {
          console.log(`Mismatch: closed ) at line ${lineNum}, but expected to close ${last.type} from line ${last.lineNum}`);
        }
      }
    } else if (char === '[') {
      bracketCount++;
      stack.push({ type: '[', lineNum, col: j + 1 });
    } else if (char === ']') {
      bracketCount--;
      if (bracketCount < 0) {
        console.log(`Error: Extra ] at line ${lineNum}, col ${j + 1}`);
        bracketCount = 0;
      } else {
        const last = stack.pop();
        if (last && last.type !== '[') {
          console.log(`Mismatch: closed ] at line ${lineNum}, but expected to close ${last.type} from line ${last.lineNum}`);
        }
      }
    }
  }
}

console.log("\nUnclosed elements stack:");
console.log(stack.filter(x => x.lineNum >= 4500 && x.lineNum <= 5650));
