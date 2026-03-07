import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = process.env;

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:demo',
};

export const isFirebaseConfigured =
  !!env.EXPO_PUBLIC_FIREBASE_API_KEY &&
  !!env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  !!env.EXPO_PUBLIC_FIREBASE_PROJECT_ID &&
  !!env.EXPO_PUBLIC_FIREBASE_APP_ID;

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
