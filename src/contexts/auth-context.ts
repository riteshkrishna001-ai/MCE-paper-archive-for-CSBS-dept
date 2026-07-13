import { createContext } from 'react';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/types';

export interface AuthContextValue {
  /** Raw Firebase Auth user, or null if signed out. */
  currentUser: User | null;
  /** Firestore-backed profile (role, counters), or null if signed out / not yet loaded. */
  profile: UserProfile | null;
  /** True while the initial auth state is resolving — use to gate route guards. */
  loading: boolean;
  /** Convenience flag derived from `profile.role`. */
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
