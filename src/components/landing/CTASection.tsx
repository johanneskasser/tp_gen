import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '../ui';

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-blue-900"></div>

      {/* Animated Background Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Radial Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20"></div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Headline */}
        <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 animate-fade-in">
          {t('landing.finalCta.headline')}
        </h2>

        {/* Subheadline */}
        <p className="font-body text-lg sm:text-xl text-white/80 mb-12 max-w-2xl mx-auto animate-fade-in animation-delay-100">
          {t('landing.finalCta.subheadline')}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in animation-delay-200">
          <Link to="/login">
            <Button
              variant="default"
              size="lg"
              className="group w-full sm:w-auto text-lg font-semibold bg-white text-primary-900 hover:bg-white/90 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            >
              {t('landing.finalCta.cta')}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Button>
          </Link>

          <Link to="/marketplace">
            <button className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold font-body text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg hover:bg-white/20 hover:border-white/50 transition-all duration-300 hover:-translate-y-1">
              <Compass className="mr-2 group-hover:rotate-12 transition-transform" size={20} />
              {t('landing.finalCta.secondary')}
            </button>
          </Link>
        </div>

        {/* Trust Badge */}
        <div className="mt-12 inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 animate-fade-in animation-delay-300">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="font-body font-medium text-white/90">
            100% Kostenlos · Keine Kreditkarte erforderlich
          </span>
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/10 to-transparent"></div>
    </section>
  );
}
