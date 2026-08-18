const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.resolve('scripts/ccmas-text.txt'), 'utf8');
const lines = text.split('\n');

// Find start lines for each major program section in the text
const sections = [
  { dept: 'aerospace', title: 'Aerospace Engineering', prefix: ['ASE', 'AEE'] },
  { dept: 'chem', title: 'Chemical Engineering', prefix: ['CHE'] },
  { dept: 'civil', title: 'Civil Engineering', prefix: ['CVE'] },
  { dept: 'industrial', title: 'Industrial and Production Engineering', prefix: ['IPE', 'INDE'] },
  { dept: 'mech', title: 'Mechanical Engineering', prefix: ['MEE'] },
];

console.log('Finding sections...');
for (let i = 800; i < lines.length; i++) {
  const l = lines[i].trim();
  for (const s of sections) {
    if (l.toLowerCase().includes(s.title.toLowerCase()) && (l.toLowerCase().includes('b.eng') || l.toLowerCase().includes('b. eng') || l.toLowerCase().includes('programme') || l.toLowerCase().includes('course structure'))) {
      console.log(`Found ${s.dept} around line ${i}: "${l}"`);
    }
  }
}
