import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/config/constants';

/**
 * Functional navbar scaffold for the Authentication phase.
 * Provides sign-in/sign-out and an admin-aware link so auth can be
 * exercised end-to-end. Full navigation (Browse/Upload/About) and the
 * final visual design land in the Pages & UI phase.
 */
export function Navbar() {
  const { currentUser, profile, isAdmin, signOutUser, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOutUser();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-surface-dark/80">
      <div className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-ink dark:text-ink-inverted">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm text-white">
            V
          </span>
          <span className="hidden sm:inline">{APP_NAME}</span>
        </Link>

        <div className="flex items-center gap-3">
          {loading ? null : currentUser && profile ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-black/10 px-2.5 py-1.5 text-sm font-medium text-ink transition hover:bg-surface-subtle dark:border-white/10 dark:text-ink-inverted dark:hover:bg-white/5"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt=""
                    className="h-6 w-6 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                )}
                <span className="hidden md:inline">{profile.displayName}</span>
                {isAdmin && (
                  <ShieldCheck
                    className="h-4 w-4 text-brand-600"
                    aria-label="Administrator"
                  />
                )}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 animate-fade-in rounded-xl border border-black/5 bg-white p-1.5 shadow-soft-lg dark:border-white/10 dark:bg-surface-dark-subtle"
                >
                  {isAdmin && (
                    <Link
                      to="/admin"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface-subtle dark:text-ink-inverted dark:hover:bg-white/5"
                    >
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface-subtle dark:text-ink-inverted dark:hover:bg-white/5"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-brand-600"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
