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
import { PlanCard } from '../components/marketplace/PlanCard';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
      {/* Modern Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="w-full">
          {/* Header Content */}
          <div className="py-4 px-6">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              {/* Sorting Pills */}
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
                    'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex-shrink-0',
                    filters.sort_by === option.value
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
                  )}
                >
                  <option.icon size={16} />
                  <span className="whitespace-nowrap">{t(option.labelKey)}</span>
                </button>
              ))}

              {/* Following Filter - Only show if authenticated */}
              {user && (
                <button
                  onClick={toggleFollowing}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex-shrink-0',
                    showFollowingOnly
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
                  )}
                >
                  <Users size={16} />
                  <span className="whitespace-nowrap">{t('marketplace.filters.fromFollowing')}</span>
                </button>
              )}

              {/* Search */}
              <div className="w-80 hidden lg:block flex-shrink-0">
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
                className="lg:hidden relative flex-shrink-0 ml-auto"
                size="sm"
              >
                <Filter size={18} />
                {filterChips.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {filterChips.length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="lg:hidden pb-4">
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
        </div>
      </div>

      {/* Filter Chips */}
      {filterChips.length > 0 && (
        <div className="container mx-auto px-6 max-w-[1600px] py-4 flex-shrink-0">
          <FilterChips chips={filterChips} onClearAll={clearFilters} />
        </div>
      )}

      {/* Layout: Sidebar + Content */}
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-6 max-w-[1600px] flex-1">
          <div className="flex gap-8 py-8 h-full">
            {/* Filter Sidebar (Desktop) */}
            <aside className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-32 h-[calc(100vh-180px)] shadow-xl shadow-slate-900/5">
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
              {/* Results Header */}
              {!loading && filteredPlans.length > 0 && (
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedIntensities.length > 0 && runnerProfile
                        ? `${filteredPlans.length} von ${total} Plänen`
                        : t('marketplace.resultsCount', { count: total })}
                    </h2>
                    {selectedIntensities.length > 0 && runnerProfile && (
                      <p className="text-sm text-slate-600 mt-0.5">
                        Gefiltert nach deiner Intensität
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Results */}
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-slate-600">
                      {t('marketplace.loadingPlans')}
                    </span>
                  </div>
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Card variant="default" className="p-12 text-center max-w-md bg-white shadow-xl">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <Search size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {t('marketplace.noResults')}
                    </h3>
                    <p className="text-sm text-slate-600 mb-6">
                      {t('marketplace.noResultsDescription')}
                    </p>
                    <Button onClick={clearFilters} variant="secondary" className="px-6">
                      {t('marketplace.filters.resetFilters')}
                    </Button>
                  </Card>
                </div>
              ) : (
                <>
                  {/* Plans Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {filteredPlans.map((plan, index) => (
                      <div
                        key={plan.id}
                        style={{
                          animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`,
                        }}
                      >
                        <PlanCard
                          plan={plan}
                          runnerProfile={runnerProfile || undefined}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {total > (filters.page_size || 12) && (
                    <div className="mt-4 flex justify-center items-center gap-3 pb-8">
                      <Button
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                        disabled={filters.page === 1}
                        variant="secondary"
                        className="px-6"
                      >
                        {t('marketplace.pagination.previous')}
                      </Button>
                      <div className="px-6 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <span className="text-sm font-bold text-slate-900">
                          Seite {filters.page} von {Math.ceil(total / (filters.page_size || 12))}
                        </span>
                      </div>
                      <Button
                        onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                        disabled={filters.page === Math.ceil(total / (filters.page_size || 12))}
                        variant="secondary"
                        className="px-6"
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

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

