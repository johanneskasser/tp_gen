/**
 * CoachingPanel - Interactive Coaching Assistant
 *
 * Replaces ExpertSuggestionPanel with a friendlier approach.
 * Key difference: Violations are NOT shown separately.
 * Instead, they're integrated into suggestions as "why this helps".
 */

import { useState, useMemo } from 'react';
import {
  Sparkles,
  Calendar,
  TrendingUp,
  CheckCircle,
  Plus,
  Target,
  Zap,
  Lightbulb,
  Heart,
} from 'lucide-react';
import { TrainingPlan, TrainingWeek } from '../../types';
import { TrainingSuggestion } from '../../types/suggestions';
import { TrainingRuleEngine } from '../../expertSystem';
import { SessionSuggestion } from '../../expertSystem/types';
import { formatPace, generatePaceTable } from '../../expertSystem/vdotPaceCalculator';
import { TrainingDataCollector } from '../../utils/trainingDataCollector';
import { useRunnerProfile } from '../../contexts/RunnerProfileContext';
import { getDayName } from '../../utils/dateUtils';
import { getSessionTypeLabel } from '../../constants/sessionTypes';
import { cn } from '../../lib/designSystem';

interface Props {
  plan: TrainingPlan;
  currentWeek: TrainingWeek;
  dayOfWeek?: number;
  onAcceptSuggestion: (suggestion: TrainingSuggestion) => void;
}

export function CoachingPanel({
  plan,
  currentWeek,
  dayOfWeek: initialDay,
  onAcceptSuggestion,
}: Props) {
  const { runnerProfile } = useRunnerProfile();
  const [selectedDay, setSelectedDay] = useState<number | null>(initialDay ?? null);
  const [showPaces, setShowPaces] = useState(false);

  // Initialize expert system
  const ruleEngine = useMemo(() => {
    return new TrainingRuleEngine(plan, runnerProfile || undefined);
  }, [plan, runnerProfile]);

  // Get weekly analysis
  const weekAnalysis = useMemo(() => {
    return ruleEngine.analyzeWeek(currentWeek);
  }, [ruleEngine, currentWeek]);

  // Get VDOT pace table
  const paceTable = useMemo(() => {
    if (runnerProfile?.vdot) {
      return generatePaceTable(runnerProfile.vdot);
    }
    return null;
  }, [runnerProfile]);

  // Get days without sessions (opportunities)
  const emptyDays = useMemo(() => {
    const days: number[] = [];
    for (let d = 0; d < 7; d++) {
      const sessionsOnDay = currentWeek.sessions.filter(s => s.dayOfWeek === d);
      if (sessionsOnDay.length === 0) {
        days.push(d);
      }
    }
    return days;
  }, [currentWeek]);

  // Pre-calculate suggestion counts for all empty days
  const suggestionCountByDay = useMemo(() => {
    const counts = new Map<number, number>();
    for (let d = 0; d < 7; d++) {
      const hasSession = currentWeek.sessions.some(s => s.dayOfWeek === d);
      if (hasSession) {
        counts.set(d, 0);
        continue;
      }
      const dailyAnalysis = ruleEngine.getSuggestionsForDay(currentWeek, d);
      counts.set(d, dailyAnalysis?.suggestions.length || 0);
    }
    return counts;
  }, [currentWeek, ruleEngine]);

  // Get suggestions for selected day (integrating violations as context)
  const daySuggestions = useMemo(() => {
    if (selectedDay === null) return { suggestions: [], context: [] };

    const hasSession = currentWeek.sessions.some(s => s.dayOfWeek === selectedDay);
    if (hasSession) return { suggestions: [], context: [] };

    const dailyAnalysis = ruleEngine.getSuggestionsForDay(currentWeek, selectedDay);
    if (!dailyAnalysis) return { suggestions: [], context: [] };

    // Convert violations to helpful context (not shown separately!)
    const context = dailyAnalysis.violations.map(v => v.recommendation);

    return {
      suggestions: dailyAnalysis.suggestions,
      context,
      recommendation: dailyAnalysis.recommendation,
    };
  }, [selectedDay, currentWeek, ruleEngine]);

  // Accept a suggestion
  const handleAccept = (suggestion: SessionSuggestion, day: number) => {
    const trainingSuggestion = ruleEngine.convertToTrainingSuggestion(suggestion, day);

    TrainingDataCollector.logSuggestion(
      { plan, currentWeek, weekNumber: currentWeek.weekNumber },
      trainingSuggestion,
      'accepted'
    );

    onAcceptSuggestion(trainingSuggestion);
  };

  // Get actual suggestion count for a day (not tips!)
  const getSuggestionCountForDay = (day: number) => {
    return suggestionCountByDay.get(day) || 0;
  };

  // Check if day has tips (for lightbulb indicator)
  const hasTipsForDay = (day: number) => {
    const dayData = weekAnalysis.days.get(day);
    return (dayData?.violations.length || 0) > 0;
  };

  const PHASE_LABELS: Record<string, string> = {
    base: 'Grundlagen',
    build: 'Aufbau',
    peak: 'Peak',
    taper: 'Tapering',
    recovery: 'Regeneration',
  };

  return (
    <div className="space-y-6">
      {/* Coaching intro */}
      <div className="text-center pb-4 border-b border-stone-100">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 mb-3">
          <Sparkles className="w-7 h-7 text-violet-500" />
        </div>
        <h3 className="text-lg font-semibold text-stone-800">
          Woche {currentWeek.weekNumber} optimieren
        </h3>
        <p className="text-sm text-stone-500 mt-1">
          {PHASE_LABELS[weekAnalysis.phase] || weekAnalysis.phase} • Wähle einen Tag für Vorschläge
        </p>
      </div>

      {/* Week stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={Calendar}
          label="Einheiten"
          value={currentWeek.sessions.length}
          color="sky"
        />
        <StatCard
          icon={TrendingUp}
          label="Kilometer"
          value={`${currentWeek.totalKm.toFixed(0)}`}
          color="emerald"
        />
        <StatCard
          icon={Target}
          label="Freie Tage"
          value={emptyDays.length}
          color="amber"
        />
      </div>

      {/* VDOT Paces toggle */}
      {paceTable && (
        <div>
          <button
            onClick={() => setShowPaces(!showPaces)}
            className={cn(
              'w-full py-2 text-sm font-medium rounded-lg transition-colors',
              'flex items-center justify-center gap-2',
              showPaces
                ? 'bg-violet-100 text-violet-700'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            )}
          >
            <Heart className="w-4 h-4" />
            {showPaces ? 'Tempos ausblenden' : `VDOT ${runnerProfile?.vdot} Tempos anzeigen`}
          </button>

          {showPaces && (
            <div className="mt-3 p-4 bg-violet-50 rounded-xl border border-violet-100">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.entries(paceTable).map(([zone, pace]) => (
                  <div key={zone} className="bg-white rounded-lg p-2 text-center">
                    <span className="text-xs text-stone-500 block">{zone}</span>
                    <span className="font-semibold text-violet-700">{pace}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Day selector */}
      <div>
        <p className="text-sm font-medium text-stone-600 mb-3">
          Wähle einen Tag:
        </p>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, day) => {
            const sessionsOnDay = currentWeek.sessions.filter(s => s.dayOfWeek === day);
            const isSelected = selectedDay === day;
            const hasSession = sessionsOnDay.length > 0;
            const suggestionCount = getSuggestionCountForDay(day);
            const hasTips = hasTipsForDay(day);

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'relative p-3 rounded-xl text-center transition-all',
                  'border-2',
                  isSelected
                    ? 'border-violet-400 bg-violet-50 shadow-sm'
                    : hasSession
                      ? 'border-stone-200 bg-stone-50 hover:border-stone-300'
                      : 'border-dashed border-stone-200 hover:border-violet-300 hover:bg-violet-50/50'
                )}
              >
                <span className={cn(
                  'text-xs font-medium',
                  isSelected ? 'text-violet-600' : 'text-stone-500'
                )}>
                  {getDayName(day).slice(0, 2)}
                </span>

                {hasSession ? (
                  <div className="mt-1">
                    <CheckCircle className={cn(
                      'w-4 h-4 mx-auto',
                      isSelected ? 'text-violet-500' : 'text-emerald-500'
                    )} />
                  </div>
                ) : (
                  <div className="mt-1">
                    <Plus className={cn(
                      'w-4 h-4 mx-auto',
                      isSelected ? 'text-violet-400' : 'text-stone-300'
                    )} />
                  </div>
                )}

                {/* Suggestion indicator - only show if there are actual suggestions */}
                {suggestionCount > 0 && !hasSession && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {suggestionCount}
                  </span>
                )}

                {/* Tips indicator - show small lightbulb if tips but no suggestions */}
                {suggestionCount === 0 && hasTips && !hasSession && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                    <Lightbulb className="w-2.5 h-2.5 text-amber-500" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day content */}
      {selectedDay !== null && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <h4 className="text-sm font-semibold text-stone-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-500" />
            {getDayName(selectedDay)}
          </h4>

          {/* Context tips (integrated from violations - shown as helpful hints) */}
          {daySuggestions.context && daySuggestions.context.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-700 mb-1">
                    {daySuggestions.context.length === 1 ? 'Tipp für diesen Tag:' : 'Tipps für diesen Tag:'}
                  </p>
                  <ul className="text-sm text-amber-600 space-y-1">
                    {daySuggestions.context.slice(0, 3).map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-amber-400">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {daySuggestions.suggestions.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-stone-500">
                Vorgeschlagene Einheiten:
              </p>
              {daySuggestions.suggestions.map((suggestion, idx) => (
                <SuggestionCard
                  key={idx}
                  suggestion={suggestion}
                  onAccept={() => handleAccept(suggestion, selectedDay)}
                />
              ))}
            </div>
          ) : currentWeek.sessions.some(s => s.dayOfWeek === selectedDay) ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm text-emerald-700 font-medium">
                Bereits geplant!
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Dieser Tag hat bereits eine Einheit.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-100 text-center">
              <p className="text-sm text-stone-500">
                Keine spezifischen Vorschläge für diesen Tag.
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {daySuggestions.recommendation === 'rest'
                  ? 'Ein Ruhetag wäre hier ideal.'
                  : 'Du kannst frei wählen, was du trainieren möchtest.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* No day selected */}
      {selectedDay === null && (
        <div className="text-center py-6 text-stone-400">
          <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Wähle einen Tag oben aus</p>
        </div>
      )}

      {/* Attribution */}
      <div className="pt-4 border-t border-stone-100 flex items-center justify-center gap-2 text-xs text-stone-400">
        <Zap className="w-3 h-3" />
        <span>
          Coaching: Daniels • Pfitzinger • Hansons
        </span>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'sky' | 'emerald' | 'amber';
}) {
  const colorClasses = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className={cn(
      'p-3 rounded-xl border text-center',
      colorClasses[color]
    )}>
      <Icon className="w-5 h-5 mx-auto mb-1 opacity-60" />
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onAccept,
}: {
  suggestion: SessionSuggestion;
  onAccept: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-white border border-stone-200 hover:border-violet-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-stone-800">
              {getSessionTypeLabel(suggestion.type)}
            </span>
            <span className={cn(
              'px-1.5 py-0.5 rounded text-xs font-medium',
              suggestion.priority === 'high'
                ? 'bg-violet-100 text-violet-700'
                : 'bg-stone-100 text-stone-600'
            )}>
              {suggestion.priority === 'high' ? 'Empfohlen' : 'Optional'}
            </span>
          </div>

          {suggestion.distance && (
            <p className="text-sm text-stone-600">
              {suggestion.distance.toFixed(1)} km
              {suggestion.warmUp && ` (+ ${suggestion.warmUp}${suggestion.warmUpUnit} Einlaufen)`}
              {suggestion.targetPace && (
                <span className="text-violet-600 ml-2">
                  @ {formatPace(suggestion.targetPace)}/km
                </span>
              )}
            </p>
          )}

          {suggestion.reasoning && (
            <p className="text-xs text-stone-400 mt-2 italic">
              {suggestion.reasoning}
            </p>
          )}
        </div>

        <button
          onClick={onAccept}
          className={cn(
            'flex-shrink-0 px-3 py-2 rounded-lg',
            'bg-violet-100 text-violet-700 font-medium text-sm',
            'hover:bg-violet-200 transition-colors',
            'flex items-center gap-1'
          )}
        >
          <Plus className="w-4 h-4" />
          Hinzufügen
        </button>
      </div>
    </div>
  );
}
