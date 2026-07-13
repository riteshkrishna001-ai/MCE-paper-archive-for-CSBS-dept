import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/layout/FullPageSpinner';

/**
 * Wraps routes that require the `admin` role specifically.
 * Signed-out users are sent to /login; signed-in non-admins are sent
 * home rather than shown a confusing 403, since "Admin Dashboard" simply
 * isn't a destination they have any path to from the regular UI.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) return <FullPageSpinner label="Verifying admin access…" />;

  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
