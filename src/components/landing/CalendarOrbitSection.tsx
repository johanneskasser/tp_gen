import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Zap, CloudOff, RefreshCw } from 'lucide-react';

interface CalendarApp {
  name: string;
  color: string;
  icon: string;
}

const calendarApps: CalendarApp[] = [
  { name: 'Google Calendar', color: '#4285F4', icon: '📅' },
  { name: 'Apple Calendar', color: '#FF3B30', icon: '🍎' },
  { name: 'Outlook', color: '#0078D4', icon: '📧' },
  { name: 'Notion', color: '#191919', icon: '📝' },
  { name: 'Any iCal App', color: '#22C55E', icon: '✨' },
];

const featurePills = [
  { icon: RefreshCw, labelKey: 'landing.ical.features.realtime' },
  { icon: Zap, labelKey: 'landing.ical.features.noManual' },
  { icon: CloudOff, labelKey: 'landing.ical.features.offline' },
];

export function CalendarOrbitSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
      id="ical-sync"
    >
      {/* Background with subtle gradient and mesh pattern */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-blue-50/30" />
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="orbit-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="currentColor" className="text-primary-600" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#orbit-grid)" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text Content */}
          <div
            className={`space-y-8 transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-primary-50 border border-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="font-body font-semibold text-sm text-blue-700 tracking-wide">
                Universal Sync
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-primary-900 leading-[1.1]">
                {t('landing.ical.title')}
              </h2>
              <p className="font-body text-lg md:text-xl text-text-secondary leading-relaxed max-w-xl">
                {t('landing.ical.subtitle')}
              </p>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-3">
              {featurePills.map((feature, index) => (
                <div
                  key={feature.labelKey}
                  className={`group flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-full shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${400 + index * 100}ms` }}
                >
                  <feature.icon
                    size={18}
                    className="text-blue-500 group-hover:scale-110 transition-transform"
                  />
                  <span className="font-body font-medium text-sm text-primary-800">
                    {t(feature.labelKey)}
                  </span>
                  <Check size={14} className="text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>

            {/* iCal URL Preview */}
            <div
              className={`p-4 bg-slate-900 rounded-xl shadow-xl transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '700ms' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-slate-500 font-mono">calendar subscription</span>
              </div>
              <code className="block text-sm text-green-400 font-mono overflow-x-auto">
                webcal://zenit-it.app/ical/your-plan-id.ics
              </code>
            </div>
          </div>

          {/* Right: Orbit Animation - Fixed Positioning */}
          <div
            className={`relative h-[400px] md:h-[480px] lg:h-[520px] transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            {/* Outer glow - centered */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[380px] md:h-[380px] bg-gradient-to-r from-blue-400/20 via-primary-400/20 to-blue-400/20 rounded-full blur-3xl" />

            {/* Orbit container - centered with fixed dimensions */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[400px] md:h-[400px]">
              {/* Outer orbit ring */}
              <div className="absolute inset-0 border-2 border-dashed border-slate-200/60 rounded-full" />

              {/* Inner orbit ring */}
              <div className="absolute inset-[60px] md:inset-[75px] border border-slate-100 rounded-full" />

              {/* Central logo hub - exactly centered */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative">
                  {/* Pulse rings */}
                  <div className="absolute -inset-4 rounded-2xl bg-blue-400/20 animate-pulse-ring" />
                  <div className="absolute -inset-4 rounded-2xl bg-primary-400/15 animate-pulse-ring" style={{ animationDelay: '0.7s' }} />

                  {/* Logo container */}
                  <div className="relative w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl shadow-2xl flex items-center justify-center border border-slate-100">
                    <img
                      src="/zenit-it_long_black.png"
                      alt="zenit-it"
                      className="w-14 md:w-18 h-auto"
                    />
                  </div>
                </div>
              </div>

              {/* Orbiting calendar apps */}
              <div
                className="absolute inset-0 animate-orbit"
                style={{ transformOrigin: 'center center' }}
              >
                {calendarApps.map((app, index) => {
                  const angle = (index * 360) / calendarApps.length - 90; // Start from top
                  const radius = 50; // Percentage from center
                  const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
                  const y = 50 + radius * Math.sin((angle * Math.PI) / 180);

                  return (
                    <div
                      key={app.name}
                      className="absolute"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Counter-rotate to keep icons upright */}
                      <div
                        className="animate-counter-orbit"
                        onMouseEnter={() => setHoveredApp(app.name)}
                        onMouseLeave={() => setHoveredApp(null)}
                      >
                        {/* Connection line to center */}
                        <div
                          className="absolute top-1/2 left-1/2 h-[1px] bg-gradient-to-r from-blue-300/50 to-transparent origin-left -z-10"
                          style={{
                            width: '60px',
                            transform: `rotate(${180 + angle}deg) translateY(-50%)`,
                          }}
                        />

                        {/* Calendar app icon */}
                        <div
                          className={`relative w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white shadow-lg flex items-center justify-center text-xl md:text-2xl cursor-pointer transition-all duration-300 ${
                            hoveredApp === app.name ? 'scale-125 shadow-xl z-30' : 'hover:scale-110'
                          }`}
                          style={{
                            borderWidth: '2px',
                            borderColor: app.color,
                          }}
                        >
                          {app.icon}

                          {/* Tooltip */}
                          <div
                            className={`absolute -bottom-9 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                              hoveredApp === app.name ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
                            }`}
                          >
                            {app.name}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floating labels */}
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg animate-float-gentle">
              Auto-Sync
            </div>
            <div className="absolute bottom-8 left-4 px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg animate-float-gentle" style={{ animationDelay: '1s' }}>
              Real-time
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
