import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

export function USPSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activePoints, setActivePoints] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Trigger sequential checkmark animations
            [0, 1, 2, 3].forEach((index) => {
              setTimeout(() => {
                setActivePoints((prev) => [...prev, index]);
              }, index * 200);
            });
          }
        });
      },
      {
        threshold: 0.2,
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

  const points = [
    t('landing.usp.points.noPaywall'),
    t('landing.usp.points.noAds'),
    t('landing.usp.points.openSource'),
    t('landing.usp.points.forRunners'),
  ];

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-32 overflow-hidden"
    >
      {/* Diagonal Split Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-blue-900"></div>
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Image/Visual */}
          <div
            className={`relative transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            <div className="relative">
              {/* Placeholder for community image */}
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-600/20 to-primary-600/20 backdrop-blur-sm border border-white/10 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <div className="text-6xl md:text-8xl">🏃‍♂️</div>
                    <div className="text-white/80 font-body text-lg">
                      Community-Driven
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-2xl">
                <div className="text-center">
                  <div className="text-3xl font-bold font-mono text-primary-900 mb-1">100%</div>
                  <div className="text-sm text-text-tertiary font-body">Kostenlos</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="space-y-8">
            {/* Headline */}
            <div
              className={`space-y-2 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
            >
              <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white leading-tight">
                {t('landing.usp.headline')}
              </h2>
              <h3 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl bg-gradient-to-r from-blue-400 to-primary-400 bg-clip-text text-transparent leading-tight">
                {t('landing.usp.headlineAccent')}
              </h3>
            </div>

            {/* Body */}
            <p
              className={`font-body text-lg text-white/80 leading-relaxed transition-all duration-700 delay-100 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
            >
              {t('landing.usp.body')}
            </p>

            {/* Manifesto Points */}
            <div className="space-y-4">
              {points.map((point, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 transition-all duration-500 ${
                    activePoints.includes(index)
                      ? 'opacity-100 translate-x-0'
                      : 'opacity-0 translate-x-8'
                  }`}
                  style={{ transitionDelay: `${(index + 2) * 100}ms` }}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                      activePoints.includes(index)
                        ? 'bg-gradient-to-br from-green-400 to-green-600 scale-100'
                        : 'bg-white/10 scale-90'
                    }`}
                  >
                    <Check
                      size={18}
                      className={`transition-all duration-500 ${
                        activePoints.includes(index)
                          ? 'text-white opacity-100 scale-100'
                          : 'text-white/50 opacity-0 scale-50'
                      }`}
                      strokeWidth={3}
                    />
                  </div>
                  <span className="font-body text-lg text-white/90 leading-relaxed">
                    {point}
                  </span>
                </div>
              ))}
            </div>

            {/* Additional Badge */}
            <div
              className={`inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 transition-all duration-700 delay-600 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
            >
              <span className="text-2xl">💚</span>
              <span className="font-body font-medium text-white/90">
                Für die Lauf-Community gemacht
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
