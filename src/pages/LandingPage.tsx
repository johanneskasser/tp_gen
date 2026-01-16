import { useEffect } from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { EaseOfUseShowcase } from '../components/landing/EaseOfUseShowcase';
import { CalendarOrbitSection } from '../components/landing/CalendarOrbitSection';
import { InteractiveDemoSection } from '../components/landing/InteractiveDemoSection';
import { ICalDemoSection } from '../components/landing/ICalDemoSection';
import { IndependenceSection } from '../components/landing/IndependenceSection';
import { VideosSection } from '../components/landing/VideosSection';
import { StatsSection } from '../components/landing/StatsSection';
import { RoadmapSection } from '../components/landing/RoadmapSection';
import { CTASection } from '../components/landing/CTASection';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <LandingNavbar />

      {/* Main Content */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <EaseOfUseShowcase />
        <CalendarOrbitSection />
        <InteractiveDemoSection />
        <ICalDemoSection />
        <IndependenceSection />
        <VideosSection />
        <StatsSection />
        <RoadmapSection />
        <CTASection />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white/80 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
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
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-sm text-white/60">
              © 2024 zenit-it. {t('landing.footer.madeWith')}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => i18n.changeLanguage(i18n.language === 'de' ? 'en' : 'de')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors font-body font-medium"
              >
                {i18n.language === 'de' ? '🇩🇪 Deutsch' : '🇬🇧 English'}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
