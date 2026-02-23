import { useAuth } from '../contexts/AuthContext';
import { OnboardingGuard } from './OnboardingGuard';
import { AppLayout } from './AppLayout';
import { PublicLayout } from './PublicLayout';

interface MarketplaceLayoutProps {
  children: React.ReactNode;
}

export function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-primary to-primary-50 flex items-center justify-center">
        <div className="text-text-tertiary">Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <OnboardingGuard>
        <AppLayout>{children}</AppLayout>
      </OnboardingGuard>
    );
  }

  return <PublicLayout>{children}</PublicLayout>;
}
