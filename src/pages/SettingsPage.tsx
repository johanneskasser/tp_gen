import { Card } from '../components/ui';
import { typography, cn } from '../lib/designSystem';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
      <header className="mb-6 sm:mb-8">
        <h1 className={cn(typography.h1, 'mb-2')}>Einstellungen</h1>
        <p className={cn(typography.body, 'text-text-tertiary')}>
          Verwalte deine App-Einstellungen
        </p>
      </header>

      <Card variant="default" className="text-center py-12">
        <Settings className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
        <h2 className={cn(typography.h2, 'mb-2')}>Einstellungen kommen bald</h2>
        <p className={cn(typography.body, 'text-text-tertiary')}>
          Dieser Bereich wird in Zukunft erweitert
        </p>
      </Card>
    </div>
  );
}
