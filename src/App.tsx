import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RunnerProfileProvider } from './contexts/RunnerProfileContext';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ui';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import Dashboard from './pages/Dashboard';
import PlanEditor from './pages/PlanEditor';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MarketplacePage from './pages/MarketplacePage';
import PlanDetailPage from './pages/PlanDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import OnboardingPage from './pages/OnboardingPage';
import ProtectedRoute from './components/ProtectedRoute';
import { OnboardingGuard } from './components/OnboardingGuard';
import { AppLayout } from './components/AppLayout';
import { MarketplaceLayout } from './components/MarketplaceLayout';
import { Analytics } from '@vercel/analytics/react';
import './i18n/config'; // Initialize i18n
import { useTranslation } from 'react-i18next';

function AppRoutes() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-primary to-primary-50 flex items-center justify-center">
        <div className="text-text-tertiary">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing page - public route, redirect to dashboard if logged in */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />

      {/* Login page - public route */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Auth callback route - public */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Onboarding route - protected but without layout */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected routes with AppLayout and OnboardingGuard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan/:id"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppLayout>
                <PlanEditor />
              </AppLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      {/* Marketplace routes - public with conditional layout */}
      <Route
        path="/marketplace"
        element={
          <MarketplaceLayout>
            <MarketplacePage />
          </MarketplaceLayout>
        }
      />
      <Route
        path="/marketplace/:planId"
        element={
          <MarketplaceLayout>
            <PlanDetailPage />
          </MarketplaceLayout>
        }
      />
      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppLayout>
                <UserProfilePage />
              </AppLayout>
            </OnboardingGuard>
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
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <RunnerProfileProvider>
            <ToastProvider>
              <AppRoutes />
              <ToastContainer />
              <Analytics />
            </ToastProvider>
          </RunnerProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
