import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';
import { isE2EMode } from '../config/runtime';
import { e2eUser, e2eAuthSubscribe, e2eAuthLogin, e2eAuthLogout } from './e2eStore';
import { trackEvent } from './telemetryService';

function assertFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_* environment variables.'
    );
  }
}

export async function register(email: string, password: string): Promise<User> {
  trackEvent('register_attempt', { e2e: isE2EMode });
  if (isE2EMode) {
    e2eAuthLogin();
    trackEvent('register_success', { e2e: true });
    return e2eUser;
  }
  assertFirebaseConfigured();
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'userStats', cred.user.uid), {
      currentStreak: 0,
      lastDepositMonth: '',
      badges: [],
      totalDeposits: 0,
      createdAt: serverTimestamp(),
    });
    trackEvent('register_success', { e2e: false });
    return cred.user;
  } catch (error) {
    trackEvent('register_fail', { e2e: false });
    throw error;
  }
}

export async function login(email: string, password: string): Promise<User> {
  trackEvent('login_attempt', { e2e: isE2EMode });
  if (isE2EMode) {
    e2eAuthLogin();
    trackEvent('login_success', { e2e: true });
    return e2eUser;
  }
  assertFirebaseConfigured();
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    trackEvent('login_success', { e2e: false });
    return cred.user;
  } catch (error) {
    trackEvent('login_fail', { e2e: false });
    throw error;
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (isE2EMode) {
    trackEvent('reset_password_requested', { e2e: true });
    return;
  }
  assertFirebaseConfigured();
  trackEvent('reset_password_requested', { e2e: false });
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logout(): Promise<void> {
  if (isE2EMode) {
    e2eAuthLogout();
    return;
  }
  await signOut(auth);
}

export function onAuthChanged(cb: (user: User | null) => void) {
  if (isE2EMode) {
    return e2eAuthSubscribe(cb);
  }
  return onAuthStateChanged(auth, cb);
}
