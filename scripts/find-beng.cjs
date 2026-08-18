const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.resolve('scripts/ccmas-text.txt'), 'utf8');
const lines = text.split('\n');

const results = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();
  if (l.match(/B\.\s*Eng/i) || l.match(/Bachelor of Engineering/i) || l.match(/Course Structure/i) || l.match(/Course Distribution/i)) {
    results.push({ line: i, text: l });
  }
}

console.log('Matches:', results.length);
results.slice(0, 50).forEach(r => console.log(`${r.line}: ${r.text}`));
