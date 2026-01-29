import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '../ui';

export function PublicCTABanner() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  if (user || dismissed) return null;

  const redirectPath = `/login?redirect=${encodeURIComponent(location.pathname)}`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 text-white border-t border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
        <p className="font-body text-sm sm:text-base text-white/90 flex-1">
          {t('publicCta.banner.text')}
        </p>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link to={redirectPath}>
            <Button
              variant="default"
              size="sm"
              className="bg-white text-slate-900 hover:bg-white/90 font-semibold whitespace-nowrap"
            >
              {t('publicCta.banner.button')}
            </Button>
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-white/60 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
