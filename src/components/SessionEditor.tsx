import { useState } from 'react';
import { TrainingSession, SessionType, IntervalSet } from '../types';
import { Save, X, Trash2, Plus } from 'lucide-react';
import { generateSessionTitle } from '../utils/titleGenerator';
import { SESSION_TYPE_CONFIG } from '../constants/sessionTypes';

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
  const [coolDown, setCoolDown] = useState(session.coolDown?.toString() || '');
  const [notes, setNotes] = useState(session.notes || '');

  const sessionTypes: { value: SessionType; label: string; color: string }[] = [
    { value: 'easy', label: 'Locker', color: 'bg-green-100 text-green-800' },
    { value: 'long', label: 'Lang', color: 'bg-blue-100 text-blue-800' },
    { value: 'intervals', label: 'Intervall', color: 'bg-red-100 text-red-800' },
    { value: 'tempo', label: 'Tempo', color: 'bg-orange-100 text-orange-800' },
    { value: 'recovery', label: 'Regeneration', color: 'bg-slate-100 text-slate-800' },
    { value: 'race', label: 'Wettkampf', color: 'bg-purple-100 text-purple-800' },
  ];

  const handleAddInterval = () => {
    setIntervals([
      ...intervals,
      { distance: 1, repetitions: 1, pace: '', recovery: '' },
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
      coolDown: coolDown ? parseFloat(coolDown) : undefined,
      notes: notes || undefined,
    };

    // Generate title automatically if user didn't provide one
    updatedSession.title = title.trim() || generateSessionTitle(updatedSession);

    onSave(updatedSession);
    onCancel(); // Close the dialog after saving
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Training bearbeiten</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
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
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Distanz (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="60"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Warm Up (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={warmUp}
                    onChange={(e) => setWarmUp(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cool Down (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={coolDown}
                    onChange={(e) => setCoolDown(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2.0"
                  />
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
                    <div className="grid grid-cols-4 gap-3">
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

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Pause (km)
                          </label>
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
                            className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="0.2"
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteInterval(index)}
                          className="mt-5 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
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

        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between">
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
            Löschen
          </button>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              Speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
