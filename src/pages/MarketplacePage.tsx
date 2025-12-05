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
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { PlanDifficultyBadge } from '../components/PlanDifficultyBadge';
import { FilterSidebar } from '../components/marketplace/FilterSidebar';
import { FilterChips } from '../components/marketplace/FilterChips';
import { calculatePlanDifficulty } from '../utils/personalizedIntensity';
import { useTranslation } from 'react-i18next';

export default function MarketplacePage() {
  const [plans, setPlans] = useState<MarketplacePlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<MarketplacePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<MarketplaceFilters>({
    page: 1,
    page_size: 12,
    sort_by: 'recent',
  });
  const [searchInput, setSearchInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedDistances, setSelectedDistances] = useState<number[]>([]);
  const [selectedIntensities, setSelectedIntensities] = useState<string[]>([]);
  const [targetTimeRange, setTargetTimeRange] = useState<{ min?: number; max?: number }>({});
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { runnerProfile } = useRunnerProfile();
  const { t } = useTranslation();

  useEffect(() => {
    loadPlans();
  }, [filters]);

  // Client-side intensity filtering (since it depends on user's VDOT)
  useEffect(() => {
    if (selectedIntensities.length === 0 || !runnerProfile) {
      setFilteredPlans(plans);
      return;
    }

    const filtered = plans.filter((plan) => {
      if (!plan.plan_data) return false;

      try {
        const difficulty = calculatePlanDifficulty(plan.plan_data, runnerProfile);
        return selectedIntensities.includes(difficulty.overall);
      } catch (error) {
        console.error('Error calculating difficulty:', error);
        return false;
      }
    });

    setFilteredPlans(filtered);
  }, [plans, selectedIntensities, runnerProfile]);

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
      distance: selectedDistances.length > 0 ? selectedDistances : undefined,
      intensity: selectedIntensities.length > 0 ? selectedIntensities : undefined,
      target_time_min: targetTimeRange.min,
      target_time_max: targetTimeRange.max,
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
    setSelectedDistances([]);
    setSelectedIntensities([]);
    setTargetTimeRange({});
    setShowFollowingOnly(false);
    setFilters({
      page: 1,
      page_size: 12,
      sort_by: 'recent',
    });
  };

  const toggleDistance = (distance: number) => {
    if (selectedDistances.includes(distance)) {
      setSelectedDistances(selectedDistances.filter((d) => d !== distance));
    } else {
      setSelectedDistances([...selectedDistances, distance]);
    }
  };

  const toggleIntensity = (intensity: string) => {
    if (selectedIntensities.includes(intensity)) {
      setSelectedIntensities(selectedIntensities.filter((i) => i !== intensity));
    } else {
      setSelectedIntensities([...selectedIntensities, intensity]);
    }
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

  // Generate filter chips
  const getFilterChips = () => {
    const chips = [];

    // Distance chips
    selectedDistances.forEach((dist) => {
      const label = dist === 5 ? '5K' : dist === 10 ? '10K' : dist === 21.0975 ? 'Halbmarathon' : 'Marathon';
      chips.push({
        id: `dist-${dist}`,
        label,
        onRemove: () => toggleDistance(dist),
      });
    });

    // Intensity chips
    selectedIntensities.forEach((intensity) => {
      const labels: Record<string, string> = {
        very_easy: '😌 Sehr Leicht',
        easy: '🙂 Leicht',
        moderate: '💪 Moderat',
        challenging: '🔥 Herausfordernd',
        very_challenging: '💥 Sehr Anspruchsvoll',
        extreme: '⚠️ Extrem',
      };
      chips.push({
        id: `intensity-${intensity}`,
        label: labels[intensity],
        onRemove: () => toggleIntensity(intensity),
      });
    });

    // Tags chips
    selectedTags.forEach((tag) => {
      chips.push({
        id: `tag-${tag}`,
        label: tag,
        onRemove: () => toggleTag(tag),
      });
    });

    // Time range chip
    if (targetTimeRange.min || targetTimeRange.max) {
      const min = targetTimeRange.min ? `${targetTimeRange.min}min` : '';
      const max = targetTimeRange.max ? `${targetTimeRange.max}min` : '';
      const label = min && max ? `${min} - ${max}` : min || max;
      chips.push({
        id: 'time-range',
        label: `Zielzeit: ${label}`,
        onRemove: () => setTargetTimeRange({}),
      });
    }

    return chips;
  };

  const filterChips = getFilterChips();

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Modern Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-border-light shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between py-4">
            {/* Title */}
            <h1 className={cn(typography.h2, 'hidden sm:block')}>Marketplace</h1>

            {/* Search (smaller, right-aligned) */}
            <div className="flex-1 sm:flex-none sm:w-80 ml-auto">
              <Input
                type="text"
                placeholder="Suchen..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                leftIcon={<Search size={16} />}
                className="w-full text-sm"
              />
            </div>

            {/* Filter Button (Mobile) */}
            <Button
              onClick={() => setShowFilterSheet(!showFilterSheet)}
              variant="secondary"
              className="ml-2 sm:hidden relative"
              size="sm"
            >
              <Filter size={18} />
              {filterChips.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-700 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {filterChips.length}
                </span>
              )}
            </Button>
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

      {/* Filter Chips */}
      {filterChips.length > 0 && (
        <div className="container mx-auto px-4 max-w-7xl py-3">
          <FilterChips chips={filterChips} onClearAll={clearFilters} />
        </div>
      )}

      {/* Layout: Sidebar + Content */}
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex gap-6 py-6">
          {/* Filter Sidebar (Desktop) */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-hidden rounded-lg border border-border-light shadow-sm">
              <FilterSidebar
                selectedDistances={selectedDistances}
                onDistanceToggle={toggleDistance}
                selectedIntensities={selectedIntensities}
                onIntensityToggle={toggleIntensity}
                runnerProfile={runnerProfile || undefined}
                targetTimeRange={targetTimeRange}
                onTargetTimeChange={setTargetTimeRange}
                selectedTags={selectedTags}
                onTagToggle={toggleTag}
                availableTags={PREDEFINED_TAGS}
                onApply={handleSearch}
                onClear={clearFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
      {/* Old Filter Panel - Remove */}
      {false && (
        <div className="border-b border-border-light bg-background-secondary">
          <div className="container mx-auto px-3 sm:px-4 py-4 max-w-7xl">
            <div className="space-y-4">
              {/* Distance Filter */}
              <div>
                <h3 className={cn(typography.h4, 'mb-2')}>Distanz</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '5K', value: 5 },
                    { label: '10K', value: 10 },
                    { label: 'Halbmarathon', value: 21.0975 },
                    { label: 'Marathon', value: 42.195 },
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => toggleDistance(value)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                        selectedDistances.includes(value)
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-text-secondary hover:bg-blue-50 border border-border-light'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Intensity Filter */}
              {runnerProfile && (
                <div>
                  <h3 className={cn(typography.h4, 'mb-2')}>
                    Intensität (für dich)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: '😌 Sehr Leicht', value: 'very_easy', selectedClass: 'bg-green-600', hoverClass: 'hover:bg-green-50' },
                      { label: '🙂 Leicht', value: 'easy', selectedClass: 'bg-green-500', hoverClass: 'hover:bg-green-50' },
                      { label: '💪 Moderat', value: 'moderate', selectedClass: 'bg-blue-600', hoverClass: 'hover:bg-blue-50' },
                      { label: '🔥 Herausfordernd', value: 'challenging', selectedClass: 'bg-orange-600', hoverClass: 'hover:bg-orange-50' },
                      { label: '💥 Sehr Anspruchsvoll', value: 'very_challenging', selectedClass: 'bg-red-600', hoverClass: 'hover:bg-red-50' },
                      { label: '⚠️ Extrem', value: 'extreme', selectedClass: 'bg-red-800', hoverClass: 'hover:bg-red-50' },
                    ].map(({ label, value, selectedClass, hoverClass }) => (
                      <button
                        key={value}
                        onClick={() => toggleIntensity(value)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                          selectedIntensities.includes(value)
                            ? `${selectedClass} text-white shadow-sm border-transparent`
                            : `bg-white text-text-secondary ${hoverClass} border-border-light`
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    💡 Basierend auf deinem Fitnesslevel (VDOT: {runnerProfile?.vdot?.toFixed(1) || 'N/A'})
                  </p>
                </div>
              )}

              {/* Target Time Filter */}
              <div>
                <h3 className={cn(typography.h4, 'mb-2')}>Zielzeit</h3>
                <div className="flex gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-text-secondary">Von:</label>
                    <select
                      value={targetTimeRange.min || ''}
                      onChange={(e) =>
                        setTargetTimeRange({
                          ...targetTimeRange,
                          min: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="px-3 py-1.5 rounded border border-border-light text-sm"
                    >
                      <option value="">Beliebig</option>
                      <option value="20">20 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1 Std</option>
                      <option value="90">1:30 Std</option>
                      <option value="120">2 Std</option>
                      <option value="150">2:30 Std</option>
                      <option value="180">3 Std</option>
                      <option value="210">3:30 Std</option>
                      <option value="240">4 Std</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-text-secondary">Bis:</label>
                    <select
                      value={targetTimeRange.max || ''}
                      onChange={(e) =>
                        setTargetTimeRange({
                          ...targetTimeRange,
                          max: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="px-3 py-1.5 rounded border border-border-light text-sm"
                    >
                      <option value="">Beliebig</option>
                      <option value="20">20 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1 Std</option>
                      <option value="90">1:30 Std</option>
                      <option value="120">2 Std</option>
                      <option value="150">2:30 Std</option>
                      <option value="180">3 Std</option>
                      <option value="210">3:30 Std</option>
                      <option value="240">4 Std</option>
                      <option value="300">5 Std</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3 className={cn(typography.h4, 'mb-2')}>Tags</h3>
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
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} variant="default">
                  {t('marketplace.filters.apply')}
                </Button>
                <Button onClick={clearFilters} variant="secondary">
                  {t('marketplace.filters.reset')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            ) : filteredPlans.length === 0 ? (
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
                  <p className={cn(typography.bodySmall, 'text-text-tertiary')}>
                    {selectedIntensities.length > 0 && runnerProfile
                      ? `${filteredPlans.length} von ${total} Plänen (gefiltert nach Intensität)`
                      : t('marketplace.resultsCount', { count: total })}
                  </p>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredPlans.map((plan) => (
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
                    <p className={cn(typography.bodySmall, 'text-text-tertiary line-clamp-2')}>
                      {plan.description}
                    </p>
                  )}

                  {/* Difficulty Badge */}
                  {runnerProfile && plan.plan_data && (
                    <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                      <PlanDifficultyBadge
                        plan={plan.plan_data}
                        userProfile={runnerProfile}
                        compact={true}
                      />
                    </div>
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
                        <Badge key={idx}>
                          {tag}
                        </Badge>
                      ))}
                      {plan.tags.length > 3 && (
                        <Badge className="bg-gray-100 text-gray-600">
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
          </main>
        </div>
      </div>
    </div>
  );
}
