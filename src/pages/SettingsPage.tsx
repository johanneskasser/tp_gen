import { Card } from '../components/ui';
import { typography, cn } from '../lib/designSystem';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
      <header className="mb-6 sm:mb-8">
        <h1 className={cn(typography.h1, 'mb-2')}>{t('settings.title')}</h1>
        <p className={cn(typography.body, 'text-text-tertiary')}>
          {t('navigation.settings')} verwalten
        </p>
      </header>

      <div className="space-y-6">
        {/* Language Settings */}
        <Card variant="default">
          <div className="p-6">
            <h2 className={cn(typography.h3, 'mb-4')}>{t('settings.language')}</h2>
            <p className={cn(typography.bodySmall, 'text-text-tertiary mb-4')}>
              Wähle deine bevorzugte Sprache für die Benutzeroberfläche
            </p>
            <LanguageSwitcher variant="dropdown" showLabel={false} />
          </div>
        </Card>
      </div>
    </div>
  );
}
