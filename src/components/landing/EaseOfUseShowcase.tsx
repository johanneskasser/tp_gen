import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Calendar, CheckCircle2, Sparkles, Play, RotateCcw } from 'lucide-react';

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

const raceOptions = ['Marathon', '21K', '10K', '5K'];

export function EaseOfUseShowcase() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedRace, setSelectedRace] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const runAnimation = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setCurrentStep(-1);
    setShowConfetti(false);
    setSelectedRace(null);
    setSelectedDate(null);

    // Step 1: Pick your race
    setTimeout(() => {
      setCurrentStep(0);
      setTimeout(() => setSelectedRace('Marathon'), 600);
    }, 400);

    // Step 2: Set the date
    setTimeout(() => {
      setCurrentStep(1);
      setTimeout(() => setSelectedDate('27. April 2025'), 600);
    }, 1800);

    // Step 3: Done!
    setTimeout(() => {
      setCurrentStep(2);
      setShowConfetti(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 2000);
    }, 3200);
  }, [isAnimating]);

  // Auto-start animation when visible
  useEffect(() => {
    if (isVisible && !isAnimating && currentStep === -1) {
      const timeout = setTimeout(runAnimation, 800);
      return () => clearTimeout(timeout);
    }
  }, [isVisible, isAnimating, currentStep, runAnimation]);

  const handleReplay = () => {
    setCurrentStep(-1);
    setShowConfetti(false);
    setSelectedRace(null);
    setSelectedDate(null);
    setTimeout(runAnimation, 200);
  };

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
                {/* Progress dots */}
                <div className="flex justify-center gap-3 py-5 border-b border-slate-100">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-500 ${
                        i <= currentStep
                          ? i === currentStep
                            ? 'bg-blue-500 scale-125 shadow-lg shadow-blue-500/50'
                            : 'bg-green-500'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>

                {/* Content area */}
                <div className="p-6 space-y-4 min-h-[320px]">
                  {steps.map((step, i) => {
                    const isActive = i === currentStep;
                    const isCompleted = i < currentStep;

                    return (
                      <div
                        key={i}
                        className={`relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
                          isActive
                            ? 'bg-blue-50 border-2 border-blue-300 scale-[1.02] shadow-lg'
                            : isCompleted
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-slate-50/50 border border-slate-100 opacity-50'
                        }`}
                      >
                        {/* Step icon */}
                        <div
                          className={`p-3 rounded-xl transition-all duration-300 ${
                            isActive
                              ? `${step.bgColor} ${step.color}`
                              : isCompleted
                              ? 'bg-green-100 text-green-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={24} />
                          ) : (
                            <step.icon size={24} />
                          )}
                        </div>

                        {/* Step content */}
                        <div className="flex-1">
                          <span
                            className={`font-body font-semibold text-base ${
                              isActive
                                ? 'text-primary-900'
                                : isCompleted
                                ? 'text-green-700'
                                : 'text-slate-400'
                            }`}
                          >
                            {t(step.labelKey)}
                          </span>

                          {/* Selected value display */}
                          {i === 0 && selectedRace && (
                            <div className="mt-1 text-sm font-mono text-blue-600 animate-fade-in">
                              {selectedRace}
                            </div>
                          )}
                          {i === 1 && selectedDate && (
                            <div className="mt-1 text-sm font-mono text-orange-600 animate-fade-in">
                              {selectedDate}
                            </div>
                          )}
                        </div>

                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-blue-500 rounded-l-full" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Race selection (shown during step 0) */}
                {currentStep === 0 && !selectedRace && (
                  <div className="absolute bottom-24 left-6 right-6 bg-white rounded-xl shadow-xl border border-slate-200 p-3 animate-slide-up">
                    <div className="grid grid-cols-2 gap-2">
                      {raceOptions.map((race) => (
                        <div
                          key={race}
                          className="px-3 py-2 text-center text-sm font-body font-medium bg-slate-50 rounded-lg text-slate-600"
                        >
                          {race}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completion celebration */}
                {showConfetti && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Confetti particles */}
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 rounded-full animate-fade-in"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          backgroundColor: ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'][
                            i % 5
                          ],
                          animationDelay: `${i * 50}ms`,
                          transform: `scale(${0.5 + Math.random()})`,
                        }}
                      />
                    ))}

                    {/* Success overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent" />
                  </div>
                )}

                {/* Bottom action area */}
                <div className="p-6 pt-0">
                  <div
                    className={`py-4 px-6 rounded-xl text-center font-body font-semibold transition-all duration-500 ${
                      currentStep >= 2
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {currentStep >= 2 ? (
                      <span className="flex items-center justify-center gap-2">
                        <CheckCircle2 size={20} />
                        Plan erstellt!
                      </span>
                    ) : (
                      'Warte auf Eingabe...'
                    )}
                  </div>
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
