import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * Firebase configuration, sourced from environment variables so no secrets
 * are committed to source control. See .env.example for the required keys.
 *
 * Firebase web config values are NOT truly secret — they appear in any
 * deployed bundle. Real protection comes from Firestore/Storage Security
 * Rules, not from hiding these values.
 */

const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

type RequiredKey = (typeof REQUIRED_KEYS)[number];

/**
 * Throws a clear, human-readable error when env vars are missing, BEFORE
 * Firebase's own SDK throws a cryptic "Cannot read properties of undefined"
 * or "app/invalid-credential" error that is hard to trace back to a
 * missing .env.local file.
 */
function assertFirebaseConfig(): void {
  const missing: string[] = REQUIRED_KEYS.filter(
    (key) => !import.meta.env[key as RequiredKey],
  );

  if (missing.length > 0) {
    throw new Error(
      `Firebase configuration is incomplete. Missing environment variables:\n` +
        `  ${missing.join(', ')}\n\n` +
        `Steps to fix:\n` +
        `  1. Copy .env.example → .env.local\n` +
        `  2. Paste your Firebase project config values into .env.local\n` +
        `  3. Restart the dev server (npm run dev)\n\n` +
        `Get the values from: Firebase Console → Project Settings → Your Apps → SDK setup`,
    );
  }
}

assertFirebaseConfig();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID && {
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  }),
};

// Reuse an existing app instance during Vite HMR instead of re-initializing.
export const firebaseApp: FirebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp);
export const storage: FirebaseStorage = getStorage(firebaseApp);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Firestore collection name constants.
 * Centralized so a typo causes a compile error (missing import) rather
 * than silently creating a sibling collection in Firestore.
 */
export const COLLECTIONS = {
  USERS: 'users',
  PAPERS: 'papers',
  SUBJECTS: 'subjects',
  ACADEMIC_YEARS: 'academicYears',
} as const;
