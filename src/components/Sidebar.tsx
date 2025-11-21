import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Camera,
  Store,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn, typography, flex } from '../lib/designSystem';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function Sidebar({ isCollapsed, onToggle, isMobile = false }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [imageError, setImageError] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Marktplatz',
      href: '/marketplace',
      icon: Store,
    },
    {
      name: 'Profil',
      href: '/profile',
      icon: User,
    },
    {
      name: 'Einstellungen',
      href: '/settings',
      icon: Settings,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (name: string | null) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        'h-full bg-white border-border-light transition-all duration-300 flex flex-col',
        // Desktop: fixed left with toggle width
        !isMobile && 'fixed left-0 top-0 border-r',
        !isMobile && (isCollapsed ? 'w-20' : 'w-64'),
        // Mobile: full sidebar from right
        isMobile && 'w-64 shadow-2xl'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border-light">
        <div className={cn(flex.rowJustified)}>
          {!isCollapsed && (
            <h1 className={cn(typography.h3, 'text-primary-800')}>
              Trainingsplan
            </h1>
          )}
          {/* Desktop Toggle Button */}
          {!isMobile && (
            <button
              onClick={onToggle}
              className={cn(
                'p-2 rounded-lg hover:bg-background-tertiary transition-colors',
                isCollapsed && 'mx-auto'
              )}
              aria-label={isCollapsed ? 'Sidebar erweitern' : 'Sidebar einklappen'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-text-tertiary" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-text-tertiary" />
              )}
            </button>
          )}
          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-background-tertiary transition-colors"
              aria-label="Menü schließen"
            >
              <ChevronRight className="w-5 h-5 text-text-tertiary" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                active
                  ? 'bg-primary-100 text-primary-800 font-medium'
                  : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary',
                isCollapsed && 'justify-center'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0')} />
              {!isCollapsed && (
                <span className={cn(typography.body)}>{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border-light">
        <div className={cn(
          'rounded-lg hover:bg-background-tertiary transition-colors p-3',
          isCollapsed && 'p-2',
          flex.rowJustified
        )}>
          <Link
            to="/profile"
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {profile?.avatar_url && !imageError ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User'}
                  className={cn(
                    'rounded-full object-cover',
                    isCollapsed ? 'w-10 h-10' : 'w-12 h-12'
                  )}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div
                  className={cn(
                    'rounded-full bg-primary-200 flex items-center justify-center',
                    isCollapsed ? 'w-10 h-10' : 'w-12 h-12'
                  )}
                >
                  <span className={cn(typography.h4, 'text-primary-800')}>
                    {getInitials(profile?.full_name || null)}
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-success-text rounded-full border-2 border-white" />
            </div>

            {/* User Info */}
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className={cn(typography.bodySmall, 'font-semibold text-text-primary truncate')}>
                  {profile?.full_name || 'Unbenannt'}
                </p>
                <p className={cn(typography.caption, 'text-text-tertiary truncate')}>
                  {user?.email}
                </p>
              </div>
            )}
          </Link>

          {/* Logout Button */}
          {!isCollapsed && (
            <button
              onClick={handleSignOut}
              className={cn(
                'p-2 rounded-lg text-text-tertiary hover:bg-error-bg hover:text-error-text transition-all duration-150 flex-shrink-0',
                'focus:outline-none focus:ring-2 focus:ring-error-text focus:ring-offset-2'
              )}
              aria-label="Abmelden"
              title="Abmelden"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
