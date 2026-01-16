import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Lock,
  Eye,
  DollarSign,
  Building2,
  Unlock,
  ShieldCheck,
  Heart,
  Code2,
  Check,
  X,
} from 'lucide-react';

interface ManifestoItem {
  icon: React.ElementType;
  labelKey: string;
}

const rejectItems: ManifestoItem[] = [
  { icon: Lock, labelKey: 'landing.independence.problems.paywall' },
  { icon: Eye, labelKey: 'landing.independence.problems.data' },
  { icon: DollarSign, labelKey: 'landing.independence.problems.premium' },
  { icon: Building2, labelKey: 'landing.independence.problems.corporate' },
];

const valueItems: ManifestoItem[] = [
  { icon: Unlock, labelKey: 'landing.independence.values.free' },
  { icon: ShieldCheck, labelKey: 'landing.independence.values.privacy' },
  { icon: Heart, labelKey: 'landing.independence.values.runners' },
  { icon: Code2, labelKey: 'landing.independence.values.open' },
];

export function IndependenceSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-0 overflow-hidden"
      id="independence"
    >
      {/* Diagonal Split Background */}
      <div className="absolute inset-0">
        {/* Dark side - left */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 via-primary-900 to-slate-900"
          style={{ clipPath: 'polygon(0 0, 55% 0, 45% 100%, 0 100%)' }}
        />
        {/* Pattern overlay on dark side */}
        <div
          className="absolute inset-0 opacity-10"
          style={{ clipPath: 'polygon(0 0, 55% 0, 45% 100%, 0 100%)' }}
        >
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diagonal-lines" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
          </svg>
        </div>

        {/* Light side - right */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"
          style={{ clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 45% 100%)' }}
        />
      </div>

      {/* Diagonal divider line with glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom right, transparent 49.5%, rgba(59, 130, 246, 0.3) 49.5%, rgba(59, 130, 246, 0.3) 50.5%, transparent 50.5%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="grid lg:grid-cols-2 gap-0 lg:gap-24">
          {/* Left: What we reject (Dark side) */}
          <div className="py-12 lg:py-16 lg:pr-12">
            <div
              className={`transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
              }`}
            >
              <span className="inline-block font-display text-xs uppercase tracking-[0.2em] text-white/50 mb-6">
                {t('landing.independence.reject')}
              </span>

              <div className="space-y-5">
                {rejectItems.map((item, index) => (
                  <div
                    key={item.labelKey}
                    className={`group relative flex items-center gap-4 transition-all duration-500 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                    }`}
                    style={{ transitionDelay: `${200 + index * 100}ms` }}
                  >
                    {/* Animated X mark */}
                    <div
                      className={`absolute -left-8 transition-all duration-500 ${
                        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                      }`}
                      style={{ transitionDelay: `${400 + index * 150}ms` }}
                    >
                      <X className="text-red-500" size={20} strokeWidth={3} />
                    </div>

                    {/* Icon container */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                      <item.icon className="text-white/40" size={22} />
                    </div>

                    {/* Text with strikethrough */}
                    <span className="font-body text-lg text-white/40 line-through decoration-red-500/70 decoration-2">
                      {t(item.labelKey)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: What we stand for (Light side) */}
          <div className="py-12 lg:py-16 lg:pl-12">
            <div
              className={`transition-all duration-700 delay-200 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
              }`}
            >
              <span className="inline-block font-display text-xs uppercase tracking-[0.2em] text-primary-600 mb-6">
                {t('landing.independence.standFor')}
              </span>

              <div className="space-y-5">
                {valueItems.map((item, index) => (
                  <div
                    key={item.labelKey}
                    className={`group flex items-center gap-4 transition-all duration-500 ${
                      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    }`}
                    style={{ transitionDelay: `${400 + index * 100}ms` }}
                  >
                    {/* Icon container with color */}
                    <div
                      className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
                        index === 0
                          ? 'bg-green-100 text-green-600'
                          : index === 1
                          ? 'bg-blue-100 text-blue-600'
                          : index === 2
                          ? 'bg-red-100 text-red-500'
                          : 'bg-primary-100 text-primary-700'
                      }`}
                    >
                      <item.icon size={22} />
                    </div>

                    {/* Text */}
                    <span className="font-body text-lg font-medium text-primary-900 group-hover:text-primary-700 transition-colors">
                      {t(item.labelKey)}
                    </span>

                    {/* Animated check */}
                    <Check
                      className={`text-green-500 transition-all duration-300 ${
                        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
                      }`}
                      style={{ transitionDelay: `${700 + index * 100}ms` }}
                      size={18}
                    />
                  </div>
                ))}
              </div>

              {/* Signature badge */}
              <div
                className={`mt-10 inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-50 via-white to-blue-50 rounded-full border border-green-200 shadow-sm transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: '1000ms' }}
              >
                <Heart className="text-red-500 animate-pulse" size={18} fill="currentColor" />
                <span className="font-display font-semibold text-primary-900">
                  {t('landing.independence.badge')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized version indicator */}
      <div className="lg:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-blue-100 border-4 border-white shadow-xl flex items-center justify-center">
          <span className="text-lg">VS</span>
        </div>
      </div>
    </section>
  );
}
