import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingPlanService, SavedTrainingPlan } from '../services/trainingPlanService';
import { Plus, Calendar, Loader2 } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { typography, cn, flex } from '../lib/designSystem';
import { useToast } from '../contexts/ToastContext';
import PublishPlanModal from '../components/PublishPlanModal';
import { useTranslation } from 'react-i18next';
import { DashboardStats } from '../components/DashboardStats';
import { TrainingPlansTable } from '../components/TrainingPlansTable';
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';

export default function Dashboard() {
  const [plans, setPlans] = useState<SavedTrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingPlanId, setPublishingPlanId] = useState<string | null>(null);

  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { runnerProfile } = useRunnerProfile();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await trainingPlanService.getAllPlans();
      setPlans(data);
    } catch (err) {
      toast.error(t('dashboard.loadError'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t('dashboard.confirmDelete', { name }))) return;

    try {
      setDeletingId(id);
      await trainingPlanService.deletePlan(id);
      setPlans(plans.filter((p) => p.id !== id));
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
    toast.success(t('dashboard.planUpdated'));
    await loadPlans();
  };

  const handleSetActive = async (id: string) => {
    try {
      // Toggle active status in DB
      const newStatus = await trainingPlanService.toggleActivePlan(id);

      // Update local state
      setPlans(plans.map(p => ({
        ...p,
        is_active: p.id === id ? newStatus : false,
      })));

      toast.success(
        newStatus
          ? t('dashboard.planSetAsActive')
          : t('dashboard.planRemovedAsActive')
      );
    } catch (err) {
      toast.error(t('dashboard.setActiveError'));
      console.error(err);
    }
  };

  // Calculate plan progress based on start date and weeks
  const calculatePlanProgress = (plan: SavedTrainingPlan): number => {
    if (!plan.plan_data?.startDate || !plan.plan_data?.weeks) return 0;

    const startDate = new Date(plan.plan_data.startDate);
    const today = new Date();
    const totalWeeks = plan.plan_data.weeks.length;

    // Calculate weeks passed since start
    const daysPassed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const weeksPassed = Math.floor(daysPassed / 7);

    // Calculate progress percentage
    const progress = Math.min(100, Math.round((weeksPassed / totalWeeks) * 100));

    return progress;
  };

  // Get next session from active plan (today or any day in the future)
  const getNextSession = (plan: SavedTrainingPlan): string | undefined => {
    if (!plan.plan_data?.weeks || !plan.plan_data?.startDate) return undefined;

    const startDate = new Date(plan.plan_data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysPassed = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const weeksPassed = Math.floor(daysPassed / 7);
    const dayInWeek = daysPassed % 7;

    // Check current week first
    if (weeksPassed < plan.plan_data.weeks.length) {
      const currentWeek = plan.plan_data.weeks[weeksPassed];
      if (currentWeek?.sessions) {
        const nextSession = currentWeek.sessions
          .filter(s => s.dayOfWeek >= dayInWeek)
          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];

        if (nextSession) {
          return nextSession.title || nextSession.type;
        }
      }
    }

    // If no session this week, check next weeks
    for (let i = weeksPassed + 1; i < plan.plan_data.weeks.length; i++) {
      const week = plan.plan_data.weeks[i];
      if (week?.sessions && week.sessions.length > 0) {
        const firstSession = week.sessions.sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];
        return firstSession.title || firstSession.type;
      }
    }

    return undefined;
  };

  // Get status message (days until start or after end)
  const getPlanStatus = (plan: SavedTrainingPlan): { type: 'active' | 'upcoming' | 'ended'; message?: string; days?: number } => {
    if (!plan.plan_data?.startDate || !plan.plan_data?.weeks) {
      return { type: 'active' };
    }

    const startDate = new Date(plan.plan_data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    const totalWeeks = plan.plan_data.weeks.length;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (totalWeeks * 7));

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

  // Calculate real stats from user data
  const activePlan = plans.find(p => p.is_active);
  const planStatus = activePlan ? getPlanStatus(activePlan) : null;

  // Auto-set first plan as active if no plan is active yet
  useEffect(() => {
    const autoSetActivePlan = async () => {
      if (plans.length > 0 && !plans.some(p => p.is_active)) {
        try {
          await trainingPlanService.setActivePlan(plans[0].id);
          // Reload plans to get updated is_active status
          await loadPlans();
        } catch (err) {
          console.error('Failed to auto-set active plan:', err);
        }
      }
    };

    autoSetActivePlan();
  }, [plans.length]);

  const dashboardStats = {
    userName: runnerProfile?.name || user?.email?.split('@')[0] || 'Läufer',
    vdot: runnerProfile?.vdot,
    weeklyKm: runnerProfile?.weeklyKmBase,
    activePlan: activePlan ? {
      name: activePlan.name,
      progress: calculatePlanProgress(activePlan),
      nextSession: getNextSession(activePlan),
      status: planStatus,
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl flex-1 flex flex-col">
      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12 flex-1">
          <div className={flex.row}>
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            <span className={cn(typography.body, 'text-text-tertiary')}>
              {t('dashboard.loadingPlans')}
            </span>
          </div>
        </div>
      ) : plans.length === 0 ? (
        /* Empty State */
        <div className="space-y-6 flex-1 flex flex-col justify-center">
          <DashboardStats {...dashboardStats} activePlan={undefined} />

          <Card className="p-8 text-center max-w-md mx-auto">
            <div>
              <Calendar size={48} className="mx-auto text-text-tertiary mb-4" />
              <h2 className={cn(typography.h2, 'mb-2')}>
                {t('dashboard.noPlanYet')}
              </h2>
              <p className={cn(typography.body, 'text-text-tertiary mb-6')}>
                {t('dashboard.noPlanDescription')}
              </p>
              <Button
                onClick={() => navigate('/plan/new')}
                size="lg"
              >
                <Plus size={20} />
                {t('dashboard.createFirstPlan')}
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        /* Dashboard with Stats and Table */
        <div className="space-y-8 flex-1 flex flex-col">
          {/* Stats Section */}
          <DashboardStats {...dashboardStats} />

          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('dashboard.yourPlans')}
            </h2>
            <Button
              onClick={() => navigate('/plan/new')}
              size="lg"
            >
              <Plus size={20} />
              {t('dashboard.createNewPlan')}
            </Button>
          </div>

          {/* Training Plans Table */}
          <TrainingPlansTable
            plans={plans}
            onDelete={handleDelete}
            onPublish={setPublishingPlanId}
            onSetActive={handleSetActive}
            deletingId={deletingId}
          />
        </div>
      )}

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
    </div>
  );
}
