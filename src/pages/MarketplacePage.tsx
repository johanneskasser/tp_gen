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
} from 'lucide-react';
import { Button, Card, Input, Badge } from '../components/ui';
import { typography, cn, flex } from '../lib/designSystem';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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

  const navigate = useNavigate();

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
      page: 1,
    });
  };

  const handleSortChange = (sort_by: MarketplaceFilters['sort_by']) => {
    setFilters({ ...filters, sort_by, page: 1 });
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
      if (distance === 21.0975) return 'Halbmarathon';
      if (distance === 42.195) return 'Marathon';
      return `${distance} km`;
    }
    return distance || 'N/A';
  };

  const getDuration = (plan: MarketplacePlan) => {
    return plan.plan_data?.weeks?.length || 0;
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 max-w-7xl">
      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Input
              type="text"
              placeholder="Trainingspläne durchsuchen..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              leftIcon={<Search size={18} />}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="primary">
              Suchen
            </Button>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters || selectedTags.length > 0 ? 'primary' : 'secondary'}
            leftIcon={<Filter size={18} />}
          >
            Filter {selectedTags.length > 0 && `(${selectedTags.length})`}
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card variant="default" className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className={cn(typography.h3, 'mb-3')}>Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'cursor-pointer transition-all',
                        selectedTags.includes(tag)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      )}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} variant="primary" size="sm">
                  Filter anwenden
                </Button>
                <Button onClick={clearFilters} variant="secondary" size="sm">
                  Zurücksetzen
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Sort Options */}
        <div className={flex.row}>
          <span className={cn(typography.small, 'text-text-tertiary')}>
            Sortieren:
          </span>
          <div className="flex gap-2">
            {[
              { value: 'recent', label: 'Neueste', icon: Clock },
              { value: 'popular', label: 'Beliebt', icon: TrendingUp },
              { value: 'rating', label: 'Bewertung', icon: Star },
              { value: 'clones', label: 'Meist kopiert', icon: Copy },
            ].map((option) => (
              <Button
                key={option.value}
                onClick={() => handleSortChange(option.value as any)}
                variant={filters.sort_by === option.value ? 'primary' : 'ghost'}
                size="sm"
                leftIcon={<option.icon size={16} />}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
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
        <Card variant="default" className="p-8 text-center max-w-md mx-auto">
          <Search size={48} className="mx-auto text-text-tertiary mb-4" />
          <h3 className={cn(typography.h3, 'mb-2')}>
            Keine Trainingspläne gefunden
          </h3>
          <p className={cn(typography.body, 'text-text-tertiary mb-4')}>
            Versuche es mit anderen Suchbegriffen oder Filtern
          </p>
          <Button onClick={clearFilters} variant="secondary">
            Filter zurücksetzen
          </Button>
        </Card>
      ) : (
        <>
          {/* Results Count */}
          <div className="mb-4">
            <p className={cn(typography.small, 'text-text-tertiary')}>
              {total} {total === 1 ? 'Trainingsplan' : 'Trainingspläne'} gefunden
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
                <div className="p-4 border-b border-gray-200 sticky top-0 z-10 flex-shrink-0 bg-background-primary">
                  <h3 className={cn(typography.h3, 'mb-2')}>{plan.name}</h3>
                  {plan.description && (
                    <p className={cn(typography.small, 'text-text-tertiary line-clamp-2')}>
                      {plan.description}
                    </p>
                  )}
                </div>

                {/* Plan Details - Scrollable Middle */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto bg-background-primary">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <MapPin size={16} />
                    <span>{getDistanceLabel(plan)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <Calendar size={16} />
                    <span>{getDuration(plan)} Wochen</span>
                  </div>

                  {/* Target Time */}
                  {plan.plan_data?.event?.targetTime && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Clock size={16} />
                      <span>Ziel: {plan.plan_data.event.targetTime} min</span>
                    </div>
                  )}

                  {/* Creator Info */}
                  {plan.creator && plan.visibility === 'public' && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <User size={16} />
                      <span>{plan.creator.full_name || 'Anonym'}</span>
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
                          +{plan.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Stats Footer - Sticky Bottom */}
                <div className="p-4 border-t border-gray-200 sticky bottom-0 flex items-center justify-between text-sm text-text-tertiary flex-shrink-0 bg-background-primary">
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
                Vorherige
              </Button>
              <span className={cn(typography.body, 'px-4 py-2')}>
                Seite {filters.page} von {Math.ceil(total / (filters.page_size || 12))}
              </span>
              <Button
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                disabled={
                  filters.page === Math.ceil(total / (filters.page_size || 12))
                }
                variant="secondary"
              >
                Nächste
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
