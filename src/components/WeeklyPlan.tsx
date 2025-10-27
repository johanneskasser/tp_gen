import { useState } from 'react';
import { TrainingWeek, TrainingSession } from '../types';
import { formatDate, getDayName } from '../utils/dateUtils';
import SessionEditor from './SessionEditor';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { calculateSessionDistance } from '../utils/calculationUtils';
import { generateSessionTitle } from '../utils/titleGenerator';

interface WeeklyPlanProps {
  week: TrainingWeek;
  weekIndex: number;
  onUpdate: (updatedWeek: TrainingWeek) => void;
}

export default function WeeklyPlan({
  week,
  weekIndex,
  onUpdate,
}: WeeklyPlanProps) {
  const [isExpanded, setIsExpanded] = useState(weekIndex === 0);
  const [editingSession, setEditingSession] = useState<string | null>(null);

  const handleAddSession = (dayOfWeek: number) => {
    const newSession: TrainingSession = {
      id: `${week.weekNumber}-${Date.now()}`,
      dayOfWeek,
      type: 'easy',
      title: '',
      distance: 0,
    };

    const updatedSessions = [...week.sessions, newSession].sort(
      (a, b) => a.dayOfWeek - b.dayOfWeek
    );

    onUpdate({
      ...week,
      sessions: updatedSessions,
    });

    setEditingSession(newSession.id);
  };

  const handleUpdateSession = (updatedSession: TrainingSession) => {
    const updatedSessions = week.sessions.map((s) =>
      s.id === updatedSession.id ? updatedSession : s
    );

    onUpdate({
      ...week,
      sessions: updatedSessions,
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    const updatedSessions = week.sessions.filter((s) => s.id !== sessionId);

    onUpdate({
      ...week,
      sessions: updatedSessions,
    });

    setEditingSession(null);
  };

  const getSessionsForDay = (dayOfWeek: number) => {
    return week.sessions.filter((s) => s.dayOfWeek === dayOfWeek);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50 hover:from-blue-100 hover:to-slate-100 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-blue-600">
            Woche {week.weekNumber}
          </span>
          <span className="text-slate-600">
            {formatDate(week.startDate)} - {formatDate(week.endDate)}
          </span>
          <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-medium">
            {week.totalKm.toFixed(1)} km
          </span>
        </div>
        {isExpanded ? <ChevronUp /> : <ChevronDown />}
      </button>

      {isExpanded && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
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
                        {editingSession === session.id ? (
                          <SessionEditor
                            session={session}
                            onSave={handleUpdateSession}
                            onCancel={() => setEditingSession(null)}
                            onDelete={() => handleDeleteSession(session.id)}
                          />
                        ) : (
                          <button
                            onClick={() => setEditingSession(session.id)}
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
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => handleAddSession(dayOfWeek)}
                      className="w-full py-2 border-2 border-dashed border-slate-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 text-slate-600 hover:text-blue-600"
                    >
                      <Plus size={16} />
                      <span className="text-xs">Hinzufügen</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
