import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface OnboardingGuardProps {
  children: ReactNode;
}

/**
 * OnboardingGuard checks if the user has completed onboarding
 * and redirects them to the onboarding page if not.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = () => {
      // Skip check if on onboarding page
      if (location.pathname === '/onboarding') {
        setIsChecking(false);
        return;
      }

      // If user is logged in but hasn't completed onboarding
      if (user && profile && !profile.onboarding_completed) {
        navigate('/onboarding', { replace: true });
      } else {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [user, profile, navigate, location.pathname]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-primary to-primary-50 flex items-center justify-center">
        <div className="text-text-tertiary">Lädt...</div>
      </div>
    );
  }

  return <>{children}</>;
}
