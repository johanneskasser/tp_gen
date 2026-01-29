import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from '../ui';

interface AuthGateProps {
  children: React.ReactNode;
  featureKey?: string;
}

export function AuthGate({ children, featureKey = 'sessions' }: AuthGateProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (user) {
    return <>{children}</>;
  }

  const redirectPath = `/login?redirect=${encodeURIComponent(location.pathname)}`;

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl">
        <div className="text-center px-6 py-8 max-w-sm">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-primary-600" />
          </div>
          <p className="font-body text-text-primary font-medium mb-2">
            {t(`publicCta.gate.${featureKey}`)}
          </p>
          <Link to={redirectPath}>
            <Button variant="default" size="default" className="mt-3">
              {t('publicCta.signUpFree')}
            </Button>
          </Link>
          <p className="font-body text-xs text-text-tertiary mt-3">
            <Link to={redirectPath} className="text-primary-600 hover:underline">
              {t('publicCta.alreadyHaveAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
