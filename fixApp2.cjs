const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');

const fixLines = [133, 148, 176, 336, 352, 392, 530, 839];
lines[133-1] = "  const handleBackToHome = React.useCallback(() => setActiveApp('home'), []);";
[148, 176, 336, 352, 392, 530, 839].forEach(l => {
  lines[l-1] = "  }, []);";
});

fs.writeFileSync('src/App.tsx', lines.join('\n'));
