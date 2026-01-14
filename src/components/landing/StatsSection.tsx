import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Users, Download, Star } from 'lucide-react';

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
  delay: number;
  isVisible: boolean;
}

function StatItem({ icon, value, suffix, label, delay, isVisible }: StatItemProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = value / steps;
    const stepDuration = duration / steps;

    let currentCount = 0;
    const timer = setInterval(() => {
      currentCount += increment;
      if (currentCount >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(currentCount));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible, value]);

  return (
    <div
      className={`flex flex-col items-center text-center transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className="mb-4 text-primary-600">
        {icon}
      </div>

      {/* Value */}
      <div className="mb-2">
        <span className="font-mono font-bold text-4xl md:text-5xl text-primary-900">
          {count.toLocaleString()}
        </span>
        <span className="font-mono font-bold text-3xl md:text-4xl text-primary-600">
          {suffix}
        </span>
      </div>

      {/* Label */}
      <div className="font-body text-text-tertiary font-medium">
        {label}
      </div>
    </div>
  );
}

export function StatsSection() {
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
        threshold: 0.3,
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

  const stats = [
    {
      icon: <FileText size={40} strokeWidth={2} />,
      value: 1247,
      suffix: '+',
      label: t('landing.stats.plansCreated'),
    },
    {
      icon: <Users size={40} strokeWidth={2} />,
      value: 523,
      suffix: '+',
      label: t('landing.stats.runners'),
    },
    {
      icon: <Download size={40} strokeWidth={2} />,
      value: 3891,
      suffix: '+',
      label: t('landing.stats.downloads'),
    },
    {
      icon: <Star size={40} strokeWidth={2} />,
      value: 4.8,
      suffix: '⭐',
      label: t('landing.stats.avgRating'),
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-24 bg-gradient-to-br from-primary-50 via-blue-50/50 to-slate-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h2 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-primary-900">
            {t('landing.stats.title')}
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              delay={index * 100}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
