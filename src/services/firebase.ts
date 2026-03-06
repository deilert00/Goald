// REPLACE these placeholder values with your own Firebase project config.
// Get them from: https://console.firebase.google.com → Project Settings → Your apps → Web app
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export const isFirebaseConfigured =
  firebaseConfig.apiKey !== 'YOUR_API_KEY' &&
  firebaseConfig.authDomain !== 'YOUR_AUTH_DOMAIN' &&
  firebaseConfig.projectId !== 'YOUR_PROJECT_ID' &&
  firebaseConfig.appId !== 'YOUR_APP_ID';

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
