import { Platform } from 'react-native';
import { getAnalytics, logEvent as jsLogEvent, isSupported, Analytics } from 'firebase/analytics';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebaseConfig';

let webAnalytics: Analytics | null = null;
let webReady = false;

export const initAnalytics = async () => {
  if (Platform.OS !== 'web') return;
  try {
    if (await isSupported()) {
      webAnalytics = getAnalytics();
      webReady = true;
    }
  } catch (e) {
    console.warn('Web Analytics unavailable:', e);
  }
};

export const logEvent = async (event: string, params: Record<string, unknown> = {}) => {
  try {
    if (Platform.OS === 'web' && webReady && webAnalytics) {
      jsLogEvent(webAnalytics, event, params as Record<string, unknown>);
    }
    await addDoc(collection(db, '_analytics'), {
      event,
      ...params,
      uid: auth.currentUser?.uid ?? null,
      ts: serverTimestamp(),
    });
  } catch (e) {
    console.warn('Analytics event failed:', event, e);
  }
};

export const ANALYTICS_EVENTS = {
  appOpen: 'app_open',
  appBackgrounded: 'app_backgrounded',
  screenView: 'screen_view',
  signUpCompleted: 'sign_up_completed',
  weekOpen: 'week_open',
  blockScroll80: 'block_scroll_80',
  miniCheckAnswer: 'minicheck_answer',
  pulseCheckSubmitted: 'pulse_check_submitted',
  eoqSubmitted: 'eoq_submitted',
  eoqPassed: 'eoq_passed',
  eoqFailed: 'eoq_failed',
  weekUnlocked: 'week_unlocked',
  lecturerProfileOpen: 'lecturer_profile_open',
} as const;