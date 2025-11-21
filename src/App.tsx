import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ui';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PlanEditor from './pages/PlanEditor';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MarketplacePage from './pages/MarketplacePage';
import PlanDetailPage from './pages/PlanDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { Analytics } from '@vercel/analytics/react';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-primary to-primary-50 flex items-center justify-center">
        <div className="text-text-tertiary">Lädt...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public route - redirect to dashboard if already logged in */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Protected routes with AppLayout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PlanEditor />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              <ProfilePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <SettingsPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace"
        element={
          <ProtectedRoute>
            <AppLayout>
              <MarketplacePage />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/marketplace/:planId"
        element={
          <ProtectedRoute>
            <AppLayout>
              <PlanDetailPage />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
          <ToastContainer />
          <Analytics />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
