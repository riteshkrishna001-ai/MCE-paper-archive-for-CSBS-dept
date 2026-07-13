import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/contexts/auth-context';

/** Reads the current auth state and actions. Must be used inside <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
}
