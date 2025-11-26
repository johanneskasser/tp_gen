import { useState, useMemo } from 'react';
import { TrainingSession, SessionType, IntervalSet, DistanceUnit } from '../types';
import { Save, X, Trash2, Plus } from 'lucide-react';
import { generateSessionTitle } from '../utils/titleGenerator';
import { SESSION_TYPE_CONFIG, getSessionTypeLabel } from '../constants/sessionTypes';
import { formatPace } from '../utils/paceCalculator';

interface SessionEditorProps {
  session: TrainingSession;
  onSave: (session: TrainingSession) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export default function SessionEditor({
  session,
  onSave,
  onCancel,
  onDelete,
}: SessionEditorProps) {
  const [title, setTitle] = useState(session.title);
  const [type, setType] = useState<SessionType>(session.type);
  const [distance, setDistance] = useState(session.distance?.toString() || '');
  const [duration, setDuration] = useState(session.duration?.toString() || '');
  const [intervals, setIntervals] = useState<IntervalSet[]>(
    session.intervals || []
  );
  const [warmUp, setWarmUp] = useState(session.warmUp?.toString() || '');
  const [warmUpUnit, setWarmUpUnit] = useState<DistanceUnit>(session.warmUpUnit || 'km');
  const [coolDown, setCoolDown] = useState(session.coolDown?.toString() || '');
  const [coolDownUnit, setCoolDownUnit] = useState<DistanceUnit>(session.coolDownUnit || 'km');
  const [notes, setNotes] = useState(session.notes || '');

  const sessionTypes = Object.entries(SESSION_TYPE_CONFIG).map(([value, config]) => ({
    value: value as SessionType,
    label: getSessionTypeLabel(value as SessionType),
    color: config.color,
  }));

  // Calculate pace for tempo runs when both distance and duration are provided
  const calculatedPace = useMemo(() => {
    if (!distance || !duration) return '';
    const distKm = parseFloat(distance);
    const durationMin = parseFloat(duration);
    if (distKm > 0 && durationMin > 0) {
      const paceMinPerKm = durationMin / distKm;
      const minutes = Math.floor(paceMinPerKm);
      const seconds = Math.round((paceMinPerKm - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return '';
  }, [distance, duration]);

  const handleAddInterval = () => {
    setIntervals([
      ...intervals,
      { distance: 1, repetitions: 1, pace: '', recovery: '', recoveryUnit: 'km' },
    ]);
  };

  const handleUpdateInterval = (index: number, field: keyof IntervalSet, value: string | number) => {
    const updated = [...intervals];
    updated[index] = { ...updated[index], [field]: value };
    setIntervals(updated);
  };

  const handleDeleteInterval = (index: number) => {
    setIntervals(intervals.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updatedSession: TrainingSession = {
      ...session,
      title: '',
      type,
      distance: distance ? parseFloat(distance) : undefined,
      duration: duration ? parseFloat(duration) : undefined,
      intervals: type === 'intervals' && intervals.length > 0 ? intervals : undefined,
      warmUp: warmUp ? parseFloat(warmUp) : undefined,
      warmUpUnit: warmUp ? warmUpUnit : undefined,
      coolDown: coolDown ? parseFloat(coolDown) : undefined,
      coolDownUnit: coolDown ? coolDownUnit : undefined,
      notes: notes || undefined,
    };

    // Generate title automatically if user didn't provide one
    updatedSession.title = title.trim() || generateSessionTitle(updatedSession);

    onSave(updatedSession);
    onCancel(); // Close the dialog after saving
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm sm:max-w-md md:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800">Training bearbeiten</h3>
          <button
            onClick={onCancel}
            className="p-1.5 sm:p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Titel (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Wird automatisch generiert wenn leer gelassen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Typ
            </label>
            <div className="flex flex-wrap gap-2">
              {sessionTypes.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setType(st.value)}
                  className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm ${
                    type === st.value
                      ? st.color + ' ring-2 ring-offset-2 ring-blue-500'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {type !== 'intervals' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Distanz (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="10.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dauer (min) - optional
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="60"
                  />
                </div>
              </div>
              {calculatedPace && (
                <div className="mt-2 text-sm text-slate-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <strong>Pace:</strong> {formatPace(calculatedPace)}
                </div>
              )}
            </>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Warm Up
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={warmUp}
                      onChange={(e) => setWarmUp(e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2.0"
                    />
                    <select
                      value={warmUpUnit}
                      onChange={(e) => setWarmUpUnit(e.target.value as DistanceUnit)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="km">km</option>
                      <option value="min">min</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cool Down
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={coolDown}
                      onChange={(e) => setCoolDown(e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2.0"
                    />
                    <select
                      value={coolDownUnit}
                      onChange={(e) => setCoolDownUnit(e.target.value as DistanceUnit)}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="km">km</option>
                      <option value="min">min</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-slate-700">
                  Intervalle
                </label>
                <button
                  onClick={handleAddInterval}
                  className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
                >
                  <Plus size={16} />
                  Intervall
                </button>
              </div>

              <div className="space-y-3">
                {intervals.map((interval, index) => (
                  <div
                    key={index}
                    className="bg-slate-50 p-4 rounded-lg border border-slate-200"
                  >
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Distanz (km)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={interval.distance}
                            onChange={(e) =>
                              handleUpdateInterval(
                                index,
                                'distance',
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Wiederholungen
                          </label>
                          <input
                            type="number"
                            value={interval.repetitions}
                            onChange={(e) =>
                              handleUpdateInterval(
                                index,
                                'repetitions',
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Pace
                          </label>
                          <input
                            type="text"
                            value={interval.pace}
                            onChange={(e) =>
                              handleUpdateInterval(index, 'pace', e.target.value)
                            }
                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="4:30"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Pause
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={interval.recovery}
                              onChange={(e) =>
                                handleUpdateInterval(
                                  index,
                                  'recovery',
                                  e.target.value
                                )
                              }
                              className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="0.2"
                            />
                            <select
                              value={interval.recoveryUnit || 'km'}
                              onChange={(e) =>
                                handleUpdateInterval(
                                  index,
                                  'recoveryUnit',
                                  e.target.value as DistanceUnit
                                )
                              }
                              className="px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                              <option value="km">km</option>
                              <option value="min">min</option>
                            </select>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteInterval(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {intervals.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-sm">
                    Klicke auf "Intervall" um Intervalle hinzuzufügen
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notizen
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Zusätzliche Notizen zum Training..."
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:justify-between">
          <button
            onClick={onDelete}
            className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-last sm:order-first"
          >
            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
            Löschen
          </button>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm sm:text-base"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Save size={16} className="sm:w-[18px] sm:h-[18px]" />
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
