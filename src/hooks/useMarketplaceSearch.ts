import { useState, useEffect, useRef } from 'react';
import { marketplaceService } from '../services/marketplaceService';
import { MarketplacePlan } from '../types/marketplace';
import { RaceDistance } from '../types';

function distanceToKm(d: RaceDistance): number | null {
  const map: Record<RaceDistance, number | null> = {
    '5K': 5,
    '10K': 10,
    'HM': 21.0975,
    'M': 42.195,
    'CUSTOM': null,
  };
  return map[d];
}

// Parse "MM:SS" or "H:MM:SS" → total minutes
function parseTimeToMinutes(time: string): number | null {
  if (!time) return null;
  const parts = time.trim().split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 2) return parts[0] + parts[1] / 60; // MM:SS → MM + SS/60
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60; // H:MM:SS
  return null;
}

export interface UseMarketplaceSearchResult {
  plans: MarketplacePlan[];
  loading: boolean;
  error: string | null;
}

export function useMarketplaceSearch(
  distance: RaceDistance | null,
  targetTime: string,
  durationWeeks: number | null
): UseMarketplaceSearchResult {
  const [plans, setPlans] = useState<MarketplacePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!distance || distance === 'CUSTOM') {
      setPlans([]);
      setLoading(false);
      return;
    }

    const km = distanceToKm(distance);
    if (km === null) {
      setPlans([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Closure flag guards against stale updates from rapid changes and unmount
    // (Supabase does not expose a cancellation signal, so we use this pattern)
    let cancelled = false;

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const filters: Parameters<typeof marketplaceService.browsePlans>[0] = {
          distance: [km],
          sort_by: 'clones',
          page_size: 20, // fetch more so we can re-sort by duration proximity
          page: 1,
        };

        const minutes = parseTimeToMinutes(targetTime);
        if (minutes !== null && minutes > 0) {
          filters.target_time_min = Math.round(minutes * 0.75);
          filters.target_time_max = Math.round(minutes * 1.25);
        }

        let { plans: results } = await marketplaceService.browsePlans(filters);

        // Sort by duration proximity when we know the target number of weeks
        if (durationWeeks !== null && durationWeeks > 0) {
          results = [...results].sort((a, b) => {
            const aWeeks = a.plan_data?.weeks?.length ?? 0;
            const bWeeks = b.plan_data?.weeks?.length ?? 0;
            return Math.abs(aWeeks - durationWeeks) - Math.abs(bWeeks - durationWeeks);
          });
        }

        if (!cancelled) {
          setPlans(results.slice(0, 3));
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[useMarketplaceSearch]', err);
          setError('Suche fehlgeschlagen');
          setPlans([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 600);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [distance, targetTime, durationWeeks]);

  return { plans, loading, error };
}
