import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

const KEY_PATH = path.resolve('scripts/firebase-admin-key.json');

const app = initializeApp({ credential: cert(KEY_PATH) });
const db = getFirestore(app);
const adminAuth = getAuth(app);

async function createAccount() {
  const email = 'teststudent@lasu.edu.ng';
  const password = 'password123';
  const name = 'Samuel Adeleke';

  let userRecord;
  try {
    userRecord = await adminAuth.getUserByEmail(email);
    console.log('User already exists, updating password...');
    userRecord = await adminAuth.updateUser(userRecord.uid, {
      password,
      displayName: name,
    });
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      console.log('Creating new user in Firebase Auth...');
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: name,
      });
    } else {
      throw e;
    }
  }

  // Set Firestore document with onboarded: false
  await db.collection('users').doc(userRecord.uid).set({
    name,
    email,
    matric: '',
    department: '',
    level: '',
    role: 'student',
    onboarded: false, // ensures onboarding triggers on login
    enrolledCourses: [],
    createdAt: new Date(),
  }, { merge: true });

  console.log('\n=======================================');
  console.log('TEST ACCOUNT READY');
  console.log('=======================================');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log(`UID:      ${userRecord.uid}`);
  console.log(`Onboarded state: FALSE (will route to Onboarding)`);
  console.log('=======================================\n');
}

createAccount().catch(console.error);
