import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { cn, typography } from '../lib/designSystem';

interface PageHeaderProps {
  onMenuClick: () => void;
  isMobileMenuOpen?: boolean;
}

interface PageInfo {
  title: string;
  description: string;
}

const PAGE_TITLES: Record<string, PageInfo> = {
  '/dashboard': {
    title: 'Meine Trainingspläne',
    description: 'Verwalte und erstelle deine Trainingspläne',
  },
  '/marketplace': {
    title: 'Trainingsplan-Marktplatz',
    description: 'Entdecke und nutze Trainingspläne von anderen Läufern',
  },
  '/profile': {
    title: 'Profil',
    description: 'Verwalte deine Profil-Einstellungen',
  },
  '/settings': {
    title: 'Einstellungen',
    description: 'Passe deine App-Einstellungen an',
  },
};

const DEFAULT_PAGE_INFO: PageInfo = {
  title: 'Trainingsplan Generator',
  description: 'Erstelle und verwalte deine Trainingspläne',
};

export function PageHeader({ onMenuClick, isMobileMenuOpen }: PageHeaderProps) {
  const location = useLocation();

  const getPageInfo = (): PageInfo => {
    // Check exact match first
    if (PAGE_TITLES[location.pathname]) {
      return PAGE_TITLES[location.pathname];
    }

    // Check for dynamic routes
    if (location.pathname.startsWith('/plan/')) {
      const isNew = location.pathname === '/plan/new';
      return {
        title: isNew ? 'Neuer Trainingsplan' : 'Trainingsplan bearbeiten',
        description: isNew
          ? 'Erstelle deinen individuellen Trainingsplan'
          : 'Bearbeite und optimiere deinen Plan',
      };
    }

    if (location.pathname.startsWith('/marketplace/')) {
      return {
        title: 'Trainingsplan Details',
        description: 'Informationen und Details zum Trainingsplan',
      };
    }

    return DEFAULT_PAGE_INFO;
  };

  const pageInfo = getPageInfo();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-border-light shadow-sm">
      <div className="flex items-center gap-4 px-4 py-4">
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
          <p className={cn(typography.small, 'text-text-tertiary truncate')}>
            {pageInfo.description}
          </p>
        </div>
      </div>
    </header>
  );
}
