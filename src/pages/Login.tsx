import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME, COLLEGE_NAME, DEPARTMENT_NAME } from '@/config/constants';

interface LocationState {
  from?: { pathname: string };
}

export default function Login() {
  const { currentUser, signInWithGoogle, loading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Already signed in — bounce straight to where they came from (or home).
  if (!loading && currentUser) {
    const state = location.state as LocationState | null;
    return <Navigate to={state?.from?.pathname ?? '/'} replace />;
  }

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      const state = location.state as LocationState | null;
      navigate(state?.from?.pathname ?? '/', { replace: true });
    } catch {
      // Toast feedback is already handled inside AuthContext.
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-slide-up rounded-2xl border border-black/5 bg-white p-8 text-center shadow-soft-lg dark:border-white/10 dark:bg-surface-dark-subtle">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10">
          <GraduationCap className="h-6 w-6 text-brand-600" aria-hidden="true" />
        </div>

        <h1 className="font-display text-xl font-bold text-ink dark:text-ink-inverted">
          Sign in to {APP_NAME}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          For {DEPARTMENT_NAME} students at {COLLEGE_NAME}. Sign in with your Google
          account to upload papers and track your contributions.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-soft transition hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-surface-dark dark:text-ink-inverted dark:hover:bg-white/5"
        >
          {isSigningIn ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
          {isSigningIn ? 'Signing in…' : 'Continue with Google'}
        </button>

        <p className="mt-5 text-xs text-ink-muted">
          You can browse and download approved papers without signing in.
          Sign-in is only required to upload.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v2.97h3.86c2.26-2.09 3.56-5.17 3.56-8.79z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-2.97c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.07C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.31a7.18 7.18 0 0 1 0-4.62V6.62H1.27a11.96 11.96 0 0 0 0 10.76l4-3.07z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.18 15.24 0 12 0 7.31 0 3.26 2.7 1.27 6.62l4 3.07C6.22 6.84 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}
