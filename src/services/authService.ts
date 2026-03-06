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

function assertFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Update src/services/firebase.ts with your project credentials.'
    );
  }
}

export async function register(email: string, password: string): Promise<User> {
  if (isE2EMode) {
    e2eAuthLogin();
    return e2eUser;
  }
  assertFirebaseConfigured();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'userStats', cred.user.uid), {
    currentStreak: 0,
    lastDepositMonth: '',
    badges: [],
    totalDeposits: 0,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function login(email: string, password: string): Promise<User> {
  if (isE2EMode) {
    e2eAuthLogin();
    return e2eUser;
  }
  assertFirebaseConfigured();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function resetPassword(email: string): Promise<void> {
  if (isE2EMode) {
    return;
  }
  assertFirebaseConfigured();
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
