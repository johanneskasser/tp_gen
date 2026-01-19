import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Play, Calendar, Zap, Clock, MapPin, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '../ui';
import WeeklyChart from '../WeeklyChart';
import { sampleWeeks } from '../../data/sampleData';

interface TrainingDay {
  day: string;
  type: 'easy' | 'intervals' | 'long' | 'rest' | 'tempo' | 'race';
  title: string;
  distance: string;
  delay: number;
}

const trainingWeek: TrainingDay[] = [
  { day: 'Mo', type: 'easy', title: 'Locker', distance: '8 km', delay: 0 },
  { day: 'Di', type: 'intervals', title: 'Intervall', distance: '6x800m', delay: 150 },
  { day: 'Mi', type: 'rest', title: 'Ruhe', distance: '—', delay: 300 },
  { day: 'Do', type: 'tempo', title: 'Tempo', distance: '10 km', delay: 450 },
  { day: 'Fr', type: 'easy', title: 'Locker', distance: '6 km', delay: 600 },
  { day: 'Sa', type: 'long', title: 'Lang', distance: '22 km', delay: 750 },
  { day: 'So', type: 'rest', title: 'Ruhe', distance: '—', delay: 900 },
];

const sessionColors = {
  easy: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  intervals: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  long: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  rest: { bg: 'bg-slate-300', light: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
  tempo: { bg: 'bg-purple-500', light: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  race: { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
};

export function HeroSection() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [activeDay, setActiveDay] = useState(-1);
  const [totalKm, setTotalKm] = useState(0);

  // Current week number calculation
  const currentWeek = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Animation sequence
  useEffect(() => {
    if (!isVisible) return;

    const phases = [
      { delay: 500, action: () => setAnimationPhase(1) },  // Show calendar frame
      { delay: 1000, action: () => setAnimationPhase(2) }, // Start filling days
      { delay: 1200, action: () => setActiveDay(0) },
      { delay: 1400, action: () => setActiveDay(1) },
      { delay: 1600, action: () => setActiveDay(2) },
      { delay: 1800, action: () => setActiveDay(3) },
      { delay: 2000, action: () => setActiveDay(4) },
      { delay: 2200, action: () => setActiveDay(5) },
      { delay: 2400, action: () => setActiveDay(6) },
      { delay: 2800, action: () => setAnimationPhase(3) }, // Show chart and stats
    ];

    const timers = phases.map(({ delay, action }) => setTimeout(action, delay));

    // Animate total km counter
    const kmInterval = setInterval(() => {
      setTotalKm(prev => {
        if (prev >= 52) {
          clearInterval(kmInterval);
          return 52;
        }
        return prev + 2;
      });
    }, 50);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(kmInterval);
    };
  }, [isVisible]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.02]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="currentColor" className="text-primary-600" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>
        {/* Gradient orbs */}
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse-ring" />
        <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-green-400/10 rounded-full blur-3xl animate-pulse-ring" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Column - Text Content */}
          <div className="space-y-8">
            <div
              className={`space-y-4 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-primary-900">
                {t('landing.hero.headline')}
              </h1>
              <h2 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight bg-gradient-to-r from-blue-600 via-primary-600 to-blue-700 bg-clip-text text-transparent">
                {t('landing.hero.headlineAccent')}
              </h2>
            </div>

            <p
              className={`font-body text-lg sm:text-xl text-text-secondary max-w-2xl leading-relaxed transition-all duration-700 delay-100 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {t('landing.hero.subheadline')}
            </p>

            <div
              className={`flex flex-col sm:flex-row gap-4 transition-all duration-700 delay-200 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <Link to="/login">
                <Button
                  variant="default"
                  size="lg"
                  className="group w-full sm:w-auto text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  {t('landing.hero.ctaPrimary')}
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
              </Link>
              <button
                onClick={() => scrollToSection('features')}
                className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-lg font-semibold font-body text-primary-700 bg-white border-2 border-primary-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/50 transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              >
                <Play className="mr-2 group-hover:scale-110 transition-transform" size={20} />
                {t('landing.hero.ctaSecondary')}
              </button>
            </div>

            <div
              className={`flex flex-wrap items-center gap-6 text-sm text-text-tertiary transition-all duration-700 delay-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white"></div>
                </div>
                <span className="font-body font-medium">500+ runners</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★★★★★</span>
                <span className="font-body font-medium ml-1">4.8/5</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-body font-medium">100% kostenlos</span>
              </div>
            </div>
          </div>

          {/* Right Column - Animated Training Dashboard */}
          <div
            className={`relative transition-all duration-1000 delay-300 ${
              isVisible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-8 scale-95'
            }`}
          >
            {/* Background glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-green-500/20 rounded-3xl blur-3xl" />

            {/* Main Dashboard Card */}
            <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
              {/* Dashboard Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                      <Calendar size={20} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-base sm:text-lg">Marathon Training</h3>
                      <p className="text-xs text-white/60 font-body">Woche {currentWeek} von 16</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-green-300">Aktiv</span>
                  </div>
                </div>
              </div>

              {/* Week Calendar */}
              <div className="p-4 sm:p-5 border-b border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Diese Woche</span>
                  <span className="text-xs font-mono text-slate-400">{totalKm} km geplant</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {trainingWeek.map((day, index) => {
                    const colors = sessionColors[day.type];
                    const isActive = index <= activeDay;
                    const isToday = index === 3; // Thursday as "today"

                    return (
                      <div
                        key={day.day}
                        className={`relative group transition-all duration-500 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{ transitionDelay: `${day.delay}ms` }}
                      >
                        {/* Day header */}
                        <div className={`text-center text-[10px] sm:text-xs font-semibold mb-1.5 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                          {day.day}
                        </div>

                        {/* Session card */}
                        <div
                          className={`relative p-1.5 sm:p-2 rounded-lg border-2 transition-all duration-300 min-h-[60px] sm:min-h-[72px] ${
                            isActive
                              ? `${colors.light} ${colors.border} ${colors.text}`
                              : 'bg-slate-50 border-slate-100'
                          } ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''} hover:scale-105 hover:shadow-md cursor-pointer`}
                        >
                          {/* Color indicator */}
                          <div className={`w-full h-1 rounded-full mb-1.5 transition-all duration-500 ${isActive ? colors.bg : 'bg-slate-200'}`} />

                          {/* Content */}
                          <div className={`text-[9px] sm:text-[10px] font-semibold truncate transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                            {day.title}
                          </div>
                          <div className={`text-[8px] sm:text-[9px] font-mono mt-0.5 transition-opacity duration-300 ${isActive ? 'opacity-80' : 'opacity-30'}`}>
                            {day.distance}
                          </div>

                          {/* Today indicator */}
                          {isToday && isActive && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Weekly Chart - using the actual component */}
              <div className={`transition-all duration-700 ${animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="[&>div]:shadow-none [&>div]:border-0 [&>div]:rounded-none [&>div]:p-3 [&>div]:sm:p-4 [&_h3]:text-sm [&_h3]:sm:text-base [&_.recharts-responsive-container]:!h-[180px] [&_.recharts-responsive-container]:sm:!h-[200px]">
                  <WeeklyChart weeks={sampleWeeks} />
                </div>
              </div>

              {/* Stats Footer */}
              <div className={`grid grid-cols-4 gap-3 p-4 sm:p-5 bg-white border-t border-slate-100 transition-all duration-700 ${animationPhase >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                    <Clock size={12} />
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-primary-900">16</div>
                  <div className="text-[10px] text-slate-500 font-body">Wochen</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                    <TrendingUp size={12} />
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-primary-900">52</div>
                  <div className="text-[10px] text-slate-500 font-body">km/Woche</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                    <Zap size={12} />
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-primary-900">84</div>
                  <div className="text-[10px] text-slate-500 font-body">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                    <MapPin size={12} />
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-primary-900">680</div>
                  <div className="text-[10px] text-slate-500 font-body">km total</div>
                </div>
              </div>
            </div>

            {/* Floating Badges */}
            <div
              className={`absolute -top-3 -right-3 sm:-top-4 sm:-right-4 transition-all duration-700 ${animationPhase >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
              style={{ transitionDelay: '400ms' }}
            >
              <div className="px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg font-display font-semibold text-xs sm:text-sm flex items-center gap-1.5 animate-float-gentle">
                <Trophy size={14} />
                <span>Berlin Marathon</span>
              </div>
            </div>

            <div
              className={`absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 transition-all duration-700 ${animationPhase >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
              style={{ transitionDelay: '600ms' }}
            >
              <div className="px-3 py-2 bg-white border border-green-200 text-green-700 rounded-xl shadow-lg font-body font-semibold text-xs sm:text-sm flex items-center gap-1.5 animate-float-gentle" style={{ animationDelay: '1s' }}>
                <Calendar size={14} />
                <span>iCal Sync</span>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 top-1/2 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl" />
            <div className="absolute -z-10 bottom-1/4 -left-16 w-32 h-32 bg-green-500/5 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
