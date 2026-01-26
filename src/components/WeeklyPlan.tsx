import { useState, useMemo } from 'react';
import { TrainingWeek, TrainingSession, TrainingPlan } from '../types';
import { TrainingSuggestion } from '../types/suggestions';
import { formatDate, getDayName } from '../utils/dateUtils';
import SessionEditor from './SessionEditor';
import { Plus, ChevronDown, ChevronUp, Lightbulb, Sparkles } from 'lucide-react';
import { calculateSessionDistance } from '../utils/calculationUtils';
import { generateSessionTitle } from '../utils/titleGenerator';
import { CoachingPanel, WeekCoachBadge } from './coaching';
import { TrainingRuleEngine } from '../expertSystem';
import { analyzeWeekIntensity } from '../utils/intensityAnalyzer';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { calculateTrainingZones, getBestVDOT } from '../utils/vdotCalculator';
import { cn, typography } from '../lib/designSystem';

interface WeeklyPlanProps {
  week: TrainingWeek;
  weekIndex: number;
  onUpdate: (updatedWeek: TrainingWeek) => void;
  plan?: TrainingPlan; // Optional: for suggestion engine
}

export default function WeeklyPlan({
  week,
  weekIndex,
  onUpdate,
  plan,
}: WeeklyPlanProps) {
  const { runnerProfile } = useRunnerProfile();
  const [isExpanded, setIsExpanded] = useState(weekIndex === 0);
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [editingExistingSession, setEditingExistingSession] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionDayOfWeek, setSuggestionDayOfWeek] = useState<number | undefined>(undefined);

  const handleAddSession = (dayOfWeek: number) => {
    const newSession: TrainingSession = {
      id: `${week.weekNumber}-${Date.now()}`,
      dayOfWeek,
      type: 'easy',
      title: '',
      distance: 0,
    };

    setEditingSession(newSession);
    setEditingExistingSession(false);
  };

  const handleShowSuggestions = (dayOfWeek?: number) => {
    setSuggestionDayOfWeek(dayOfWeek);
    setShowSuggestions(true);
  };

  const handleAcceptSuggestion = (suggestion: TrainingSuggestion) => {
    // Create new session from suggestion
    const newSession: TrainingSession = {
      id: `${week.weekNumber}-${Date.now()}`,
      dayOfWeek: suggestion.dayOfWeek ?? 0,
      type: suggestion.type,
      distance: suggestion.distance,
      duration: suggestion.duration,
      warmUp: suggestion.warmUp,
      warmUpUnit: suggestion.warmUpUnit,
      coolDown: suggestion.coolDown,
      coolDownUnit: suggestion.coolDownUnit,
      title: suggestion.suggestedTitle || '',
      notes: suggestion.notes,
    };

    // Generate title if not provided
    if (!newSession.title) {
      newSession.title = generateSessionTitle(newSession);
    }

    // Add session to week
    const updatedSessions = [...week.sessions, newSession].sort(
      (a, b) => a.dayOfWeek - b.dayOfWeek
    );

    onUpdate({
      ...week,
      sessions: updatedSessions,
    });

    setShowSuggestions(false);
  };

  const handleUpdateSession = (updatedSession: TrainingSession) => {
    let updatedSessions: TrainingSession[];

    if (editingExistingSession) {
      // Update existing session
      updatedSessions = week.sessions.map((s) =>
        s.id === updatedSession.id ? updatedSession : s
      );
    } else {
      // Add new session
      updatedSessions = [...week.sessions, updatedSession].sort(
        (a, b) => a.dayOfWeek - b.dayOfWeek
      );
    }

    onUpdate({
      ...week,
      sessions: updatedSessions,
    });

    setEditingSession(null);
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = week.sessions.filter((s) => s.id !== sessionId);

    onUpdate({
      ...week,
      sessions: updatedSessions,
    });

    setEditingSession(null);
  };

  const handleEditExistingSession = (session: TrainingSession) => {
    setEditingSession(session);
    setEditingExistingSession(true);
  };

  const getSessionsForDay = (dayOfWeek: number) => {
    return week.sessions.filter((s) => s.dayOfWeek === dayOfWeek);
  };

  // Calculate which days to show based on week start
  const startDayOfWeek = week.startDayOfWeek ?? 0; // Default to Monday if not set
  const daysToShow = Array.from({ length: 7 }, (_, i) => (startDayOfWeek + i) % 7);

  // Calculate training zones from runner profile for dynamic RPE-based intensity analysis
  let zones;
  if (runnerProfile) {
    const vdot = runnerProfile.vdot || getBestVDOT(runnerProfile.personalBests || []);
    if (vdot > 0) {
      zones = calculateTrainingZones(vdot);
    }
  }

  // Calculate intensity distribution for the week (using dynamic RPE if zones available)
  const intensityDist = analyzeWeekIntensity(week.sessions, zones);

  // Expert System - for coaching badge
  const ruleEngine = useMemo(() => {
    if (!plan) return null;
    return new TrainingRuleEngine(plan, runnerProfile || undefined);
  }, [plan, runnerProfile]);

  // Count actual suggestions (not violations/tips) for coaching badge
  const suggestionCount = useMemo(() => {
    if (!ruleEngine) return 0;
    let count = 0;
    for (let d = 0; d < 7; d++) {
      const hasSession = week.sessions.some(s => s.dayOfWeek === d);
      if (hasSession) continue;
      const dailyAnalysis = ruleEngine.getSuggestionsForDay(week, d);
      count += dailyAnalysis?.suggestions.length || 0;
    }
    return count;
  }, [ruleEngine, week]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="w-full px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-slate-50">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Week info and expand button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 items-start hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
                Woche {week.weekNumber}
              </span>
              <span className="text-xs sm:text-sm md:text-base text-slate-600">
                {formatDate(week.startDate)} - {formatDate(week.endDate)}
              </span>
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-600 text-white rounded-full text-xs sm:text-sm font-medium">
                {week.totalKm.toFixed(1)} km
              </span>
              {/* Coaching Badge - shows actual suggestion count */}
              {plan && (
                <WeekCoachBadge
                  tipCount={suggestionCount}
                  onClick={() => {
                    setIsExpanded(true);
                    handleShowSuggestions(undefined);
                  }}
                />
              )}
              <div className="flex-shrink-0 text-slate-600">
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
          </button>

          {/* Center: Intensity zones */}
          <div className="hidden lg:flex items-center gap-3 flex-1 max-w-md">
            <div className="flex items-center gap-2 flex-1">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-slate-600">Locker:</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${intensityDist.current.easy * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">
                    {Math.round(intensityDist.current.easy * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-slate-600">Moderat:</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-yellow-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${intensityDist.current.moderate * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">
                    {Math.round(intensityDist.current.moderate * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 text-xs text-slate-600">Hart:</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-red-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${intensityDist.current.hard * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-10 text-right">
                    {Math.round(intensityDist.current.hard * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right side: AI Suggestion Button */}
          {plan && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShowSuggestions(undefined);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg hover:from-violet-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
            >
              <Sparkles size={16} />
              <span className="hidden sm:inline">Coaching</span>
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-3 sm:p-6 space-y-4">
          {/* Days Grid - no violation coloring */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
            {daysToShow.map((dayOfWeek) => {
              const daySessions = getSessionsForDay(dayOfWeek);

              return (
                <div
                  key={dayOfWeek}
                  className="border border-slate-200 bg-slate-50 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700 text-sm">
                      {getDayName(dayOfWeek)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {daySessions.map((session) => (
                      <div key={session.id}>
                        <button
                          onClick={() => handleEditExistingSession(session)}
                          className="w-full text-left p-2 bg-white rounded border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all"
                        >
                          <div className="font-medium text-sm text-slate-800">
                            {session.title || generateSessionTitle(session)}
                          </div>
                          <div className="text-xs text-slate-600 mt-1">
                            {calculateSessionDistance(session).toFixed(1)} km
                          </div>
                          {session.notes && (
                            <div className="text-xs text-slate-500 mt-1 italic">
                              {session.notes.substring(0, 30)}
                              {session.notes.length > 30 ? '...' : ''}
                            </div>
                          )}
                        </button>
                      </div>
                    ))}

                    {/* Add Session Button */}
                    <button
                      onClick={() => handleAddSession(dayOfWeek)}
                      className="w-full py-2 border-2 border-dashed border-slate-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 text-slate-600 hover:text-blue-600 text-xs"
                    >
                      <Plus size={14} />
                      <span>Hinzufügen</span>
                    </button>

                    {/* Suggestion Button - Only show if plan is available */}
                    {plan && (
                      <button
                        onClick={() => handleShowSuggestions(dayOfWeek)}
                        className="w-full py-2 border-2 border-dashed border-violet-300 rounded hover:border-violet-500 hover:bg-violet-50 transition-colors flex items-center justify-center gap-1 text-violet-600 hover:text-violet-700 text-xs font-medium"
                      >
                        <Lightbulb size={14} />
                        <span>Vorschlag</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coaching Panel Modal */}
          {showSuggestions && plan && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
                <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex justify-between items-center z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                      <Sparkles className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                      <h3 className={cn(typography.h2, 'text-text-primary')}>
                        Coaching
                      </h3>
                      <p className={cn(typography.caption, 'text-text-tertiary')}>
                        Personalisierte Trainingsvorschläge
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-stone-400 hover:text-stone-600 transition-colors p-2 rounded-lg hover:bg-stone-100"
                  >
                    <span className="sr-only">Schließen</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                  <CoachingPanel
                    plan={plan}
                    currentWeek={week}
                    dayOfWeek={suggestionDayOfWeek}
                    onAcceptSuggestion={handleAcceptSuggestion}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {editingSession && (
        <SessionEditor
          session={editingSession}
          onSave={handleUpdateSession}
          onCancel={handleCancelEdit}
          onDelete={() => handleDeleteSession(editingSession.id)}
        />
      )}
    </div>
  );
}
