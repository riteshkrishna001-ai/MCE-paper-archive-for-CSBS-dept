import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppErrorBoundary } from '@/components/layout/AppErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { AppRouter } from '@/router';

/**
 * AppErrorBoundary is the outermost wrapper so it catches:
 *  - Firebase init errors (missing .env.local)
 *  - Any future render crash in auth, routing, or pages
 * Without it, any of the above would produce a completely blank screen
 * with no feedback for the user or developer.
 */
export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <div className="flex min-h-screen flex-col bg-surface text-ink dark:bg-surface-dark dark:text-ink-inverted">
            <Navbar />
            <main className="flex-1">
              <AppRouter />
            </main>
          </div>
          <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
