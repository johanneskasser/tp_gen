import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { cn, typography } from '../lib/designSystem';

interface LanguageSwitcherProps {
  variant?: 'inline' | 'dropdown';
  showLabel?: boolean;
}

export function LanguageSwitcher({ variant = 'inline', showLabel = true }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (variant === 'dropdown') {
    return (
      <div className="flex items-center gap-2">
        {showLabel && (
          <label className={cn(typography.bodySmall, 'text-text-secondary')}>
            {t('settings.language')}
          </label>
        )}
        <select
          value={i18n.language}
          onChange={(e) => changeLanguage(e.target.value)}
          className={cn(
            'px-3 py-2 rounded-lg border border-border-light',
            'bg-white text-text-primary',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-colors duration-fast',
            typography.body
          )}
        >
          <option value="de">🇩🇪 Deutsch</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <Languages className="w-5 h-5 text-text-tertiary" />
      )}
      <div className="flex gap-1 rounded-lg border border-border-light p-1 bg-background-secondary">
        <button
          onClick={() => changeLanguage('de')}
          className={cn(
            'px-3 py-1.5 rounded-md transition-all duration-fast',
            typography.bodySmall,
            'font-medium',
            i18n.language === 'de'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/50'
          )}
        >
          DE
        </button>
        <button
          onClick={() => changeLanguage('en')}
          className={cn(
            'px-3 py-1.5 rounded-md transition-all duration-fast',
            typography.bodySmall,
            'font-medium',
            i18n.language === 'en'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-text-secondary hover:text-text-primary hover:bg-white/50'
          )}
        >
          EN
        </button>
      </div>
    </div>
  );
}
