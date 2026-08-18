const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.resolve('scripts/ccmas-text.txt'), 'utf8');
const lines = text.split('\n');

for (let i = 0; i < 2000; i++) {
  const l = lines[i].trim();
  if (l.match(/credit\s*load/i) || l.match(/minimum\s*credit/i) || l.match(/maximum\s*credit/i) || l.match(/maximum\s*units/i) || l.match(/minimum\s*units/i)) {
    console.log(`Line ${i}: ${l}`);
  }
}
