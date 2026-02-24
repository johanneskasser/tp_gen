import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine, BarChart2, Shield, Users } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  label: string;
  title: string;
  description: string;
  detail: string;
  accentColor: string;
  delay: number;
  isVisible: boolean;
}

function FeatureCard({
  icon,
  label,
  title,
  description,
  detail,
  accentColor,
  delay,
  isVisible,
}: FeatureCardProps) {
  return (
    <div
      className={`group relative bg-white rounded-2xl p-8 border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Label */}
      <div className="mb-5">
        <span className={`text-xs font-bold uppercase tracking-widest ${accentColor}`}>
          {label}
        </span>
      </div>

      {/* Icon */}
      <div className="mb-5">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>

      {/* Content */}
      <h3 className="font-display font-bold text-xl mb-2 text-slate-900 group-hover:text-blue-700 transition-colors leading-tight">
        {title}
      </h3>
      <p className="font-body text-slate-500 leading-relaxed text-sm mb-4">{description}</p>

      {/* Detail chip */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
        <span className="text-xs font-medium text-slate-600">{detail}</span>
      </div>

      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-slate-500/0 group-hover:from-blue-500/3 group-hover:to-slate-500/3 rounded-2xl transition-all duration-500 pointer-events-none" />
    </div>
  );
}

export function FeaturesSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const features = [
    {
      icon: <PenLine size={22} strokeWidth={2} />,
      label: t('landing.features.cards.editor.label'),
      title: t('landing.features.cards.editor.title'),
      description: t('landing.features.cards.editor.description'),
      detail: t('landing.features.cards.editor.detail'),
      accentColor: 'text-blue-600',
    },
    {
      icon: <BarChart2 size={22} strokeWidth={2} />,
      label: t('landing.features.cards.calculations.label'),
      title: t('landing.features.cards.calculations.title'),
      description: t('landing.features.cards.calculations.description'),
      detail: t('landing.features.cards.calculations.detail'),
      accentColor: 'text-emerald-600',
    },
    {
      icon: <Shield size={22} strokeWidth={2} />,
      label: t('landing.features.cards.openSource.label'),
      title: t('landing.features.cards.openSource.title'),
      description: t('landing.features.cards.openSource.description'),
      detail: t('landing.features.cards.openSource.detail'),
      accentColor: 'text-orange-600',
    },
    {
      icon: <Users size={22} strokeWidth={2} />,
      label: t('landing.features.cards.marketplace.label'),
      title: t('landing.features.cards.marketplace.title'),
      description: t('landing.features.cards.marketplace.description'),
      detail: t('landing.features.cards.marketplace.detail'),
      accentColor: 'text-purple-600',
    },
  ];

  const trustItems = [
    t('landing.features.trust.free'),
    t('landing.features.trust.noAccount'),
    t('landing.features.trust.openSource'),
    t('landing.features.trust.madeIn'),
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  return (
    <section id="features" ref={sectionRef} className="py-20 md:py-32 bg-gradient-to-b from-white via-slate-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full mb-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <span className="text-xs font-bold text-white uppercase tracking-widest">{t('landing.features.badge')}</span>
          </div>
          <h2
            className={`font-display font-bold text-4xl sm:text-5xl md:text-6xl text-slate-900 mb-4 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('landing.features.title')}<br />
            <span className="text-blue-600">{t('landing.features.titleAccent')}</span>
          </h2>
          <p
            className={`font-body text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('landing.features.description')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              label={feature.label}
              title={feature.title}
              description={feature.description}
              detail={feature.detail}
              accentColor={feature.accentColor}
              delay={index * 100}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Bottom trust bar */}
        <div
          className={`mt-16 flex flex-wrap justify-center gap-4 transition-all duration-700 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {trustItems.map((item) => (
            <div
              key={item}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm"
            >
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-xs font-medium text-slate-600">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
