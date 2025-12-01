import { useState, useMemo } from 'react';
import {
  TrainingSession,
  SessionType,
  IntervalSet,
  DistanceUnit,
  FartlekSegment,
  Exercise,
} from '../types';
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
  const [notes, setNotes] = useState(session.notes || '');

  // Standard fields
  const [distance, setDistance] = useState(session.distance?.toString() || '');
  const [duration, setDuration] = useState(session.duration?.toString() || '');

  // Intervals
  const [intervals, setIntervals] = useState<IntervalSet[]>(session.intervals || []);
  const [warmUp, setWarmUp] = useState(session.warmUp?.toString() || '');
  const [warmUpUnit, setWarmUpUnit] = useState<DistanceUnit>(session.warmUpUnit || 'km');
  const [coolDown, setCoolDown] = useState(session.coolDown?.toString() || '');
  const [coolDownUnit, setCoolDownUnit] = useState<DistanceUnit>(session.coolDownUnit || 'km');

  // Strides
  const [stridesCount, setStridesCount] = useState(session.strides?.count?.toString() || '6');
  const [stridesDuration, setStridesDuration] = useState(session.strides?.duration?.toString() || '15');
  const [stridesRecovery, setStridesRecovery] = useState(session.strides?.recovery?.toString() || '60');

  // Hill Repeats
  const [hillReps, setHillReps] = useState(session.hillRepeats?.repetitions?.toString() || '6');
  const [hillDistance, setHillDistance] = useState(session.hillRepeats?.distance?.toString() || '');
  const [hillDuration, setHillDuration] = useState(session.hillRepeats?.duration?.toString() || '');
  const [hillRecovery, setHillRecovery] = useState(session.hillRepeats?.recovery?.toString() || '2');
  const [hillGrade, setHillGrade] = useState(session.hillRepeats?.grade?.toString() || '');

  // Progression
  const [progressionDistance, setProgressionDistance] = useState(session.progression?.totalDistance?.toString() || '');
  const [progressionStartPace, setProgressionStartPace] = useState(session.progression?.startPace || '');
  const [progressionEndPace, setProgressionEndPace] = useState(session.progression?.endPace || '');

  // Fartlek
  const [fartlekSegments, setFartlekSegments] = useState<FartlekSegment[]>(session.fartlek || []);

  // Exercises (Strength & Plyometrics)
  const [exercises, setExercises] = useState<Exercise[]>(session.exercises || []);

  const sessionTypes = Object.entries(SESSION_TYPE_CONFIG).map(([value, config]) => ({
    value: value as SessionType,
    label: getSessionTypeLabel(value as SessionType),
    color: config.color,
  }));

  // Calculate pace for tempo runs
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

  // Interval handlers
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

  // Fartlek handlers
  const handleAddFartlekSegment = () => {
    setFartlekSegments([...fartlekSegments, { type: 'easy', duration: 5, pace: '' }]);
  };

  const handleUpdateFartlekSegment = (
    index: number,
    field: keyof FartlekSegment,
    value: string | number
  ) => {
    const updated = [...fartlekSegments];
    updated[index] = { ...updated[index], [field]: value };
    setFartlekSegments(updated);
  };

  const handleDeleteFartlekSegment = (index: number) => {
    setFartlekSegments(fartlekSegments.filter((_, i) => i !== index));
  };

  // Exercise handlers
  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: 10, isTime: false, restTime: 60 }]);
  };

  const handleUpdateExercise = (index: number, field: keyof Exercise, value: string | number | boolean) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleDeleteExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updatedSession: TrainingSession = {
      ...session,
      title: '',
      type,
      notes: notes || undefined,
    };

    // Set fields based on session type
    switch (type) {
      case 'strides':
        updatedSession.strides = {
          count: parseInt(stridesCount) || 6,
          duration: parseInt(stridesDuration) || 15,
          recovery: parseInt(stridesRecovery) || 60,
        };
        break;

      case 'hill_repeats':
        updatedSession.hillRepeats = {
          repetitions: parseInt(hillReps) || 6,
          distance: hillDistance ? parseFloat(hillDistance) : undefined,
          duration: hillDuration ? parseFloat(hillDuration) : undefined,
          recovery: parseFloat(hillRecovery) || 2,
          grade: hillGrade ? parseFloat(hillGrade) : undefined,
        };
        updatedSession.warmUp = warmUp ? parseFloat(warmUp) : undefined;
        updatedSession.warmUpUnit = warmUp ? warmUpUnit : undefined;
        updatedSession.coolDown = coolDown ? parseFloat(coolDown) : undefined;
        updatedSession.coolDownUnit = coolDown ? coolDownUnit : undefined;
        break;

      case 'progression':
        updatedSession.progression = {
          totalDistance: progressionDistance ? parseFloat(progressionDistance) : undefined,
          startPace: progressionStartPace || undefined,
          endPace: progressionEndPace || undefined,
        };
        updatedSession.warmUp = warmUp ? parseFloat(warmUp) : undefined;
        updatedSession.warmUpUnit = warmUp ? warmUpUnit : undefined;
        updatedSession.coolDown = coolDown ? parseFloat(coolDown) : undefined;
        updatedSession.coolDownUnit = coolDown ? coolDownUnit : undefined;
        break;

      case 'fartlek':
        updatedSession.fartlek = fartlekSegments.length > 0 ? fartlekSegments : undefined;
        updatedSession.warmUp = warmUp ? parseFloat(warmUp) : undefined;
        updatedSession.warmUpUnit = warmUp ? warmUpUnit : undefined;
        updatedSession.coolDown = coolDown ? parseFloat(coolDown) : undefined;
        updatedSession.coolDownUnit = coolDown ? coolDownUnit : undefined;
        break;

      case 'strength':
      case 'plyometrics':
        updatedSession.exercises = exercises.length > 0 ? exercises : undefined;
        updatedSession.duration = duration ? parseFloat(duration) : undefined;
        break;

      case 'intervals':
        updatedSession.intervals = intervals.length > 0 ? intervals : undefined;
        updatedSession.warmUp = warmUp ? parseFloat(warmUp) : undefined;
        updatedSession.warmUpUnit = warmUp ? warmUpUnit : undefined;
        updatedSession.coolDown = coolDown ? parseFloat(coolDown) : undefined;
        updatedSession.coolDownUnit = coolDown ? coolDownUnit : undefined;
        break;

      default:
        // easy, long, tempo, recovery, race
        updatedSession.distance = distance ? parseFloat(distance) : undefined;
        updatedSession.duration = duration ? parseFloat(duration) : undefined;
        break;
    }

    // Generate title automatically if user didn't provide one
    updatedSession.title = title.trim() || generateSessionTitle(updatedSession);

    onSave(updatedSession);
    onCancel();
  };

  // Render fields based on session type
  const renderSessionFields = () => {
    switch (type) {
      case 'strides':
        return (
          <div className="space-y-4">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-sm text-cyan-800">
              <strong>Steigerungen:</strong> 4-8 kurze Sprints (10-20s) zur Technik- und Geschwindigkeitspflege
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Anzahl
                </label>
                <input
                  type="number"
                  min="4"
                  max="8"
                  value={stridesCount}
                  onChange={(e) => setStridesCount(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dauer (Sekunden)
                </label>
                <input
                  type="number"
                  min="10"
                  max="20"
                  value={stridesDuration}
                  onChange={(e) => setStridesDuration(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pause (Sekunden)
                </label>
                <input
                  type="number"
                  value={stridesRecovery}
                  onChange={(e) => setStridesRecovery(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="60"
                />
              </div>
            </div>
          </div>
        );

      case 'hill_repeats':
        return (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              <strong>Bergwiederholungen:</strong> Für Kraft, Technik und neuromuskuläre Qualität
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2.0"
                  />
                  <select
                    value={warmUpUnit}
                    onChange={(e) => setWarmUpUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2.0"
                  />
                  <select
                    value={coolDownUnit}
                    onChange={(e) => setCoolDownUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Wiederholungen
                </label>
                <input
                  type="number"
                  value={hillReps}
                  onChange={(e) => setHillReps(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Distanz (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hillDistance}
                  onChange={(e) => setHillDistance(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Dauer (min)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={hillDuration}
                  onChange={(e) => setHillDuration(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Pause (min)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={hillRecovery}
                  onChange={(e) => setHillRecovery(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Steigung (%) - optional
              </label>
              <input
                type="number"
                step="0.5"
                value={hillGrade}
                onChange={(e) => setHillGrade(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="5"
              />
            </div>
          </div>
        );

      case 'progression':
        return (
          <div className="space-y-4">
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-3 text-sm text-cyan-800">
              <strong>Progression Run:</strong> Starte locker und steigere das Tempo kontinuierlich
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Warm Up (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={warmUp}
                    onChange={(e) => setWarmUp(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2.0"
                  />
                  <select
                    value={warmUpUnit}
                    onChange={(e) => setWarmUpUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cool Down (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={coolDown}
                    onChange={(e) => setCoolDown(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2.0"
                  />
                  <select
                    value={coolDownUnit}
                    onChange={(e) => setCoolDownUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Distanz (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={progressionDistance}
                  onChange={(e) => setProgressionDistance(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start-Pace
                </label>
                <input
                  type="text"
                  value={progressionStartPace}
                  onChange={(e) => setProgressionStartPace(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="6:00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End-Pace
                </label>
                <input
                  type="text"
                  value={progressionEndPace}
                  onChange={(e) => setProgressionEndPace(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="4:30"
                />
              </div>
            </div>
          </div>
        );

      case 'fartlek':
        return (
          <div className="space-y-4">
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 text-sm text-pink-800">
              <strong>Fartlek:</strong> Spielerische Tempowechsel für vielseitiges Training
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2.0"
                  />
                  <select
                    value={warmUpUnit}
                    onChange={(e) => setWarmUpUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2.0"
                  />
                  <select
                    value={coolDownUnit}
                    onChange={(e) => setCoolDownUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-700">Segmente</label>
              <button
                onClick={handleAddFartlekSegment}
                className="px-3 py-1 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center gap-1 text-sm"
              >
                <Plus size={16} />
                Segment
              </button>
            </div>
            <div className="space-y-3">
              {fartlekSegments.map((segment, index) => (
                <div
                  key={index}
                  className="bg-slate-50 p-4 rounded-lg border border-slate-200"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Typ
                      </label>
                      <select
                        value={segment.type}
                        onChange={(e) =>
                          handleUpdateFartlekSegment(index, 'type', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="easy">Locker</option>
                        <option value="tempo">Tempo</option>
                        <option value="fast">Schnell</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Dauer (min)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        value={segment.duration}
                        onChange={(e) =>
                          handleUpdateFartlekSegment(index, 'duration', parseFloat(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="5"
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Pace (optional)
                        </label>
                        <input
                          type="text"
                          value={segment.pace || ''}
                          onChange={(e) =>
                            handleUpdateFartlekSegment(index, 'pace', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="4:30"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteFartlekSegment(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {fartlekSegments.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  Klicke auf "Segment" um Fartlek-Segmente hinzuzufügen
                </div>
              )}
            </div>
          </div>
        );

      case 'strength':
      case 'plyometrics':
        return (
          <div className="space-y-4">
            <div className={`${type === 'strength' ? 'bg-gray-50 border-gray-200' : 'bg-indigo-50 border-indigo-200'} border rounded-lg p-3 text-sm ${type === 'strength' ? 'text-gray-800' : 'text-indigo-800'}`}>
              <strong>{type === 'strength' ? 'Krafttraining:' : 'Plyometrie:'}</strong>{' '}
              {type === 'strength' ? 'Schweres/explosives Krafttraining für Laufökonomie' : 'Sprünge, Hops, Bounds für Schnellkraft'}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gesamtdauer (min) - optional
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="45"
              />
            </div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-slate-700">Übungen</label>
              <button
                onClick={handleAddExercise}
                className={`px-3 py-1 ${type === 'strength' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg transition-colors flex items-center gap-1 text-sm`}
              >
                <Plus size={16} />
                Übung
              </button>
            </div>
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div
                  key={index}
                  className="bg-slate-50 p-4 rounded-lg border border-slate-200"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Übung
                      </label>
                      <input
                        type="text"
                        value={exercise.name}
                        onChange={(e) =>
                          handleUpdateExercise(index, 'name', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="z.B. Kniebeugen, Box Jumps, etc."
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Sätze
                        </label>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) =>
                            handleUpdateExercise(index, 'sets', parseInt(e.target.value))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="3"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {exercise.isTime ? 'Zeit (s)' : 'Wdh.'}
                        </label>
                        <input
                          type="number"
                          value={exercise.reps}
                          onChange={(e) =>
                            handleUpdateExercise(index, 'reps', parseInt(e.target.value))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder={exercise.isTime ? '30' : '10'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Pause (s)
                        </label>
                        <input
                          type="number"
                          value={exercise.restTime || ''}
                          onChange={(e) =>
                            handleUpdateExercise(index, 'restTime', parseInt(e.target.value))
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="60"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <label className="flex items-center text-xs font-medium text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={exercise.isTime || false}
                            onChange={(e) =>
                              handleUpdateExercise(index, 'isTime', e.target.checked)
                            }
                            className="mr-1.5 rounded"
                          />
                          Zeit
                        </label>
                        <button
                          onClick={() => handleDeleteExercise(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {exercises.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-sm">
                  Klicke auf "Übung" um Übungen hinzuzufügen
                </div>
              )}
            </div>
          </div>
        );

      case 'intervals':
        return (
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
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2.0"
                  />
                  <select
                    value={warmUpUnit}
                    onChange={(e) => setWarmUpUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="2.0"
                  />
                  <select
                    value={coolDownUnit}
                    onChange={(e) => setCoolDownUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
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
        );

      default:
        // easy, long, tempo, recovery, race
        return (
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
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm sm:max-w-md md:max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center z-10">
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

          {renderSessionFields()}

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
