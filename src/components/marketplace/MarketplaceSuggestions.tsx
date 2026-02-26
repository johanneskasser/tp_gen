import { Link } from 'react-router-dom';
import { MarketplacePlan } from '../../types/marketplace';
import { RaceDistance } from '../../types';
import { getDistanceColors } from '../../constants/distanceColors';
import { Star, Copy, Calendar, Store, ArrowRight, Check, AlertTriangle } from 'lucide-react';
import { cn, flex } from '../../lib/designSystem';

const VALID_DISTANCES = new Set<RaceDistance>(['5K', '10K', 'HM', 'M', 'CUSTOM']);

interface MarketplaceSuggestionsProps {
  plans: MarketplacePlan[];
  loading: boolean;
  error: string | null;
  distance: RaceDistance | null;
  selectedPlanId?: string;
  /** User's target duration — used to warn if a selected plan will be truncated */
  userDurationWeeks?: number | null;
  onSelectForClone: (plan: MarketplacePlan) => void;
  onDeselect: () => void;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-100 bg-white p-4 flex gap-3">
      <div className="w-1 self-stretch rounded-full bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3.5 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="h-7 bg-slate-100 rounded w-28 mt-3" />
      </div>
    </div>
  );
}

const DISTANCE_KM_LABEL: Record<RaceDistance, string> = {
  '5K': '5',
  '10K': '10',
  'HM': '21',
  'M': '42',
  'CUSTOM': '',
};

export default function MarketplaceSuggestions({
  plans,
  loading,
  error,
  distance,
  selectedPlanId,
  userDurationWeeks,
  onSelectForClone,
  onDeselect,
}: MarketplaceSuggestionsProps) {
  const marketplaceUrl =
    distance && distance !== 'CUSTOM'
      ? `/marketplace?distance=${DISTANCE_KM_LABEL[distance]}`
      : '/marketplace';

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className={cn(flex.rowJustified, 'px-0.5')}>
        <div className={cn(flex.rowTight, 'items-center')}>
          <Store size={14} className="text-primary-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Ähnliche Pläne
          </span>
        </div>
        {!loading && plans.length > 0 && (
          <Link
            to={marketplaceUrl}
            className={cn(
              'text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors',
              flex.rowTight,
              'items-center gap-0.5'
            )}
          >
            Mehr <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="flex flex-col gap-2.5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p className="text-xs text-text-tertiary text-center py-4">{error}</p>
      )}

      {/* Empty state */}
      {!loading && !error && plans.length === 0 && distance && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
          <Store size={24} className="mx-auto mb-2 text-slate-300" />
          <p className="text-xs text-text-tertiary">
            Noch keine öffentlichen Pläne für diese Distanz
          </p>
          <Link
            to="/marketplace"
            className="text-xs text-primary-600 hover:underline mt-1 inline-block"
          >
            Alle Pläne ansehen
          </Link>
        </div>
      )}

      {/* Plan cards */}
      {!loading &&
        plans.map((plan) => {
          const rawDist = plan.plan_data?.event?.distance;
          const distType: RaceDistance = VALID_DISTANCES.has(rawDist as RaceDistance)
            ? (rawDist as RaceDistance)
            : 'CUSTOM';
          const colors = getDistanceColors(distType);
          const weeks = plan.plan_data?.weeks?.length ?? 0;
          const rating = plan.stats?.rating_avg;
          const isSelected = plan.id === selectedPlanId;
          const droppedWeeks =
            isSelected && userDurationWeeks != null && weeks > userDurationWeeks
              ? weeks - userDurationWeeks
              : 0;

          return (
            <div
              key={plan.id}
              className={cn(
                'group relative rounded-xl border bg-white',
                'p-4 flex gap-3 transition-all duration-200',
                isSelected
                  ? 'border-primary-300 shadow-md shadow-primary-100 ring-1 ring-primary-300'
                  : 'border-slate-100 hover:border-slate-200 hover:shadow-sm'
              )}
            >
              {/* Color accent stripe */}
              <div
                className={cn(
                  'self-stretch rounded-full shrink-0 transition-all duration-200',
                  isSelected ? 'w-1.5' : 'w-1 group-hover:w-1.5'
                )}
                style={{ backgroundColor: colors.hex }}
              />

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                {/* Plan name */}
                <h4 className="text-sm font-semibold text-text-primary leading-tight truncate">
                  {plan.name}
                </h4>

                {/* Meta row */}
                <div className={cn(flex.rowTight, 'text-xs text-text-tertiary items-center')}>
                  <Calendar size={11} />
                  <span>{weeks} Wo.</span>
                  {rating != null && (
                    <>
                      <span>·</span>
                      <Star size={11} className="text-yellow-500 fill-yellow-500" />
                      <span>{rating.toFixed(1)}</span>
                    </>
                  )}
                  <span>·</span>
                  <Copy size={11} />
                  <span>{plan.clone_count}×</span>
                </div>

                {/* Action button */}
                {isSelected ? (
                  <div className="flex flex-col gap-1.5 mt-0.5">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700">
                        <Check size={13} className="text-primary-600" />
                        Ausgewählt
                      </span>
                      <button
                        type="button"
                        onClick={onDeselect}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Abwählen
                      </button>
                    </div>
                    {droppedWeeks > 0 && (
                      <p className="inline-flex items-start gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 leading-snug">
                        <AlertTriangle size={11} className="shrink-0 mt-0.5 text-amber-500" />
                        {droppedWeeks} Aufbau-{droppedWeeks === 1 ? 'Woche' : 'Wochen'} werden weggeschnitten
                      </p>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectForClone(plan)}
                    className={cn(
                      'self-start mt-0.5 inline-flex items-center gap-1.5 px-3 py-1.5',
                      'rounded-lg text-xs font-semibold transition-all duration-150',
                      'border border-primary-200 text-primary-700',
                      'hover:bg-primary-600 hover:text-white hover:border-primary-600',
                      'active:scale-95'
                    )}
                  >
                    <Copy size={11} />
                    Plan auswählen
                  </button>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
