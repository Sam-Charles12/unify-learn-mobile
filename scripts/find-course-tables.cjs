const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.resolve('scripts/ccmas-text.txt'), 'utf8');
const lines = text.split('\n');

for (let i = 1000; i < lines.length; i++) {
  const l = lines[i].trim();
  if (l.match(/^MEE\s*\d{3}/) || l.match(/^CVE\s*\d{3}/) || l.match(/^CHE\s*\d{3}/) || l.match(/^IPE\s*\d{3}/) || l.match(/^AEE\s*\d{3}/) || l.match(/^ASE\s*\d{3}/)) {
    console.log(`Course code at line ${i}: ${l}`);
    for (let j = 1; j <= 5; j++) {
      console.log(`   +${j}: ${lines[i + j]?.trim()}`);
    }
    if (i > 1500) break;
  }
}
