import { useState } from 'react';
import { Card } from '../components/ui';
import { typography, cn } from '../lib/designSystem';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { Coffee, Heart, ExternalLink, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="settings-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="currentColor" className="text-primary-600" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#settings-grid)" />
        </svg>
      </div>

      <div className="relative container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Preferences Section */}
          <section className="space-y-3 sm:space-y-4">
            <h2 className={cn(typography.overline, 'text-text-tertiary px-1')}>
              {t('settings.sections.preferences')}
            </h2>

            {/* Language Settings Card */}
            <Card
              variant="default"
              onMouseEnter={() => setHoveredCard('language')}
              onMouseLeave={() => setHoveredCard(null)}
              className={cn(
                'group transition-all duration-300',
                hoveredCard === 'language' && 'shadow-md border-primary-200'
              )}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={cn(
                      'p-2 sm:p-2.5 rounded-lg transition-all duration-300 flex-shrink-0',
                      hoveredCard === 'language'
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                        : 'bg-blue-100'
                    )}>
                      <Globe className={cn(
                        'w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300',
                        hoveredCard === 'language' ? 'text-white' : 'text-blue-600'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn(typography.h4, 'mb-0.5 text-base sm:text-lg')}>
                        {t('settings.language')}
                      </h3>
                      <p className={cn(typography.bodySmall, 'text-text-tertiary hidden sm:block')}>
                        {t('settings.languageDescription')}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <LanguageSwitcher variant="dropdown" showLabel={false} />
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Support & Community Section */}
          <section className="space-y-3 sm:space-y-4">
            <h2 className={cn(typography.overline, 'text-text-tertiary px-1')}>
              {t('settings.sections.community')}
            </h2>

            {/* GitHub Card */}
            <a
              href="https://github.com/johanneskasser/tp_gen"
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={() => setHoveredCard('github')}
              onMouseLeave={() => setHoveredCard(null)}
              className="block"
            >
              <Card
                variant="default"
                className={cn(
                  'group transition-all duration-300 cursor-pointer',
                  hoveredCard === 'github' && 'shadow-md border-slate-300'
                )}
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={cn(
                        'p-2 sm:p-2.5 rounded-lg transition-all duration-300 flex-shrink-0',
                        hoveredCard === 'github'
                          ? 'bg-gradient-to-br from-slate-800 to-slate-900'
                          : 'bg-slate-100'
                      )}>
                        <svg
                          className={cn(
                            'w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300',
                            hoveredCard === 'github' ? 'text-white' : 'text-slate-700'
                          )}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(typography.h4, 'mb-0.5 text-base sm:text-lg')}>
                          {t('settings.support.github')}
                        </h3>
                        <p className={cn(typography.bodySmall, 'text-text-tertiary hidden sm:block')}>
                          {t('settings.support.githubDescription')}
                        </p>
                      </div>
                    </div>
                    <ExternalLink
                      className={cn(
                        'w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 flex-shrink-0',
                        hoveredCard === 'github'
                          ? 'text-slate-600 translate-x-0.5 -translate-y-0.5'
                          : 'text-slate-400'
                      )}
                    />
                  </div>
                </div>
              </Card>
            </a>

            {/* Buy Me a Coffee Card */}
            <Card
              variant="default"
              onMouseEnter={() => setHoveredCard('coffee')}
              onMouseLeave={() => setHoveredCard(null)}
              className={cn(
                'group transition-all duration-300 overflow-hidden',
                hoveredCard === 'coffee' && 'shadow-md border-yellow-300'
              )}
            >
              {/* Background gradient on hover */}
              <div className={cn(
                'absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-yellow-50 transition-opacity duration-500',
                hoveredCard === 'coffee' ? 'opacity-100' : 'opacity-0'
              )} />

              <div className="relative p-4 sm:p-5">
                {/* Icon and Title */}
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className={cn(
                    'p-2 sm:p-2.5 rounded-lg transition-all duration-300 flex-shrink-0',
                    hoveredCard === 'coffee'
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 scale-105'
                      : 'bg-yellow-100'
                  )}>
                    <Coffee className={cn(
                      'w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300',
                      hoveredCard === 'coffee' ? 'text-white' : 'text-yellow-600'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(typography.h4, 'mb-0.5 text-base sm:text-lg')}>
                      {t('settings.support.coffee')}
                    </h3>
                    <p className={cn(typography.bodySmall, 'text-text-tertiary hidden sm:block')}>
                      {t('settings.support.coffeeDescription')}
                    </p>
                  </div>
                </div>

                {/* Message Box */}
                <div className="mb-4 p-3 sm:p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-yellow-200/50">
                  <div className="flex items-start gap-2">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0 text-red-500 animate-pulse" />
                    <p className={cn(typography.bodySmall, 'text-text-secondary leading-relaxed text-xs sm:text-sm')}>
                      {t('settings.support.coffeeMessage')}
                    </p>
                  </div>
                </div>

                {/* CTA Button */}
                <a
                  href="https://buymeacoffee.com/johanneskasser"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'group/btn inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3',
                    'bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500',
                    'hover:from-yellow-500 hover:via-orange-500 hover:to-orange-600',
                    'text-white rounded-lg font-semibold shadow-md hover:shadow-lg',
                    'transition-all duration-300 hover:scale-[1.02]',
                    'border border-yellow-600/20 text-sm sm:text-base'
                  )}
                >
                  <Coffee className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
                  <span className="font-display">{t('settings.support.coffee')}</span>
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
                </a>

                {/* Decorative elements */}
                <div className={cn(
                  'absolute top-4 right-4 w-16 h-16 sm:w-20 sm:h-20 bg-yellow-300/10 rounded-full blur-2xl transition-opacity duration-500',
                  hoveredCard === 'coffee' ? 'opacity-100' : 'opacity-0'
                )} />
              </div>
            </Card>
          </section>

          {/* App Info Footer */}
          <div className="pt-6 sm:pt-8">
            <div className="flex items-center justify-center gap-2 text-text-tertiary">
              <p className={cn(typography.bodySmall, 'text-xs sm:text-sm')}>
                {t('settings.sections.footer')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
