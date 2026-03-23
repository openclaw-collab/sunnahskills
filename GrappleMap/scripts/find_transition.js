#!/usr/bin/env node
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const text = readFileSync(join(ROOT, 'GrappleMap.txt'), 'utf8');
const lines = text.split('\n');

// Search for transitions containing specific terms
const searchTerms = ['arm over', 'over head', 'arm.*head', 'head.*arm'];

let inData = false;
let desc = [];
let seqIndex = 0;
let results = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const isData = line.length > 0 && line[0] === ' ';

  if (isData) {
    inData = true;
  } else {
    if (inData && desc.length > 0) {
      seqIndex++;
      const fullDesc = desc.join(' ').toLowerCase();

      // Check if any search term matches
      for (const term of searchTerms) {
        if (fullDesc.includes(term.replace('.*', ''))) {
          results.push({
            index: seqIndex,
            line: i,
            description: desc.join('\n')
          });
          break;
        }
      }

      desc = [];
    }
    inData = false;
    if (line.trim()) desc.push(line);
  }
}

console.log('Found transitions:');
results.forEach(r => {
  console.log(`\nIndex ${r.index} (line ${r.line}):`);
  console.log(r.description.substring(0, 100) + '...');
});
