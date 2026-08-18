const fs = require('fs');
const path = require('path');

const courses = JSON.parse(fs.readFileSync(path.resolve('scripts/all-parsed-courses.json'), 'utf8'));

// Generate weekly outlines for courses
function generateWeeks(course) {
  const weeks = [];
  const numWeeks = 4; // Generate 4 starter interactive weeks per course
  
  for (let w = 1; w <= numWeeks; w++) {
    weeks.push({
      id: `week-${w}`,
      weekNumber: w,
      title: `${course.title} - Module ${w}: Fundamentals & Principles Part ${w}`,
      isPublished: true,
      contentBlocks: [
        {
          type: 'heading',
          data: { text: `1. Overview of ${course.title} (Part ${w})` },
        },
        {
          type: 'paragraph',
          data: {
            text: `This module covers the core theoretical and practical principles of ${course.title} (${course.code}) as prescribed by the curriculum. Students are expected to master fundamental definitions, analytical derivations, and engineering applications.`,
          },
        },
        {
          type: 'definition',
          data: {
            term: `Core Concept: ${course.code} Module ${w}`,
            definition: `The systematic engineering methodology applied to solve complex problems in ${course.title}.`,
          },
        },
        {
          type: 'mcq',
          data: {
            question: `Which of the following is a primary objective of ${course.title} in Module ${w}?`,
            options: [
              'To understand fundamental equations and problem formulation',
              'To ignore safety and environmental standards',
              'To eliminate experimental testing entirely',
              'To avoid mathematical analysis in engineering design',
            ],
            correctIndex: 0,
          },
        },
        {
          type: 'eoq',
          data: {
            questions: [
              {
                question: `In the context of ${course.code}, what is the key consideration for Module ${w}?`,
                options: [
                  'Rigorous analysis and adherence to engineering specifications',
                  'Guessing dimensions without calculations',
                  'Skipping material properties verification',
                  'Excluding all design margins',
                ],
                correctIndex: 0,
              },
              {
                question: `Why is active recall and problem solving vital for ${course.title}?`,
                options: [
                  'To solidify understanding and achieve high retention for examinations and practical work',
                  'To memorize without understanding underlying physics',
                  'To pass without studying',
                  'It has no practical importance in engineering',
                ],
                correctIndex: 0,
              },
            ],
          },
        },
      ],
    });
  }
  
  return weeks;
}

const enrichedCourses = courses.map((c) => ({
  ...c,
  weeks: generateWeeks(c),
}));

// Build the TypeScript file content
let tsContent = `import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';

export interface SeedCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  departments: string[];
  levels: string[];
  semester?: string;
  lecturers?: string[];
  weeks: {
    id: string;
    weekNumber: number;
    title: string;
    isPublished: boolean;
    contentBlocks: any[];
  }[];
}

export const SAMPLE_COURSES: SeedCourse[] = ${JSON.stringify(enrichedCourses, null, 2)};

export const seedSampleCourses = async () => {
  try {
    for (const course of SAMPLE_COURSES) {
      const { weeks, ...courseData } = course;
      await setDoc(doc(db, 'courses', course.id), courseData, { merge: true });

      for (const week of weeks) {
        await setDoc(
          doc(db, 'courses', course.id, 'weeks', week.id),
          week,
          { merge: true }
        );
      }
    }
    console.log('Successfully seeded all 146 engineering courses!');
    return true;
  } catch (error) {
    console.error('Failed to seed sample courses:', error);
    return false;
  }
};
`;

fs.writeFileSync(path.resolve('src/lib/seedCourses.ts'), tsContent, 'utf8');
console.log('Successfully updated src/lib/seedCourses.ts with 146 courses across 5 departments!');
