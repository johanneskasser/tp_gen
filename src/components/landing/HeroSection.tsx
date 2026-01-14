import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Play } from 'lucide-react';
import { Button } from '../ui';

export function HeroSection() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.015]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-primary-900"/>
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            {/* Headline */}
            <div
              className={`space-y-4 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-primary-900">
                {t('landing.hero.headline')}
              </h1>
              <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight bg-gradient-to-r from-blue-600 via-primary-600 to-blue-700 bg-clip-text text-transparent">
                {t('landing.hero.headlineAccent')}
              </h2>
            </div>

            {/* Subheadline */}
            <p
              className={`font-body text-lg sm:text-xl text-text-secondary max-w-2xl leading-relaxed transition-all duration-700 delay-100 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {t('landing.hero.subheadline')}
            </p>

            {/* CTAs */}
            <div
              className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <Link to="/login">
                <Button
                  variant="default"
                  size="lg"
                  className="group w-full sm:w-auto text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  {t('landing.hero.ctaPrimary')}
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
              </Link>
              <button
                onClick={() => scrollToSection('features')}
                className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold font-body text-primary-700 bg-white border-2 border-primary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              >
                <Play className="mr-2 group-hover:scale-110 transition-transform" size={20} />
                {t('landing.hero.ctaSecondary')}
              </button>
            </div>

            {/* Trust Indicators */}
            <div
              className={`flex flex-wrap items-center gap-6 text-sm text-text-tertiary transition-all duration-700 delay-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white"></div>
                </div>
                <span className="font-body font-medium">500+ runners</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★★★★★</span>
                <span className="font-body font-medium ml-1">4.8/5</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-body font-medium">100% kostenlos</span>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Element */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
          >
            {/* Floating Card with Chart Preview */}
            <div className="relative">
              {/* Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-primary-500/20 rounded-3xl blur-3xl"></div>

              {/* Main Card */}
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border border-primary-100 animate-float">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-primary-900">Marathon Training</h3>
                    <p className="text-sm text-text-tertiary font-body">12 Wochen · 45 km/Woche</p>
                  </div>
                  <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold font-body rounded-full">
                    Aktiv
                  </div>
                </div>

                {/* Mini Chart */}
                <div className="space-y-3">
                  <div className="flex items-end justify-between h-32 gap-2">
                    {[28, 32, 35, 38, 42, 45, 48, 42, 38, 35, 30, 20].map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-500 hover:from-blue-600 hover:to-blue-500"
                          style={{
                            height: `${height}%`,
                            animationDelay: `${i * 50}ms`
                          }}
                        ></div>
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-3 text-xs font-body">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-blue-400"></div>
                      <span className="text-text-secondary">Locker</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-orange-400"></div>
                      <span className="text-text-secondary">Intervall</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                      <span className="text-text-secondary">Lang</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border-light">
                  <div>
                    <div className="text-2xl font-bold font-mono text-primary-900">12</div>
                    <div className="text-xs text-text-tertiary font-body">Wochen</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono text-primary-900">45</div>
                    <div className="text-xs text-text-tertiary font-body">km/Woche</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono text-primary-900">72</div>
                    <div className="text-xs text-text-tertiary font-body">Sessions</div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-br from-orange-400 to-orange-600 text-white px-4 py-2 rounded-full shadow-lg font-display font-semibold text-sm animate-bounce-slow">
                PDF Export ✓
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add custom animations to global CSS */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
