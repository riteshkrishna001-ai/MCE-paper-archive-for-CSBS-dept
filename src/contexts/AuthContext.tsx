import { useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import toast from 'react-hot-toast';
import type { UserProfile } from '@/types';
import {
  signInWithGoogle as signInWithGoogleService,
  signOutUser as signOutUserService,
  subscribeToAuthChanges,
  subscribeToUserProfile,
} from '@/services/authService';
import { AuthContext, type AuthContextValue } from '@/contexts/auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    // Safety net: if onAuthStateChanged never fires within 8 seconds
    // (e.g. network offline, Firebase project suspended), stop blocking
    // the UI so the user sees something instead of a blank/spinner forever.
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 8000);

    const unsubscribeAuth = subscribeToAuthChanges((user) => {
      clearTimeout(safetyTimer);
      unsubscribeProfile?.();
      setCurrentUser(user);

      if (user) {
        unsubscribeProfile = subscribeToUserProfile(user.uid, (nextProfile) => {
          setProfile(nextProfile);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithGoogleService();
      toast.success('Signed in successfully.');
    } catch (error) {
      toast.error('Sign-in failed. Please try again.');
      throw error;
    }
  };

  const signOutUser = async () => {
    try {
      await signOutUserService();
      toast.success('Signed out.');
    } catch (error) {
      toast.error('Sign-out failed. Please try again.');
      throw error;
    }
  };

  const value: AuthContextValue = {
    currentUser,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    signInWithGoogle,
    signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
