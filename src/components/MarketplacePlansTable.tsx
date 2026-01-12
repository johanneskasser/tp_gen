import { useNavigate } from 'react-router-dom';
import { MarketplacePlan } from '../types/marketplace';
import { UserProfile } from '../types/userProfile';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Copy,
  Star,
  Share2,
  Check,
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '../components/ui';
import { Card } from '../components/ui';
import { PlanDifficultyBadge } from './PlanDifficultyBadge';

interface MarketplacePlansTableProps {
  plans: MarketplacePlan[];
  runnerProfile?: UserProfile;
}

export function MarketplacePlansTable({ plans, runnerProfile }: MarketplacePlansTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const [copiedPlanId, setCopiedPlanId] = useState<string | null>(null);

  const getDistanceLabel = (plan: MarketplacePlan) => {
    const distance = plan.plan_data?.event?.distance;
    if (typeof distance === 'number') {
      if (distance === 5) return '5K';
      if (distance === 10) return '10K';
      if (distance === 21.0975) return t('marketplace.distance.halfMarathon');
      if (distance === 42.195) return t('marketplace.distance.marathon');
      return `${distance} km`;
    }
    return distance || 'N/A';
  };

  const getDuration = (plan: MarketplacePlan) => {
    return plan.plan_data?.weeks?.length || 0;
  };

  const handleShareLink = async (planId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click navigation

    const shareUrl = `${window.location.origin}/marketplace/${planId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedPlanId(planId);
      toast.success('Link kopiert!');

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedPlanId(null);
      }, 2000);
    } catch (err) {
      console.error('Error copying link:', err);
      toast.error('Fehler beim Kopieren des Links');
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">{t('marketplace.table.name')}</TableHead>
              <TableHead>{t('marketplace.table.distance')}</TableHead>
              <TableHead>{t('marketplace.table.duration')}</TableHead>
              <TableHead>{t('marketplace.table.targetTime')}</TableHead>
              {runnerProfile && (
                <TableHead>{t('marketplace.table.difficulty')}</TableHead>
              )}
              <TableHead>{t('marketplace.table.tags')}</TableHead>
              <TableHead className="text-right">{t('marketplace.table.stats')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={runnerProfile ? 8 : 7} className="h-24 text-center">
                  {t('marketplace.noResults')}
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow
                  key={plan.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/marketplace/${plan.id}`)}
                >
                  {/* Name & Description */}
                  <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{plan.name}</span>
                      {plan.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {plan.description}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Distance */}
                  <TableCell>
                    <Badge variant="default">{getDistanceLabel(plan)}</Badge>
                  </TableCell>

                  {/* Duration (Weeks) */}
                  <TableCell>
                    <span className="text-sm">
                      {t('marketplace.weeks', { count: getDuration(plan) })}
                    </span>
                  </TableCell>

                  {/* Target Time */}
                  <TableCell>
                    {plan.plan_data?.event?.targetTime ? (
                      <span className="text-sm">{plan.plan_data.event.targetTime}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Difficulty (only if user has profile) */}
                  {runnerProfile && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {plan.plan_data ? (
                        <PlanDifficultyBadge
                          plan={plan.plan_data}
                          userProfile={runnerProfile}
                          compact={true}
                        />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  )}

                  {/* Tags */}
                  <TableCell>
                    {plan.tags && plan.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {plan.tags.slice(0, 2).map((tag, idx) => (
                          <Badge key={idx} variant="default" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {plan.tags.length > 2 && (
                          <Badge variant="default" className="text-xs">
                            +{plan.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>

                  {/* Stats - Simplified */}
                  <TableCell className="text-right">
                    <div className="flex gap-3 text-sm text-muted-foreground justify-end">
                      <div className="flex items-center gap-1" title="Rating">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="tabular-nums font-medium">
                          {plan.stats?.rating_avg ? plan.stats.rating_avg.toFixed(1) : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground" title="Verwendet">
                        <Copy className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{plan.clone_count}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Share Button */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleShareLink(plan.id, e)}
                      className="p-2 hover:bg-muted rounded-md transition-colors"
                      title="Link teilen"
                    >
                      {copiedPlanId === plan.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Share2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
