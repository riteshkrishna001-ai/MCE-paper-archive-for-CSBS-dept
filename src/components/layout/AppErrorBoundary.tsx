import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level Error Boundary.
 * Without this, any unhandled render error (including a Firebase init
 * crash from a missing .env.local) blanks the entire page — the browser
 * shows nothing and the user has no idea what went wrong.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isFirebaseConfigError =
      error.message.includes('Firebase') ||
      error.message.includes('projectId') ||
      error.message.includes('apiKey') ||
      error.message.includes('app/invalid');

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-16 text-center dark:bg-surface-dark">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8 dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-3 font-display text-xl font-bold text-red-700 dark:text-red-400">
            {isFirebaseConfigError ? 'Firebase not configured' : 'Something went wrong'}
          </h1>

          {isFirebaseConfigError ? (
            <div className="mt-4 text-left text-sm text-red-700/80 dark:text-red-400/80">
              <p className="font-semibold">Missing or invalid Firebase environment variables.</p>
              <p className="mt-2">To fix this:</p>
              <ol className="mt-2 list-inside list-decimal space-y-1">
                <li>
                  Copy <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">.env.example</code>{' '}
                  to{' '}
                  <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">.env.local</code>
                </li>
                <li>
                  Open your Firebase project → Project Settings → General → Your Apps → SDK setup
                </li>
                <li>Paste the config values into .env.local</li>
                <li>
                  Restart the dev server:{' '}
                  <code className="rounded bg-red-100 px-1 dark:bg-red-900/50">npm run dev</code>
                </li>
              </ol>
            </div>
          ) : (
            <div className="mt-4 text-sm text-red-700/80 dark:text-red-400/80">
              <p>An unexpected error occurred. Check the browser console for details.</p>
              <details className="mt-3 text-left">
                <summary className="cursor-pointer font-medium">Error details</summary>
                <pre className="mt-2 overflow-auto rounded bg-red-100 p-3 text-xs dark:bg-red-900/50">
                  {error.message}
                </pre>
              </details>
            </div>
          )}

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
