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
    <div className="relative min-h-[200px]">
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl overflow-hidden">
        <div className="text-center px-3 py-4 max-w-[280px] w-full">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-4 h-4 text-primary-600" />
          </div>
          <p className="font-body text-sm text-text-primary font-medium mb-3 leading-tight">
            {t(`publicCta.gate.${featureKey}`)}
          </p>
          <Link to={redirectPath} className="block">
            <Button variant="default" size="sm" className="w-full mb-2">
              {t('publicCta.signUpFree')}
            </Button>
          </Link>
          <Link
            to={redirectPath}
            className="font-body text-xs text-primary-600 hover:underline inline-block"
          >
            {t('publicCta.alreadyHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
