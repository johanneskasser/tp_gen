import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Pencil, Github } from 'lucide-react';
import { analytics } from '../../utils/analytics';

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-blue-900" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main message */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/15 mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-white/90 uppercase tracking-widest">
              {t('landing.cta.badge')}
            </span>
          </div>

          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white mb-6 leading-tight">
            {t('landing.cta.headline')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500">
              {t('landing.cta.headlineAccent')}
            </span>
          </h2>

          <p className="font-body text-lg sm:text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('landing.cta.description')}
          </p>
        </div>

        {/* Dual CTA */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-12">
          {/* Primary: open editor */}
          <Link to="/editor" onClick={() => analytics.trackFinalCTAClicked('editor')}>
            <div className="group bg-white hover:bg-blue-50 text-slate-900 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer border border-white/20">
              <div className="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-xl mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Pencil size={18} className="text-white" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1">{t('landing.cta.primaryTitle')}</h3>
              <p className="text-slate-500 text-sm mb-4">{t('landing.cta.primarySubtitle')}</p>
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                {t('landing.cta.primaryCta')}
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Secondary: marketplace */}
          <Link to="/marketplace" onClick={() => analytics.trackFinalCTAClicked('marketplace')}>
            <div className="group bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-pointer border border-white/10 hover:border-white/25">
              <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-xl mx-auto mb-4 group-hover:scale-110 transition-transform border border-white/10">
                <Compass size={18} className="text-white" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1">{t('landing.cta.secondaryTitle')}</h3>
              <p className="text-white/50 text-sm mb-4">{t('landing.cta.secondarySubtitle')}</p>
              <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/80">
                {t('landing.cta.secondaryCta')}
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Open source note */}
        <div className="text-center">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
          >
            <Github size={15} />
            {t('landing.cta.openSource')}
          </a>
        </div>
      </div>
    </section>
  );
}
