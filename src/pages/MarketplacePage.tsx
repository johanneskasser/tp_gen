import { useEffect, useState } from 'react';
import { marketplaceService } from '../services/marketplaceService';
import {
  MarketplacePlan,
  MarketplaceFilters,
  PREDEFINED_TAGS,
} from '../types/marketplace';
import { Search, Loader2 } from 'lucide-react';
import { Button, Card, Pagination } from '../components/ui';
import { cn, typography, flex } from '../lib/designSystem';
import { useRunnerProfile } from '../contexts/RunnerProfileContext';
import { useAuth } from '../contexts/AuthContext';
import { CommandPaletteSearch } from '../components/marketplace/CommandPaletteSearch';
import { FilterOverlay } from '../components/marketplace/FilterOverlay';
import { PublicCTABanner } from '../components/marketplace/PublicCTABanner';
import { SEOHead } from '../components/seo/SEOHead';
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
  const [showFollowingOnly, setShowFollowingOnly] = useState(false);
  const [showFilterOverlay, setShowFilterOverlay] = useState(false);
  const [activeCommand, setActiveCommand] = useState<string>();
  const { runnerProfile } = useRunnerProfile();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isAuthenticated = !!user;

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

  const handleCommandSelect = (command: string) => {
    setActiveCommand(command);

    // Map commands to sort_by values
    const commandMap: Record<string, MarketplaceFilters['sort_by']> = {
      recent: 'recent',
      popular: 'popular',
      rating: 'rating',
      clones: 'clones',
    };

    if (command === 'friends') {
      setShowFollowingOnly(true);
      setFilters({
        ...filters,
        from_following: true,
        page: 1
      });
    } else if (commandMap[command]) {
      setFilters({ ...filters, sort_by: commandMap[command], page: 1 });
    }
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

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t('seo.marketplace.title'),
    description: t('seo.marketplace.description'),
    url: 'https://zenit-it.fit/marketplace',
    inLanguage: ['de', 'en'],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-background-primary flex flex-col">
      <SEOHead
        title={t('seo.marketplace.title')}
        description={t('seo.marketplace.description')}
        canonicalUrl="/marketplace"
        structuredData={structuredData}
        alternateUrls={[
          { lang: 'de', url: '/marketplace' },
          { lang: 'en', url: '/marketplace' },
        ]}
      />
      {/* Command Palette Header - Clean & Powerful */}
      <div className="sticky top-0 z-20 bg-white flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-8 max-w-[1600px] py-4 sm:py-8">
          <CommandPaletteSearch
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onCommandSelect={handleCommandSelect}
            activeFilters={filterChips}
            onFilterClick={() => setShowFilterOverlay(true)}
            activeCommand={activeCommand}
            isAuthenticated={isAuthenticated}
            onClearCommand={() => {
              setActiveCommand(undefined);
              // Reset to default sort when clearing command
              if (activeCommand === 'friends') {
                setShowFollowingOnly(false);
              }
              setFilters({ ...filters, sort_by: 'recent', from_following: undefined, page: 1 });
            }}
          />
        </div>
      </div>

      {/* Filter Overlay Modal */}
      <FilterOverlay
        isOpen={showFilterOverlay}
        onClose={() => setShowFilterOverlay(false)}
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
        onApply={() => {
          handleSearch();
          setShowFilterOverlay(false);
        }}
        onClear={clearFilters}
      />

      {/* Layout: Main Content with more breathing room */}
      <div className="flex-1 flex flex-col">
        <div className="container mx-auto px-6 max-w-[1400px] flex-1">
          <div className="py-10">
            {/* Main Content */}
            <main className="flex flex-col">
              {/* Results Header */}
              {!loading && filteredPlans.length > 0 && (
                <div className={cn('mb-8', flex.rowJustified)}>
                  <div>
                    <h2 className={typography.h2}>
                      {selectedIntensities.length > 0 && runnerProfile
                        ? `${filteredPlans.length} von ${total} Plänen`
                        : t('marketplace.resultsCount', { count: total })}
                    </h2>
                    {selectedIntensities.length > 0 && runnerProfile && (
                      <p className={cn(typography.bodySmall, 'mt-1')}>
                        Gefiltert nach deiner Intensität
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Results */}
              {loading ? (
                <div className={cn(flex.center, 'py-24')}>
                  <div className={cn(flex.colNormal, 'items-center')}>
                    <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
                    <span className={cn(typography.body, 'font-medium text-text-secondary')}>
                      {t('marketplace.loadingPlans')}
                    </span>
                  </div>
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className={cn(flex.center, 'py-24')}>
                  <Card variant="default" className="p-12 text-center max-w-md bg-white shadow-xl border border-border-light">
                    <div className={cn(
                      'w-20 h-20 mx-auto mb-6 rounded-full bg-background-tertiary',
                      flex.center
                    )}>
                      <Search size={36} className="text-text-tertiary" />
                    </div>
                    <h3 className={cn(typography.h2, 'mb-3')}>
                      {t('marketplace.noResults')}
                    </h3>
                    <p className={cn(typography.body, 'mb-8')}>
                      {t('marketplace.noResultsDescription')}
                    </p>
                    <Button onClick={clearFilters} variant="secondary" className="px-8 py-3">
                      {t('marketplace.filters.resetFilters')}
                    </Button>
                  </Card>
                </div>
              ) : (
                <>
                  {/* Plans Grid - More spacing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
                    {filteredPlans.map((plan, index) => (
                      <div
                        key={plan.id}
                        className="animate-fade-in-up"
                        style={{
                          animationDelay: `${index * 0.05}s`,
                          animationFillMode: 'both',
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
                    <Pagination
                      currentPage={filters.page || 1}
                      totalPages={Math.ceil(total / (filters.page_size || 12))}
                      onPageChange={(page) => setFilters({ ...filters, page })}
                      itemsPerPage={filters.page_size || 12}
                      totalItems={total}
                    />
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
      <PublicCTABanner />
    </div>
  );
}

