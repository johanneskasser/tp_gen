import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Download, Users, Cloud } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  isVisible: boolean;
}

function FeatureCard({ icon, title, description, delay, isVisible }: FeatureCardProps) {
  return (
    <div
      className={`group relative bg-white rounded-2xl p-8 border border-primary-100 hover:border-primary-300 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Icon Container */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-primary-600 text-white group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>

      {/* Content */}
      <h3 className="font-display font-semibold text-xl mb-3 text-primary-900 group-hover:text-blue-600 transition-colors">
        {title}
      </h3>
      <p className="font-body text-text-secondary leading-relaxed">
        {description}
      </p>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-primary-500/0 group-hover:from-blue-500/5 group-hover:to-primary-500/5 rounded-2xl transition-all duration-500 pointer-events-none"></div>
    </div>
  );
}

export function FeaturesSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const features = [
    {
      icon: <Brain size={28} strokeWidth={2} />,
      title: t('landing.features.smartPlanning.title'),
      description: t('landing.features.smartPlanning.description'),
    },
    {
      icon: <Download size={28} strokeWidth={2} />,
      title: t('landing.features.exportAnywhere.title'),
      description: t('landing.features.exportAnywhere.description'),
    },
    {
      icon: <Users size={28} strokeWidth={2} />,
      title: t('landing.features.marketplace.title'),
      description: t('landing.features.marketplace.description'),
    },
    {
      icon: <Cloud size={28} strokeWidth={2} />,
      title: t('landing.features.autoSync.title'),
      description: t('landing.features.autoSync.description'),
    },
  ];

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-20 md:py-32 bg-gradient-to-b from-white via-slate-50/50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            className={`font-display font-bold text-4xl sm:text-5xl md:text-6xl text-primary-900 mb-4 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('landing.features.title')}
          </h2>
          <p
            className={`font-body text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('landing.features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={index * 100}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Additional Info */}
        <div
          className={`mt-16 text-center transition-all duration-700 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-full border border-green-200/50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-body font-medium text-text-secondary">
              Alle Features sind 100% kostenlos, ohne versteckte Kosten
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
