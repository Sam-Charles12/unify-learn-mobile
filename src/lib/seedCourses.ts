import { collection, doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';

export const SAMPLE_COURSES = [
  {
    id: 'ece-306',
    code: 'ECE 306',
    title: 'Control Systems Engineering',
    credits: 3,
    departments: ['ece', 'computer'],
    levels: ['300'],
    lecturers: ['dr-mumuni'],
    weeks: [
      {
        id: 'week-1',
        weekNumber: 1,
        title: 'Introduction to Open & Closed-Loop Control Systems',
        isPublished: true,
        contentBlocks: [
          {
            type: 'heading',
            data: { text: '1. Fundamentals of Feedback Control' },
          },
          {
            type: 'paragraph',
            data: {
              text: 'Control engineering is based on the foundations of feedback theory and linear systems analysis. A control system consists of interconnected components configured to achieve a desired system response.',
            },
          },
          {
            type: 'definition',
            data: {
              term: 'Open-Loop vs Closed-Loop',
              definition:
                'An open-loop system computes its input to a system using only current state and system model without measuring output. A closed-loop system uses feedback to compare actual output against the reference setpoint.',
            },
          },
          {
            type: 'mcq',
            data: {
              question: 'Which of the following is a fundamental characteristic of closed-loop systems?',
              options: [
                'They are unaffected by system parameter variations',
                'They use output feedback to reduce system error',
                'They cannot become unstable',
                'They do not require sensor measurement',
              ],
              correctIndex: 1,
            },
          },
          {
            type: 'eoq',
            data: {
              questions: [
                {
                  question: 'What is the primary objective of a feedback control system?',
                  options: [
                    'To reduce system error between reference and output',
                    'To increase system cost',
                    'To eliminate all power consumption',
                    'To avoid using mathematical models',
                  ],
                  correctIndex: 0,
                },
                {
                  question: 'The transfer function of a linear time-invariant system is defined as:',
                  options: [
                    'Ratio of Laplace transform of output to input with zero initial conditions',
                    'Ratio of time domain output to time domain input',
                    'The derivative of the input signal',
                    'The steady-state error constant',
                  ],
                  correctIndex: 0,
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'mee-302',
    code: 'MEE 302',
    title: 'Fluid Mechanics & Turbomachinery',
    credits: 3,
    departments: ['mech', 'civil', 'chem', 'ece'],
    levels: ['300'],
    lecturers: ['engr-adebayo'],
    weeks: [
      {
        id: 'week-1',
        weekNumber: 1,
        title: 'Fluid Statics, Pressure & Manometry',
        isPublished: true,
        contentBlocks: [
          {
            type: 'heading',
            data: { text: '1. Hydrostatic Pressure Distribution' },
          },
          {
            type: 'paragraph',
            data: {
              text: 'In a static fluid, pressure increases linearly with depth due to the weight of the fluid column above.',
            },
          },
        ],
      },
    ],
  },
];

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
    console.log('Sample courses seeded successfully!');
    return true;
  } catch (error) {
    console.error('Failed to seed sample courses:', error);
    return false;
  }
};
