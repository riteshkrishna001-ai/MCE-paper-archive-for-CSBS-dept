import { APP_NAME, COLLEGE_NAME, DEPARTMENT_NAME, TAGLINE } from '@/config/constants';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { currentUser, profile } = useAuth();

  return (
    <div className="container-page py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-brand-600">
        {COLLEGE_NAME} · {DEPARTMENT_NAME}
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold text-ink dark:text-ink-inverted sm:text-4xl">
        {APP_NAME}
      </h1>
      <p className="mt-3 text-ink-muted">{TAGLINE}</p>

      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-black/5 bg-white p-5 text-left text-sm shadow-soft dark:border-white/10 dark:bg-surface-dark-subtle">
        <p className="font-medium text-ink dark:text-ink-inverted">Auth phase status</p>
        {currentUser && profile ? (
          <p className="mt-1 text-ink-muted">
            Signed in as <strong>{profile.displayName}</strong> ({profile.email}) — role:{' '}
            <strong>{profile.role}</strong>
          </p>
        ) : (
          <p className="mt-1 text-ink-muted">Not signed in. Browsing is open to everyone.</p>
        )}
      </div>

      <p className="mt-10 text-xs text-ink-muted">
        Homepage hero, search, semester cards, and latest uploads arrive in the Pages &amp; UI
        phase.
      </p>
    </div>
  );
}
