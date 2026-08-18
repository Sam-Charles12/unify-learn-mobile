const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.resolve('scripts/ccmas-text.txt'), 'utf8');
const lines = text.split('\n');

for (let i = 0; i < 400; i++) {
  const l = lines[i].trim();
  if (l) {
    console.log(`${i}: ${l}`);
  }
}
