const fs = require('fs');
const path = require('path');

const text = fs.readFileSync(path.resolve('scripts/ccmas-text.txt'), 'utf8');

// The departments we want and their section markers in CCMAS
const DEPTS = [
  {
    id: 'aerospace',
    name: 'Aerospace Engineering',
    startMarker: 'B. Eng Aerospace Engineering',
    endMarker: 'B.Eng Agricultural and Biosystems Engineering',
  },
  {
    id: 'chem',
    name: 'Chemical Engineering',
    startMarker: 'B. Eng Chemical Engineering',
    endMarker: 'B. Eng Civil Engineering',
  },
  {
    id: 'civil',
    name: 'Civil Engineering',
    startMarker: 'B. Eng Civil Engineering',
    endMarker: 'B. Eng Computer Engineering',
  },
  {
    id: 'industrial',
    name: 'Industrial Engineering',
    startMarker: 'B. Eng Industrial and Production Engineering',
    endMarker: 'B. Eng Marine Engineering',
  },
  {
    id: 'mech',
    name: 'Mechanical Engineering',
    startMarker: 'B. Eng Mechanical Engineering',
    endMarker: 'B. Eng Mechatronic Engineering',
  },
];

function extractCoursesFromSection(sectionText, deptId) {
  const courses = [];
  const lines = sectionText.split('\n');
  
  let currentLevel = '100';
  let currentSemester = '1';
  
  // Regular expressions to detect level headers and course rows
  // Typical CCMAS pattern: Course Code (e.g. GST 111, MTH 101, AEE 301, CHE 301, CVE 301, IPE 301, MEE 301)
  const courseCodeRegex = /^([A-Z]{3})\s*(\d{3})\b/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check level headers
    if (line.match(/100\s*Level/i)) currentLevel = '100';
    else if (line.match(/200\s*Level/i)) currentLevel = '200';
    else if (line.match(/300\s*Level/i)) currentLevel = '300';
    else if (line.match(/400\s*Level/i)) currentLevel = '400';
    else if (line.match(/500\s*Level/i)) currentLevel = '500';
    
    if (line.match(/1st\s*Semester|First\s*Semester|Harmattan/i)) currentSemester = '1';
    else if (line.match(/2nd\s*Semester|Second\s*Semester|Rain/i)) currentSemester = '2';
    
    // Check if line matches a course code
    const match = line.match(courseCodeRegex);
    if (match) {
      const code = `${match[1]} ${match[2]}`;
      // In PDF text, the next tokens or next lines might be the title and credits
      // Let's inspect the line or surrounding lines
      let rest = line.slice(match[0].length).trim();
      
      // If the rest of the line contains title + units
      // Often in CCMAS: "GST 111 Communication in English 2 C" or Title on next line
      let title = rest;
      let credits = 2;
      
      // Extract credits if at end of string
      const unitMatch = rest.match(/(\d+)\s*(?:C|E|R|Compulsory|Elective)?\s*$/i);
      if (unitMatch) {
        credits = parseInt(unitMatch[1], 10) || 2;
        title = rest.replace(/(\d+)\s*(?:C|E|R|Compulsory|Elective)?\s*$/i, '').trim();
      }
      
      // If title is empty or short, check next line
      if (title.length < 3 && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (!nextLine.match(courseCodeRegex) && !nextLine.match(/Level|Semester|Total/i)) {
          title = nextLine;
        }
      }
      
      // Clean up title
      title = title.replace(/\s+/g, ' ').replace(/^[-:.]\s*/, '').trim();
      
      if (title.length >= 3 && !title.match(/^Course\s*Title/i)) {
        courses.push({
          code,
          title,
          credits: Math.min(6, Math.max(1, credits)),
          level: currentLevel,
          semester: currentSemester,
          department: deptId,
          rawLine: line,
        });
      }
    }
  }
  
  return courses;
}

const allExtracted = {};

DEPTS.forEach((dept) => {
  const startIdx = text.indexOf(dept.startMarker);
  const endIdx = text.indexOf(dept.endMarker, startIdx + 100);
  
  if (startIdx !== -1 && endIdx !== -1) {
    const section = text.substring(startIdx, endIdx);
    const courses = extractCoursesFromSection(section, dept.id);
    allExtracted[dept.id] = {
      name: dept.name,
      count: courses.length,
      courses,
    };
    console.log(`${dept.name}: extracted ${courses.length} courses`);
  } else {
    console.log(`Could not locate section for ${dept.name}`);
  }
});

fs.writeFileSync(path.resolve('scripts/extracted-courses.json'), JSON.stringify(allExtracted, null, 2), 'utf8');
console.log('Saved to scripts/extracted-courses.json');
