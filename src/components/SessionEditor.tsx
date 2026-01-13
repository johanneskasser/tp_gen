import { useState, useMemo } from 'react';
import {
  TrainingSession,
  SessionType,
  IntervalSet,
  DistanceUnit,
  FartlekSegment,
  Exercise,
} from '../types';
import { Save, X, Trash2, Plus, Activity, HelpCircle } from 'lucide-react';
import { generateSessionTitle } from '../utils/titleGenerator';
import { SESSION_TYPE_CONFIG, getSessionTypeLabel } from '../constants/sessionTypes';
import { formatPace } from '../utils/paceCalculator';
import { IntervalVisualization } from './visualizations/IntervalVisualization';
import { ProgressionVisualization } from './visualizations/ProgressionVisualization';
import { FartlekVisualization } from './visualizations/FartlekVisualization';
import { SESSION_CHARACTERISTICS } from '../config/sessionCharacteristics';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { calculateTrainingZones, getBestVDOT } from '../utils/vdotCalculator';
import { calculateSessionRPE, getRPELabel } from '../utils/sessionRPECalculator';

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
  const { runnerProfile } = useRunnerProfile();

  const [title, setTitle] = useState(session.title);
  const [type, setType] = useState<SessionType>(session.type);
  const [notes, setNotes] = useState(session.notes || '');
  const [showRPEInfo, setShowRPEInfo] = useState(false);

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

  // Calculate dynamic RPE based on user's VDOT and session details
  const intensityInfo = useMemo(() => {
    // Get user's training zones from VDOT
    let zones = null;
    if (runnerProfile) {
      const vdot = runnerProfile.vdot || getBestVDOT(runnerProfile.personalBests || []);
      if (vdot > 0) {
        zones = calculateTrainingZones(vdot);
      }
    }

    // Build current session state for RPE calculation
    const currentSession: TrainingSession = {
      ...session,
      type,
      distance: distance ? parseFloat(distance) : undefined,
      duration: duration ? parseFloat(duration) : undefined,
      intervals: intervals.length > 0 ? intervals : undefined,
      warmUp: warmUp ? parseFloat(warmUp) : undefined,
      warmUpUnit: warmUp ? warmUpUnit : undefined,
      coolDown: coolDown ? parseFloat(coolDown) : undefined,
      coolDownUnit: coolDown ? coolDownUnit : undefined,
      progression: progressionDistance || progressionStartPace || progressionEndPace ? {
        totalDistance: progressionDistance ? parseFloat(progressionDistance) : undefined,
        startPace: progressionStartPace,
        endPace: progressionEndPace,
      } : undefined,
      hillRepeats: hillReps || hillDistance || hillDuration ? {
        repetitions: hillReps ? parseInt(hillReps) : 6,
        distance: hillDistance ? parseFloat(hillDistance) : undefined,
        duration: hillDuration ? parseFloat(hillDuration) : undefined,
        recovery: hillRecovery ? parseFloat(hillRecovery) : 2,
        grade: hillGrade ? parseFloat(hillGrade) : undefined,
      } : undefined,
      fartlek: fartlekSegments.length > 0 ? fartlekSegments : undefined,
      strides: stridesCount || stridesDuration ? {
        count: stridesCount ? parseInt(stridesCount) : 6,
        duration: stridesDuration ? parseInt(stridesDuration) : 15,
        recovery: stridesRecovery ? parseInt(stridesRecovery) : 60,
      } : undefined,
      exercises: exercises.length > 0 ? exercises : undefined,
    };

    // Calculate RPE dynamically if zones available, otherwise use base characteristics
    let rpe: number;
    let rpeLabel;

    if (zones) {
      rpe = calculateSessionRPE(currentSession, zones);
      rpeLabel = getRPELabel(rpe);
    } else {
      // Fallback to base characteristics if no VDOT available
      const characteristics = SESSION_CHARACTERISTICS[type];
      rpe = characteristics.intensityScore;
      rpeLabel = getRPELabel(rpe);
    }

    const recoveryDays = SESSION_CHARACTERISTICS[type].recoveryDaysNeeded;

    // Color scheme based on RPE
    let color, barColor;
    if (rpe < 4) {
      color = 'bg-green-100 border-green-300 text-green-800';
      barColor = 'bg-green-500';
    } else if (rpe < 6) {
      color = 'bg-yellow-100 border-yellow-300 text-yellow-800';
      barColor = 'bg-yellow-500';
    } else if (rpe < 8) {
      color = 'bg-orange-100 border-orange-300 text-orange-800';
      barColor = 'bg-orange-500';
    } else {
      color = 'bg-red-100 border-red-300 text-red-800';
      barColor = 'bg-red-500';
    }

    return {
      rpe: Math.round(rpe * 10) / 10, // Round to 1 decimal
      label: rpeLabel.label,
      emoji: rpeLabel.emoji,
      description: rpeLabel.description,
      recoveryDays,
      color,
      barColor,
    };
  }, [
    type, distance, duration, intervals, warmUp, warmUpUnit, coolDown, coolDownUnit,
    progressionDistance, progressionStartPace, progressionEndPace,
    hillReps, hillDistance, hillDuration, hillRecovery, hillGrade,
    fartlekSegments, stridesCount, stridesDuration, stridesRecovery,
    exercises, runnerProfile, session
  ]);

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

      case 'tempo':
        updatedSession.distance = distance ? parseFloat(distance) : undefined;
        updatedSession.duration = duration ? parseFloat(duration) : undefined;
        updatedSession.warmUp = warmUp ? parseFloat(warmUp) : undefined;
        updatedSession.warmUpUnit = warmUp ? warmUpUnit : undefined;
        updatedSession.coolDown = coolDown ? parseFloat(coolDown) : undefined;
        updatedSession.coolDownUnit = coolDown ? coolDownUnit : undefined;
        break;

      case 'intervals':
        updatedSession.intervals = intervals.length > 0 ? intervals : undefined;
        updatedSession.warmUp = warmUp ? parseFloat(warmUp) : undefined;
        updatedSession.warmUpUnit = warmUp ? warmUpUnit : undefined;
        updatedSession.coolDown = coolDown ? parseFloat(coolDown) : undefined;
        updatedSession.coolDownUnit = coolDown ? coolDownUnit : undefined;
        break;

      default:
        // easy, long, recovery, race
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

            {/* Live Visualisierung */}
            {progressionDistance && progressionStartPace && progressionEndPace && (
              <ProgressionVisualization
                distance={parseFloat(progressionDistance)}
                startPace={progressionStartPace}
                endPace={progressionEndPace}
              />
            )}
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

            {/* Live Visualisierung */}
            {fartlekSegments.length > 0 && (
              <FartlekVisualization
                segments={fartlekSegments}
                warmUp={warmUp ? parseFloat(warmUp) : undefined}
                warmUpUnit={warmUpUnit}
                coolDown={coolDown ? parseFloat(coolDown) : undefined}
                coolDownUnit={coolDownUnit}
              />
            )}
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

      case 'tempo':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-800">
              <strong>Tempo-Lauf:</strong> Zügiges, aber kontrolliertes Tempo für Ausdauer und Laktattoleranz
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

            {/* Live Visualisierung */}
            {intervals.length > 0 && (
              <IntervalVisualization
                intervals={intervals}
                warmUp={warmUp ? parseFloat(warmUp) : undefined}
                warmUpUnit={warmUpUnit}
                coolDown={coolDown ? parseFloat(coolDown) : undefined}
                coolDownUnit={coolDownUnit}
              />
            )}
          </div>
        );

      default:
        // easy, long, recovery, race
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

          {/* Intensity Level Display - Dynamic RPE */}
          <div className={`border rounded-lg p-4 ${intensityInfo.color}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={20} />
                <span className="font-semibold">Intensitätslevel:</span>
                <span className="text-2xl">{intensityInfo.emoji}</span>
                <span className="font-bold">{intensityInfo.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-medium">Score: {intensityInfo.rpe}/10</div>
                  {intensityInfo.recoveryDays > 0 && (
                    <div className="text-xs">
                      {intensityInfo.recoveryDays} Tag{intensityInfo.recoveryDays > 1 ? 'e' : ''} Erholung
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRPEInfo(!showRPEInfo)}
                    className="p-1 hover:bg-white/50 rounded-full transition-colors"
                  >
                    <HelpCircle size={18} />
                  </button>
                  {showRPEInfo && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowRPEInfo(false)}
                      />
                      <div className="absolute right-0 top-8 z-50 w-80 max-h-[70vh] bg-white border-2 border-slate-300 rounded-lg shadow-xl text-slate-800 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto p-4 space-y-3 text-xs">
                          <div>
                            <h4 className="font-bold text-sm mb-2">Wie wird die RPE berechnet?</h4>
                            <p className="mb-2">
                              Der RPE-Score (Rate of Perceived Exertion) wird dynamisch basierend auf mehreren Faktoren berechnet:
                            </p>
                          </div>

                          <div>
                            <h5 className="font-semibold mb-1">📊 VDOT-basierte Personalisierung</h5>
                            <p>
                              Deine Pace wird mit deinen persönlichen Trainingszonen verglichen (aus deinem VDOT-Wert).
                              Die gleiche Pace hat unterschiedliche RPE-Werte je nach Fitnesslevel.
                            </p>
                          </div>

                          <div>
                            <h5 className="font-semibold mb-1">🏃 Intervall-Faktoren</h5>
                            <p>
                              • <strong>Pace:</strong> Vergleich mit deinen persönlichen Zonen (Easy, Marathon, Threshold, Interval)<br/>
                              • <strong>Wiederholungen:</strong> Mehr Reps = höhere kumulative Ermüdung<br/>
                              • <strong>Recovery:</strong> Kürzere Pausen = höhere RPE<br/>
                              • <strong>Gesamtvolumen:</strong> Mehr Intervall-km = härter
                            </p>
                          </div>

                          <div>
                            <h5 className="font-semibold mb-1">📏 Distanz & Dauer</h5>
                            <p>
                              Längere Läufe erhöhen die RPE exponentiell durch Glykogenverbrauch und kumulative Ermüdung.
                            </p>
                          </div>

                          <div>
                            <h5 className="font-semibold mb-1">📚 Wissenschaftliche Grundlagen</h5>
                            <ul className="list-disc list-inside space-y-1 ml-2">
                              <li>
                                <a
                                  href="https://marathonhandbook.com/rate-of-perceived-exertion/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Borg RPE Scale (1-10)
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://vdoto2.com/calculator"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Jack Daniels' VDOT System
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://www.veohtu.com/trimp.html"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Bannister's TRIMP
                                </a>
                              </li>
                              <li>
                                <a
                                  href="https://www.veohtu.com/runningspeed.html"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  VDOT Training Zones
                                </a>
                              </li>
                            </ul>
                          </div>

                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-[10px] text-slate-600">
                              💡 Tipp: Trage deine Bestzeiten im Profil ein für präzisere RPE-Berechnungen!
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Intensity Bar */}
            <div className="relative">
              <div className="flex gap-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 ${
                      i < Math.round(intensityInfo.rpe) ? intensityInfo.barColor : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Locker</span>
                <span>Sehr Hart</span>
              </div>
            </div>

            {/* Description */}
            <div className="mt-2 text-xs opacity-80">
              {intensityInfo.description}
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
