const fs = require('fs');
let code = fs.readFileSync('src/lib/voice.ts', 'utf8');

code = code.replace(
`  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }`,
`  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.pause();
    window.speechSynthesis.cancel();
  }`);

fs.writeFileSync('src/lib/voice.ts', code);
