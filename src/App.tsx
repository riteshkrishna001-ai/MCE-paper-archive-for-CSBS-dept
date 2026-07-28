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
            <footer style={{
              textAlign: 'center',
              padding: '10px 0',
              fontSize: '0.78rem',
              letterSpacing: '0.04em',
              color: 'rgba(150,150,170,0.85)',
              background: 'rgba(20,20,30,0.72)',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(8px)',
              userSelect: 'none',
            }}>
              Made by <strong style={{ color: 'rgba(190,190,220,0.95)' }}>Ritesh Krishna</strong> &nbsp;|&nbsp; 4MC24CB038
            </footer>
          </div>
          <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
