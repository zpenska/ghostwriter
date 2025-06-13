// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Debugging: Log the config to make sure env vars are loaded
console.log('🔧 Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? 'Found' : 'Missing',
  authDomain: firebaseConfig.authDomain ? 'Found' : 'Missing',
  projectId: firebaseConfig.projectId ? 'Found' : 'Missing',
  storageBucket: firebaseConfig.storageBucket ? 'Found' : 'Missing',
});

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Development mode check
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser');
  console.log('🔑 API Key available:', !!firebaseConfig.apiKey);
  console.log('📁 Project ID:', firebaseConfig.projectId);
}

export default app;