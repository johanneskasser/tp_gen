import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingPlanService, SavedTrainingPlan } from '../services/trainingPlanService';
import { Plus, Edit, Trash2, Calendar, MapPin, Loader2, Globe, Lock, EyeOff, Share2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { Button, Card } from '../components/ui';
import { typography, cn, flex } from '../lib/designSystem';
import { useToast } from '../contexts/ToastContext';
import PublishPlanModal from '../components/PublishPlanModal';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const [plans, setPlans] = useState<SavedTrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [publishingPlanId, setPublishingPlanId] = useState<string | null>(null);

  const navigate = useNavigate();
  const toast = useToast();
  const { t, i18n } = useTranslation();

  const dateLocale = i18n.language === 'de' ? de : enUS;

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

  const getDistanceLabel = (plan: SavedTrainingPlan) => {
    const { distance, customDistance } = plan.plan_data.event;
    if (distance === 'CUSTOM' && customDistance) {
      return `${customDistance} km`;
    }
    return distance;
  };

  const getVisibilityIcon = (visibility: SavedTrainingPlan['visibility']) => {
    switch (visibility) {
      case 'public':
        return <Globe size={14} className="text-green-600" />;
      case 'public_anonymous':
        return <EyeOff size={14} className="text-orange-600" />;
      case 'private':
      default:
        return <Lock size={14} className="text-gray-400" />;
    }
  };

  const getVisibilityLabel = (visibility: SavedTrainingPlan['visibility']) => {
    switch (visibility) {
      case 'public':
        return t('dashboard.visibility.publicWithProfile');
      case 'public_anonymous':
        return t('dashboard.visibility.publicAnonymousDesc');
      case 'private':
      default:
        return t('dashboard.visibility.private');
    }
  };

  const handlePublishSuccess = async () => {
    setPublishingPlanId(null);
    toast.success(t('dashboard.planUpdated'));
    await loadPlans();
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
      {/* Action Bar */}
      <div className="mb-6 sm:mb-8 flex justify-end">
        <Button
          onClick={() => navigate('/plan/new')}
          size="lg"
        >
          <Plus size={20} />
          {t('dashboard.createNewPlan')}
        </Button>
      </div>

      {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className={flex.row}>
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
              <span className={cn(typography.body, 'text-text-tertiary')}>
                {t('dashboard.loadingPlans')}
              </span>
            </div>
          </div>
        ) : plans.length === 0 ? (
          /* Empty State */
          <Card variant="default" className="p-8 text-center max-w-md mx-auto">
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
        ) : (
          /* Plans Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                variant="default"
                className="overflow-hidden hover:shadow-lg transition-all duration-base"
              >
                <div className="p-4 sm:p-6">
                  {/* Plan Title with Visibility Badge */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <h3 className={cn(typography.h3, 'truncate flex-1')}>
                      {plan.name}
                    </h3>
                    <div
                      className={cn(
                        'flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-help',
                        plan.visibility === 'public'
                          ? 'bg-green-50 border border-green-200'
                          : plan.visibility === 'public_anonymous'
                          ? 'bg-orange-50 border border-orange-200'
                          : 'bg-gray-50 border border-gray-200'
                      )}
                      title={getVisibilityLabel(plan.visibility)}
                    >
                      {getVisibilityIcon(plan.visibility)}
                      <span className={cn(typography.caption, 'font-medium')}>
                        {plan.visibility === 'public'
                          ? t('dashboard.visibility.public')
                          : plan.visibility === 'public_anonymous'
                          ? t('dashboard.visibility.publicAnonymous')
                          : t('dashboard.visibility.private')}
                      </span>
                    </div>
                  </div>

                  {/* Plan Details */}
                  <div className="space-y-2 mb-4">
                    <div className={cn(flex.rowTight, typography.bodySmall, 'text-text-secondary')}>
                      <MapPin size={16} className="flex-shrink-0 text-text-tertiary" />
                      <span className="truncate">
                        {getDistanceLabel(plan)} - {plan.plan_data.event.terrain === 'road' ? t('dashboard.road') : t('dashboard.trail')}
                      </span>
                    </div>
                    <div className={cn(flex.rowTight, typography.bodySmall, 'text-text-secondary')}>
                      <Calendar size={16} className="flex-shrink-0 text-text-tertiary" />
                      <span>
                        {format(new Date(plan.plan_data.event.date), 'dd. MMM yyyy', { locale: dateLocale })}
                      </span>
                    </div>
                    <div className={cn(typography.bodySmall, 'text-text-tertiary')}>
                      {t('dashboard.weeks', { count: plan.plan_data.weeks.length })}
                    </div>
                  </div>

                  {/* Stats for published plans */}
                  {plan.visibility !== 'private' && (
                    <div className="mb-4 pb-4 border-b border-border-light">
                      <div className="flex gap-4 text-text-tertiary">
                        <div className={cn(flex.rowTight, typography.caption)} title={t('dashboard.stats.views')}>
                          <Eye size={14} />
                          <span>{plan.view_count}</span>
                        </div>
                        <div className={cn(flex.rowTight, typography.caption)} title={t('dashboard.stats.clones')}>
                          <Share2 size={14} />
                          <span>{plan.clone_count}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Last Updated */}
                  <div className={cn(typography.caption, 'text-text-tertiary mb-4 pb-4 border-b border-border-light')}>
                    {t('dashboard.updatedAt', { date: format(new Date(plan.updated_at), 'dd.MM.yyyy HH:mm', { locale: dateLocale }) })}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => navigate(`/plan/${plan.id}`)}
                        size="sm"
                        className="flex-1"
                      >
                        <Edit size={16} />
                        {t('common.edit')}
                      </Button>
                      <Button
                        onClick={() => handleDelete(plan.id, plan.name)}
                        disabled={deletingId === plan.id}
                        variant="destructive"
                        size="sm"
                        loading={deletingId === plan.id}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                    <Button
                      onClick={() => setPublishingPlanId(plan.id)}
                      variant={plan.visibility !== 'private' ? 'default' : 'secondary'}
                      size="sm"
                      fullWidth
                    >
                      <Share2 size={16} />
                      {plan.visibility !== 'private' ? t('dashboard.managePublication') : t('dashboard.publish')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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
  );
}
