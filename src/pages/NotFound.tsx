import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="font-display text-6xl font-extrabold text-brand-500">404</p>
      <h1 className="mt-2 text-xl font-semibold text-ink dark:text-ink-inverted">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        The page you're looking for doesn't exist, or may have moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-brand-600"
      >
        Back to home
      </Link>
    </div>
  );
}
