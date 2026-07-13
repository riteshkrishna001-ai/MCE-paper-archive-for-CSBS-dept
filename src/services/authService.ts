import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, type Unsubscribe } from 'firebase/firestore';
import { auth, googleProvider, db, COLLECTIONS } from '@/config/firebase';
import type { UserProfile } from '@/types';

/**
 * Authentication & user-profile service.
 *
 * Role model: every new sign-in is created as `role: 'student'`. There is
 * intentionally no self-service way to become an admin from the client —
 * an existing admin (or the project owner, via the Firebase console)
 * promotes a user by editing their `users/{uid}` document and setting
 * `role: 'admin'`. This keeps privilege escalation out of reach of client
 * code entirely, which Firestore Security Rules (Security phase) will
 * also enforce server-side.
 */

/** Opens the Google sign-in popup and ensures a matching Firestore profile exists. */
export async function signInWithGoogle(): Promise<UserProfile> {
  const credential = await signInWithPopup(auth, googleProvider);
  return ensureUserProfile(credential.user);
}

/** Signs the current user out of Firebase Auth. */
export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

/**
 * Fetches a user's Firestore profile by UID, or `null` if none exists yet.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, COLLECTIONS.USERS, uid));
  return snapshot.exists() ? (snapshot.data() as UserProfile) : null;
}

/**
 * Ensures a `users/{uid}` document exists for the given Firebase Auth user.
 * - First sign-in: creates the profile with role `student` and zeroed counters.
 * - Later sign-ins: keeps the existing role/counters, but refreshes
 *   `displayName` / `photoURL` / `email` in case they changed upstream
 *   (e.g. the student updated their Google account photo).
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, COLLECTIONS.USERS, user.uid);
  const existing = await getDoc(userRef);
  const now = Date.now();

  if (!existing.exists()) {
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? 'Unnamed Student',
      photoURL: user.photoURL ?? null,
      role: 'student',
      uploadCount: 0,
      approvedCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  }

  const current = existing.data() as UserProfile;
  const refreshedFields: Partial<UserProfile> = {
    displayName: user.displayName ?? current.displayName,
    photoURL: user.photoURL ?? current.photoURL,
    email: user.email ?? current.email,
    updatedAt: now,
  };
  await updateDoc(userRef, refreshedFields);
  return { ...current, ...refreshedFields };
}

/** Subscribes to Firebase Auth state changes. Returns an unsubscribe function. */
export function subscribeToAuthChanges(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

/**
 * Subscribes to live updates on a user's Firestore profile (e.g. so an
 * admin promotion takes effect immediately without requiring re-login).
 */
export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void,
): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.USERS, uid), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
  });
}
