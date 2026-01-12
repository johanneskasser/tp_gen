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
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/ui';
import { typography, cn, flex } from '../lib/designSystem';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { useToast } from '../contexts/ToastContext';
import ClonePlanModal from '../components/ClonePlanModal';
import WeeklyChart from '../components/WeeklyChart';
import { PlanDifficultyBadge } from '../components/PlanDifficultyBadge';

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
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0]));
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
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
        <div className="flex justify-center items-center py-12">
          <div className={flex.row}>
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            <span className={cn(typography.body, 'text-text-tertiary')}>
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
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-5xl">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          onClick={() => navigate('/marketplace')}
          variant="ghost"
        >
          <ArrowLeft size={18} />
          Zurück
        </Button>
      </div>

      {/* Plan Header */}
      <Card variant="default" className="mb-6">
        <div className="p-6">
          {/* Title and Action Buttons */}
          <div className="flex items-start justify-between mb-4 gap-4">
            <h1 className={cn(typography.h1, 'flex-1')}>{plan.name}</h1>
            <div className="flex gap-2">
              <Button
                onClick={handleShareLink}
                variant="secondary"
                size="lg"
                title="Link kopieren"
              >
                {linkCopied ? <Check size={18} /> : <Share2 size={18} />}
                {linkCopied ? 'Kopiert!' : 'Teilen'}
              </Button>
              <Button
                onClick={() => setShowCloneModal(true)}
                variant="default"
                size="lg"
              >
                <Copy size={18} />
                Plan kopieren & anpassen
              </Button>
            </div>
          </div>

          {/* Stats and Rating Row */}
          <div className="flex flex-wrap gap-4 mb-6 items-center">
            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-text-tertiary">
              <div className={flex.row}>
                <Eye size={20} />
                <span>{plan.view_count}</span>
              </div>
              <div className={flex.row}>
                <Copy size={20} />
                <span>{plan.clone_count}</span>
              </div>
              <div className={flex.row}>
                <Heart
                  size={20}
                  className={plan.user_interaction?.has_liked ? 'fill-red-500 text-red-500' : ''}
                />
                <span>{plan.stats?.likes_count || 0}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300" />

            {/* Rating Stars */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRating(rating)}
                  className="transition-transform hover:scale-110"
                  title={`${rating} Sterne vergeben`}
                >
                  <Star
                    size={24}
                    className={
                      rating <= selectedRating
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-gray-300 hover:text-yellow-400'
                    }
                  />
                </button>
              ))}
              <span className={cn(typography.bodySmall, 'ml-2 text-text-tertiary')}>
                {plan.stats?.rating_avg
                  ? `${plan.stats.rating_avg.toFixed(1)} (${plan.stats.rating_count})`
                  : 'Noch keine Bewertungen'}
              </span>
            </div>
          </div>

          {/* Plan Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={flex.row}>
              <MapPin size={20} className="text-primary-600" />
              <div>
                <div className={cn(typography.bodySmall, 'text-text-tertiary')}>Distanz</div>
                <div className={typography.body}>{getDistanceLabel()}</div>
              </div>
            </div>
            <div className={flex.row}>
              <Calendar size={20} className="text-primary-600" />
              <div>
                <div className={cn(typography.bodySmall, 'text-text-tertiary')}>Dauer</div>
                <div className={typography.body}>
                  {plan.plan_data?.weeks?.length || 0} Wochen
                </div>
              </div>
            </div>
            {plan.plan_data?.event?.targetTime && (
              <div className={flex.row}>
                <Clock size={20} className="text-primary-600" />
                <div>
                  <div className={cn(typography.bodySmall, 'text-text-tertiary')}>Zielzeit</div>
                  <div className={typography.body}>
                    {plan.plan_data.event.targetTime} min
                  </div>
                </div>
              </div>
            )}
            {plan.creator && plan.visibility === 'public' && (
              <div className={flex.row}>
                <User size={20} className="text-primary-600" />
                <div className="flex-1">
                  <div className={cn(typography.bodySmall, 'text-text-tertiary')}>Ersteller</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/profile/${plan.creator!.id}`)}
                      className={cn(typography.body, 'hover:text-primary-700 hover:underline transition-colors')}
                    >
                      {plan.creator.full_name || 'Anonym'}
                    </button>
                    {user && user.id !== plan.creator.id && (
                      <Button
                        onClick={handleFollow}
                        disabled={followLoading}
                        variant={isFollowing ? 'secondary' : 'default'}
                      >
                        {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                        {isFollowing ? 'Entfolgen' : 'Folgen'}
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
              <h3 className={cn(typography.h3, 'mb-2')}>Beschreibung</h3>
              <p className={cn(typography.body, 'text-text-secondary whitespace-pre-wrap')}>
                {plan.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {plan.tags && plan.tags.length > 0 && (
            <div className="mb-6">
              <h3 className={cn(typography.h3, 'mb-2')}>Tags</h3>
              <div className="flex flex-wrap gap-2">
                {plan.tags.map((tag, idx) => (
                  <Badge key={idx}>{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Like and Comment Actions - Bottom Right */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={handleLike}
              variant={plan.user_interaction?.has_liked ? 'default' : 'ghost'}
              title={plan.user_interaction?.has_liked ? 'Like entfernen' : 'Liken'}
            >
              <Heart
                size={20}
                className={plan.user_interaction?.has_liked ? 'fill-current' : ''}
              />
            </Button>
            <Button
              onClick={() => {
                const commentsSection = document.getElementById('comments-section');
                commentsSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              variant="ghost"
              title="Zu den Kommentaren"
            >
              <MessageCircle size={20} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Weekly Chart */}
      {plan.plan_data?.weeks && plan.plan_data.weeks.length > 0 && (
        <div className="mb-6 border-b border-border-light">
          <button
            onClick={() => setShowChart(!showChart)}
            className="w-full flex items-center justify-between py-4 px-2 hover:bg-background-secondary transition-colors group"
          >
            <h2 className={cn(typography.h2, 'group-hover:text-primary-700 transition-colors')}>
              Wöchentlicher Überblick
            </h2>
            {showChart ? (
              <ChevronUp size={24} className="text-text-tertiary group-hover:text-primary-700 transition-colors" />
            ) : (
              <ChevronDown size={24} className="text-text-tertiary group-hover:text-primary-700 transition-colors" />
            )}
          </button>
          {showChart && (
            <div className="pb-6 px-2 animate-fade-in space-y-4">
              {/* Plan Difficulty Badge */}
              {runnerProfile && (
                <PlanDifficultyBadge
                  plan={plan.plan_data}
                  userProfile={runnerProfile}
                  showDetails={true}
                />
              )}

              <WeeklyChart weeks={plan.plan_data.weeks} userProfile={runnerProfile || undefined} />
            </div>
          )}
        </div>
      )}

      {/* Training Plan Content */}
      <div className="mb-6 border-b border-border-light">
        <button
          onClick={() => setShowPlanDetails(!showPlanDetails)}
          className="w-full flex items-center justify-between py-4 px-2 hover:bg-background-secondary transition-colors group"
        >
          <h2 className={cn(typography.h2, 'group-hover:text-primary-700 transition-colors')}>
            Trainingsplan
          </h2>
          {showPlanDetails ? (
            <ChevronUp size={24} className="text-text-tertiary group-hover:text-primary-700 transition-colors" />
          ) : (
            <ChevronDown size={24} className="text-text-tertiary group-hover:text-primary-700 transition-colors" />
          )}
        </button>
        {showPlanDetails && (
          <div className="pb-6 px-2 animate-fade-in">
            {plan.plan_data?.weeks && plan.plan_data.weeks.length > 0 ? (
            <div className="space-y-3">
              {plan.plan_data.weeks.map((week, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Week Header */}
                  <button
                    onClick={() => toggleWeek(week.weekNumber)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={cn(typography.h3)}>Woche {week.weekNumber}</span>
                      <span className={cn(typography.bodySmall, 'text-text-tertiary')}>
                        {week.startDate} - {week.endDate}
                      </span>
                      <Badge>{week.totalKm.toFixed(1)} km</Badge>
                      <Badge>{week.sessions.length} Einheiten</Badge>
                    </div>
                    {expandedWeeks.has(week.weekNumber) ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>

                  {/* Week Sessions */}
                  {expandedWeeks.has(week.weekNumber) && (
                    <div className="p-4 space-y-3">
                      {week.sessions.length === 0 ? (
                        <p className={cn(typography.body, 'text-text-tertiary text-center py-4')}>
                          Keine Trainingseinheiten
                        </p>
                      ) : (
                        week.sessions.map((session) => (
                          <div
                            key={session.id}
                            className="border border-gray-200 rounded p-3 hover:border-primary-300 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge>{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][session.dayOfWeek]}</Badge>
                                  <Badge className={`bg-${session.type === 'easy' ? 'green' : session.type === 'long' ? 'blue' : session.type === 'intervals' ? 'orange' : session.type === 'tempo' ? 'red' : session.type === 'recovery' ? 'gray' : 'purple'}-100`}>
                                    {session.type === 'easy' ? 'Locker' : session.type === 'long' ? 'Langer Lauf' : session.type === 'intervals' ? 'Intervalle' : session.type === 'tempo' ? 'Tempo' : session.type === 'recovery' ? 'Regeneration' : 'Wettkampf'}
                                  </Badge>
                                </div>
                                <h4 className={cn(typography.h4, 'mb-1')}>{session.title || 'Training'}</h4>
                                {session.distance && session.distance > 0 && (
                                  <p className={cn(typography.bodySmall, 'text-text-tertiary')}>
                                    Distanz: {session.distance} km
                                  </p>
                                )}
                                {session.duration && (
                                  <p className={cn(typography.bodySmall, 'text-text-tertiary')}>
                                    Dauer: {session.duration} min
                                  </p>
                                )}
                                {session.intervals && session.intervals.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {session.warmUp && (
                                      <p className={cn(typography.bodySmall, 'text-text-secondary')}>
                                        Aufwärmen: {session.warmUp} {session.warmUpUnit || 'min'}
                                      </p>
                                    )}
                                    {session.intervals.map((interval, iIdx) => (
                                      <p key={iIdx} className={cn(typography.bodySmall, 'text-text-secondary')}>
                                        • {interval.repetitions}x {interval.distance}km @ {interval.pace} (Pause: {interval.recovery} {interval.recoveryUnit || 'min'})
                                      </p>
                                    ))}
                                    {session.coolDown && (
                                      <p className={cn(typography.bodySmall, 'text-text-secondary')}>
                                        Auslaufen: {session.coolDown} {session.coolDownUnit || 'min'}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {!session.intervals && (session.warmUp || session.coolDown) && (
                                  <div className="mt-2 space-y-1">
                                    {session.warmUp && (
                                      <p className={cn(typography.bodySmall, 'text-text-secondary')}>
                                        Aufwärmen: {session.warmUp} {session.warmUpUnit || 'min'}
                                      </p>
                                    )}
                                    {session.coolDown && (
                                      <p className={cn(typography.bodySmall, 'text-text-secondary')}>
                                        Auslaufen: {session.coolDown} {session.coolDownUnit || 'min'}
                                      </p>
                                    )}
                                  </div>
                                )}
                                {session.notes && (
                                  <p className={cn(typography.bodySmall, 'text-text-secondary mt-2 italic')}>
                                    {session.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className={cn(typography.body, 'text-text-tertiary text-center py-8')}>
              Kein Trainingsplan verfügbar
            </p>
          )}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div id="comments-section"><Card variant="default">
        <div className="p-6 pb-4">
          <h2 className={cn(typography.h2, 'mb-4')}>
            Kommentare ({comments.length})
          </h2>
        </div>

        {/* Add Comment - Full Width */}
        <div className="pb-4">
          {user ? (
            <div className="flex gap-2 items-stretch">
              <Input
                type="text"
                placeholder="Schreibe einen Kommentar..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                  if (e.key === 'Enter' && !e.ctrlKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
                className="flex-1 min-w-0"
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || submittingComment}
                variant="default"
                title="Senden (Enter)"
                className="flex-shrink-0"
              >
                {submittingComment ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </Button>
            </div>
          ) : (
            <div className="mx-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className={cn(typography.body, 'text-text-tertiary')}>
                Melde dich an, um zu kommentieren
              </p>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="px-6 pb-6">
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className={cn(typography.body, 'text-text-tertiary text-center py-8')}>
                Noch keine Kommentare. Sei der Erste!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className={flex.row}>
                      <User size={16} className="text-text-tertiary" />
                      <span className={cn(typography.bodySmall, 'font-semibold')}>
                        {comment.user?.full_name || 'Anonym'}
                      </span>
                      <span className={cn(typography.bodySmall, 'text-text-tertiary')}>
                        {format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm', {
                          locale: de,
                        })}
                      </span>
                    </div>
                    {user?.id === comment.user_id && (
                      <Button
                        onClick={() => handleDeleteComment(comment.id)}
                        variant="ghost"
                      >
                        <Trash2 size={14} />
                        Löschen
                      </Button>
                    )}
                  </div>
                  <p className={cn(typography.body, 'text-text-secondary ml-7')}>
                    {comment.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </Card></div>

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
    </div>
  );
}
