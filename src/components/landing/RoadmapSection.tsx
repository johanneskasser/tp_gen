import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Watch, Sparkles, Users, Smartphone } from 'lucide-react';

interface RoadmapCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
  isVisible: boolean;
  comingSoonText: string;
}

function RoadmapCard({ icon, title, description, delay, isVisible, comingSoonText }: RoadmapCardProps) {
  return (
    <div
      className={`relative bg-white rounded-2xl p-8 border border-primary-100 shadow-md transition-all duration-700 hover:shadow-xl hover:-translate-y-1 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Coming Soon Badge */}
      <div className="absolute -top-3 -right-3">
        <div className="px-4 py-1.5 bg-gradient-to-r from-orange-400 to-orange-600 text-white text-xs font-semibold font-body rounded-full shadow-lg">
          {comingSoonText}
        </div>
      </div>

      {/* Icon */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-blue-100 text-primary-600">
          {icon}
        </div>
      </div>

      {/* Content */}
      <h3 className="font-display font-semibold text-xl mb-3 text-primary-900">
        {title}
      </h3>
      <p className="font-body text-text-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function RoadmapSection() {
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

  const roadmapItems = [
    {
      icon: <Watch size={28} strokeWidth={2} />,
      title: t('landing.roadmap.smartwatchIntegration.title'),
      description: t('landing.roadmap.smartwatchIntegration.description'),
    },
    {
      icon: <Sparkles size={28} strokeWidth={2} />,
      title: t('landing.roadmap.aiPlanning.title'),
      description: t('landing.roadmap.aiPlanning.description'),
    },
    {
      icon: <Users size={28} strokeWidth={2} />,
      title: t('landing.roadmap.coaching.title'),
      description: t('landing.roadmap.coaching.description'),
    },
    {
      icon: <Smartphone size={28} strokeWidth={2} />,
      title: t('landing.roadmap.mobileApps.title'),
      description: t('landing.roadmap.mobileApps.description'),
    },
  ];

  return (
    <section
      id="roadmap"
      ref={sectionRef}
      className="py-20 md:py-32 bg-gradient-to-b from-white via-primary-50/30 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            className={`font-display font-bold text-4xl sm:text-5xl md:text-6xl text-primary-900 mb-4 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('landing.roadmap.title')}
          </h2>
          <p
            className={`font-body text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('landing.roadmap.subtitle')}
          </p>
        </div>

        {/* Roadmap Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {roadmapItems.map((item, index) => (
            <RoadmapCard
              key={index}
              icon={item.icon}
              title={item.title}
              description={item.description}
              delay={index * 150}
              isVisible={isVisible}
              comingSoonText={t('landing.roadmap.comingSoon')}
            />
          ))}
        </div>

        {/* Additional Info */}
        <div
          className={`mt-16 text-center transition-all duration-700 delay-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <p className="font-body text-text-tertiary">
            Hast du Ideen für weitere Features?{' '}
            <a href="mailto:feedback@trainingsplan.de" className="text-primary-600 hover:text-primary-700 font-medium underline">
              Lass es uns wissen!
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
