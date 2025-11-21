import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { PageHeader } from './PageHeader';
import { cn } from '../lib/designSystem';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapsed state from localStorage (Desktop only)
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });

  // Detect desktop/mobile
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);

      // On mobile, close sidebar when resizing to desktop
      if (desktop) {
        setIsSidebarOpen(false);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save collapsed state to localStorage (Desktop only)
  useEffect(() => {
    if (isDesktop) {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, isDesktop]);

  const handleToggle = () => {
    if (isDesktop) {
      setIsCollapsed(!isCollapsed);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-primary-50">
      {/* Desktop Sidebar - Fixed left */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggle={handleToggle}
          isMobile={false}
        />
      </div>

      {/* Mobile Sidebar - Overlay from right */}
      {isSidebarOpen && !isDesktop && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="fixed inset-y-0 right-0 z-50 lg:hidden">
            <Sidebar
              isCollapsed={false}
              onToggle={() => setIsSidebarOpen(false)}
              isMobile={true}
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300',
          // Desktop: margin for sidebar
          isDesktop && (isCollapsed ? 'lg:ml-20' : 'lg:ml-64'),
          // Mobile: no margin
          !isDesktop && 'ml-0'
        )}
      >
        {/* Page Header */}
        <PageHeader
          onMenuClick={handleToggle}
          isMobileMenuOpen={isSidebarOpen}
        />

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
