import { Calendar, Activity, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/shadcn-card';
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

export function DashboardStats({ userName, vdot, activePlan, weeklyKm }: DashboardStatsProps) {
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
    <div className="space-y-6">
      {/* Begrüßung */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.welcome', { name: userName || t('dashboard.runner') })}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* VDOT Card */}
        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.vdot')}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {vdot ? vdot.toFixed(1) : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.stats.vdotDescription')}
            </p>
          </CardContent>
        </Card>

        {/* Aktiver Plan Card */}
        <Card className={activePlan ? "bg-gradient-to-t from-green-50 to-card" : "bg-gradient-to-t from-muted/30 to-card"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.activePlan')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activePlan ? (
              <div className="flex items-center gap-3">
                {/* Animated Pie Chart */}
                <div className="relative flex-shrink-0 w-[60px] h-[60px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'completed', value: activePlan.progress },
                          { name: 'remaining', value: 100 - activePlan.progress },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={18}
                        outerRadius={28}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        <Cell fill="hsl(142 76% 36%)" />
                        <Cell fill="hsl(220 13% 91%)" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-green-600">
                      {activePlan.progress}%
                    </span>
                  </div>
                </div>

                {/* Plan Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-base font-semibold truncate">
                    {activePlan.name}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getStatusMessage()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t('dashboard.stats.noActivePlan')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wöchentliche Kilometer */}
        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.weeklyKm')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {weeklyKm ? `${weeklyKm} km` : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.stats.thisWeek')}
            </p>
          </CardContent>
        </Card>

        {/* Nächste Einheit */}
        <Card className="bg-gradient-to-t from-primary/5 to-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.nextSession')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {activePlan?.nextSession ? (
              <>
                <div className="text-sm font-medium">
                  {activePlan.nextSession}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.stats.upcoming')}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                {t('dashboard.stats.noUpcomingSession')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
