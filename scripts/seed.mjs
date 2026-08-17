import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

const KEY_PATH = path.resolve('scripts/firebase-admin-key.json');
const DATA_PATH = path.resolve('scripts/seed-data.json');

if (!fs.existsSync(KEY_PATH)) {
  console.error('Missing scripts/firebase-admin-key.json — download it from Firebase Console > Project settings > Service accounts > Generate new private key.');
  process.exit(1);
}

const app = initializeApp({ credential: cert(KEY_PATH) });
const db = getFirestore(app);
const adminAuth = getAuth(app);

const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const WEEK1_PULSE = {
  type: 'pulse_check',
  data: {
    title: 'Pulse Check: Optical Materials',
    questions: [
      { question: 'Which material is fundamental to fiber optic networks?', options: ['Copper', 'Glass', 'Graphite', 'Aluminium'], correctIndex: 1 },
      { question: 'Refraction bends light according to which law?', options: ["Coulomb's law", "Ohm's law", "Snell's law", "Faraday's law"], correctIndex: 2 },
      { question: 'Acrylic (PMMA) belongs to which class of optical materials?', options: ['Glass', 'Crystals', 'Polymers', 'Metals'], correctIndex: 2 },
    ],
  },
};

const WEEK1_EOQ = {
  type: 'eoq',
  data: {
    questions: [
      { question: 'Optical materials are substances that:', options: ['conduct electricity', 'interact with or manipulate light', 'resist mechanical stress', 'store magnetic charge'], correctIndex: 1 },
      { question: 'Which of the following is a natural optical crystal?', options: ['Calcium fluoride', 'Lithium niobate', 'Quartz', 'Borosilicate'], correctIndex: 2 },
      { question: 'The ratio of the permittivity of a material to the permittivity of free space is the:', options: ['dielectric strength', 'loss tangent', 'dielectric constant', 'polarization'], correctIndex: 2 },
      { question: 'The maximum electric field a dielectric can withstand without breaking down is its:', options: ['dielectric strength', 'refractive index', 'permittivity', 'dispersion'], correctIndex: 0 },
      { question: 'A low loss tangent value in a dielectric means:', options: ['high energy lost as heat', 'little energy lost as heat', 'high conductivity', 'poor insulation'], correctIndex: 1 },
      { question: 'Piezoelectricity generates an electric charge in response to:', options: ['temperature change', 'mechanical stress', 'light exposure', 'magnetic field'], correctIndex: 1 },
      { question: 'Which of these materials exhibits piezoelectricity naturally?', options: ['Quartz', 'Copper', 'Glass', 'Neodymium'], correctIndex: 0 },
      { question: 'The inverse piezoelectric effect means an electric field causes:', options: ['heat generation', 'light emission', 'mechanical deformation', 'magnetization'], correctIndex: 2 },
      { question: 'Materials that retain magnetization after the external field is removed are:', options: ['diamagnetic', 'paramagnetic', 'ferromagnetic', 'non-magnetic'], correctIndex: 2 },
      { question: 'Neodymium magnets (NdFeB) are examples of:', options: ['soft magnetic materials', 'hard magnetic materials', 'diamagnetic materials', 'optical polymers'], correctIndex: 1 },
    ],
  },
};

const WEEK2_PULSE = {
  type: 'pulse_check',
  data: {
    title: 'Pulse Check: Manufacturing Steps',
    questions: [
      { question: 'What is the main material used to make semiconductors?', options: ['Copper', 'Silicon', 'Quartz', 'Aluminium'], correctIndex: 1 },
      { question: 'Which step creates the oxide film on the wafer surface?', options: ['Etching', 'Photolithography', 'Oxidation', 'Packaging'], correctIndex: 2 },
      { question: 'The process that draws the circuit design onto the wafer is:', options: ['Photolithography', 'EDS', 'Metal wiring', 'Deposition'], correctIndex: 0 },
    ],
  },
};

const WEEK2_EOQ = {
  type: 'eoq',
  data: {
    questions: [
      { question: 'Semiconductor chips are manufactured mainly from:', options: ['silicon', 'copper', 'carbon', 'glass'], correctIndex: 0 },
      { question: 'Sand is heated into high-purity liquid and solidified by crystallization into a:', options: ['wafer', 'ingot', 'mask', 'die'], correctIndex: 1 },
      { question: 'Which step creates the oxide film that protects the wafer surface?', options: ['Etching', 'Oxidation', 'Packaging', 'EDS'], correctIndex: 1 },
      { question: 'Photolithography uses a light-sensitive material called:', options: ['photoresist', 'oxide', 'etchant', 'dopant'], correctIndex: 0 },
      { question: 'Wet etching uses which of the following?', options: ['plasma', 'chemical solutions', 'lasers', 'ion beams'], correctIndex: 1 },
      { question: 'Adding impurities to silicon to make it conduct is called:', options: ['oxidation', 'etching', 'doping', 'polishing'], correctIndex: 2 },
      { question: 'Why is copper avoided in semiconductor manufacturing?', options: ['it is too expensive', 'it diffuses into silicon and changes its properties', 'it does not conduct electricity', 'it cannot be deposited'], correctIndex: 1 },
      { question: 'EDS in chip manufacturing stands for:', options: ['Energy Dispersive Spectroscopy', 'Electrical Design System', 'Electron Deposition Stage', 'Engineering Data Source'], correctIndex: 0 },
      { question: 'Yield in semiconductor manufacturing is:', options: ['the testing time', 'percentage of prime chips relative to maximum chip count on a wafer', 'the wafer diameter', 'the number of packaging steps'], correctIndex: 1 },
      { question: 'The final step that cuts the wafer into individual chips is:', options: ['EDS', 'metal wiring', 'packaging', 'photolithography'], correctIndex: 2 },
    ],
  },
};

const WEEK1_FITB = { type: 'fitb', data: { prompt: 'The ratio of the permittivity of a material to the permittivity of free space is called the ______ constant.', answer: 'dielectric' } };
const WEEK2_FITB = { type: 'fitb', data: { prompt: 'The silicon rod produced by crystallization is called an ______.', answer: 'ingot' } };

const cleanQ = (s) => s.replace(/^\(?Q?\d+[a-z]*\)?/i, '').replace(/^\((i+|ii+|iii+|iv+|v+)\)\s*/i, '').trim();
const cleanA = (s) => (s || '').replace(/^[a-z]+\s*i{1,3}\.?/i, '').replace(/^\.\s*/, '').trim();

const practiceReveals = data.questions.slice(0, 12).map((q, i) => ({
  type: 'reveal',
  data: {
    statement: `${i + 1}. ${cleanQ(q.question)}`,
    explanation: cleanA(q.answer) || 'Refer to the notes above.',
  },
}));

data.weeks[0].contentBlocks = [
  ...data.weeks[0].contentBlocks,
  WEEK1_FITB,
  WEEK1_PULSE,
  { type: 'heading', data: { text: 'Practice Questions' } },
  ...practiceReveals,
  WEEK1_EOQ,
];

data.weeks[1].contentBlocks = [
  ...data.weeks[1].contentBlocks,
  WEEK2_FITB,
  WEEK2_PULSE,
  WEEK2_EOQ,
];

const lecturer = {
  name: 'Dr. A. Adeyemi',
  title: 'Senior Lecturer',
  faculty: 'Engineering',
  department: 'ece',
  email: 'adeyemi@lasu.edu.ng',
  officeHours: 'Mon & Wed, 10:00 – 12:00',
  bio: 'Senior lecturer in Electrical and Computer Engineering at LASU, specialising in electrical engineering materials. Research interests include dielectric materials, optical systems and semiconductor devices.',
  contactEnabled: true,
};

const LECTURER_EMAIL = 'lecturer@unifylearn.com';
const LECTURER_PASSWORD = 'Lecturer123!';

async function upsertLecturerUser() {
  let uid;
  try {
    const user = await adminAuth.getUserByEmail(LECTURER_EMAIL);
    uid = user.uid;
  } catch (e) {
    const created = await adminAuth.createUser({
      email: LECTURER_EMAIL,
      password: LECTURER_PASSWORD,
      displayName: 'Dr. A. Adeyemi',
    });
    uid = created.uid;
    console.log('Lecturer auth account created:', LECTURER_EMAIL, '/', LECTURER_PASSWORD);
  }

  const lecturerDoc = {
    ...lecturer,
    uid,
  };

  const courseDoc = {
    ...data.course,
    lecturers: [uid],
    weekAssignments: [{ lecturerId: uid, weeks: [1, 2] }],
  };

  await db.collection('lecturers').doc(uid).set(lecturerDoc);
  await db.collection('courses').doc(data.course.id).set(courseDoc);
  await db.collection('users').doc(uid).set({
    uid,
    email: LECTURER_EMAIL,
    name: 'Dr. A. Adeyemi',
    role: 'lecturer',
    onboarded: true,
    createdAt: new Date(),
  });
  console.log('Lecturer doc upserted:', uid);
  console.log('Lecturer user doc upserted');
  console.log('Course assigned to lecturer:', uid);
  return uid;
}

async function seed() {
  const lecturerUid = await upsertLecturerUser();

  const courseRef = db.collection('courses').doc(data.course.id);

  const now = Date.now();
  const announcements = [
    {
      id: 'ann-university-1',
      title: 'Second Semester Registration Deadline',
      body: 'Course registration for the 2025/2026 second semester closes on Friday. Ensure you complete your registration on the school portal before then.',
      scope: 'university',
      senderName: 'LASU Registry',
      senderRole: 'admin',
      createdAt: { seconds: Math.floor(now / 1000) - 3600 * 26 },
    },
    {
      id: 'ann-faculty-1',
      title: 'Faculty of Engineering Week',
      body: 'Engineering Week kicks off next Monday with the faculty orientation, lab demonstrations and the project defense schedule. Check the timetable for details.',
      scope: 'faculty',
      faculty: 'engineering',
      senderName: 'Faculty Office',
      senderRole: 'faculty-officer',
      createdAt: { seconds: Math.floor(now / 1000) - 3600 * 5 },
    },
    {
      id: 'ann-dept-1',
      title: 'ECE Departmental Seminar',
      body: 'The department seminar on "Semiconductor Industry in Nigeria" holds Thursday at 2pm in the ECE seminar room. Attendance is compulsory for 300 level.',
      scope: 'department',
      department: 'ece',
      senderName: 'HOD, ECE',
      senderRole: 'hod',
      createdAt: { seconds: Math.floor(now / 1000) - 3600 * 2 },
    },
    {
      id: 'ann-course-1',
      title: 'Quiz Rescheduled',
      body: 'The Week 1 mini quiz for ECE 301 has been moved to Wednesday. Review the Optical Materials notes before then.',
      scope: 'course',
      courseId: 'ece301',
      courseCode: 'ECE 301',
      lecturerName: 'Dr. A. Adeyemi',
      weekNumber: 1,
      senderName: 'Dr. A. Adeyemi',
      senderRole: 'lecturer',
      createdAt: { seconds: Math.floor(now / 1000) - 3600 },
    },
  ];

  for (const ann of announcements) {
    const { id, ...annData } = ann;
    await db.collection('announcements').doc(id).set({ ...annData, isActive: true });
    console.log('Announcement upserted:', id);
  }

  for (const week of data.weeks) {
    const weekRef = courseRef.collection('weeks').doc(week.id);
    const { id, ...weekData } = week;
    await weekRef.set(weekData);
    console.log('Week upserted:', week.id, '—', weekData.contentBlocks.length, 'blocks');
  }

  console.log('\nSeed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});