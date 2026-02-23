import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Coffee, Heart } from 'lucide-react';

export function Footer() {
  const { t, i18n } = useTranslation();

  return (
    <footer className="bg-slate-900 text-white/80 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <img
              src="/zenit-it_long_white.png"
              alt="zenit-it"
              className="h-8 w-auto mb-3"
            />
            <p className="font-body text-sm text-white/60 leading-relaxed">
              {t('landing.footer.tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-white mb-3">Links</h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <Link to="/marketplace" className="hover:text-white transition-colors">
                  {t('navigation.marketplace')}
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  {t('navigation.dashboard')}
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  {t('landing.nav.features')}
                </a>
              </li>
              <li>
                <a href="#roadmap" className="hover:text-white transition-colors">
                  {t('landing.nav.roadmap')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2 font-body text-sm">
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  {t('landing.footer.links.privacy')}
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  {t('landing.footer.links.terms')}
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition-colors">
                  {t('landing.footer.links.contact')}
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold text-white mb-3">{t('landing.footer.support.title')}</h4>
            <div className="space-y-4 font-body text-sm">
              {/* GitHub */}
              <div>
                <a
                  href="https://github.com/johanneskasser/tp_gen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span>{t('landing.footer.support.github')}</span>
                </a>
              </div>

              {/* Buy Me a Coffee */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-start gap-2 mb-2 text-white/60">
                  <Heart className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400/60" />
                  <p className="text-xs leading-relaxed">
                    {t('landing.footer.support.coffeeMessage')}
                  </p>
                </div>
                <a
                  href="https://buymeacoffee.com/johanneskasser"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-200/90 hover:text-yellow-100 rounded-lg transition-all hover:scale-105"
                >
                  <Coffee className="w-4 h-4" />
                  <span className="font-medium">{t('landing.footer.support.buyMeCoffee')}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-sm text-white/60">
            © 2026 zenit-it. {t('landing.footer.madeWith')}
          </p>
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'de' ? 'en' : 'de')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-body font-medium"
            >
              {i18n.language === 'de' ? 'Deutsch' : 'English'}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
