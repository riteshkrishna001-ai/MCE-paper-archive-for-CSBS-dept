import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Browse from '@/pages/Browse';
import Upload from '@/pages/Upload';
import About from '@/pages/About';
import AdminDashboard from '@/pages/AdminDashboard';
import NotFound from '@/pages/NotFound';

/**
 * All application routes in one place. Page components are intentionally
 * minimal placeholders for now (except Home/Login) — they're filled in
 * during the Pages & UI phase. Route guards (auth/admin) are wired up
 * now so the access-control model is correct from the start.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/about" element={<About />} />

      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <Upload />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
