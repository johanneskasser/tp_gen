import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import { userService } from '../services/userService';
import { MarketplacePlan, PlanComment } from '../types/marketplace';
import {
  ArrowLeft,
  Heart,
  Star,
  Copy,
  Eye,
  User,
  Clock,
  Loader2,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  UserPlus,
  UserMinus,
  Share2,
  Check,
  BarChart3,
  ListChecks,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { Button, Input, Badge } from '../components/ui';
import { cn, getSessionTypeConfig, typography, flex } from '../lib/designSystem';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { useToast } from '../contexts/ToastContext';
import ClonePlanModal from '../components/ClonePlanModal';
import WeeklyChart from '../components/WeeklyChart';
import { PlanDifficultyBadge } from '../components/PlanDifficultyBadge';
import { calculateSessionDistance } from '../utils/calculationUtils';
import { DISTANCE_COLORS, type RaceDistance } from '../constants/distanceColors';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { SEOHead } from '../components/seo/SEOHead';
import { AuthGate } from '../components/marketplace/AuthGate';
import { PublicCTABanner } from '../components/marketplace/PublicCTABanner';
import { useTranslation } from 'react-i18next';

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { runnerProfile } = useRunnerProfile();
  const toast = useToast();
  const { t } = useTranslation();
  const location = useLocation();

  const [plan, setPlan] = useState<MarketplacePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<PlanComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [visibleComments, setVisibleComments] = useState(10);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [selectedWeekForHorizontalView, setSelectedWeekForHorizontalView] = useState<number>(0);
  const [selectedDayInWeek, setSelectedDayInWeek] = useState<number | null>(null);

  const loginRedirect = `/login?redirect=${encodeURIComponent(location.pathname)}`;

  useEffect(() => {
    if (planId) {
      loadPlan();
      loadComments();
    }
  }, [planId]);

  useEffect(() => {
    if (plan && plan.creator && user) {
      checkFollowStatus();
    }
  }, [plan, user]);

  const checkFollowStatus = async () => {
    if (!plan?.creator?.id) return;

    try {
      const following = await userService.isFollowing(plan.creator.id);
      setIsFollowing(following);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const loadPlan = async () => {
    if (!planId) return;

    try {
      setLoading(true);
      const data = await marketplaceService.getPlanById(planId);
      if (data) {
        setPlan(data);
        setSelectedRating(data.user_interaction?.user_rating || 0);
      } else {
        toast.error('Trainingsplan nicht gefunden');
        navigate('/marketplace');
      }
    } catch (err) {
      console.error('Error loading plan:', err);
      toast.error('Fehler beim Laden des Plans');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!planId) return;

    try {
      const data = await marketplaceService.getComments(planId);
      setComments(data);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate(loginRedirect);
      return;
    }

    if (!planId || !plan) return;

    try {
      const isLiked = await marketplaceService.toggleLike(planId);

      setPlan({
        ...plan,
        stats: {
          ...plan.stats!,
          likes_count: isLiked
            ? (plan.stats?.likes_count || 0) + 1
            : (plan.stats?.likes_count || 0) - 1,
        },
        user_interaction: {
          ...plan.user_interaction!,
          has_liked: isLiked,
        },
      });

      toast.success(isLiked ? 'Plan geliked!' : 'Like entfernt');
    } catch (err) {
      console.error('Error toggling like:', err);
      toast.error('Fehler beim Liken');
    }
  };

  const handleRating = async (rating: number) => {
    if (!user) {
      navigate(loginRedirect);
      return;
    }

    if (!planId || !plan) return;

    try {
      if (rating === selectedRating) {
        await marketplaceService.deleteRating(planId);
        setSelectedRating(0);
        toast.success('Bewertung entfernt');
      } else {
        await marketplaceService.ratePlan(planId, rating);
        setSelectedRating(rating);
        toast.success(`${rating} Sterne vergeben`);
      }

      await loadPlan();
    } catch (err) {
      console.error('Error rating plan:', err);
      toast.error('Fehler beim Bewerten');
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      navigate(loginRedirect);
      return;
    }

    if (!planId || !commentText.trim()) return;

    try {
      setSubmittingComment(true);
      await marketplaceService.addComment(planId, commentText);
      setCommentText('');
      await loadComments();
      toast.success('Kommentar hinzugefügt');
    } catch (err) {
      console.error('Error submitting comment:', err);
      toast.error('Fehler beim Kommentieren');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Kommentar wirklich löschen?')) return;

    try {
      await marketplaceService.deleteComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      toast.success('Kommentar gelöscht');
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Fehler beim Löschen');
    }
  };

  const handleFollow = async () => {
    if (!user) {
      navigate(loginRedirect);
      return;
    }

    if (!plan?.creator?.id) return;

    if (user.id === plan.creator.id) {
      toast.error('Du kannst dir selbst nicht folgen');
      return;
    }

    try {
      setFollowLoading(true);
      const nowFollowing = await userService.toggleFollow(plan.creator.id);
      setIsFollowing(nowFollowing);
      toast.success(nowFollowing ? 'Du folgst jetzt diesem User' : 'Du folgst diesem User nicht mehr');
    } catch (err) {
      console.error('Error toggling follow:', err);
      toast.error('Fehler beim Folgen');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShareLink = async () => {
    if (!planId) return;

    const shareUrl = `${window.location.origin}/marketplace/${planId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      toast.success('Link kopiert!');

      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Error copying link:', err);
      toast.error('Fehler beim Kopieren des Links');
    }
  };

  const getDistanceInfo = (): { label: string; type: RaceDistance } => {
    const distance = plan?.plan_data?.event?.distance;
    const customDistance = plan?.plan_data?.event?.customDistance;

    if (distance === '5K') return { label: '5K', type: '5K' };
    if (distance === '10K') return { label: '10K', type: '10K' };
    if (distance === 'HM') return { label: 'Halbmarathon', type: 'HM' };
    if (distance === 'M') return { label: 'Marathon', type: 'M' };
    if (distance === 'CUSTOM' && customDistance) return { label: `${customDistance} km`, type: 'CUSTOM' };

    if (typeof distance === 'number') {
      if (distance === 5) return { label: '5K', type: '5K' };
      if (distance === 10) return { label: '10K', type: '10K' };
      if (distance === 21.0975) return { label: 'Halbmarathon', type: 'HM' };
      if (distance === 42.195) return { label: 'Marathon', type: 'M' };
      return { label: `${distance} km`, type: 'CUSTOM' };
    }

    return { label: 'N/A', type: 'CUSTOM' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-slate-600">
              Lade Trainingsplan...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const distanceInfo = getDistanceInfo();
  const colors = DISTANCE_COLORS[distanceInfo.type];
  const description = plan.description || '';
  const shouldTruncateDescription = description.length > 200;

  return (
    <TooltipProvider delayDuration={300}>
      {plan && (
        <SEOHead
          title={t('seo.marketplace.planTitle', {
            name: plan.name,
            distance: getDistanceInfo().label,
          })}
          description={t('seo.marketplace.planDescription', {
            weeks: plan.plan_data?.weeks?.length || 0,
            distance: getDistanceInfo().label,
            description: (plan.description || '').slice(0, 120),
          })}
          canonicalUrl={`/marketplace/${planId}`}
          ogType="article"
          structuredData={{
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: plan.name,
            description: plan.description || '',
            url: `https://zenit-it.fit/marketplace/${planId}`,
            author: plan.creator ? { '@type': 'Person', name: plan.creator.full_name || 'Anonymous' } : undefined,
            datePublished: plan.published_at || plan.created_at,
            ...(plan.stats?.rating_avg ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: plan.stats.rating_avg,
                reviewCount: plan.stats.rating_count,
                bestRating: 5,
              },
            } : {}),
          }}
          alternateUrls={[
            { lang: 'de', url: `/marketplace/${planId}` },
            { lang: 'en', url: `/marketplace/${planId}` },
          ]}
        />
      )}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Sticky Header */}
        <header
          className={cn(
            "sticky z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm",
            user ? "top-[72px]" : "top-16 md:top-20"
          )}
        >

          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2.5 max-w-7xl mx-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => navigate('/marketplace')}
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  aria-label="Zurück zum Marketplace"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zurück zum Marketplace</TooltipContent>
            </Tooltip>

            <div className="w-px h-5 bg-slate-200" />

            {/* Plan name + Distance badge */}
            <h1 className="font-semibold text-sm text-slate-800 truncate max-w-[200px] lg:max-w-[300px]">
              {plan.name}
            </h1>
            <div
              className="inline-flex items-center px-3 py-1 rounded-lg font-bold text-xs text-white shadow-md transition-all duration-300"
              style={{
                backgroundColor: colors.hex,
              }}
            >
              {distanceInfo.label}
            </div>

            {/* Creator + Follow */}
            {plan.creator && plan.visibility === 'public' && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(`/profile/${plan.creator!.id}`)}
                      className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 transition-colors"
                    >
                      <User size={14} />
                      <span className="font-medium max-w-[120px] truncate">
                        {plan.creator.full_name || 'Anonym'}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Profil anzeigen</TooltipContent>
                </Tooltip>

                {user && user.id !== plan.creator.id && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleFollow}
                        disabled={followLoading}
                        variant={isFollowing ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-6 text-xs px-2"
                      >
                        {isFollowing ? <UserMinus size={12} /> : <UserPlus size={12} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isFollowing ? 'Entfolgen' : 'Folgen'}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Eye size={14} />
                <span className="font-medium">{plan.view_count}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Copy size={14} />
                <span className="font-medium">{plan.clone_count}</span>
              </div>
            </div>

            {/* Combined Rating & Like */}
            <div className="flex items-center gap-3">
              {/* Rating Stars - Interactive or Read-only */}
              <div className="flex items-center gap-0.5">
                {user ? (
                  <>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Tooltip key={rating}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleRating(rating)}
                            className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                            aria-label={`${rating} Sterne vergeben`}
                          >
                            <Star
                              size={16}
                              className={
                                rating <= selectedRating
                                  ? 'fill-yellow-500 text-yellow-500'
                                  : 'text-gray-300 hover:text-yellow-400'
                              }
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>{rating} Stern{rating !== 1 ? 'e' : ''}</TooltipContent>
                      </Tooltip>
                    ))}
                  </>
                ) : (
                  <>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <span key={rating} className="p-0.5">
                        <Star
                          size={16}
                          className={
                            rating <= (plan.stats?.rating_avg || 0)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-gray-300'
                          }
                        />
                      </span>
                    ))}
                  </>
                )}
                <span className="ml-1.5 text-xs text-slate-500">
                  {plan.stats?.rating_avg
                    ? `${plan.stats.rating_avg.toFixed(1)} (${plan.stats.rating_count})`
                    : '—'}
                </span>
              </div>

              {/* Like Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors active:scale-95"
                  >
                    <Heart
                      size={16}
                      className={cn(
                        "transition-all",
                        plan.user_interaction?.has_liked
                          ? 'fill-red-500 text-red-500'
                          : 'text-slate-400 hover:text-red-400'
                      )}
                    />
                    <span className="text-xs font-medium text-slate-600">
                      {plan.stats?.likes_count || 0}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {plan.user_interaction?.has_liked ? 'Like entfernen' : 'Plan liken'}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex-1" />

            {/* Clone Button - Primary CTA */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowCloneModal(true)}
                  variant="default"
                  size="sm"
                  className="gap-1.5"
                >
                  <Copy size={16} />
                  <span>Kopieren</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Plan kopieren & anpassen</TooltipContent>
            </Tooltip>

            {/* More Menu */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="px-2" aria-label="Weitere Aktionen">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Weitere Aktionen</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleShareLink}>
                  {linkCopied ? <Check size={16} className="mr-2" /> : <Share2 size={16} className="mr-2" />}
                  {linkCopied ? 'Link kopiert!' : 'Link teilen'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  const commentsSection = document.getElementById('comments-section');
                  commentsSection?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <MessageCircle size={16} className="mr-2" />
                  Kommentare ({comments.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Row 1 */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
              <Button
                onClick={() => navigate('/marketplace')}
                variant="ghost"
                size="sm"
                className="px-1.5"
                aria-label="Zurück"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              <h1 className="font-semibold text-sm text-slate-800 truncate flex-1">
                {plan.name}
              </h1>

              <Button
                onClick={() => setShowCloneModal(true)}
                variant="default"
                size="sm"
                className="px-2"
              >
                <Copy size={16} />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-1.5">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleShareLink}>
                    {linkCopied ? <Check size={16} className="mr-2" /> : <Share2 size={16} className="mr-2" />}
                    {linkCopied ? 'Link kopiert!' : 'Link teilen'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLike}>
                    <Heart size={16} className={cn("mr-2", plan.user_interaction?.has_liked && "fill-current")} />
                    {plan.user_interaction?.has_liked ? 'Like entfernen' : 'Plan liken'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const commentsSection = document.getElementById('comments-section');
                    commentsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    <MessageCircle size={16} className="mr-2" />
                    Kommentare ({comments.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Row 2 */}
            <div className="flex items-center gap-2 px-3 py-2 text-xs">
              <div
                className="inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-white shadow-md"
                style={{
                  backgroundColor: colors.hex,
                }}
              >
                {distanceInfo.label}
              </div>

              {plan.creator && plan.visibility === 'public' && (
                <>
                  <div className="flex items-center gap-1 text-slate-600">
                    <User size={12} />
                    <span className="max-w-[100px] truncate font-medium">
                      {plan.creator.full_name || 'Anonym'}
                    </span>
                  </div>
                  {user && user.id !== plan.creator.id && (
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-6 text-xs px-2"
                    >
                      {isFollowing ? <UserMinus size={10} /> : <UserPlus size={10} />}
                    </Button>
                  )}
                </>
              )}

              <div className="flex-1" />

              <div className="flex items-center gap-1.5 text-slate-500">
                <Eye size={12} />
                <span>{plan.view_count}</span>
                <span>•</span>
                <Copy size={12} />
                <span>{plan.clone_count}</span>
                <span>•</span>
                <Heart size={12} className={plan.user_interaction?.has_liked ? 'fill-red-500 text-red-500' : ''} />
                <span>{plan.stats?.likes_count || 0}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">
          {/* Plan Header Info */}
          <article
            className="relative bg-white rounded-xl overflow-hidden mb-6 shadow-lg"
            role="article"
            aria-label="Plan details"
          >
            <div className="px-4 sm:px-6 pt-5 pb-4">
              {/* Title */}
              <h2 className={cn(typography.h1, 'mb-3 leading-tight')}>
                {plan.name}
              </h2>

              {/* Description */}
              {plan.description && (
                <div className="mb-4">
                  <p
                    className={cn(
                      typography.bodySmall,
                      'text-slate-600 leading-relaxed',
                      !descriptionExpanded && shouldTruncateDescription && 'line-clamp-3'
                    )}
                  >
                    {plan.description}
                  </p>
                  {shouldTruncateDescription && (
                    <button
                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 transition-colors"
                    >
                      {descriptionExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                    </button>
                  )}
                </div>
              )}

              {/* Metadata Row */}
              <div className={cn(flex.rowTight, 'flex-wrap', typography.caption, 'text-slate-500 mb-3')}>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{plan.plan_data?.weeks?.length || 0} Wochen</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{distanceInfo.label}</span>
                </div>
                {plan.plan_data?.event?.targetTime && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={14} style={{ color: colors.hex }} />
                      <span className="font-semibold">Ziel: {plan.plan_data.event.targetTime}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Tags */}
              {plan.tags && plan.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {plan.tags.map((tag, idx) => (
                    <Badge key={idx} className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action Bar - Comments Only */}
              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <Button
                  onClick={() => {
                    const commentsSection = document.getElementById('comments-section');
                    commentsSection?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                >
                  <MessageCircle size={16} />
                  <span>{comments.length} Kommentar{comments.length !== 1 ? 'e' : ''}</span>
                </Button>
              </div>
            </div>
          </article>

          {/* Weekly Chart Section */}
          {plan.plan_data?.weeks && plan.plan_data.weeks.length > 0 && (
            <section
              className="relative bg-white rounded-xl overflow-hidden mb-6 shadow-lg"
            >
              <button
                onClick={() => setShowChart(!showChart)}
                className="w-full flex items-center gap-3 pl-6 pr-4 py-4 hover:bg-slate-50 transition-colors group touch-manipulation"
                aria-expanded={showChart}
                aria-controls="chart-content"
              >
                <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Wöchentlicher Überblick
                  </h2>
                  <p className="text-xs text-slate-500">
                    {plan.plan_data.weeks.length} Wochen Trainingsplan
                  </p>
                </div>
                {showChart ? (
                  <ChevronUp size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                ) : (
                  <ChevronDown size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                )}
              </button>

              {showChart && (
                <div
                  id="chart-content"
                  className="px-4 sm:px-6 pb-4 border-t border-slate-100"
                  style={{ animation: 'fadeInUp 0.3s ease-out' }}
                >
                  {runnerProfile && (
                    <div className="pt-4 pb-2">
                      <PlanDifficultyBadge
                        plan={plan.plan_data}
                        userProfile={runnerProfile}
                        showDetails={true}
                      />
                    </div>
                  )}
                  <WeeklyChart weeks={plan.plan_data.weeks} userProfile={runnerProfile || undefined} />
                </div>
              )}
            </section>
          )}

          {/* Training Plan Content */}
          <section
            className="relative bg-white rounded-xl overflow-hidden mb-6 shadow-lg"
          >
            {/* Refined Modern Header */}
            <div className="relative pl-6 pr-4 py-4 bg-white border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                    <ListChecks className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 leading-none mb-1">
                      Trainingsplan
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="font-medium">{plan.plan_data?.weeks?.length || 0} Wochen</span>
                      <span>•</span>
                      <span className="font-medium">{plan.plan_data?.weeks?.reduce((sum, w) => sum + w.sessions.length, 0) || 0} Sessions</span>
                      <span>•</span>
                      <span className="font-bold text-slate-900">{plan.plan_data?.weeks?.reduce((sum, w) => sum + w.totalKm, 0).toFixed(0) || 0} km</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {plan.plan_data?.weeks && plan.plan_data.weeks.length > 0 ? (
              <div className="px-4 sm:px-6 pb-4">
                {/* Refined Week Selector */}
                <div className="border-b border-slate-200">
                  <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-1 min-w-min px-4 sm:px-6">
                      {plan.plan_data.weeks.map((week, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedWeekForHorizontalView(week.weekNumber)}
                          className={cn(
                            'relative px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-all',
                            selectedWeekForHorizontalView === week.weekNumber
                              ? 'text-slate-900'
                              : 'text-slate-500 hover:text-slate-700'
                          )}
                        >
                          <span className="relative z-10">
                            Woche {week.weekNumber}
                            <span className={cn(
                              "ml-1.5 text-xs",
                              selectedWeekForHorizontalView === week.weekNumber
                                ? "font-bold"
                                : "opacity-60"
                            )}>
                              {week.totalKm.toFixed(0)}
                            </span>
                          </span>
                          {selectedWeekForHorizontalView === week.weekNumber && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Horizontal Day Cards */}
                {(() => {
                  const selectedWeek = plan.plan_data.weeks.find(
                    w => w.weekNumber === selectedWeekForHorizontalView
                  ) || plan.plan_data.weeks[0];

                  // Create array of all 7 days
                  const daysInWeek = Array.from({ length: 7 }, (_, dayIndex) => {
                    const session = selectedWeek.sessions.find(s => s.dayOfWeek === dayIndex);
                    return { dayIndex, session };
                  });

                  return (
                    <>
                      {/* Week Summary - Compact */}
                      <div className="px-4 sm:px-6 py-3 bg-slate-50/50">
                        <div className="flex items-center justify-center gap-2 text-sm">
                          <span className="text-slate-600">Diese Woche:</span>
                          <span className="font-bold text-slate-900">{selectedWeek.totalKm.toFixed(1)} km</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">{selectedWeek.sessions.length} Sessions</span>
                        </div>
                      </div>

                      {/* Horizontal Scrollable Days - Refined Minimalist */}
                      <div className="overflow-x-auto scrollbar-hide -mx-4 sm:-mx-6 px-4 sm:px-6 py-3">
                        <div className="flex gap-2 min-w-min">
                          {daysInWeek.map(({ dayIndex, session }) => {
                            const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
                            const dayNamesFull = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
                            const config = session ? getSessionTypeConfig(session.type) : null;
                            const totalDistance = session ? calculateSessionDistance(session) : 0;
                            const isRestDay = !session;
                            const isSelected = selectedDayInWeek === dayIndex;

                            return (
                              <button
                                key={dayIndex}
                                onClick={() => {
                                  if (session) {
                                    setSelectedDayInWeek(isSelected ? null : dayIndex);
                                  }
                                }}
                                className={cn(
                                  'relative flex flex-col min-w-[100px] rounded-lg p-3 transition-all duration-150',
                                  'border',
                                  isRestDay
                                    ? 'bg-white/40 border-slate-200/60 cursor-default opacity-50'
                                    : isSelected
                                    ? 'bg-white border-slate-900 shadow-sm'
                                    : 'bg-white border-slate-200/80 hover:border-slate-400 cursor-pointer'
                                )}
                                disabled={isRestDay}
                                title={isRestDay ? `${dayNamesFull[dayIndex]} - Ruhetag` : `${dayNamesFull[dayIndex]} - Klicken für Details`}
                              >
                                {/* Selected indicator - Top border accent */}
                                {session && isSelected && (
                                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-900" />
                                )}

                                {/* Day Name - Clean typography */}
                                <div className="mb-3">
                                  <p className={cn(
                                    "text-xs font-semibold tracking-wide uppercase",
                                    isSelected ? "text-slate-900" : "text-slate-600"
                                  )}>
                                    {dayNames[dayIndex]}
                                  </p>
                                </div>

                                {/* Session Content */}
                                {session && config ? (
                                  <div className="flex-1 flex flex-col gap-2.5">
                                    {/* Session Type - Minimal badge */}
                                    <div
                                      className={cn(
                                        'px-2 py-1 rounded text-[10px] font-semibold text-center uppercase tracking-wide',
                                        config.bgColor,
                                        config.textColor
                                      )}
                                    >
                                      {config.label}
                                    </div>

                                    {/* Distance/Duration - Prominent display */}
                                    <div className="text-center">
                                      {totalDistance > 0 ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <p className="text-2xl font-bold leading-none text-slate-900">
                                            {totalDistance.toFixed(1)}
                                          </p>
                                          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">km</p>
                                        </div>
                                      ) : session.duration ? (
                                        <div className="flex flex-col items-center gap-0.5">
                                          <p className="text-2xl font-bold leading-none text-slate-900">{session.duration}</p>
                                          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">min</p>
                                        </div>
                                      ) : (
                                        <p className="text-xs text-slate-300">—</p>
                                      )}

                                      {/* Interval indicator */}
                                      {session.intervals && session.intervals.length > 0 && (
                                        <div className="mt-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-slate-100 text-[9px] font-semibold text-slate-600 uppercase tracking-wide">
                                          {session.intervals.length}x
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex flex-col items-center justify-center gap-1">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                      <Clock size={12} strokeWidth={2} />
                                    </div>
                                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Ruhe</p>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Session Detail View - Enhanced */}
                      {selectedDayInWeek !== null && (() => {
                        const session = selectedWeek.sessions.find(s => s.dayOfWeek === selectedDayInWeek);
                        if (!session) return null;

                        const config = getSessionTypeConfig(session.type);
                        const totalDistance = calculateSessionDistance(session);
                        const dayNamesFull = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

                        return (
                          <AuthGate featureKey="sessions">
                            <div
                              className="mt-6 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-lg"
                              style={{ animation: 'fadeInUp 0.3s ease-out' }}
                            >
                              {/* Header with close button */}
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-black text-sm shadow-md">
                                      {dayNamesFull[session.dayOfWeek]}
                                    </div>
                                    <span
                                      className={cn(
                                        'inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-black shadow-md',
                                        config.bgColor,
                                        config.textColor
                                      )}
                                    >
                                      {config.label}
                                    </span>
                                    {totalDistance > 0 && (
                                      <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-black shadow-md">
                                        {totalDistance.toFixed(1)} km
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xl font-black text-slate-900">
                                    {session.title || 'Training'}
                                  </h4>
                                </div>
                                <button
                                  onClick={() => setSelectedDayInWeek(null)}
                                  className="ml-2 w-8 h-8 rounded-lg bg-white/50 hover:bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all shadow-sm hover:shadow-md active:scale-95"
                                  aria-label="Schließen"
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              </div>

                              {/* Session details with better visual hierarchy */}
                              <div className="space-y-3">
                                {session.duration && (
                                  <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg">
                                    <Clock size={16} className="text-blue-600 flex-shrink-0" />
                                    <span className="font-bold text-slate-900">Dauer: {session.duration} min</span>
                                  </div>
                                )}

                                {session.intervals && session.intervals.length > 0 && (
                                  <div className="p-4 bg-white/80 rounded-xl space-y-2">
                                    {session.warmUp && (
                                      <div className="flex items-center gap-2 text-orange-600 font-bold">
                                        <span className="text-lg">🔥</span>
                                        <span>Aufwärmen: {session.warmUp}{session.warmUpUnit || 'min'}</span>
                                      </div>
                                    )}
                                    <div className="space-y-2 border-l-4 border-blue-500 pl-3">
                                      {session.intervals.map((interval, iIdx) => (
                                        <div key={iIdx} className="font-bold text-slate-900">
                                          <span className="text-blue-600 text-lg mr-1">⚡</span>
                                          {interval.repetitions}x {interval.distance}km @ {interval.pace}
                                          <span className="block text-sm text-slate-600 font-medium ml-6 mt-0.5">
                                            Pause: {interval.recovery} {interval.recoveryUnit || 'min'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    {session.coolDown && (
                                      <div className="flex items-center gap-2 text-blue-600 font-bold mt-2">
                                        <span className="text-lg">❄️</span>
                                        <span>Auslaufen: {session.coolDown}{session.coolDownUnit || 'min'}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {!session.intervals && (session.warmUp || session.coolDown) && (
                                  <div className="p-3 bg-white/80 rounded-xl space-y-2">
                                    {session.warmUp && (
                                      <div className="flex items-center gap-2 text-orange-600 font-bold">
                                        <span className="text-lg">🔥</span>
                                        <span>Aufwärmen: {session.warmUp} {session.warmUpUnit || 'min'}</span>
                                      </div>
                                    )}
                                    {session.coolDown && (
                                      <div className="flex items-center gap-2 text-blue-600 font-bold">
                                        <span className="text-lg">❄️</span>
                                        <span>Auslaufen: {session.coolDown} {session.coolDownUnit || 'min'}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {session.notes && (
                                  <div className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded-xl">
                                    <div className="flex gap-2">
                                      <span className="text-amber-600 text-lg flex-shrink-0">💡</span>
                                      <p className="text-amber-900 font-medium italic">
                                        {session.notes}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedDayInWeek(null)}
                                className="ml-2 w-8 h-8 rounded-lg bg-white/50 hover:bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all shadow-sm hover:shadow-md active:scale-95"
                                aria-label="Schließen"
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          </AuthGate>
                        );
                      })()}
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-8">
                Kein Trainingsplan verfügbar
              </p>
            )}
          </section>

          {/* Comments Section */}
          <section
            id="comments-section"
            className="bg-white rounded-xl overflow-hidden shadow-lg"
            role="region"
            aria-label="Kommentare"
          >
            {/* Header */}
            <header className="flex items-center gap-2 pl-4 pr-4 py-3 border-b border-slate-100">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-semibold text-slate-900">
                {comments.length === 0
                  ? 'Noch keine Kommentare'
                  : `${comments.length} Kommentar${comments.length !== 1 ? 'e' : ''}`}
              </h2>
            </header>

            {/* Add Comment */}
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              {user ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Schreibe einen Kommentar..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    className="flex-1 text-sm"
                    aria-label="Kommentar schreiben"
                  />
                  <Button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    variant="default"
                    size="sm"
                    title="Senden (Enter)"
                    className="flex-shrink-0"
                  >
                    {submittingComment ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-center text-slate-500 py-1">
                  Melde dich an, um zu kommentieren
                </p>
              )}
            </div>

            {/* Comments List */}
            <div className="divide-y divide-slate-100">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                    <MessageCircle size={24} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500">
                    Noch keine Kommentare. Sei der Erste!
                  </p>
                </div>
              ) : (
                <>
                  {comments.slice(0, visibleComments).map((comment, idx) => (
                    <article
                      key={comment.id}
                      className="p-2.5 hover:bg-slate-50 transition-colors"
                      style={{ animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both` }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                          <User size={12} className="text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {comment.user?.full_name || 'Anonym'}
                            </span>
                            <time className="text-xs text-slate-400 flex-shrink-0 ml-2">
                              {format(new Date(comment.created_at), 'dd.MM.yy', { locale: de })}
                            </time>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {comment.comment}
                          </p>
                        </div>
                        {user?.id === comment.user_id && (
                          <Button
                            onClick={() => handleDeleteComment(comment.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0 p-1"
                            aria-label="Kommentar löschen"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </article>
                  ))}
                  {comments.length > visibleComments && (
                    <button
                      onClick={() => setVisibleComments((v) => v + 10)}
                      className="w-full p-3 text-xs text-blue-600 hover:bg-slate-50 font-medium transition-colors active:scale-95"
                    >
                      Mehr laden ({comments.length - visibleComments} weitere)
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
        </div>

        {/* Clone Modal */}
        {showCloneModal && plan && (
          <ClonePlanModal
            plan={plan}
            onClose={() => setShowCloneModal(false)}
            onSuccess={(newPlanId) => {
              setShowCloneModal(false);
              toast.success('Plan erfolgreich kopiert!');
              if (newPlanId === 'guest') {
                navigate('/editor');
              } else {
                navigate(`/plan/${newPlanId}`);
              }
            }}
          />
        )}
      </div>

      <PublicCTABanner />
    </TooltipProvider>
  );
}
