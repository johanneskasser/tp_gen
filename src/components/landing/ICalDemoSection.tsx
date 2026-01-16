import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Link2, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface TrainingSession {
  day: number;
  type: 'easy' | 'intervals' | 'long' | 'recovery';
  titleKey: string;
  distance: string;
}

const trainingSessions: TrainingSession[] = [
  { day: 0, type: 'easy', titleKey: 'Easy Run', distance: '5km' },
  { day: 2, type: 'intervals', titleKey: 'Intervals', distance: '6x800m' },
  { day: 4, type: 'recovery', titleKey: 'Recovery', distance: '4km' },
  { day: 5, type: 'long', titleKey: 'Long Run', distance: '18km' },
];

const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const sessionColors = {
  easy: {
    bg: 'bg-blue-100',
    border: 'border-l-blue-500',
    text: 'text-blue-700',
  },
  intervals: {
    bg: 'bg-orange-100',
    border: 'border-l-orange-500',
    text: 'text-orange-700',
  },
  long: {
    bg: 'bg-green-100',
    border: 'border-l-green-500',
    text: 'text-green-700',
  },
  recovery: {
    bg: 'bg-emerald-100',
    border: 'border-l-emerald-500',
    text: 'text-emerald-700',
  },
};

export function ICalDemoSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showingSessions, setShowingSessions] = useState<number[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);

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

  const handleSubscribe = () => {
    if (isSubscribed) return;

    setIsSubscribed(true);
    setSyncProgress(0);

    // Animate progress bar
    const progressInterval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Animate sessions appearing one by one
    trainingSessions.forEach((_, i) => {
      setTimeout(() => {
        setShowingSessions((prev) => [...prev, i]);
      }, 500 + i * 400);
    });
  };

  const handleReset = () => {
    setIsSubscribed(false);
    setShowingSessions([]);
    setSyncProgress(0);
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-28 overflow-hidden bg-white"
      id="ical-demo"
    >
      {/* Subtle background texture */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="calendar-dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" className="text-slate-900" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#calendar-dots)" />
        </svg>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-primary-900 mb-4">
            {t('landing.icalDemo.title')}
          </h2>
          <p className="font-body text-lg text-text-secondary max-w-2xl mx-auto">
            {t('landing.icalDemo.subtitle')}
          </p>
        </div>

        {/* Calendar mockup */}
        <div
          className={`mx-auto max-w-2xl transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Calendar header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-primary-600 text-white p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <CalendarDays size={22} />
                  </div>
                  <div>
                    <span className="font-display font-semibold text-lg">Mein Kalender</span>
                    <p className="text-xs text-white/70 font-body">Marathon Training 2025</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <span className="font-mono text-sm px-3 py-1 bg-white/10 rounded-lg">
                    Januar 2025
                  </span>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Week view */}
            <div className="p-4 sm:p-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {weekDays.map((day, i) => (
                  <div
                    key={day}
                    className={`text-center text-xs font-semibold py-2 rounded-lg ${
                      i === 5 || i === 6 ? 'text-blue-600 bg-blue-50' : 'text-slate-500'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((_, dayIndex) => {
                  const session = trainingSessions.find((s) => s.day === dayIndex);
                  const sessionIndex = session ? trainingSessions.indexOf(session) : -1;
                  const isShowing = sessionIndex !== -1 && showingSessions.includes(sessionIndex);
                  const colors = session ? sessionColors[session.type] : null;

                  return (
                    <div
                      key={dayIndex}
                      className={`aspect-square sm:aspect-[4/5] border rounded-xl p-2 relative overflow-hidden transition-all duration-300 ${
                        session && isShowing
                          ? 'border-slate-200 bg-white shadow-md'
                          : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      {/* Date number */}
                      <span
                        className={`text-xs font-medium ${
                          dayIndex === 5 || dayIndex === 6 ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      >
                        {13 + dayIndex}
                      </span>

                      {/* Training session card */}
                      {session && (
                        <div
                          className={`absolute inset-x-1 bottom-1 top-7 rounded-lg p-1.5 border-l-[3px] transition-all duration-500 ${
                            isShowing
                              ? `opacity-100 translate-y-0 scale-100 ${colors?.bg} ${colors?.border}`
                              : 'opacity-0 translate-y-4 scale-90 bg-slate-100'
                          }`}
                        >
                          <div className={`text-[10px] sm:text-xs font-semibold ${colors?.text}`}>
                            {session.titleKey}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
                            {session.distance}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sync progress indicator */}
              {isSubscribed && syncProgress < 100 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-body">Synchronisiere...</span>
                    <span className="font-mono">{syncProgress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-200"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Subscribe button area */}
            <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/50">
              <button
                onClick={isSubscribed ? handleReset : handleSubscribe}
                className={`w-full py-3.5 px-6 rounded-xl font-body font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSubscribed
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <Check size={20} className="animate-scale-in" />
                    <span>{t('landing.icalDemo.subscribed')}</span>
                  </>
                ) : (
                  <>
                    <Link2 size={20} />
                    <span>{t('landing.icalDemo.cta')}</span>
                  </>
                )}
              </button>

              {isSubscribed && (
                <button
                  onClick={handleReset}
                  className="w-full mt-2 py-2 text-sm text-slate-500 hover:text-slate-700 font-body transition-colors"
                >
                  Demo zurücksetzen
                </button>
              )}
            </div>
          </div>

          {/* Floating helper text */}
          <div
            className={`text-center mt-8 transition-all duration-500 delay-500 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p className="font-body text-sm text-text-tertiary">
              {t('landing.icalDemo.hint')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
