import { Calendar, Activity, Target, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface DashboardStatsProps {
  userName?: string;
  vdot?: number;
  activePlan?: {
    id?: string;
    name: string;
    progress: number;
    nextSession?: string;
    status?: {
      type: 'active' | 'upcoming' | 'ended';
      days?: number;
    } | null;
  };
  weeklyKm?: number;
}

export function DashboardStats({ vdot, activePlan, weeklyKm }: DashboardStatsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Get status message based on plan status
  const getStatusMessage = () => {
    if (!activePlan?.status) return t('dashboard.stats.planProgress');

    if (activePlan.status.type === 'upcoming' && activePlan.status.days) {
      return t('dashboard.stats.daysUntilStart', { days: activePlan.status.days });
    } else if (activePlan.status.type === 'ended' && activePlan.status.days) {
      return t('dashboard.stats.daysAfterEnd', { days: activePlan.status.days });
    }

    return t('dashboard.stats.planProgress');
  };

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* Active Plan Card - Compact */}
      {activePlan ? (
        <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 rounded-xl border-2 border-green-400 shadow-lg shadow-green-500/20 p-5 text-white relative overflow-hidden cursor-pointer hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
          onClick={() => activePlan.id && navigate(`/plan/${activePlan.id}`)}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

          <div className="relative z-10 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-green-200" />
              <span className="text-xs font-semibold text-green-100 uppercase tracking-wide">
                {t('dashboard.stats.activePlan')}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white truncate">
              {activePlan.name}
            </h3>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-green-100">
                  {getStatusMessage()}
                </span>
                <span className="text-xl font-bold text-white tabular-nums">
                  {activePlan.progress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-white/20 backdrop-blur-sm rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full shadow-md transition-all duration-700 ease-out"
                  style={{ width: `${activePlan.progress}%` }}
                />
              </div>
            </div>

            {/* Next Session */}
            {activePlan.nextSession && (
              <div className="pt-2 border-t border-white/20">
                <div className="text-xs font-semibold text-green-100 uppercase tracking-wide">
                  {t('dashboard.stats.nextSession')}
                </div>
                <div className="text-sm font-semibold text-white line-clamp-1 mt-0.5">
                  {activePlan.nextSession}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl border-2 border-slate-300 p-5 relative overflow-hidden">
          <div className="relative z-10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-300 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-slate-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">
              {t('dashboard.stats.activePlan')}
            </h3>
            <p className="text-xs text-slate-600">
              {t('dashboard.stats.noActivePlan')}
            </p>
          </div>
        </div>
      )}

      {/* VDOT Card */}
      <div className="bg-white rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg hover:border-blue-300 transition-all p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {vdot ? vdot.toFixed(1) : '—'}
            </div>
          </div>
        </div>
        <div className="text-sm font-bold text-slate-700">
          {t('dashboard.stats.vdot')}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {t('dashboard.stats.vdotDescription')}
        </div>
      </div>

      {/* Weekly KM Card */}
      <div className="bg-white rounded-xl border-2 border-purple-200 shadow-md hover:shadow-lg hover:border-purple-300 transition-all p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {weeklyKm || '—'}
            </div>
          </div>
        </div>
        <div className="text-sm font-bold text-slate-700">
          {t('dashboard.stats.weeklyKm')}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {t('dashboard.stats.thisWeek')}
        </div>
      </div>
    </div>
  );
}
