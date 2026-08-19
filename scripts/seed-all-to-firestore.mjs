import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const KEY_PATH = path.resolve('scripts/firebase-admin-key.json');
const COURSES_PATH = path.resolve('scripts/all-parsed-courses.json');

const app = initializeApp({ credential: cert(KEY_PATH) });
const db = getFirestore(app);

const courses = JSON.parse(fs.readFileSync(COURSES_PATH, 'utf8'));

function generateWeeks(course) {
  const weeks = [];
  const numWeeks = 4;
  for (let w = 1; w <= numWeeks; w++) {
    weeks.push({
      id: `week-${w}`,
      weekNumber: w,
      title: `${course.title} - Module ${w}: Core Principles & Calculations`,
      isPublished: true,
      contentBlocks: [
        {
          type: 'heading',
          data: { text: `1. Overview of ${course.title} (Module ${w})` },
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

async function seedAll() {
  console.log(`Seeding ${courses.length} courses to Firestore...`);
  
  // 1. Clean up old non-relevant courses if any
  const existingSnap = await db.collection('courses').get();
  for (const doc of existingSnap.docs) {
    const data = doc.data();
    // if it's ece301 or only in ece
    if (doc.id === 'ece301' || doc.id === 'ece-306' || (data.departments && data.departments.length === 1 && data.departments[0] === 'ece')) {
      console.log(`Deleting legacy ECE course: ${doc.id}`);
      await db.collection('courses').doc(doc.id).delete();
    }
  }

  // 2. Upload all 146 courses
  let count = 0;
  for (const course of courses) {
    const weeks = generateWeeks(course);
    const courseData = {
      id: course.id,
      code: course.code,
      title: course.title,
      credits: course.credits,
      departments: course.departments,
      levels: course.levels,
      semester: course.semester || '1',
    };
    
    await db.collection('courses').doc(course.id).set(courseData, { merge: true });
    
    for (const week of weeks) {
      await db.collection('courses').doc(course.id).collection('weeks').doc(week.id).set(week, { merge: true });
    }
    count++;
    if (count % 20 === 0) {
      console.log(`Seeded ${count}/${courses.length} courses...`);
    }
  }
  
  console.log(`\nSuccessfully seeded all ${count} courses and their weekly modules to Firestore!`);
}

seedAll().catch(console.error);
