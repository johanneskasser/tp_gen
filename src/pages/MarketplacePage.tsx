import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketplaceService } from '../services/marketplaceService';
import {
  MarketplacePlan,
  MarketplaceFilters,
  PREDEFINED_TAGS,
} from '../types/marketplace';
import {
  Search,
  Filter,
  TrendingUp,
  Clock,
  Star,
  Copy,
  Eye,
  Heart,
  Loader2,
  Calendar,
  MapPin,
  User,
  Users,
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/ui';
import { typography, cn, flex } from '../lib/designSystem';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function MarketplacePage() {
  const [plans, setPlans] = useState<MarketplacePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    page: 1,
    page_size: 12,
    sort_by: 'recent',
  });
  const [searchInput, setSearchInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const dateLocale = i18n.language === 'de' ? de : enUS;

  useEffect(() => {
    loadPlans();
  }, [filters]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const result = await marketplaceService.browsePlans(filters);
      setPlans(result.plans);
      setTotal(result.total);
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters({
      ...filters,
      search: searchInput || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      from_following: showFollowingOnly || undefined,
      page: 1,
    });
  };

  const handleSortChange = (sort_by: MarketplaceFilters['sort_by']) => {
    setFilters({ ...filters, sort_by, from_following: showFollowingOnly || undefined, page: 1 });
  };

  const toggleFollowing = () => {
    const newValue = !showFollowingOnly;
    setShowFollowingOnly(newValue);
    setFilters({
      ...filters,
      from_following: newValue || undefined,
      page: 1
    });
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setSelectedTags([]);
    setShowFollowingOnly(false);
    setFilters({
      page: 1,
      page_size: 12,
      sort_by: 'recent',
    });
  };

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

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-background-primary border-b border-border-light backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-3 sm:px-4 max-w-7xl">
          {/* Search Bar */}
          <div className="py-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder={t('marketplace.searchPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  leftIcon={<Search size={18} />}
                  className="w-full"
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters || selectedTags.length > 0 ? 'primary' : 'secondary'}
                className="relative"
              >
                <Filter size={18} />
                {selectedTags.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedTags.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Tabs for Sorting and Filtering */}
          <div className="flex items-center gap-4 overflow-x-auto -mx-3 sm:mx-0">
            {/* Sorting Tabs */}
            <div className="flex gap-1 px-3 sm:px-0 min-w-max">
              {[
                { value: 'recent', labelKey: 'marketplace.sortBy.recent', icon: Clock },
                { value: 'popular', labelKey: 'marketplace.sortBy.popular', icon: TrendingUp },
                { value: 'rating', labelKey: 'marketplace.sortBy.rating', icon: Star },
                { value: 'clones', labelKey: 'marketplace.sortBy.clones', icon: Copy },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative',
                    'hover:text-text-primary',
                    filters.sort_by === option.value
                      ? 'text-text-primary'
                      : 'text-text-tertiary'
                  )}
                >
                  <option.icon size={16} />
                  <span className="whitespace-nowrap">{t(option.labelKey)}</span>
                  {filters.sort_by === option.value && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-700 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Following Filter - Only show if authenticated */}
            {user && (
              <>
                <div className="h-8 w-px bg-border-light" />
                <button
                  onClick={toggleFollowing}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                    showFollowingOnly
                      ? 'bg-primary-700 text-white shadow-sm'
                      : 'bg-background-secondary text-text-secondary hover:bg-primary-100 border border-border-light'
                  )}
                >
                  <Users size={16} />
                  <span>{t('marketplace.filters.fromFollowing')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="border-b border-border-light bg-background-secondary">
          <div className="container mx-auto px-3 sm:px-4 py-4 max-w-7xl">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                      selectedTags.includes(tag)
                        ? 'bg-primary-700 text-white shadow-sm'
                        : 'bg-white text-text-secondary hover:bg-primary-50 border border-border-light'
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} variant="primary" size="sm">
                  {t('marketplace.filters.apply')}
                </Button>
                <Button onClick={clearFilters} variant="secondary" size="sm">
                  {t('marketplace.filters.reset')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-6 max-w-7xl">

      {/* Results */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className={flex.row}>
            <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
            <span className={cn(typography.body, 'text-text-tertiary')}>
              {t('marketplace.loadingPlans')}
            </span>
          </div>
        </div>
      ) : plans.length === 0 ? (
        <Card variant="default" className="p-8 text-center max-w-md mx-auto">
          <Search size={48} className="mx-auto text-text-tertiary mb-4" />
          <h3 className={cn(typography.h3, 'mb-2')}>
            {t('marketplace.noResults')}
          </h3>
          <p className={cn(typography.body, 'text-text-tertiary mb-4')}>
            {t('marketplace.noResultsDescription')}
          </p>
          <Button onClick={clearFilters} variant="secondary">
            {t('marketplace.filters.resetFilters')}
          </Button>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <div className="mb-4">
            <p className={cn(typography.small, 'text-text-tertiary')}>
              {t('marketplace.resultsCount', { count: total })}
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                variant="default"
                className="cursor-pointer hover:shadow-lg transition-shadow h-[420px] flex flex-col"
                onClick={() => navigate(`/marketplace/${plan.id}`)}
              >
                {/* Plan Header - Sticky Top */}
                <div className="p-4 border-b border-gray-200 sticky top-0 z-10 flex-shrink-0">
                  <h3 className={cn(typography.h3, 'mb-2')}>{plan.name}</h3>
                  {plan.description && (
                    <p className={cn(typography.small, 'text-text-tertiary line-clamp-2')}>
                      {plan.description}
                    </p>
                  )}
                </div>

                {/* Plan Details - Scrollable Middle */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <MapPin size={16} />
                    <span>{getDistanceLabel(plan)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Calendar size={16} />
                    <span>{t('marketplace.weeks', { count: getDuration(plan) })}</span>
                  </div>

                  {/* Target Time */}
                  {plan.plan_data?.event?.targetTime && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Clock size={16} />
                      <span>{t('marketplace.targetTime', { time: plan.plan_data.event.targetTime })}</span>
                    </div>
                  )}

                  {/* Creator Info */}
                  {plan.creator && plan.visibility === 'public' && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <User size={16} />
                      <span>{plan.creator.full_name || t('marketplace.anonymous')}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {plan.tags && plan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {plan.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} size="sm">
                          {tag}
                        </Badge>
                      ))}
                      {plan.tags.length > 3 && (
                        <Badge size="sm" className="bg-gray-100 text-gray-600">
                          {t('marketplace.tags.more', { count: plan.tags.length - 3 })}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats Footer - Sticky Bottom */}
                <div className="p-4 border-t border-gray-200 sticky bottom-0 flex items-center justify-between text-sm text-text-tertiary flex-shrink-0">
                  <div className={flex.row}>
                    <Heart size={16} />
                    <span>{plan.stats?.likes_count || 0}</span>
                  </div>
                  <div className={flex.row}>
                    <Star size={16} className="text-yellow-500" />
                    <span>
                      {plan.stats?.rating_avg
                        ? plan.stats.rating_avg.toFixed(1)
                        : 'N/A'}
                    </span>
                  </div>
                  <div className={flex.row}>
                    <Copy size={16} />
                    <span>{plan.clone_count}</span>
                  </div>
                  <div className={flex.row}>
                    <Eye size={16} />
                    <span>{plan.view_count}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {total > (filters.page_size || 12) && (
            <div className="mt-8 flex justify-center gap-2">
              <Button
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                disabled={filters.page === 1}
                variant="secondary"
              >
                {t('marketplace.pagination.previous')}
              </Button>
              <span className={cn(typography.body, 'px-4 py-2')}>
                {t('marketplace.page', { current: filters.page, total: Math.ceil(total / (filters.page_size || 12)) })}
              </span>
              <Button
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                disabled={
                  filters.page === Math.ceil(total / (filters.page_size || 12))
                }
                variant="secondary"
              >
                {t('marketplace.pagination.next')}
              </Button>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
