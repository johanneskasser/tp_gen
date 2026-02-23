import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Plus } from 'lucide-react';
import { cn, typography } from '../lib/designSystem';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';

interface PageHeaderProps {
  onMenuClick: () => void;
  isMobileMenuOpen?: boolean;
}

interface PageInfo {
  title: string;
  description: string;
}

export function PageHeader({ onMenuClick, isMobileMenuOpen }: PageHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getPageInfo = (): PageInfo => {
    const pathname = location.pathname;

    // Exact matches
    const pageTitles: Record<string, PageInfo> = {
      '/dashboard': {
        title: t('dashboard.title'),
        description: 'Verwalte und erstelle deine Trainingspläne',
      },
      '/marketplace': {
        title: t('marketplace.title'),
        description: t('marketplace.subtitle'),
      },
      '/profile': {
        title: t('profile.title'),
        description: 'Verwalte deine Profil-Einstellungen',
      },
      '/settings': {
        title: t('settings.title'),
        description: 'Passe deine App-Einstellungen an',
      },
    };

    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }

    // Check for dynamic routes
    if (pathname.startsWith('/plan/')) {
      const isNew = pathname === '/plan/new';
      return {
        title: isNew ? 'Neuer Trainingsplan' : 'Trainingsplan bearbeiten',
        description: isNew
          ? 'Erstelle deinen individuellen Trainingsplan'
          : 'Bearbeite und optimiere deinen Plan',
      };
    }

    if (pathname.startsWith('/marketplace/')) {
      return {
        title: 'Trainingsplan Details',
        description: 'Informationen und Details zum Trainingsplan',
      };
    }

    return {
      title: t('app.title'),
      description: 'Erstelle und verwalte deine Trainingspläne',
    };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-border-light shadow-sm">
      <div className="flex items-center gap-4 px-4 h-[72px]">
        {/* Menu Toggle Button */}
        <button
          onClick={onMenuClick}
          className={cn(
            'p-2 rounded-lg transition-colors lg:hidden',
            'hover:bg-primary-50 active:bg-primary-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-400',
            isMobileMenuOpen && 'bg-primary-100'
          )}
          aria-label={isMobileMenuOpen ? 'Menü schließen' : 'Menü öffnen'}
        >
          <Menu size={24} className="text-text-primary" />
        </button>

        {/* Desktop Toggle - Hidden on mobile */}
        <button
          onClick={onMenuClick}
          className={cn(
            'hidden lg:block p-2 rounded-lg transition-colors',
            'hover:bg-primary-50 active:bg-primary-100',
            'focus:outline-none focus:ring-2 focus:ring-primary-400'
          )}
          aria-label="Seitenmenü umschalten"
        >
          <Menu size={20} className="text-text-primary" />
        </button>

        {/* Page Title & Description */}
        <div className="flex-1 min-w-0">
          <h1 className={cn(typography.h2, 'mb-0.5 truncate')}>{pageInfo.title}</h1>
          <p className={cn(typography.bodySmall, 'text-text-tertiary truncate')}>
            {pageInfo.description}
          </p>
        </div>

        {/* "Neuen Plan erstellen" Button - only on Dashboard */}
        {location.pathname === '/dashboard' && (
          <Button
            onClick={() => navigate('/plan/new')}
            className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 rounded-xl px-4 sm:px-6 py-2 sm:py-2.5 font-semibold flex items-center gap-2 flex-shrink-0"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">
              {t('dashboard.createNewPlan')}
            </span>
            <span className="sm:hidden">Neu</span>
          </Button>
        )}
      </div>
    </header>
  );
}
