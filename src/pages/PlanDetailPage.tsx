import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Calendar,
  MapPin,
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
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/ui';
import { cn, getSessionTypeConfig } from '../lib/designSystem';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { useToast } from '../contexts/ToastContext';
import ClonePlanModal from '../components/ClonePlanModal';
import WeeklyChart from '../components/WeeklyChart';
import { PlanDifficultyBadge } from '../components/PlanDifficultyBadge';
import { calculateSessionDistance } from '../utils/calculationUtils';

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { runnerProfile } = useRunnerProfile();
  const toast = useToast();

  const [plan, setPlan] = useState<MarketplacePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<PlanComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [showCloneModal, setShowCloneModal] = useState(false);
  // Mobile: start collapsed, Desktop: first week expanded
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return new Set<number>();
    }
    return new Set([0]);
  });
  const [showChart, setShowChart] = useState(true);
  const [showPlanDetails, setShowPlanDetails] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

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
      toast.error('Bitte melde dich an, um Pläne zu liken');
      return;
    }

    if (!planId || !plan) return;

    try {
      const isLiked = await marketplaceService.toggleLike(planId);

      // Update local state
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
      toast.error('Bitte melde dich an, um zu bewerten');
      return;
    }

    if (!planId || !plan) return;

    try {
      if (rating === selectedRating) {
        // Remove rating
        await marketplaceService.deleteRating(planId);
        setSelectedRating(0);
        toast.success('Bewertung entfernt');
      } else {
        // Set rating
        await marketplaceService.ratePlan(planId, rating);
        setSelectedRating(rating);
        toast.success(`${rating} Sterne vergeben`);
      }

      // Reload plan to get updated stats
      await loadPlan();
    } catch (err) {
      console.error('Error rating plan:', err);
      toast.error('Fehler beim Bewerten');
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error('Bitte melde dich an, um zu kommentieren');
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
      toast.error('Bitte melde dich an, um Usern zu folgen');
      return;
    }

    if (!plan?.creator?.id) return;

    // Don't allow following yourself
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

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Error copying link:', err);
      toast.error('Fehler beim Kopieren des Links');
    }
  };

  const getDistanceLabel = () => {
    if (!plan) return '';
    const distance = plan.plan_data?.event?.distance;
    if (typeof distance === 'number') {
      if (distance === 5) return '5K';
      if (distance === 10) return '10K';
      if (distance === 21.0975) return 'Halbmarathon';
      if (distance === 42.195) return 'Marathon';
      return `${distance} km`;
    }
    return distance || 'N/A';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Sticky Header with Navigation and Actions - Stacks below PageHeader (72px) */}
      <div className="sticky top-[72px] z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="py-3 flex items-center justify-between gap-3">
            {/* Back Button */}
            <Button
              onClick={() => navigate('/marketplace')}
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline ml-1">Zurück</span>
            </Button>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleShareLink}
                variant="secondary"
                size="sm"
                title="Link kopieren"
                className="flex-shrink-0"
              >
                {linkCopied ? <Check size={16} /> : <Share2 size={16} />}
                <span className="hidden sm:inline ml-1">{linkCopied ? 'Kopiert!' : 'Teilen'}</span>
              </Button>
              <Button
                onClick={() => setShowCloneModal(true)}
                variant="default"
                size="sm"
                className="flex-shrink-0"
              >
                <Copy size={16} />
                <span className="hidden sm:inline ml-1">Kopieren</span>
                <span className="hidden lg:inline">&nbsp;& anpassen</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-5xl">

      {/* Plan Header */}
      <Card variant="default" className="mb-6 shadow-lg shadow-slate-900/5">
        <div className="p-4 sm:p-6">
          {/* Title - Now without action buttons (moved to sticky header) */}
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 leading-tight">
              {plan.name}
            </h1>
          </div>

          {/* Stats and Rating Row - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            {/* Stats - Horizontal scroll on mobile */}
            <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide pb-1 sm:pb-0 sm:overflow-visible">
              <div className="flex items-center gap-2 flex-shrink-0 text-slate-500">
                <Eye size={18} />
                <span className="text-sm font-medium">{plan.view_count}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 text-slate-500">
                <Copy size={18} />
                <span className="text-sm font-medium">{plan.clone_count}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 text-slate-500">
                <Heart
                  size={18}
                  className={plan.user_interaction?.has_liked ? 'fill-red-500 text-red-500' : ''}
                />
                <span className="text-sm font-medium">{plan.stats?.likes_count || 0}</span>
              </div>
            </div>

            {/* Divider - Hidden on mobile */}
            <div className="hidden sm:block h-6 w-px bg-gray-200" />

            {/* Rating Stars - Touch-optimized */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className="p-1.5 sm:p-1 transition-transform hover:scale-110 active:scale-95 touch-manipulation"
                  title={`${rating} Sterne vergeben`}
                >
                  <Star
                    size={22}
                    className={
                      rating <= selectedRating
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                    }
                  />
                </button>
              ))}
              <span className="ml-2 text-xs sm:text-sm text-slate-500">
                {plan.stats?.rating_avg
                  ? `${plan.stats.rating_avg.toFixed(1)} (${plan.stats.rating_count})`
                  : 'Noch keine'}
              </span>
            </div>
          </div>

          {/* Plan Details Grid - Responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {/* Distance */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">Distanz</div>
                <div className="text-sm font-semibold text-slate-900 truncate">{getDistanceLabel()}</div>
              </div>
            </div>

            {/* Duration */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-green-600" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">Dauer</div>
                <div className="text-sm font-semibold text-slate-900">{plan.plan_data?.weeks?.length || 0} Wochen</div>
              </div>
            </div>

            {/* Target Time */}
            {plan.plan_data?.event?.targetTime && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-purple-600" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">Zielzeit</div>
                  <div className="text-sm font-semibold text-slate-900">{plan.plan_data.event.targetTime} min</div>
                </div>
              </div>
            )}

            {/* Creator */}
            {plan.creator && plan.visibility === 'public' && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-500">Ersteller</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/profile/${plan.creator!.id}`)}
                      className="text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors truncate"
                    >
                      {plan.creator.full_name || 'Anonym'}
                    </button>
                    {user && user.id !== plan.creator.id && (
                      <Button
                        onClick={handleFollow}
                        disabled={followLoading}
                        variant={isFollowing ? 'secondary' : 'default'}
                        size="sm"
                        className="h-7 text-xs"
                      >
                        {isFollowing ? <UserMinus size={12} /> : <UserPlus size={12} />}
                        <span className="hidden sm:inline ml-1">{isFollowing ? 'Entfolgen' : 'Folgen'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {plan.description && (
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Beschreibung</h3>
              <p className="text-sm sm:text-base text-slate-600 whitespace-pre-wrap leading-relaxed">
                {plan.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {plan.tags && plan.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {plan.tags.map((tag, idx) => (
                  <Badge key={idx} className="text-xs sm:text-sm">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Like and Comment Actions - Touch-optimized */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              onClick={handleLike}
              variant={plan.user_interaction?.has_liked ? 'default' : 'ghost'}
              size="sm"
              title={plan.user_interaction?.has_liked ? 'Like entfernen' : 'Liken'}
              className="min-w-[44px] min-h-[44px] touch-manipulation"
            >
              <Heart
                size={18}
                className={plan.user_interaction?.has_liked ? 'fill-current' : ''}
              />
              <span className="ml-1 text-sm">{plan.user_interaction?.has_liked ? 'Liked' : 'Like'}</span>
            </Button>
            <Button
              onClick={() => {
                const commentsSection = document.getElementById('comments-section');
                commentsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="ghost"
              size="sm"
              title="Zu den Kommentaren"
              className="min-w-[44px] min-h-[44px] touch-manipulation"
            >
              <MessageCircle size={18} />
              <span className="ml-1 text-sm">{comments.length}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Weekly Chart Section */}
      {plan.plan_data?.weeks && plan.plan_data.weeks.length > 0 && (
        <Card variant="default" className="mb-6 shadow-lg shadow-slate-900/5 overflow-hidden">
          <button
            onClick={() => setShowChart(!showChart)}
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors group touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Wöchentlicher Überblick
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Distanz und Intensität pro Woche
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="hidden sm:inline-flex">{plan.plan_data.weeks.length} Wochen</Badge>
              {showChart ? (
                <ChevronUp size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              ) : (
                <ChevronDown size={20} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              )}
            </div>
          </button>
          {showChart && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100 space-y-4"
                 style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              {/* Plan Difficulty Badge */}
              {runnerProfile && (
                <div className="pt-4">
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
        </Card>
      )}

      {/* Training Plan Content */}
      <Card variant="default" className="mb-6 shadow-lg shadow-slate-900/5 overflow-hidden">
        <button
          onClick={() => setShowPlanDetails(!showPlanDetails)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 transition-colors group touch-manipulation"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <ListChecks size={20} className="text-green-600" />
            </div>
            <div className="text-left">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 group-hover:text-green-600 transition-colors">
                Trainingsplan
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Alle Trainingseinheiten im Detail
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="hidden sm:inline-flex">{plan.plan_data?.weeks?.reduce((sum, w) => sum + w.sessions.length, 0) || 0} Einheiten</Badge>
            {showPlanDetails ? (
              <ChevronUp size={20} className="text-slate-400 group-hover:text-green-600 transition-colors" />
            ) : (
              <ChevronDown size={20} className="text-slate-400 group-hover:text-green-600 transition-colors" />
            )}
          </div>
        </button>
        {showPlanDetails && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-gray-100"
               style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            {plan.plan_data?.weeks && plan.plan_data.weeks.length > 0 ? (
            <div className="space-y-3 pt-4">
              {plan.plan_data.weeks.map((week, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  {/* Week Header - Touch-optimized */}
                  <button
                    onClick={() => toggleWeek(week.weekNumber)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-slate-50 to-white hover:from-slate-100 hover:to-slate-50 transition-colors touch-manipulation"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-left">
                      <span className="text-sm sm:text-base font-bold text-slate-900">Woche {week.weekNumber}</span>
                      <span className="text-xs text-slate-500">
                        {week.startDate} - {week.endDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs bg-blue-100 text-blue-700">{week.totalKm.toFixed(1)} km</Badge>
                      <Badge className="text-xs hidden sm:inline-flex">{week.sessions.length} Einheiten</Badge>
                      {expandedWeeks.has(week.weekNumber) ? (
                        <ChevronUp size={18} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Week Sessions - Mobile optimized */}
                  {expandedWeeks.has(week.weekNumber) && (
                    <div className="p-3 sm:p-4 space-y-3 bg-slate-50/50 border-t border-gray-100">
                      {week.sessions.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-4">
                          Keine Trainingseinheiten
                        </p>
                      ) : (
                        week.sessions.map((session, sessionIdx) => {
                          const config = getSessionTypeConfig(session.type);
                          // Calculate total distance including intervals, warm-up, cool-down
                          const totalDistance = calculateSessionDistance(session);
                          return (
                            <div
                              key={session.id}
                              className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 touch-manipulation"
                              style={{ animation: `fadeInUp 0.3s ease-out ${sessionIdx * 0.05}s both` }}
                            >
                              {/* Session Header */}
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold">
                                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][session.dayOfWeek]}
                                  </span>
                                  <span className={cn(
                                    "inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium",
                                    config.bgColor, config.textColor
                                  )}>
                                    {config.label}
                                  </span>
                                </div>
                                {totalDistance > 0 && (
                                  <span className="text-sm sm:text-base font-bold text-slate-900 whitespace-nowrap">
                                    {totalDistance.toFixed(1)} km
                                  </span>
                                )}
                              </div>

                              {/* Session Title */}
                              <h4 className="text-sm sm:text-base font-semibold text-slate-900 mb-2">
                                {session.title || 'Training'}
                              </h4>

                              {/* Session Details */}
                              <div className="space-y-1.5 text-xs sm:text-sm text-slate-600">
                                {session.duration && (
                                  <p className="flex items-center gap-2">
                                    <Clock size={14} className="text-slate-400 flex-shrink-0" />
                                    <span>Dauer: {session.duration} min</span>
                                  </p>
                                )}

                                {/* Intervals */}
                                {session.intervals && session.intervals.length > 0 && (
                                  <div className="mt-2 p-2 sm:p-3 bg-slate-50 rounded-lg space-y-1.5">
                                    {session.warmUp && (
                                      <p className="text-slate-600">
                                        🔥 Aufwärmen: {session.warmUp} {session.warmUpUnit || 'min'}
                                      </p>
                                    )}
                                    {session.intervals.map((interval, iIdx) => (
                                      <p key={iIdx} className="text-slate-700 font-medium">
                                        ⚡ {interval.repetitions}x {interval.distance}km @ {interval.pace}
                                        <span className="text-slate-500 font-normal"> (Pause: {interval.recovery} {interval.recoveryUnit || 'min'})</span>
                                      </p>
                                    ))}
                                    {session.coolDown && (
                                      <p className="text-slate-600">
                                        ❄️ Auslaufen: {session.coolDown} {session.coolDownUnit || 'min'}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Warm-up/Cool-down without intervals */}
                                {!session.intervals && (session.warmUp || session.coolDown) && (
                                  <div className="mt-2 p-2 sm:p-3 bg-slate-50 rounded-lg space-y-1">
                                    {session.warmUp && (
                                      <p className="text-slate-600">
                                        🔥 Aufwärmen: {session.warmUp} {session.warmUpUnit || 'min'}
                                      </p>
                                    )}
                                    {session.coolDown && (
                                      <p className="text-slate-600">
                                        ❄️ Auslaufen: {session.coolDown} {session.coolDownUnit || 'min'}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Notes */}
                                {session.notes && (
                                  <p className="mt-2 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 italic">
                                    💡 {session.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">
              Kein Trainingsplan verfügbar
            </p>
          )}
          </div>
        )}
      </Card>

      {/* Comments Section */}
      <div id="comments-section">
        <Card variant="default" className="shadow-lg shadow-slate-900/5 overflow-hidden">
          {/* Comments Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                  Kommentare
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  {comments.length === 0 ? 'Noch keine Kommentare' : `${comments.length} Kommentar${comments.length !== 1 ? 'e' : ''}`}
                </p>
              </div>
            </div>
          </div>

          {/* Add Comment - Touch-optimized */}
          <div className="p-4 sm:p-5 bg-slate-50/50">
            {user ? (
              <div className="flex gap-2 sm:gap-3 items-stretch">
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
                  className="flex-1 min-w-0 text-sm sm:text-base"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submittingComment}
                  variant="default"
                  title="Senden (Enter)"
                  className="flex-shrink-0 min-w-[44px] min-h-[44px] touch-manipulation"
                >
                  {submittingComment ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </div>
            ) : (
              <div className="p-4 bg-white border border-gray-200 rounded-xl text-center">
                <p className="text-sm text-slate-600">
                  Melde dich an, um zu kommentieren
                </p>
              </div>
            )}
          </div>

          {/* Comments List */}
          <div className="p-4 sm:p-5">
            <div className="space-y-4">
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
                comments.map((comment, idx) => (
                  <div
                    key={comment.id}
                    className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4 shadow-sm"
                    style={{ animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both` }}
                  >
                    {/* Comment Header */}
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-slate-900 block truncate">
                            {comment.user?.full_name || 'Anonym'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm', {
                              locale: de,
                            })}
                          </span>
                        </div>
                      </div>
                      {user?.id === comment.user_id && (
                        <Button
                          onClick={() => handleDeleteComment(comment.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0 touch-manipulation"
                        >
                          <Trash2 size={14} />
                          <span className="hidden sm:inline ml-1">Löschen</span>
                        </Button>
                      )}
                    </div>
                    {/* Comment Content */}
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed pl-10">
                      {comment.comment}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Clone Modal */}
      {showCloneModal && plan && (
        <ClonePlanModal
          plan={plan}
          onClose={() => setShowCloneModal(false)}
          onSuccess={(newPlanId) => {
            setShowCloneModal(false);
            toast.success('Plan erfolgreich kopiert!');
            navigate(`/plan/${newPlanId}`);
          }}
        />
      )}
      </div>{/* End Main Content Container */}
    </div>
  );
}
