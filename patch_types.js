import fs from 'fs';
const file = 'src/types.ts';
let content = fs.readFileSync(file, 'utf8');

const openingMemoryType = `export interface OpeningMemory {
  id: string;
  title: string;
  dateStr: string;
  summary: string;
  timestamp: number;
}

`;

content = openingMemoryType + content;

const anchor = `  isNarrationMode?: boolean;`;
const insert = `  activeOpening?: {
    id: string;
    title: string;
    startTimestamp: number;
  };
  openingMemories?: OpeningMemory[];`;

content = content.replace(anchor, anchor + '\n' + insert);
fs.writeFileSync(file, content);
