import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Calendar, CheckCircle2, Sparkles, Play, RotateCcw, ChevronDown, MousePointer2 } from 'lucide-react';

interface Step {
  icon: React.ElementType;
  labelKey: string;
  color: string;
  bgColor: string;
}

const steps: Step[] = [
  {
    icon: Target,
    labelKey: 'landing.ease.steps.race',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    icon: Calendar,
    labelKey: 'landing.ease.steps.date',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    icon: CheckCircle2,
    labelKey: 'landing.ease.steps.done',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
];

const raceOptions = ['Marathon', 'Halbmarathon', '10K', '5K'];
const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

export function EaseOfUseShowcase() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showRaceDropdown, setShowRaceDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 180, y: 100 });
  const [hoveredRace, setHoveredRace] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hasAnimatedOnce, setHasAnimatedOnce] = useState(false);

  // Generate calendar days for a month 4 months from now
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + 4);
  const targetMonth = futureDate.getMonth();
  const targetYear = futureDate.getFullYear();
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(targetYear, targetMonth, 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday = 0

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimatedOnce) {
          setIsVisible(true);
        }
      },
      { threshold: 0.4 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimatedOnce]);

  const runAnimation = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setHasAnimatedOnce(true);
    setCurrentStep(-1);
    setShowConfetti(false);
    setSelectedRace(null);
    setSelectedDate(null);
    setShowRaceDropdown(false);
    setShowDatePicker(false);
    setHoveredRace(null);
    setHoveredDay(null);
    setCursorPosition({ x: 180, y: 100 });

    // Animation timeline with cursor movements
    // Y-coordinates are relative to the form content area (p-5 div)
    const timeline = [
      // Move cursor to race dropdown (label + field area)
      { delay: 400, action: () => setCursorPosition({ x: 160, y: 135 }) },
      { delay: 800, action: () => setCurrentStep(0) },
      { delay: 1000, action: () => setShowRaceDropdown(true) },
      // Hover over options in dropdown
      { delay: 1400, action: () => { setCursorPosition({ x: 140, y: 185 }); setHoveredRace(0); } },
      { delay: 1700, action: () => { setCursorPosition({ x: 140, y: 215 }); setHoveredRace(1); } },
      { delay: 2000, action: () => { setCursorPosition({ x: 140, y: 185 }); setHoveredRace(0); } },
      // Click Marathon
      { delay: 2300, action: () => { setSelectedRace('Marathon'); setShowRaceDropdown(false); setHoveredRace(null); } },

      // Move to date picker field
      { delay: 2800, action: () => { setCursorPosition({ x: 160, y: 225 }); setCurrentStep(1); } },
      { delay: 3200, action: () => setShowDatePicker(true) },
      // Hover over days in calendar
      { delay: 3600, action: () => { setCursorPosition({ x: 120, y: 340 }); setHoveredDay(15); } },
      { delay: 3900, action: () => { setCursorPosition({ x: 150, y: 340 }); setHoveredDay(16); } },
      { delay: 4200, action: () => { setCursorPosition({ x: 180, y: 340 }); setHoveredDay(17); } },
      // Click day 17
      { delay: 4500, action: () => {
        setSelectedDate(`17. ${months[targetMonth]} ${targetYear}`);
        setShowDatePicker(false);
        setHoveredDay(null);
      }},

      // Complete - move to button area
      { delay: 5000, action: () => { setCurrentStep(2); setCursorPosition({ x: 180, y: 320 }); } },
      { delay: 5500, action: () => { setShowConfetti(true); setIsAnimating(false); } },
    ];

    timeline.forEach(({ delay, action }) => {
      setTimeout(action, delay);
    });
  }, [isAnimating, targetMonth, targetYear]);

  // Auto-start animation when visible
  useEffect(() => {
    if (isVisible && !isAnimating && currentStep === -1 && !hasAnimatedOnce) {
      const timeout = setTimeout(runAnimation, 600);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, isAnimating, currentStep, runAnimation, hasAnimatedOnce]);

  const handleReplay = () => {
    setHasAnimatedOnce(false);
    setCurrentStep(-1);
    setShowConfetti(false);
    setSelectedRace(null);
    setSelectedDate(null);
    setShowRaceDropdown(false);
    setShowDatePicker(false);
    setTimeout(runAnimation, 200);
  };

  // Generate confetti particles
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    color: ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][i % 6],
    size: 4 + Math.random() * 6,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
  }));

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-28 overflow-hidden"
      id="ease-of-use"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-slate-50" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-green-200/30 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left: Text content */}
          <div
            className={`space-y-6 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
              <Sparkles className="text-green-600" size={16} />
              <span className="font-body font-semibold text-sm text-green-700">
                {t('landing.ease.badge')}
              </span>
            </div>

            {/* Headline */}
            <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-primary-900 leading-[1.1]">
              {t('landing.ease.title')}
            </h2>

            {/* Tagline */}
            <p className="font-display font-semibold text-2xl md:text-3xl bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              {t('landing.ease.tagline')}
            </p>

            {/* Description */}
            <p className="font-body text-lg text-text-secondary leading-relaxed max-w-lg">
              {t('landing.ease.description')}
            </p>

            {/* Replay button */}
            <button
              onClick={handleReplay}
              disabled={isAnimating}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-body font-medium text-sm transition-all duration-300 ${
                isAnimating
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:shadow-md'
              }`}
            >
              {isAnimating ? (
                <>
                  <Play size={16} className="animate-pulse" />
                  <span>Läuft...</span>
                </>
              ) : (
                <>
                  <RotateCcw size={16} />
                  <span>Animation wiederholen</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Interactive device mockup */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="relative max-w-sm mx-auto">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-green-400/20 rounded-3xl blur-2xl scale-110" />

              {/* Device frame */}
              <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* App header bar */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <img src="/zenit-it_long_black.png" alt="zenit-it" className="h-5" />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  </div>
                </div>

                {/* Progress indicator */}
                <div className="flex justify-center gap-3 py-4 bg-white">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        i < currentStep
                          ? 'bg-green-500'
                          : i === currentStep
                          ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Form content */}
                <div className="p-5 space-y-4 min-h-[380px] relative">
                  {/* Title */}
                  <h3 className="font-display font-semibold text-lg text-primary-900">
                    Neuen Plan erstellen
                  </h3>

                  {/* Race Selection Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Wettkampf</label>
                    <div
                      className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                        currentStep === 0 && !selectedRace
                          ? 'border-blue-400 bg-blue-50/50 shadow-md'
                          : selectedRace
                          ? 'border-green-300 bg-green-50/30'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span className={`font-body ${selectedRace ? 'text-primary-900 font-medium' : 'text-slate-400'}`}>
                        {selectedRace || 'Wettkampf auswählen...'}
                      </span>
                      <ChevronDown size={18} className={`transition-transform ${showRaceDropdown ? 'rotate-180' : ''} text-slate-400`} />

                      {/* Dropdown */}
                      {showRaceDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden animate-scale-in">
                          {raceOptions.map((race, i) => (
                            <div
                              key={race}
                              className={`px-4 py-3 font-body text-sm transition-colors ${
                                hoveredRace === i
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {race}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Date Selection Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600">Wettkampfdatum</label>
                    <div
                      className={`relative px-4 py-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                        currentStep === 1 && !selectedDate
                          ? 'border-blue-400 bg-blue-50/50 shadow-md'
                          : selectedDate
                          ? 'border-green-300 bg-green-50/30'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span className={`font-body ${selectedDate ? 'text-primary-900 font-medium' : 'text-slate-400'}`}>
                        {selectedDate || 'Datum auswählen...'}
                      </span>
                      <Calendar size={18} className="text-slate-400" />

                      {/* Date Picker */}
                      {showDatePicker && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl z-20 p-3 animate-scale-in">
                          {/* Month header */}
                          <div className="flex items-center justify-between mb-3 px-1">
                            <span className="font-display font-semibold text-sm text-primary-900">
                              {months[targetMonth]} {targetYear}
                            </span>
                          </div>
                          {/* Day headers */}
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
                              <div key={d} className="text-[10px] font-medium text-slate-400 text-center py-1">
                                {d}
                              </div>
                            ))}
                          </div>
                          {/* Calendar grid */}
                          <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for offset */}
                            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                              <div key={`empty-${i}`} className="w-7 h-7" />
                            ))}
                            {/* Days */}
                            {Array.from({ length: Math.min(daysInMonth, 21) }).map((_, i) => {
                              const day = i + 1;
                              return (
                                <div
                                  key={day}
                                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                                    hoveredDay === day
                                      ? 'bg-blue-500 text-white scale-110 shadow-md'
                                      : day === 17
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {day}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Create button */}
                  <div className="pt-4">
                    <div
                      className={`py-3.5 px-6 rounded-xl text-center font-body font-semibold transition-all duration-500 ${
                        currentStep >= 2
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                          : selectedRace && selectedDate
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {currentStep >= 2 ? (
                        <span className="flex items-center justify-center gap-2">
                          <CheckCircle2 size={20} />
                          Plan erstellt!
                        </span>
                      ) : (
                        'Plan erstellen'
                      )}
                    </div>
                  </div>

                  {/* Animated cursor */}
                  {isAnimating && (
                    <div
                      className="absolute z-30 pointer-events-none transition-all duration-300 ease-out"
                      style={{
                        left: cursorPosition.x,
                        top: cursorPosition.y,
                        transform: 'translate(-2px, -2px)',
                      }}
                    >
                      <MousePointer2
                        size={24}
                        className="text-slate-800 drop-shadow-lg fill-white"
                        strokeWidth={2}
                      />
                    </div>
                  )}

                  {/* Confetti overlay - permanent after completion */}
                  {showConfetti && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-b-3xl">
                      {confettiParticles.map((particle) => (
                        <div
                          key={particle.id}
                          className="absolute animate-fade-in"
                          style={{
                            left: `${particle.x}%`,
                            top: `${particle.y}%`,
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: particle.color,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            animation: `float-gentle ${particle.duration}s ease-in-out infinite`,
                            animationDelay: `${particle.delay}s`,
                            opacity: 0.8,
                          }}
                        />
                      ))}
                      {/* Success shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 via-transparent to-transparent" />
                    </div>
                  )}
                </div>
              </div>

              {/* Floating badges */}
              <div
                className={`absolute -top-4 -right-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold rounded-full shadow-lg transition-all duration-500 ${
                  isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
                style={{ transitionDelay: '600ms' }}
              >
                Unter 30 Sek.
              </div>

              <div
                className={`absolute -bottom-3 -left-3 px-4 py-2 bg-white border border-green-200 text-green-700 text-sm font-semibold rounded-full shadow-lg transition-all duration-500 ${
                  isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                }`}
                style={{ transitionDelay: '800ms' }}
              >
                Keine Registrierung
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
