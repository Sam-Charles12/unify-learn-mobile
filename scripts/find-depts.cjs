const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.resolve('scripts/ccmas-text.txt'), 'utf8');
const lines = text.split('\n');
console.log('Total lines:', lines.length);

const targets = [
  'Aerospace Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Industrial Engineering',
  'Industrial and Production Engineering',
  'Mechanical Engineering',
];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  for (const t of targets) {
    if (line.toLowerCase() === t.toLowerCase() || line.toLowerCase().startsWith('b.eng') && line.toLowerCase().includes(t.toLowerCase())) {
      console.log(`Match at line ${i}: "${line}"`);
    }
  }
}
