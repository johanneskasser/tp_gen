import { useMemo } from 'react';
import { SavedTrainingPlan } from '../services/trainingPlanService';
import { useTranslation } from 'react-i18next';
import { Calendar } from 'lucide-react';
import { PlanCard } from './PlanCard';

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
  const { t } = useTranslation();

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

  return (
    <div className="space-y-6">
      {(searchQuery || distanceFilters.length > 0) && (
        <div className="text-sm text-slate-600">
          {t('dashboard.showingResults', { count: filteredPlans.length, total: plans.length })}
        </div>
      )}

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
          {filteredPlans.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={index}
              deleting={deletingId === plan.id}
              onDelete={onDelete}
              onPublish={onPublish}
              onSetActive={onSetActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
