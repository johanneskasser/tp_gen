import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Clock } from 'lucide-react';

interface VideoPlaceholderProps {
  title: string;
  description: string;
  duration: string;
  delay: number;
  isVisible: boolean;
}

function VideoPlaceholder({ title, description, duration, delay, isVisible }: VideoPlaceholderProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Container */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary-900 via-slate-800 to-blue-900 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-primary-500/20"></div>

        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M0 0h20L0 20z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-20 h-20 rounded-full bg-white/90 flex items-center justify-center transition-all duration-500 ${
              isHovered ? 'scale-110 bg-white shadow-2xl' : 'scale-100'
            }`}
          >
            <Play
              size={32}
              className={`text-primary-600 transition-transform duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
              fill="currentColor"
            />
          </div>
        </div>

        {/* Duration Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
          <Clock size={14} className="text-white" />
          <span className="text-white text-sm font-mono font-medium">{duration}</span>
        </div>

        {/* Hover Glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        ></div>
      </div>

      {/* Video Info */}
      <div className="mt-6 space-y-2">
        <h3 className="font-display font-semibold text-xl text-primary-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="font-body text-text-secondary leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export function VideosSection() {
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

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            className={`font-display font-bold text-4xl sm:text-5xl md:text-6xl text-primary-900 mb-4 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('landing.videos.title')}
          </h2>
          <p
            className={`font-body text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {t('landing.videos.subtitle')}
          </p>
        </div>

        {/* Videos Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <VideoPlaceholder
            title={t('landing.videos.createPlan.title')}
            description={t('landing.videos.createPlan.description')}
            duration={t('landing.videos.createPlan.duration')}
            delay={0}
            isVisible={isVisible}
          />
          <VideoPlaceholder
            title={t('landing.videos.browseMarketplace.title')}
            description={t('landing.videos.browseMarketplace.description')}
            duration={t('landing.videos.browseMarketplace.duration')}
            delay={200}
            isVisible={isVisible}
          />
        </div>
      </div>
    </section>
  );
}
