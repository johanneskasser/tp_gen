import { useState } from 'react';
import { TrainingWeek, TrainingSession, TrainingPlan } from '../types';
import { TrainingSuggestion } from '../types/suggestions';
import { formatDate, getDayName } from '../utils/dateUtils';
import SessionEditor from './SessionEditor';
import { Plus, ChevronDown, ChevronUp, Lightbulb, Sparkles } from 'lucide-react';
import { calculateSessionDistance } from '../utils/calculationUtils';
import { generateSessionTitle } from '../utils/titleGenerator';
import { TrainingSuggestionPanel } from './TrainingSuggestionPanel';

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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50 hover:from-blue-100 hover:to-slate-100 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 items-start">
          <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
            Woche {week.weekNumber}
          </span>
          <span className="text-xs sm:text-sm md:text-base text-slate-600">
            {formatDate(week.startDate)} - {formatDate(week.endDate)}
          </span>
          <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-600 text-white rounded-full text-xs sm:text-sm font-medium">
            {week.totalKm.toFixed(1)} km
          </span>
        </div>
        <div className="flex-shrink-0">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-3 sm:p-6 space-y-4">
          {/* Smart Suggestions Button - Show at top of week */}
          {plan && (
            <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 border border-purple-200">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-600" size={20} />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">Smart Trainings-Vorschläge</p>
                  <p className="text-xs text-slate-600">KI-gestützte Empfehlungen für optimales Training</p>
                </div>
              </div>
              <button
                onClick={() => handleShowSuggestions(undefined)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Lightbulb size={16} />
                Vorschläge anzeigen
              </button>
            </div>
          )}

          {/* Days Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
            {daysToShow.map((dayOfWeek) => {
              const daySessions = getSessionsForDay(dayOfWeek);
              return (
                <div
                  key={dayOfWeek}
                  className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                >
                  <div className="font-medium text-slate-700 mb-2 text-sm">
                    {getDayName(dayOfWeek)}
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
                        className="w-full py-2 border-2 border-dashed border-purple-300 rounded hover:border-purple-500 hover:bg-purple-50 transition-colors flex items-center justify-center gap-1 text-purple-600 hover:text-purple-700 text-xs font-medium"
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

          {/* Suggestion Panel Modal */}
          {showSuggestions && plan && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="text-purple-600" />
                    Smart Trainings-Vorschläge
                  </h3>
                  <button
                    onClick={() => setShowSuggestions(false)}
                    className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6">
                  <TrainingSuggestionPanel
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
