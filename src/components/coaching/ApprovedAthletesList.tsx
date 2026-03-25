import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Users, Loader2 } from 'lucide-react';
import { getApprovedAthletes } from '../../services/coachingService';
import { trainingPlanService, SavedTrainingPlan } from '../../services/trainingPlanService';
import { CoachingRequest, PublicAthleteProfile } from '../../types/coaching';
import { PlanCard } from '../PlanCard';
import PublishPlanModal from '../PublishPlanModal';
import { useToast } from '../../contexts/ToastContext';

interface ApprovedAthletesListProps {
  refreshKey: number;
  onCreatePlan: (athleteId: string, username: string) => void;
  onCountChange?: (count: number) => void;
}

type AthleteWithRequest = CoachingRequest & { athlete: PublicAthleteProfile };

function AvatarInitials({ name, username, size = 'md' }: { name: string | null; username: string; size?: 'sm' | 'md' }) {
  const display = name || username;
  const initials = display.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
  const cls = size === 'sm'
    ? 'w-8 h-8 text-xs'
    : 'w-10 h-10 text-sm';
  return (
    <div className={`${cls} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials || '?'}
    </div>
  );
}

export function ApprovedAthletesList({ refreshKey, onCreatePlan, onCountChange }: ApprovedAthletesListProps) {
  const { t } = useTranslation();
  const toast = useToast();

  const [athletes, setAthletes] = useState<AthleteWithRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Plans state for selected athlete
  const [plans, setPlans] = useState<SavedTrainingPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingPlanId, setPublishingPlanId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getApprovedAthletes()
      .then((data) => {
        if (!cancelled) {
          setAthletes(data);
          onCountChange?.(data.length);
          // Auto-select first athlete
          if (data.length > 0 && !selectedId) {
            setSelectedId(data[0].athlete_id);
          }
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  // Load plans when selection changes
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setPlansLoading(true);
    setPlans([]);
    trainingPlanService.getCoachPlansForAthlete(selectedId)
      .then((data) => { if (!cancelled) setPlans(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setPlansLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const selectedAthlete = athletes.find((a) => a.athlete_id === selectedId);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('dashboard.confirmDelete', { name }))) return;
    setDeletingId(id);
    try {
      await trainingPlanService.deletePlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      toast.success(t('dashboard.deleteSuccess', { name }));
    } catch (err) {
      toast.error(t('dashboard.deleteError'));
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublishSuccess = async () => {
    setPublishingPlanId(null);
    if (!selectedId) return;
    try {
      const data = await trainingPlanService.getCoachPlansForAthlete(selectedId);
      setPlans(data);
    } catch { /* non-critical */ }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{t('coaching.noAthletes')}</p>
      </div>
    );
  }

  return (
    <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white" style={{ minHeight: '600px' }}>
      {/* ─── Left sidebar: athlete list ─── */}
      <div className="w-64 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
        {athletes.map((a) => {
          const isSelected = a.athlete_id === selectedId;
          return (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.athlete_id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                isSelected
                  ? 'bg-blue-50 border-l-2 border-l-blue-600'
                  : 'hover:bg-gray-50 border-l-2 border-l-transparent'
              }`}
            >
              <AvatarInitials name={a.athlete.full_name} username={a.athlete.username} size="sm" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                  {a.athlete.full_name || a.athlete.username}
                </p>
                <p className="text-xs text-gray-400 truncate">@{a.athlete.username}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Right main: plans for selected athlete ─── */}
      <div className="flex-1 overflow-y-auto">
        {!selectedAthlete ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            {t('coaching.selectAthlete')}
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AvatarInitials name={selectedAthlete.athlete.full_name} username={selectedAthlete.athlete.username} />
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {selectedAthlete.athlete.full_name || selectedAthlete.athlete.username}
                  </h2>
                  <p className="text-xs text-gray-500">@{selectedAthlete.athlete.username}</p>
                </div>
              </div>
              <button
                onClick={() => onCreatePlan(selectedAthlete.athlete_id, selectedAthlete.athlete.username)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                {t('coaching.createPlan')}
              </button>
            </div>

            {/* Plans */}
            {plansLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm">{t('coaching.noPlansYet')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {plans.map((plan, index) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    index={index}
                    deleting={deletingId === plan.id}
                    onDelete={handleDelete}
                    onPublish={setPublishingPlanId}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {publishingPlanId && (
        <PublishPlanModal
          planId={publishingPlanId}
          currentVisibility={plans.find((p) => p.id === publishingPlanId)?.visibility}
          currentDescription={plans.find((p) => p.id === publishingPlanId)?.description}
          currentTags={plans.find((p) => p.id === publishingPlanId)?.tags}
          onClose={() => setPublishingPlanId(null)}
          onSuccess={handlePublishSuccess}
        />
      )}
    </div>
  );
}
