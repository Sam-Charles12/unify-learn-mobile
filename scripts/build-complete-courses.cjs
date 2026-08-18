const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.resolve('scripts/ccmas-text.txt'), 'utf8');
const lines = text.split('\n');

const DEPT_RANGES = [
  { dept: 'aerospace', name: 'Aerospace Engineering', start: 1549, end: 3500 },
  { dept: 'chem', name: 'Chemical Engineering', start: 9375, end: 11000 },
  { dept: 'civil', name: 'Civil Engineering', start: 11000, end: 13000 },
  { dept: 'industrial', name: 'Industrial Engineering', start: 25439, end: 27500 },
  { dept: 'mech', name: 'Mechanical Engineering', start: 31002, end: 33500 },
];

function parseDeptCourses(deptConfig) {
  const courses = [];
  const deptLines = lines.slice(deptConfig.start, deptConfig.end);
  
  let currentLevel = '100';
  let currentSemester = '1';
  
  // Look for course codes: GST, MTH, PHY, CHM, GET, ENG, STA, CSC, and dept-specific codes (ASE, AEE, CHE, CVE, IPE, MEE)
  const codeRegex = /^([A-Z]{3})\s*(\d{3})\b/;
  
  for (let i = 0; i < deptLines.length; i++) {
    const rawLine = deptLines[i].trim();
    
    // Level detection
    if (rawLine.match(/^100\s*Level/i)) currentLevel = '100';
    else if (rawLine.match(/^200\s*Level/i)) currentLevel = '200';
    else if (rawLine.match(/^300\s*Level/i)) currentLevel = '300';
    else if (rawLine.match(/^400\s*Level/i)) currentLevel = '400';
    else if (rawLine.match(/^500\s*Level/i)) currentLevel = '500';
    
    // Semester detection
    if (rawLine.match(/1st\s*Semester|First\s*Semester|Harmattan/i)) currentSemester = '1';
    else if (rawLine.match(/2nd\s*Semester|Second\s*Semester|Rain/i)) currentSemester = '2';
    
    const match = rawLine.match(codeRegex);
    if (match) {
      const code = `${match[1]} ${match[2]}`;
      let title = rawLine.slice(match[0].length).trim();
      let units = 2;
      
      // Look for units (usually a digit followed by C or E or at end of line)
      const uMatch = title.match(/(\d+)\s*(?:C|E|R|Compulsory|Elective)?(?:\s*\d+)*\s*$/i);
      if (uMatch) {
        units = parseInt(uMatch[1], 10) || 2;
        title = title.replace(/(\d+)\s*(?:C|E|R|Compulsory|Elective)?(?:\s*\d+)*\s*$/i, '').trim();
      }
      
      // If title spilled into next 1-2 lines
      if (title.length < 4 && i + 1 < deptLines.length) {
        const next1 = deptLines[i + 1].trim();
        if (!next1.match(codeRegex) && !next1.match(/Level|Semester|Total|Course Code/i)) {
          title = `${title} ${next1}`.trim();
        }
      }
      
      // Clean title text
      title = title.replace(/\s+/g, ' ').replace(/^[-:.]\s*/, '').trim();
      
      if (title.length >= 3 && !title.toLowerCase().startsWith('course title') && !title.toLowerCase().startsWith('units')) {
        courses.push({
          id: `${code.toLowerCase().replace(/\s+/g, '-')}-${deptConfig.dept}`,
          code,
          title,
          credits: Math.min(6, Math.max(1, units)),
          departments: [deptConfig.dept],
          levels: [currentLevel],
          semester: currentSemester,
        });
      }
    }
  }
  
  return courses;
}

const allCoursesMap = new Map();

DEPT_RANGES.forEach((d) => {
  const list = parseDeptCourses(d);
  console.log(`${d.name}: parsed ${list.length} course entries`);
  
  list.forEach((c) => {
    // If course already exists (e.g. general engineering courses like GST 111, MTH 101, GET 201), add department to its array
    const baseId = c.code.toLowerCase().replace(/\s+/g, '-');
    if (allCoursesMap.has(baseId)) {
      const existing = allCoursesMap.get(baseId);
      if (!existing.departments.includes(c.departments[0])) {
        existing.departments.push(c.departments[0]);
      }
      if (!existing.levels.includes(c.levels[0])) {
        existing.levels.push(c.levels[0]);
      }
    } else {
      allCoursesMap.set(baseId, {
        id: baseId,
        code: c.code,
        title: c.title,
        credits: c.credits,
        departments: [...c.departments],
        levels: [...c.levels],
        semester: c.semester,
      });
    }
  });
});

const consolidated = Array.from(allCoursesMap.values());
console.log(`\nTotal unique courses across all 5 departments: ${consolidated.length}`);

// Breakdown per department
['mech', 'civil', 'chem', 'aerospace', 'industrial'].forEach((d) => {
  const count = consolidated.filter((c) => c.departments.includes(d)).length;
  console.log(`- ${d}: ${count} courses`);
});

fs.writeFileSync(path.resolve('scripts/all-parsed-courses.json'), JSON.stringify(consolidated, null, 2), 'utf8');
console.log('Saved to scripts/all-parsed-courses.json');
