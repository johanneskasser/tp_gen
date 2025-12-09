import { useEffect, useState } from 'react';
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
  Loader2,
  Users,
} from 'lucide-react';
import { Button, Card, Input } from '../components/ui';
import { typography, cn, flex } from '../lib/designSystem';
import { useAuth } from '../contexts/AuthContext';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { FilterSidebar } from '../components/marketplace/FilterSidebar';
import { FilterChips } from '../components/marketplace/FilterChips';
import { calculatePlanDifficulty } from '../utils/personalizedIntensity';
import { useTranslation } from 'react-i18next';
import { MarketplacePlansTable } from '../components/MarketplacePlansTable';

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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Modern Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-border-light shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Single Row: Sorting Tabs + Search + Filter Button */}
          <div className="flex items-center justify-between gap-4 overflow-x-auto py-3">
            {/* Sorting Tabs */}
            <div className="flex gap-1 min-w-max">
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

            {/* Search + Following + Filter Button */}
            <div className="flex items-center gap-2 min-w-max">
              {/* Following Filter - Only show if authenticated */}
              {user && (
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
              )}

              {/* Search */}
              <div className="w-64">
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
                className="lg:hidden relative"
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
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      {filterChips.length > 0 && (
        <div className="container mx-auto px-4 max-w-7xl py-3 flex-shrink-0">
          <FilterChips chips={filterChips} onClearAll={clearFilters} />
        </div>
      )}

      {/* Layout: Sidebar + Content - Takes remaining space */}
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-4 max-w-7xl flex-1">
          <div className="flex gap-6 py-6 h-full">
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
          <main className="flex-1 min-w-0 flex flex-col">
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

                {/* Plans Table */}
                <MarketplacePlansTable
                  plans={filteredPlans}
                  runnerProfile={runnerProfile || undefined}
                />

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
    </div>
  );
}

