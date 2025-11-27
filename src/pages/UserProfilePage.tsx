import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService, UserProfile } from '../services/userService';
import { marketplaceService } from '../services/marketplaceService';
import { MarketplacePlan } from '../types/marketplace';
import {
  ArrowLeft,
  User,
  Users,
  Calendar,
  MapPin,
  Eye,
  Copy,
  Star,
  Heart,
  Loader2,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { typography, cn, flex } from '../lib/designSystem';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<MarketplacePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile();
      loadUserPlans();
      checkFollowStatus();
    }
  }, [userId]);

  const loadProfile = async () => {
    if (!userId) return;

    try {
      const data = await userService.getUserProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      toast.error('Fehler beim Laden des Profils');
    }
  };

  const loadUserPlans = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const result = await marketplaceService.browsePlans({
        creator_id: userId,
        page_size: 50,
      });
      setPlans(result.plans);
    } catch (err) {
      console.error('Error loading user plans:', err);
      toast.error('Fehler beim Laden der Pläne');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!userId || !currentUser) return;

    try {
      const following = await userService.isFollowing(userId);
      setIsFollowing(following);
    } catch (err) {
      console.error('Error checking follow status:', err);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      toast.error('Bitte melde dich an, um Usern zu folgen');
      return;
    }

    if (!userId) return;

    // Don't allow following yourself
    if (currentUser.id === userId) {
      toast.error('Du kannst dir selbst nicht folgen');
      return;
    }

    try {
      setFollowLoading(true);
      const nowFollowing = await userService.toggleFollow(userId);
      setIsFollowing(nowFollowing);

      // Update follower count locally
      if (profile) {
        setProfile({
          ...profile,
          follower_count: nowFollowing ? profile.follower_count + 1 : profile.follower_count - 1,
        });
      }

      toast.success(nowFollowing ? 'Du folgst jetzt diesem User' : 'Du folgst diesem User nicht mehr');
    } catch (err) {
      console.error('Error toggling follow:', err);
      toast.error('Fehler beim Folgen');
    } finally {
      setFollowLoading(false);
    }
  };

  const getDistanceLabel = (plan: MarketplacePlan) => {
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

  const getDuration = (plan: MarketplacePlan) => {
    return plan.plan_data?.weeks?.length || 0;
  };

  if (loading && !profile) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        <div className="flex justify-center items-center py-12">
          <div className={flex.row}>
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            <span className={cn(typography.body, 'text-text-tertiary')}>
              Lade Profil...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
        <Card variant="default" className="p-8 text-center">
          <User size={48} className="mx-auto text-text-tertiary mb-4" />
          <h2 className={cn(typography.h2, 'mb-2')}>Profil nicht gefunden</h2>
          <p className={cn(typography.body, 'text-text-tertiary mb-6')}>
            Dieses Profil existiert nicht oder wurde gelöscht.
          </p>
          <Button onClick={() => navigate('/marketplace')} variant="secondary">
            Zum Marktplatz
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
      {/* Back Button */}
      <div className="mb-4">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          size="sm"
        >
          <ArrowLeft size={18} />
          Zurück
        </Button>
      </div>

      {/* Profile Header */}
      <Card variant="default" className="mb-6">
        <div className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User'}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                  <User size={40} className="text-primary-600" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className={cn(typography.h1, 'mb-2')}>
                    {profile.full_name || 'Anonym'}
                  </h1>
                  {profile.bio && (
                    <p className={cn(typography.body, 'text-text-secondary')}>
                      {profile.bio}
                    </p>
                  )}
                </div>

                {/* Follow Button */}
                {currentUser && currentUser.id !== userId && (
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    variant={isFollowing ? 'secondary' : 'default'}
                  >
                    {isFollowing ? <UserMinus size={18} /> : <UserPlus size={18} />}
                    {isFollowing ? 'Entfolgen' : 'Folgen'}
                  </Button>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-text-secondary">
                <div className={flex.rowTight}>
                  <Users size={18} />
                  <span className={typography.body}>
                    <strong className="text-text-primary">{profile.follower_count}</strong> Follower
                  </span>
                </div>
                <div className={flex.rowTight}>
                  <Users size={18} />
                  <span className={typography.body}>
                    <strong className="text-text-primary">{profile.following_count}</strong> Folgt
                  </span>
                </div>
                <div className={flex.rowTight}>
                  <Copy size={18} />
                  <span className={typography.body}>
                    <strong className="text-text-primary">{plans.length}</strong> Trainingspläne
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Training Plans */}
      <div>
        <h2 className={cn(typography.h2, 'mb-4')}>Trainingspläne</h2>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className={flex.row}>
              <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
              <span className={cn(typography.body, 'text-text-tertiary')}>
                Lade Trainingspläne...
              </span>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <Card variant="default" className="p-8 text-center">
            <Copy size={48} className="mx-auto text-text-tertiary mb-4" />
            <h3 className={cn(typography.h3, 'mb-2')}>
              Keine Trainingspläne veröffentlicht
            </h3>
            <p className={cn(typography.body, 'text-text-tertiary')}>
              Dieser User hat noch keine Trainingspläne veröffentlicht.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                variant="default"
                className="cursor-pointer hover:shadow-lg transition-shadow h-[380px] flex flex-col"
                onClick={() => navigate(`/marketplace/${plan.id}`)}
              >
                {/* Plan Header */}
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <h3 className={cn(typography.h3, 'mb-2')}>{plan.name}</h3>
                  {plan.description && (
                    <p className={cn(typography.bodySmall, 'text-text-tertiary line-clamp-2')}>
                      {plan.description}
                    </p>
                  )}
                </div>

                {/* Plan Details */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <MapPin size={16} />
                    <span>{getDistanceLabel(plan)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Calendar size={16} />
                    <span>{getDuration(plan)} Wochen</span>
                  </div>

                  {/* Tags */}
                  {plan.tags && plan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plan.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {plan.tags.length > 3 && (
                        <Badge className="bg-gray-100 text-gray-600 text-xs">
                          +{plan.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats Footer */}
                <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-text-tertiary flex-shrink-0">
                  <div className={flex.rowTight}>
                    <Heart size={16} />
                    <span>{plan.stats?.likes_count || 0}</span>
                  </div>
                  <div className={flex.rowTight}>
                    <Star size={16} className="text-yellow-500" />
                    <span>
                      {plan.stats?.rating_avg ? plan.stats.rating_avg.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className={flex.rowTight}>
                    <Copy size={16} />
                    <span>{plan.clone_count}</span>
                  </div>
                  <div className={flex.rowTight}>
                    <Eye size={16} />
                    <span>{plan.view_count}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
