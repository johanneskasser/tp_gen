import { useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Link2, Check, ChevronLeft, ChevronRight, MousePointer2 } from 'lucide-react';

interface TrainingSession {
  dayOffset: number; // Days from today
  type: 'easy' | 'intervals' | 'long' | 'recovery';
  title: string;
  distance: string;
}

const sessionColors = {
  easy: {
    bg: 'bg-blue-100',
    border: 'border-l-blue-500',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  intervals: {
    bg: 'bg-orange-100',
    border: 'border-l-orange-500',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  long: {
    bg: 'bg-green-100',
    border: 'border-l-green-500',
    text: 'text-green-700',
    dot: 'bg-green-500',
  },
  recovery: {
    bg: 'bg-emerald-100',
    border: 'border-l-emerald-500',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function ICalDemoSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showingSessions, setShowingSessions] = useState<number[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 280, y: 320 });
  const [isAnimating, setIsAnimating] = useState(false);

  // Current date calculations
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  // Training sessions based on current date
  const trainingSessions: TrainingSession[] = useMemo(() => [
    { dayOffset: 1, type: 'easy', title: 'Easy Run', distance: '5km' },
    { dayOffset: 3, type: 'intervals', title: 'Intervalle', distance: '6x800m' },
    { dayOffset: 5, type: 'recovery', title: 'Erholung', distance: '4km' },
    { dayOffset: 6, type: 'long', title: 'Langer Lauf', distance: '18km' },
  ], []);

  // Map sessions to actual days
  const sessionsByDay = useMemo(() => {
    const map = new Map<number, TrainingSession>();
    trainingSessions.forEach(session => {
      const sessionDay = currentDay + session.dayOffset;
      if (sessionDay <= daysInMonth) {
        map.set(sessionDay, session);
      }
    });
    return map;
  }, [trainingSessions, currentDay, daysInMonth]);

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
    if (isSubscribed || isAnimating) return;

    setIsAnimating(true);
    setCursorPosition({ x: 280, y: 370 });

    // Cursor moves to button (button is at bottom of calendar area)
    setTimeout(() => setCursorPosition({ x: 280, y: 430 }), 200);

    // Click effect
    setTimeout(() => {
      setIsSubscribed(true);
      setSyncProgress(0);
    }, 600);

    // Animate progress bar
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 8;
      setSyncProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 80);

    // Animate sessions appearing one by one with cursor following
    trainingSessions.forEach((_, i) => {
      setTimeout(() => {
        setShowingSessions((prev) => [...prev, i]);
        // Move cursor to show import (calendar grid area)
        const yOffset = 230 + (i * 25);
        setCursorPosition({ x: 200 + (i * 30), y: yOffset });
      }, 800 + i * 500);
    });

    // Hide cursor after animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 800 + trainingSessions.length * 500 + 500);
  };

  const handleReset = () => {
    setIsSubscribed(false);
    setShowingSessions([]);
    setSyncProgress(0);
    setIsAnimating(false);
    setCursorPosition({ x: 280, y: 370 });
  };

  // Calculate which week row contains today
  const todayPosition = adjustedFirstDay + currentDay - 1;
  const todayRow = Math.floor(todayPosition / 7);

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
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
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
                  <span className="font-mono text-sm px-3 py-1 bg-white/10 rounded-lg min-w-[140px] text-center">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Week view - show current week */}
            <div className="p-4 sm:p-6 relative">
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

              {/* Calendar grid - show 2 weeks starting from current week */}
              <div className="space-y-2">
                {[0, 1].map((weekOffset) => {
                  const weekStartDay = (todayRow + weekOffset) * 7 - adjustedFirstDay + 1;

                  return (
                    <div key={weekOffset} className="grid grid-cols-7 gap-2">
                      {weekDays.map((_, dayIndex) => {
                        const dayNumber = weekStartDay + dayIndex;
                        const isValidDay = dayNumber >= 1 && dayNumber <= daysInMonth;
                        const isToday = dayNumber === currentDay;
                        const session = sessionsByDay.get(dayNumber);
                        const sessionIndex = session ? trainingSessions.findIndex(s => s === session) : -1;
                        const isShowing = sessionIndex !== -1 && showingSessions.includes(sessionIndex);
                        const colors = session ? sessionColors[session.type] : null;
                        const isWeekend = dayIndex === 5 || dayIndex === 6;

                        if (!isValidDay) {
                          return <div key={dayIndex} className="aspect-[4/5] sm:aspect-square" />;
                        }

                        return (
                          <div
                            key={dayIndex}
                            className={`aspect-[4/5] sm:aspect-square border rounded-xl p-1.5 sm:p-2 relative overflow-hidden transition-all duration-300 ${
                              isToday
                                ? 'border-blue-400 bg-blue-50/50 ring-2 ring-blue-400/30'
                                : session && isShowing
                                ? 'border-slate-200 bg-white shadow-md'
                                : 'border-slate-100 bg-slate-50/50'
                            }`}
                          >
                            {/* Date number */}
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-xs font-medium ${
                                  isToday
                                    ? 'bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center'
                                    : isWeekend
                                    ? 'text-blue-600'
                                    : 'text-slate-400'
                                }`}
                              >
                                {dayNumber}
                              </span>
                              {isToday && (
                                <span className="text-[8px] font-bold text-blue-500 uppercase">Heute</span>
                              )}
                            </div>

                            {/* Training session card */}
                            {session && (
                              <div
                                className={`absolute inset-x-1 bottom-1 top-6 sm:top-7 rounded-lg p-1 border-l-[3px] transition-all duration-500 ${
                                  isShowing
                                    ? `opacity-100 translate-y-0 scale-100 ${colors?.bg} ${colors?.border}`
                                    : 'opacity-0 translate-y-4 scale-90 bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-1 mb-0.5">
                                  <div className={`w-1.5 h-1.5 rounded-full ${colors?.dot}`} />
                                  <span className={`text-[9px] sm:text-[10px] font-semibold ${colors?.text} truncate`}>
                                    {session.title}
                                  </span>
                                </div>
                                <div className="text-[8px] sm:text-[9px] text-slate-500 font-mono">
                                  {session.distance}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Sync progress indicator */}
              {isSubscribed && syncProgress < 100 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-body flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      Synchronisiere Trainingseinheiten...
                    </span>
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

              {/* Import success message */}
              {isSubscribed && syncProgress >= 100 && showingSessions.length === trainingSessions.length && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check size={18} />
                    <span className="font-body font-medium text-sm">
                      {trainingSessions.length} Trainingseinheiten importiert!
                    </span>
                  </div>
                </div>
              )}

              {/* Animated cursor */}
              {isAnimating && (
                <div
                  className="absolute z-30 pointer-events-none transition-all duration-300 ease-out"
                  style={{
                    left: cursorPosition.x,
                    top: cursorPosition.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <MousePointer2
                    size={24}
                    className="text-slate-800 drop-shadow-lg fill-white"
                    strokeWidth={2}
                  />
                </div>
              )}
            </div>

            {/* Subscribe button area */}
            <div className="border-t border-slate-100 p-4 sm:p-5 bg-slate-50/50">
              <button
                onClick={handleSubscribe}
                disabled={isSubscribed}
                className={`w-full py-3.5 px-6 rounded-xl font-body font-semibold text-base transition-all duration-300 flex items-center justify-center gap-2 ${
                  isSubscribed
                    ? 'bg-green-100 text-green-700 cursor-default'
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
