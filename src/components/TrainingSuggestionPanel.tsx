import { useState } from 'react';
import { TrainingPlan, TrainingWeek } from '../types';
import { TrainingSuggestion } from '../types/suggestions';
import { TrainingSuggestionEngine } from '../utils/suggestionEngine';
import { detectTrainingPhase } from '../utils/phaseDetection';
import { getVolumeRecommendation } from '../utils/volumeProgression';
import { analyzeWeekIntensity } from '../utils/intensityAnalyzer';
import { TrainingDataCollector } from '../utils/trainingDataCollector';
import { Lightbulb, TrendingUp, Target, AlertCircle, CheckCircle, X } from 'lucide-react';
import { getSessionTypeLabel } from '../constants/sessionTypes';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { calculateTrainingZones, getBestVDOT } from '../utils/vdotCalculator';

interface Props {
  plan: TrainingPlan;
  currentWeek: TrainingWeek;
  dayOfWeek?: number; // If specified, show suggestions for that day only
  onAcceptSuggestion: (suggestion: TrainingSuggestion) => void;
}

/**
 * Smart Training Suggestion Panel
 * Displays AI-powered training suggestions with reasoning
 */
export function TrainingSuggestionPanel({
  plan,
  currentWeek,
  dayOfWeek,
  onAcceptSuggestion,
}: Props) {
  const { runnerProfile } = useRunnerProfile();
  const [suggestions, setSuggestions] = useState<TrainingSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Generate suggestions
  const handleGetSuggestions = () => {
    // Get training zones for dynamic RPE-based suggestions
    let zones;
    if (runnerProfile) {
      const vdot = runnerProfile.vdot || getBestVDOT(runnerProfile.personalBests || []);
      if (vdot > 0) {
        zones = calculateTrainingZones(vdot);
      }
    }

    const engine = new TrainingSuggestionEngine(plan, currentWeek, zones);

    if (dayOfWeek !== undefined) {
      // Suggestions for specific day
      const daySuggestions = engine.getSuggestionsForDay(dayOfWeek);
      setSuggestions(daySuggestions);
    } else {
      // Suggestions for entire week
      const weekSuggestions = engine.getSuggestionsForWeek();
      // Flatten all suggestions
      const allSuggestions: TrainingSuggestion[] = [];
      weekSuggestions.forEach((suggestions) => {
        allSuggestions.push(...suggestions);
      });
      setSuggestions(allSuggestions);
    }

    setShowSuggestions(true);
  };

  // Accept a suggestion
  const handleAccept = (suggestion: TrainingSuggestion) => {
    // Log to data collector
    TrainingDataCollector.logSuggestion(
      { plan, currentWeek, weekNumber: currentWeek.weekNumber },
      suggestion,
      'accepted'
    );

    onAcceptSuggestion(suggestion);
    setShowSuggestions(false);
  };

  // Reject a suggestion
  const handleReject = (suggestion: TrainingSuggestion) => {
    TrainingDataCollector.logSuggestion(
      { plan, currentWeek, weekNumber: currentWeek.weekNumber },
      suggestion,
      'rejected'
    );

    // Remove from list
    setSuggestions(suggestions.filter((s) => s !== suggestion));
  };

  // Get analysis info
  const phaseInfo = detectTrainingPhase(plan, currentWeek.weekNumber);
  const volumeRec = getVolumeRecommendation(plan, currentWeek.weekNumber);
  const intensityDist = analyzeWeekIntensity(currentWeek.sessions);

  // Confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-700 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-700 bg-yellow-100';
    return 'text-gray-700 bg-gray-100';
  };

  // Priority badge
  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return styles[priority];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-blue-600" size={24} />
          <h3 className="text-lg font-bold text-slate-800">Smart Trainings-Vorschläge</h3>
        </div>
        <button
          onClick={handleGetSuggestions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Lightbulb size={16} />
          Vorschläge erhalten
        </button>
      </div>

      {/* Analysis Toggle */}
      <button
        onClick={() => setShowAnalysis(!showAnalysis)}
        className="text-sm text-blue-600 hover:text-blue-800 mb-3 flex items-center gap-1"
      >
        <TrendingUp size={14} />
        {showAnalysis ? 'Analyse ausblenden' : 'Wochenanalyse anzeigen'}
      </button>

      {/* Week Analysis */}
      {showAnalysis && (
        <div className="bg-slate-50 rounded-lg p-4 mb-4 space-y-3">
          {/* Phase Info */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target size={16} className="text-purple-600" />
              <span className="font-semibold text-slate-700">Trainingsphase:</span>
            </div>
            <p className="text-sm text-slate-600 ml-6">
              {phaseInfo.description} (Woche {phaseInfo.weekInPhase}/{phaseInfo.totalWeeksInPhase})
            </p>
            <ul className="text-xs text-slate-500 ml-6 mt-1 list-disc list-inside">
              {phaseInfo.focusAreas.slice(0, 2).map((area, idx) => (
                <li key={idx}>{area}</li>
              ))}
            </ul>
          </div>

          {/* Volume Recommendation */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-600" />
              <span className="font-semibold text-slate-700">Volumen-Empfehlung:</span>
            </div>
            <p className="text-sm text-slate-600 ml-6">
              Ziel: {volumeRec.targetWeeklyKm.toFixed(1)} km
              {volumeRec.isRecoveryWeek && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Regenerationswoche
                </span>
              )}
            </p>
            {volumeRec.warnings.length > 0 && (
              <div className="ml-6 mt-1">
                {volumeRec.warnings.map((warning, idx) => (
                  <p key={idx} className="text-xs text-orange-600 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {warning}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Intensity Distribution */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} className="text-orange-600" />
              <span className="font-semibold text-slate-700">Intensitäts-Balance:</span>
            </div>
            <div className="ml-6 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-24 text-slate-600">Locker:</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${intensityDist.current.easy * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-12">
                  {Math.round(intensityDist.current.easy * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-24 text-slate-600">Moderat:</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${intensityDist.current.moderate * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-12">
                  {Math.round(intensityDist.current.moderate * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-24 text-slate-600">Hart:</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${intensityDist.current.hard * 100}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-12">
                  {Math.round(intensityDist.current.hard * 100)}%
                </span>
              </div>
            </div>
            {intensityDist.needsRebalancing && (
              <p className="text-xs text-orange-600 ml-6 mt-1">
                ⚠️ Intensitäts-Balance sollte angepasst werden
              </p>
            )}
          </div>
        </div>
      )}

      {/* Suggestions List */}
      {showSuggestions && (
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Lightbulb className="mx-auto mb-2 opacity-50" size={32} />
              <p>Keine Vorschläge verfügbar</p>
              <p className="text-sm">Die Woche ist bereits gut geplant!</p>
            </div>
          ) : (
            suggestions.slice(0, 5).map((suggestion, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-800">
                        {getSessionTypeLabel(suggestion.type)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityBadge(suggestion.priority)}`}>
                        {suggestion.priority === 'high' ? 'Hoch' : suggestion.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(suggestion.confidence)}`}>
                        {Math.round(suggestion.confidence * 100)}% Match
                      </span>
                    </div>
                    {suggestion.distance && (
                      <p className="text-sm text-slate-600">
                        📏 {suggestion.distance} km
                        {suggestion.warmUp && ` (+ ${suggestion.warmUp}${suggestion.warmUpUnit} Warm Up)`}
                        {suggestion.coolDown && ` (+ ${suggestion.coolDown}${suggestion.coolDownUnit} Cool Down)`}
                      </p>
                    )}
                    {suggestion.dayOfWeek !== undefined && (
                      <p className="text-xs text-slate-500">
                        Tag: {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'][suggestion.dayOfWeek]}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(suggestion)}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Vorschlag übernehmen"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleReject(suggestion)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Ablehnen"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="bg-blue-50 rounded p-2 text-sm text-slate-700">
                  <span className="font-medium">💡 Begründung: </span>
                  {suggestion.reason}
                </div>

                {/* Notes */}
                {suggestion.notes && (
                  <p className="text-xs text-slate-500 mt-2 italic">
                    ℹ️ {suggestion.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
