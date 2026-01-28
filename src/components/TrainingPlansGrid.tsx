import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedTrainingPlan } from '../services/trainingPlanService';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import {
  Edit,
  Trash2,
  Share2,
  MoreHorizontal,
  Calendar,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getDistanceColors, type RaceDistance } from '../constants/distanceColors';

interface TrainingPlansGridProps {
  plans: SavedTrainingPlan[];
  onDelete: (id: string, name: string) => void;
  onPublish: (id: string) => void;
  onSetActive: (id: string) => void;
  deletingId: string | null;
  searchQuery: string;
  distanceFilters: string[];
}

export function TrainingPlansGrid({
  plans,
  onDelete,
  onPublish,
  onSetActive,
  deletingId,
  searchQuery,
  distanceFilters,
}: TrainingPlansGridProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'de' ? de : enUS;

  const getDistanceLabel = (plan: SavedTrainingPlan) => {
    const { distance, customDistance } = plan.plan_data.event;
    if (distance === 'CUSTOM' && customDistance) {
      return `${customDistance} km`;
    }
    return distance;
  };

  // Filter logic
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesSearch =
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.plan_data.event.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDistance =
        distanceFilters.length === 0 ||
        distanceFilters.includes(plan.plan_data.event.distance);

      return matchesSearch && matchesDistance;
    });
  }, [plans, searchQuery, distanceFilters]);

  // Calculate plan progress
  const calculatePlanProgress = (plan: SavedTrainingPlan): number => {
    if (!plan.plan_data?.startDate || !plan.plan_data?.weeks) return 0;

    const startDate = new Date(plan.plan_data.startDate);
    const today = new Date();
    const totalWeeks = plan.plan_data.weeks.length;

    const daysPassed = Math.max(
      0,
      Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const weeksPassed = Math.floor(daysPassed / 7);

    const progress = Math.min(100, Math.round((weeksPassed / totalWeeks) * 100));

    return progress;
  };

  // Get plan status
  const getPlanStatus = (
    plan: SavedTrainingPlan
  ): { type: 'active' | 'upcoming' | 'ended'; days?: number } => {
    if (!plan.plan_data?.startDate || !plan.plan_data?.weeks) {
      return { type: 'active' };
    }

    const startDate = new Date(plan.plan_data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    const totalWeeks = plan.plan_data.weeks.length;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalWeeks * 7);

    const daysToStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysAfterEnd = Math.ceil((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysToStart > 0) {
      return { type: 'upcoming', days: daysToStart };
    } else if (daysAfterEnd > 0) {
      return { type: 'ended', days: daysAfterEnd };
    } else {
      return { type: 'active' };
    }
  };

  const handleCardClick = (planId: string, e: React.MouseEvent) => {
    // Don't navigate if clicking on a button or dropdown
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('[role="menuitem"]') ||
      target.closest('[data-radix-collection-item]')
    ) {
      return;
    }
    navigate(`/plan/${planId}`);
  };

  return (
    <div className="space-y-6">
      {/* Result Count */}
      {(searchQuery || distanceFilters.length > 0) && (
        <div className="text-sm text-slate-600">
          {t('dashboard.showingResults', { count: filteredPlans.length, total: plans.length })}
        </div>
      )}

      {/* Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Calendar size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {t('dashboard.noPlanFound')}
          </h3>
          <p className="text-sm text-slate-600">
            Versuche einen anderen Suchbegriff oder Filter
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPlans.map((plan, index) => {
            const distance = plan.plan_data.event.distance as RaceDistance;
            const colors = getDistanceColors(distance);
            const status = getPlanStatus(plan);
            const progress = calculatePlanProgress(plan);

            return (
              <div
                key={plan.id}
                className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
                onClick={(e) => handleCardClick(plan.id, e)}
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                }}
              >
                {/* Racing Stripe - Left Border Accent */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
                  style={{
                    background: colors.hex,
                    boxShadow: `0 0 20px ${colors.glow}`,
                  }}
                />

                {/* Active Indicator - Top Bar */}
                {plan.is_active && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600" />
                )}

                <div className="p-6 pl-8 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-slate-900 truncate mb-1 group-hover:text-slate-700 transition-colors">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-slate-600 truncate">
                        {plan.plan_data.event.name}
                      </p>
                    </div>

                    {/* Active Badge */}
                    {plan.is_active && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500 text-white rounded-full shadow-sm flex-shrink-0">
                        <Sparkles className="h-3 w-3" />
                        <span className="text-xs font-semibold">Aktiv</span>
                      </div>
                    )}
                  </div>

                  {/* Distance Badge - STANDOUT ELEMENT */}
                  <div className="flex items-start gap-3">
                    <div
                      className="inline-flex items-center px-4 py-2 rounded-xl font-bold text-lg text-white shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105"
                      style={{
                        background: colors.hex,
                        boxShadow: `0 4px 14px ${colors.glow}`,
                      }}
                    >
                      {getDistanceLabel(plan)}
                    </div>

                    <div className="flex-1">
                      <span className="text-slate-500 text-xs block mb-0.5">
                        {t('dashboard.table.eventDate')}
                      </span>
                      <div className="font-semibold text-slate-900">
                        {format(new Date(plan.plan_data.event.date), 'dd. MMM yy', {
                          locale: dateLocale,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar (only for active plans) */}
                  {plan.is_active && status.type === 'active' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Fortschritt</span>
                        <span className="text-green-600 font-bold">{progress}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  {status.type === 'upcoming' && status.days && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      Startet in {status.days} {status.days === 1 ? 'Tag' : 'Tagen'}
                    </div>
                  )}

                  {status.type === 'ended' && status.days && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      Beendet vor {status.days} {status.days === 1 ? 'Tag' : 'Tagen'}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50">
                    {/* Set Active Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetActive(plan.id);
                      }}
                      variant="outline"
                      size="sm"
                      className={`flex-1 font-semibold transition-all ${
                        plan.is_active
                          ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                          : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      {plan.is_active ? (
                        <>
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                          Aktiv
                        </>
                      ) : (
                        <>
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          Aktivieren
                        </>
                      )}
                    </Button>

                    {/* Open Plan Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/plan/${plan.id}`);
                      }}
                      size="sm"
                      className="bg-slate-900 text-white hover:bg-slate-800 shadow-sm px-4"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-slate-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">{t('dashboard.openMenu')}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/plan/${plan.id}`);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {t('common.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPublish(plan.id);
                          }}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          {plan.visibility !== 'private'
                            ? t('dashboard.managePublication')
                            : t('dashboard.publish')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(plan.id, plan.name);
                          }}
                          disabled={deletingId === plan.id}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
