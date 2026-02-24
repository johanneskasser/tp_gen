import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import WeeklyChart from '../WeeklyChart';
import { sampleWeeks } from '../../data/sampleData';
import { SESSION_TYPE_CONFIG, getSessionTypeLabel, getSessionTypeColor } from '../../constants/sessionTypes';
import { SessionType } from '../../types';

export function InteractiveDemoSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const highlights = t('landing.interactive.highlights', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const highlightEmojis = ['📊', '🎯', '📈'];

  const tooltips: Record<string, string> = {
    easy: t('landing.interactive.tooltips.easy'),
    long: t('landing.interactive.tooltips.long'),
    intervals: t('landing.interactive.tooltips.intervals'),
    tempo: t('landing.interactive.tooltips.tempo'),
    recovery: t('landing.interactive.tooltips.recovery'),
    race: t('landing.interactive.tooltips.race'),
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
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

  // Get featured session types to display
  const featuredTypes: SessionType[] = ['easy', 'long', 'intervals', 'tempo', 'recovery', 'race'];

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-gradient-to-b from-white via-blue-50/30 to-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            className={`font-display font-bold text-4xl sm:text-5xl md:text-6xl text-primary-900 mb-4 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('landing.interactive.title')}
          </h2>
          <p
            className={`font-body text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('landing.interactive.description')}
          </p>
        </div>

        {/* Interactive Chart */}
        <div
          className={`mb-12 transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <WeeklyChart weeks={sampleWeeks} />
        </div>

        {/* Session Types Overview */}
        <div
          className={`transition-all duration-700 delay-400 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h3 className="font-display font-semibold text-2xl text-primary-900 mb-6 text-center">
            {t('landing.interactive.typesTitle')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {featuredTypes.map((type, index) => {
              const config = SESSION_TYPE_CONFIG[type];
              const colorClasses = getSessionTypeColor(type);
              return (
                <div
                  key={type}
                  className="group relative"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer ${colorClasses}`}
                  >
                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-full mb-2"
                      style={{ backgroundColor: config.chartColor }}
                    ></div>

                    {/* Label */}
                    <div className="font-body font-semibold text-sm">
                      {getSessionTypeLabel(type)}
                    </div>
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {tooltips[type]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Highlights */}
        <div
          className={`mt-12 grid md:grid-cols-3 gap-6 transition-all duration-700 delay-600 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          {highlights.map((h, i) => (
            <div key={i} className="bg-white rounded-xl p-6 border border-primary-100 shadow-sm">
              <div className="text-3xl mb-3">{highlightEmojis[i]}</div>
              <h4 className="font-display font-semibold text-lg text-primary-900 mb-2">{h.title}</h4>
              <p className="font-body text-text-secondary text-sm leading-relaxed">{h.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
