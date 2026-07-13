import type { UserRole } from './common.types';

/**
 * Mirrors a document in the `users` Firestore collection, keyed by the
 * Firebase Auth UID. Created on a user's first sign-in (see authService).
 */
export interface UserProfile {
  /** Firebase Auth UID — also the Firestore document ID. */
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  /** Total papers ever submitted by this user, regardless of status. */
  uploadCount: number;
  /** Papers from this user currently in `approved` status. */
  approvedCount: number;
  createdAt: number;
  updatedAt: number;
}

/** Lightweight shape used when first creating a profile, before counters exist. */
export type NewUserProfileInput = Pick<UserProfile, 'uid' | 'email' | 'displayName' | 'photoURL'>;
