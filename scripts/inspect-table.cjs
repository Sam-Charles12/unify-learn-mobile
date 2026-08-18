const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.resolve('scripts/ccmas-text.txt'), 'utf8');
const lines = text.split('\n');

// Search for "Mechanical Engineering" or course codes like "MEE 3" or "CHE 3" or "CVE 3" or "AEE 3"
for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();
  if (l.match(/Course\s*Structure/i) || l.match(/100\s*Level/i) || l.match(/MEE\s*\d{3}/i) || l.match(/CVE\s*\d{3}/i) || l.match(/CHE\s*\d{3}/i)) {
    console.log(`Line ${i}: ${l}`);
    // print next 10 lines
    for (let j = 1; j <= 10; j++) {
      if (i + j < lines.length) console.log(`   +${j}: ${lines[i + j].trim()}`);
    }
    break;
  }
}
