import { Calendar, Activity, Target, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface DashboardStatsProps {
  userName?: string;
  vdot?: number;
  activePlan?: {
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
    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* VDOT Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Target className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {vdot ? vdot.toFixed(1) : '—'}
            </div>
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-700">
          {t('dashboard.stats.vdot')}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {t('dashboard.stats.vdotDescription')}
        </div>
      </div>

      {/* Aktiver Plan Card */}
      <div className={`rounded-xl border shadow-md hover:shadow-lg transition-shadow p-5 ${
        activePlan
          ? 'bg-gradient-to-br from-green-50 to-white border-green-200'
          : 'bg-white border-gray-200'
      }`}>
        {activePlan ? (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="relative flex-shrink-0 w-12 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'completed', value: activePlan.progress },
                        { name: 'remaining', value: 100 - activePlan.progress },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={16}
                      outerRadius={24}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      <Cell fill="#16a34a" />
                      <Cell fill="#e5e7eb" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-bold text-green-600">
                    {activePlan.progress}%
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-lg font-bold text-slate-900 truncate">
                  {activePlan.name}
                </div>
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {t('dashboard.stats.activePlan')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {getStatusMessage()}
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {t('dashboard.stats.activePlan')}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {t('dashboard.stats.noActivePlan')}
            </div>
          </>
        )}
      </div>

      {/* Wöchentliche Kilometer */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Activity className="h-5 w-5 text-purple-600" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 tabular-nums">
              {weeklyKm || '—'}
            </div>
          </div>
        </div>
        <div className="text-sm font-semibold text-slate-700">
          {t('dashboard.stats.weeklyKm')}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          {t('dashboard.stats.thisWeek')}
        </div>
      </div>

      {/* Nächste Einheit */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-shadow p-5">
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center mb-3">
          <TrendingUp className="h-5 w-5 text-orange-600" />
        </div>
        <div className="text-sm font-semibold text-slate-700 mb-1">
          {t('dashboard.stats.nextSession')}
        </div>
        {activePlan?.nextSession ? (
          <>
            <div className="text-base font-bold text-slate-900 line-clamp-2">
              {activePlan.nextSession}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {t('dashboard.stats.upcoming')}
            </div>
          </>
        ) : (
          <div className="text-sm text-slate-500">
            {t('dashboard.stats.noUpcomingSession')}
          </div>
        )}
      </div>
    </div>
  );
}
