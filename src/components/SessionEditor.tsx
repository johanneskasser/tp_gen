import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TrainingSession,
  SessionType,
  IntervalSet,
  DistanceUnit,
  FartlekSegment,
  Exercise,
} from '../types';
import { Save, X, Trash2, Plus, Activity, HelpCircle, Zap, Timer, Mountain, TrendingUp, Sparkles, Dumbbell, Target } from 'lucide-react';
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

// Session type icons mapping
const SESSION_ICONS: Record<SessionType, any> = {
  easy: Target,
  long: TrendingUp,
  intervals: Zap,
  tempo: Timer,
  recovery: Target,
  race: Target,
  strides: Sparkles,
  hill_repeats: Mountain,
  progression: TrendingUp,
  fartlek: Sparkles,
  strength: Dumbbell,
  plyometrics: Zap,
};

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
    icon: SESSION_ICONS[value as SessionType],
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

  const handleSave = useCallback(() => {
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
  }, [
    session, type, notes, title, distance, duration, intervals, warmUp, warmUpUnit,
    coolDown, coolDownUnit, stridesCount, stridesDuration, stridesRecovery,
    hillReps, hillDistance, hillDuration, hillRecovery, hillGrade,
    progressionDistance, progressionStartPace, progressionEndPace,
    fartlekSegments, exercises, onSave, onCancel
  ]);

  // Keyboard shortcuts - placed after handleSave to avoid forward reference
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to close
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      // Alt+Enter or CMD+Enter to save
      if (e.key === 'Enter' && (e.altKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, handleSave]);

  // Render fields based on session type
  const renderSessionFields = () => {
    switch (type) {
      case 'strides':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-sm text-cyan-900">
              <div className="font-semibold mb-1">Steigerungen</div>
              <div className="text-cyan-700">4-8 kurze Sprints (10-20s) zur Technik- und Geschwindigkeitspflege</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Anzahl
                </label>
                <input
                  type="number"
                  min="4"
                  max="8"
                  value={stridesCount}
                  onChange={(e) => setStridesCount(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="6"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Dauer (s)
                </label>
                <input
                  type="number"
                  min="10"
                  max="20"
                  value={stridesDuration}
                  onChange={(e) => setStridesDuration(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Pause (s)
                </label>
                <input
                  type="number"
                  value={stridesRecovery}
                  onChange={(e) => setStridesRecovery(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="60"
                />
              </div>
            </div>
          </div>
        );

      case 'hill_repeats':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
              <div className="font-semibold mb-1">Bergwiederholungen</div>
              <div className="text-amber-700">Für Kraft, Technik und neuromuskuläre Qualität</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Warm Up
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={warmUp}
                    onChange={(e) => setWarmUp(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="2.0"
                  />
                  <select
                    value={warmUpUnit}
                    onChange={(e) => setWarmUpUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Cool Down
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={coolDown}
                    onChange={(e) => setCoolDown(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="2.0"
                  />
                  <select
                    value={coolDownUnit}
                    onChange={(e) => setCoolDownUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Reps
                </label>
                <input
                  type="number"
                  value={hillReps}
                  onChange={(e) => setHillReps(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="6"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Distanz (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={hillDistance}
                  onChange={(e) => setHillDistance(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0.4"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Dauer (min)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={hillDuration}
                  onChange={(e) => setHillDuration(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Pause (min)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={hillRecovery}
                  onChange={(e) => setHillRecovery(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="2"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Steigung (%) - optional
              </label>
              <input
                type="number"
                step="0.5"
                value={hillGrade}
                onChange={(e) => setHillGrade(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="5"
              />
            </div>
          </div>
        );

      case 'progression':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 text-sm text-cyan-900">
              <div className="font-semibold mb-1">Progression Run</div>
              <div className="text-cyan-700">Starte locker und steigere das Tempo kontinuierlich</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Warm Up
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={warmUp}
                    onChange={(e) => setWarmUp(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="2.0"
                  />
                  <select
                    value={warmUpUnit}
                    onChange={(e) => setWarmUpUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Cool Down
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={coolDown}
                    onChange={(e) => setCoolDown(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="2.0"
                  />
                  <select
                    value={coolDownUnit}
                    onChange={(e) => setCoolDownUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Distanz (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={progressionDistance}
                  onChange={(e) => setProgressionDistance(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="10.0"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Start-Pace
                </label>
                <input
                  type="text"
                  value={progressionStartPace}
                  onChange={(e) => setProgressionStartPace(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="6:00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  End-Pace
                </label>
                <input
                  type="text"
                  value={progressionEndPace}
                  onChange={(e) => setProgressionEndPace(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
          <div className="space-y-4 animate-fade-in">
            <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 text-sm text-pink-900">
              <div className="font-semibold mb-1">Fartlek</div>
              <div className="text-pink-700">Spielerische Tempowechsel für vielseitiges Training</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Warm Up
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={warmUp}
                    onChange={(e) => setWarmUp(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="2.0"
                  />
                  <select
                    value={warmUpUnit}
                    onChange={(e) => setWarmUpUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Cool Down
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={coolDown}
                    onChange={(e) => setCoolDown(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="2.0"
                  />
                  <select
                    value={coolDownUnit}
                    onChange={(e) => setCoolDownUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">Segmente</label>
              <button
                onClick={handleAddFartlekSegment}
                className="px-3 py-1.5 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-all flex items-center gap-1.5 text-sm font-medium shadow-sm hover:shadow"
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          placeholder="4:30"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteFartlekSegment(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {fartlekSegments.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
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
          <div className="space-y-4 animate-fade-in">
            <div className={`${type === 'strength' ? 'bg-gray-50 border-gray-200' : 'bg-indigo-50 border-indigo-200'} border rounded-xl p-4 text-sm ${type === 'strength' ? 'text-gray-900' : 'text-indigo-900'}`}>
              <div className="font-semibold mb-1">{type === 'strength' ? 'Krafttraining' : 'Plyometrie'}</div>
              <div className={type === 'strength' ? 'text-gray-700' : 'text-indigo-700'}>
                {type === 'strength' ? 'Schweres/explosives Krafttraining für Laufökonomie' : 'Sprünge, Hops, Bounds für Schnellkraft'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Gesamtdauer (min) - optional
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="45"
              />
            </div>
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">Übungen</label>
              <button
                onClick={handleAddExercise}
                className={`px-3 py-1.5 ${type === 'strength' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg transition-all flex items-center gap-1.5 text-sm font-medium shadow-sm hover:shadow`}
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
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {exercises.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Klicke auf "Übung" um Übungen hinzuzufügen
                </div>
              )}
            </div>
          </div>
        );

      case 'tempo':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-900">
              <div className="font-semibold mb-1">Tempo-Lauf</div>
              <div className="text-purple-700">Zügiges, aber kontrolliertes Tempo für Ausdauer und Laktattoleranz</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Warm Up
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={warmUp}
                    onChange={(e) => setWarmUp(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="2.0"
                  />
                  <select
                    value={warmUpUnit}
                    onChange={(e) => setWarmUpUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Cool Down
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={coolDown}
                    onChange={(e) => setCoolDown(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="2.0"
                  />
                  <select
                    value={coolDownUnit}
                    onChange={(e) => setCoolDownUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Distanz (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="10.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Dauer (min)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="60"
                />
              </div>
            </div>
            {calculatedPace && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
                <span className="font-semibold text-blue-900">Pace:</span>{' '}
                <span className="text-blue-700">{formatPace(calculatedPace)}</span>
              </div>
            )}
          </div>
        );

      case 'intervals':
        return (
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Warm Up
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={warmUp}
                    onChange={(e) => setWarmUp(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="2.0"
                  />
                  <select
                    value={warmUpUnit}
                    onChange={(e) => setWarmUpUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Cool Down
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={coolDown}
                    onChange={(e) => setCoolDown(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="2.0"
                  />
                  <select
                    value={coolDownUnit}
                    onChange={(e) => setCoolDownUnit(e.target.value as DistanceUnit)}
                    className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                  >
                    <option value="km">km</option>
                    <option value="min">min</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Intervalle
              </label>
              <button
                onClick={handleAddInterval}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-1.5 text-sm font-medium shadow-sm hover:shadow"
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
                    <div className="grid grid-cols-3 gap-3">
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
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                          >
                            <option value="km">km</option>
                            <option value="min">min</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteInterval(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {intervals.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
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
          <div className="space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Distanz (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="10.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Dauer (min)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="60"
                />
              </div>
            </div>
            {calculatedPace && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm">
                <span className="font-semibold text-blue-900">Pace:</span>{' '}
                <span className="text-blue-700">{formatPace(calculatedPace)}</span>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">Training bearbeiten</h2>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              aria-label="Schließen"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Titel (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Wird automatisch generiert"
              />
            </div>

            {/* Session Type Selector - Compact Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Trainingstyp
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
                {sessionTypes.map((st) => {
                  const Icon = st.icon;
                  const isSelected = type === st.value;
                  return (
                    <button
                      key={st.value}
                      type="button"
                      onClick={() => setType(st.value)}
                      className={`
                        group relative px-2 py-2 rounded-lg font-medium transition-all text-xs
                        ${isSelected
                          ? st.color + ' ring-2 ring-blue-500 shadow-sm scale-105'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Icon size={16} className={`${isSelected ? '' : 'text-slate-500'}`} />
                        <span className="text-[10px] leading-tight text-center">{st.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RPE Display - Compact */}
            <div className={`border rounded-lg p-3 ${intensityInfo.color} transition-all`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Activity size={14} className="flex-shrink-0" />
                  <span className="font-semibold text-xs whitespace-nowrap">Intensität:</span>
                  <span className="text-sm">{intensityInfo.emoji}</span>
                  <span className="font-semibold text-xs truncate">{intensityInfo.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold">{intensityInfo.rpe}/10</div>
                    {intensityInfo.recoveryDays > 0 && (
                      <div className="text-[10px] opacity-75">
                        {intensityInfo.recoveryDays}d
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowRPEInfo(!showRPEInfo)}
                      className="p-1 hover:bg-white/50 rounded-full transition-colors"
                    >
                      <HelpCircle size={14} />
                    </button>
                    {showRPEInfo && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setShowRPEInfo(false)}
                        />
                        <div className="absolute right-0 top-8 z-50 w-80 max-h-[70vh] bg-white border-2 border-slate-300 rounded-xl shadow-2xl text-slate-800 overflow-hidden flex flex-col">
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

              {/* Compact Intensity Bar */}
              <div className="mt-2">
                <div className="flex gap-0.5 h-1.5 bg-white/50 rounded-full overflow-hidden">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 transition-all ${
                        i < Math.round(intensityInfo.rpe) ? intensityInfo.barColor : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Session Fields */}
            {renderSessionFields()}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                Notizen
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                placeholder="Zusätzliche Notizen zum Training..."
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
            <button
              onClick={onDelete}
              className="order-last sm:order-first px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow text-sm"
            >
              <Trash2 size={16} />
              Löschen
            </button>

            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all font-medium text-sm"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow text-sm"
              >
                <Save size={16} />
                <span>Speichern</span>
                <span className="hidden sm:inline text-[10px] opacity-70 ml-1">⌘+↵</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }

        .scale-105 {
          transform: scale(1.05);
        }

        kbd {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }
      `}</style>
    </div>
  );
}
