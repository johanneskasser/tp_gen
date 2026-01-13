import { useNavigate } from 'react-router-dom';
import { MarketplacePlan } from '../../types/marketplace';
import { UserProfile } from '../../types/userProfile';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Copy,
  Star,
  Calendar,
  Target,
  TrendingUp,
  User,
  Check,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { Badge } from '../ui';
import { PlanDifficultyBadge } from '../PlanDifficultyBadge';
import { cn, typography } from '../../lib/designSystem';

interface PlanCardProps {
  plan: MarketplacePlan;
  runnerProfile?: UserProfile;
}

export function PlanCard({ plan, runnerProfile }: PlanCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();
  const [copiedLink, setCopiedLink] = useState(false);

  const getDistanceLabel = () => {
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

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        'group relative bg-white rounded-2xl border border-gray-200 overflow-hidden',
        'cursor-pointer transition-all duration-300 ease-out',
        'hover:shadow-2xl hover:shadow-slate-900/10 hover:-translate-y-1',
        'flex flex-col h-full'
      )}
    >
      {/* Header Section with Distance Badge */}
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100/50 px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Distance Badge - Large and Bold */}
          <div className="flex-shrink-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg">
              <Target size={20} className="text-slate-300" />
              {getDistanceLabel()}
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShareLink}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:shadow-md transition-all duration-200"
            title="Link teilen"
          >
            {copiedLink ? (
              <Check size={18} className="text-green-600" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            )}
          </button>
        </div>

        {/* Plan Name */}
        <h3 className="text-xl font-bold text-slate-900 mb-1 leading-tight group-hover:text-blue-600 transition-colors">
          {plan.name}
        </h3>

        {/* Description */}
        {plan.description && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {plan.description}
          </p>
        )}
      </div>

      {/* Stats Grid - Athletic Metrics Style */}
      <div className="px-6 py-4 bg-white grid grid-cols-3 gap-4 border-b border-gray-100">
        {/* Duration */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Dauer
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {getDuration()}<span className="text-sm font-normal text-slate-500 ml-1">Wo</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <Star size={14} className="text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Rating
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {plan.stats?.rating_avg ? plan.stats.rating_avg.toFixed(1) : '—'}
            <span className="text-sm font-normal text-slate-500 ml-1">/5</span>
          </div>
        </div>

        {/* Clones */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <Copy size={14} className="text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Nutzer
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {plan.clone_count}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-6 py-4 space-y-4">
        {/* Target Time */}
        {plan.plan_data?.event?.targetTime && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm">
              <TrendingUp size={16} className="text-blue-500" />
              <span className="font-medium text-slate-700">Zielzeit:</span>
            </div>
            <span className="text-sm font-bold text-slate-900 px-3 py-1 bg-blue-50 rounded-lg">
              {plan.plan_data.event.targetTime}
            </span>
          </div>
        )}

        {/* Difficulty Badge */}
        {runnerProfile && plan.plan_data && (
          <div onClick={(e) => e.stopPropagation()}>
            <PlanDifficultyBadge
              plan={plan.plan_data}
              userProfile={runnerProfile}
              compact={true}
            />
          </div>
        )}

        {/* Tags */}
        {plan.tags && plan.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {plan.tags.slice(0, 3).map((tag, idx) => (
              <Badge
                key={idx}
                variant="default"
                className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 border-0 font-medium"
              >
                {tag}
              </Badge>
            ))}
            {plan.tags.length > 3 && (
              <Badge
                variant="default"
                className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 border-0 font-medium"
              >
                +{plan.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Footer - Creator Info */}
      {plan.creator_profile && plan.visibility !== 'public_anonymous' && (
        <div className="px-6 py-3 bg-gradient-to-br from-slate-50/50 to-transparent border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User size={14} className="text-slate-400" />
            <span className="font-medium">
              {plan.creator_profile.display_name || 'Anonymer Nutzer'}
            </span>
          </div>
        </div>
      )}

      {/* Hover Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </article>
  );
}
