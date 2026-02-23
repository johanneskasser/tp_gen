import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { trainingPlanService, SavedTrainingPlan } from '../services/trainingPlanService';
import { Plus, Calendar, Loader2 } from 'lucide-react';
import { Button, Card } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import PublishPlanModal from '../components/PublishPlanModal';
import { useTranslation } from 'react-i18next';
import { DashboardStats } from '../components/DashboardStats';
import { TrainingPlansGrid } from '../components/TrainingPlansGrid';
import { DashboardFilters } from '../components/DashboardFilters';
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { BetaAnnouncementBar } from '../components/landing/BetaAnnouncementBar';

export default function Dashboard() {
  const [plans, setPlans] = useState<SavedTrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingPlanId, setPublishingPlanId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [distanceFilters, setDistanceFilters] = useState<string[]>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { runnerProfile } = useRunnerProfile();

  const loadPlans = useCallback(async () => {
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
  }, [toast, t]);

  // Load plans on mount and whenever we navigate to this route
  useEffect(() => {
    loadPlans();
  }, [loadPlans, location.pathname]);

  // Reload plans when component comes into focus (e.g., navigating back from plan editor)
  useEffect(() => {
    const handleFocus = () => {
      loadPlans();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadPlans]);

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
      id: activePlan.id,
      name: activePlan.name,
      progress: calculatePlanProgress(activePlan),
      nextSession: getNextSession(activePlan),
      status: planStatus,
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
      <BetaAnnouncementBar />
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 sm:px-6 max-w-[1600px] flex-1">
          <div className="py-6 sm:py-8 h-full">
            {/* Loading State */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-sm font-medium text-slate-600">
                    {t('dashboard.loadingPlans')}
                  </span>
                </div>
              </div>
            ) : plans.length === 0 ? (
              /* Empty State */
              <div className="flex items-center justify-center py-20" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
                <Card className="p-12 text-center max-w-md bg-white shadow-xl">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                    <Calendar size={32} className="text-slate-400" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    {t('dashboard.noPlanYet')}
                  </h2>
                  <p className="text-sm text-slate-600 mb-6">
                    {t('dashboard.noPlanDescription')}
                  </p>
                  <Button
                    onClick={() => navigate('/plan/new')}
                    className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 rounded-xl px-6"
                  >
                    <Plus size={20} />
                    {t('dashboard.createFirstPlan')}
                  </Button>
                </Card>
              </div>
            ) : (
              /* Dashboard with Stats and Grid */
              <div className="space-y-6 sm:space-y-8 flex-1 flex flex-col">
                {/* Stats Section */}
                <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
                  <DashboardStats {...dashboardStats} />
                </div>

                {/* Plans Section Header */}
                <div className="flex justify-between items-center" style={{ animation: 'fadeInUp 0.4s ease-out 0.1s both' }}>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {t('dashboard.yourPlans')}
                  </h2>
                </div>

                {/* Filters */}
                <div style={{ animation: 'fadeInUp 0.4s ease-out 0.15s both' }}>
                  <DashboardFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    distanceFilters={distanceFilters}
                    onDistanceFiltersChange={setDistanceFilters}
                    resultCount={plans.filter(p => {
                      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.plan_data.event.name.toLowerCase().includes(searchQuery.toLowerCase());
                      const matchesDistance = distanceFilters.length === 0 || distanceFilters.includes(p.plan_data.event.distance);
                      return matchesSearch && matchesDistance;
                    }).length}
                    totalCount={plans.length}
                  />
                </div>

                {/* Training Plans Grid */}
                <div style={{ animation: 'fadeInUp 0.4s ease-out 0.2s both' }}>
                  <TrainingPlansGrid
                    plans={plans}
                    onDelete={handleDelete}
                    onPublish={setPublishingPlanId}
                    onSetActive={handleSetActive}
                    deletingId={deletingId}
                    searchQuery={searchQuery}
                    distanceFilters={distanceFilters}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
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
