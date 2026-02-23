import { TrainingPlan } from '../types';
import { UserProfile } from '../types/userProfile';
import { calculatePlanDifficulty, getDifficultyDisplay } from '../utils/personalizedIntensity';
import { AlertCircle, TrendingUp, Activity, Info } from 'lucide-react';
import { useState } from 'react';

interface Props {
  plan: TrainingPlan;
  userProfile?: UserProfile;
  showDetails?: boolean; // Show expanded details
  compact?: boolean; // Compact badge for marketplace view
}

/**
 * Plan Difficulty Badge
 * Displays training plan difficulty rating relative to user's fitness level
 */
export function PlanDifficultyBadge({ plan, userProfile, showDetails = false, compact = false }: Props) {
  const [expanded, setExpanded] = useState(showDetails);

  // If no user profile, show generic message
  if (!userProfile || (userProfile.personalBests.length === 0 && !userProfile.weeklyKmBase)) {
    if (compact) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
          <Info size={12} />
          <span>Profil erstellen für personalisierte Bewertung</span>
        </div>
      );
    }
    return null;
  }

  const difficulty = calculatePlanDifficulty(plan, userProfile);
  const display = getDifficultyDisplay(difficulty.overall);

  // Compact badge for marketplace
  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${display.bgColor} ${display.color}`}
      >
        <span>{display.emoji}</span>
        <span>{display.label}</span>
        <span className="text-[10px] opacity-75">({difficulty.score}/100)</span>
      </div>
    );
  }

  // Full badge with details
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full px-4 py-3 flex items-center justify-between ${display.bgColor} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{display.emoji}</span>
          <div className="text-left">
            <div className={`font-bold text-lg ${display.color}`}>
              Schwierigkeitsgrad: {display.label}
            </div>
            <div className="text-sm text-slate-600">
              Score: {difficulty.score}/100 • {difficulty.breakdown.avgWeeklyKm.toFixed(1)} km/Woche
            </div>
          </div>
        </div>
        <Activity className={display.color} size={24} />
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 space-y-4 bg-slate-50">
          {/* Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded p-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-blue-600" />
                <span className="font-semibold text-sm text-slate-700">Volumen</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Durchschnitt:</span>
                  <span className="font-medium">{difficulty.breakdown.avgWeeklyKm.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Spitzenwoche:</span>
                  <span className="font-medium">{difficulty.breakdown.peakWeekKm.toFixed(1)} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Rating:</span>
                  <span className="font-medium">{difficulty.breakdown.volumeRating}/100</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded p-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-purple-600" />
                <span className="font-semibold text-sm text-slate-700">Intensität</span>
              </div>
              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Harte Einheiten/Woche:</span>
                  <span className="font-medium">{difficulty.breakdown.hardSessionsPerWeek.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rating:</span>
                  <span className="font-medium">{difficulty.breakdown.intensityRating}/100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {difficulty.warnings.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-orange-600" />
                <span className="font-semibold text-sm text-orange-800">Warnungen</span>
              </div>
              <ul className="space-y-1 text-xs text-orange-700">
                {difficulty.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {difficulty.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-blue-600" />
                <span className="font-semibold text-sm text-blue-800">Empfehlungen</span>
              </div>
              <ul className="space-y-1 text-xs text-blue-700">
                {difficulty.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* User Context */}
          {userProfile.weeklyKmBase && (
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
              <p>
                📊 Basierend auf deiner aktuellen Basis: {userProfile.weeklyKmBase} km/Woche
                {userProfile.vdot && ` • VDOT: ${userProfile.vdot.toFixed(1)}`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
