import { useNavigate } from 'react-router-dom';
import { MarketplacePlan } from '../../types/marketplace';
import { UserProfile } from '../../types/userProfile';
import { useState } from 'react';
import {
  Copy,
  Star,
  Calendar,
  TrendingUp,
  User,
  Check,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { cn, typography, flex } from '../../lib/designSystem';
import { DISTANCE_COLORS, type RaceDistance } from '../../constants/distanceColors';

interface PlanCardProps {
  plan: MarketplacePlan;
  runnerProfile?: UserProfile;
}

export function PlanCard({ plan }: PlanCardProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [copiedLink, setCopiedLink] = useState(false);

  const getDistanceInfo = (): { label: string; type: RaceDistance } => {
    const distance = plan.plan_data?.event?.distance;
    const customDistance = plan.plan_data?.event?.customDistance;

    // Handle string distance types
    if (distance === '5K') return { label: '5K', type: '5K' };
    if (distance === '10K') return { label: '10K', type: '10K' };
    if (distance === 'HM') return { label: 'HM', type: 'HM' };
    if (distance === 'M') return { label: 'Marathon', type: 'M' };
    if (distance === 'CUSTOM' && customDistance) return { label: `${customDistance} km`, type: 'CUSTOM' };

    // Fallback for legacy numeric format
    if (typeof distance === 'number') {
      if (distance === 5) return { label: '5K', type: '5K' };
      if (distance === 10) return { label: '10K', type: '10K' };
      if (distance === 21.0975) return { label: 'HM', type: 'HM' };
      if (distance === 42.195) return { label: 'Marathon', type: 'M' };
      return { label: `${distance} km`, type: 'CUSTOM' };
    }

    return { label: 'N/A', type: 'CUSTOM' };
  };

  const getDuration = () => {
    return plan.plan_data?.weeks?.length || 0;
  };

  const handleShareLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/marketplace/${plan.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success('Link kopiert!');

      setTimeout(() => {
        setCopiedLink(false);
      }, 2000);
    } catch (err) {
      console.error('Error copying link:', err);
      toast.error('Fehler beim Kopieren des Links');
    }
  };

  const handleCardClick = () => {
    navigate(`/marketplace/${plan.id}`);
  };

  const distanceInfo = getDistanceInfo();
  const colors = DISTANCE_COLORS[distanceInfo.type];

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        'group relative bg-white rounded-2xl overflow-hidden',
        'cursor-pointer transition-all duration-300 ease-out',
        'hover:shadow-2xl hover:-translate-y-1',
        'flex flex-col'
      )}
      style={{
        boxShadow: `0 1px 3px rgba(0, 0, 0, 0.1), 0 0 20px ${colors.glow}`,
      }}
    >
      {/* Racing Stripe - Left Border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
        style={{
          backgroundColor: colors.hex,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
      />

      {/* Content with left padding for stripe */}
      <div className="pl-6 pr-6 pt-6 pb-4 flex flex-col gap-4">
        {/* Header: Badge and Share */}
        <div className={cn(flex.rowJustified, 'gap-3')}>
          {/* Distance Badge - Vibrant but smaller */}
          <div
            className="inline-flex items-center px-4 py-2 rounded-lg font-bold text-base text-white shadow-md transition-all duration-300 group-hover:scale-105"
            style={{
              backgroundColor: colors.hex,
              boxShadow: `0 2px 8px ${colors.glow}`,
            }}
          >
            {distanceInfo.label}
          </div>

          {/* Share Button - Minimal */}
          <button
            onClick={handleShareLink}
            className={cn(
              'p-2 rounded-lg border border-border-light',
              'text-text-tertiary hover:text-text-secondary hover:border-border-medium',
              'transition-all duration-base opacity-0 group-hover:opacity-100'
            )}
            title="Link teilen"
          >
            {copiedLink ? (
              <Check size={16} className="text-success-text" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            )}
          </button>
        </div>

        {/* Plan Name */}
        <h3 className={cn(typography.h4, 'leading-tight')}>
          {plan.name}
        </h3>

        {/* Description */}
        {plan.description && (
          <p className={cn(typography.bodySmall, 'line-clamp-2 leading-relaxed text-text-tertiary')}>
            {plan.description}
          </p>
        )}

        {/* Compact Stats - Single line, subtle */}
        <div className={cn(flex.rowTight, 'text-text-tertiary', typography.caption, 'flex-wrap')}>
          <div className={flex.rowTight}>
            <Calendar size={12} />
            <span>{getDuration()} Wo</span>
          </div>
          <span>•</span>
          <div className={flex.rowTight}>
            <Star size={12} className="text-yellow-500 fill-yellow-500" />
            <span>{plan.stats?.rating_avg ? plan.stats.rating_avg.toFixed(1) : '—'}</span>
          </div>
          <span>•</span>
          <div className={flex.rowTight}>
            <Copy size={12} />
            <span>{plan.clone_count} Nutzer</span>
          </div>
          {plan.plan_data?.event?.targetTime && (
            <>
              <span>•</span>
              <div className={flex.rowTight}>
                <TrendingUp size={12} style={{ color: colors.hex }} />
                <span className="font-semibold">Ziel: {plan.plan_data.event.targetTime}</span>
              </div>
            </>
          )}
        </div>

        {/* Creator - Always show for uniform height */}
        <div className={cn(flex.rowTight, typography.caption, 'text-text-tertiary pt-2 border-t border-border-light')}>
          <User size={12} />
          <span>
            {plan.creator && plan.visibility !== 'public_anonymous'
              ? plan.creator.full_name || 'Anonymer Nutzer'
              : 'Anonymer Nutzer'}
          </span>
        </div>
      </div>
    </article>
  );
}
