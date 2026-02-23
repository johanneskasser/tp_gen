import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './ui';
import { getDistanceColors, type RaceDistance } from '../constants/distanceColors';

interface DashboardFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  distanceFilters: string[];
  onDistanceFiltersChange: (filters: string[]) => void;
  resultCount: number;
  totalCount: number;
}

const DISTANCE_OPTIONS: Array<{ value: RaceDistance; label: string }> = [
  { value: '5K', label: '5K' },
  { value: '10K', label: '10K' },
  { value: 'HM', label: 'Halbmarathon' },
  { value: 'M', label: 'Marathon' },
  { value: 'CUSTOM', label: 'Custom' },
];

export function DashboardFilters({
  searchQuery,
  onSearchChange,
  distanceFilters,
  onDistanceFiltersChange,
  resultCount,
  totalCount,
}: DashboardFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounced search with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const toggleDistanceFilter = (distance: string) => {
    if (distanceFilters.includes(distance)) {
      onDistanceFiltersChange(distanceFilters.filter((d) => d !== distance));
    } else {
      onDistanceFiltersChange([...distanceFilters, distance]);
    }
  };

  const clearAllFilters = () => {
    setLocalSearch('');
    onSearchChange('');
    onDistanceFiltersChange([]);
  };

  const hasActiveFilters = localSearch || distanceFilters.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <Input
          type="text"
          placeholder="Suche nach Name oder Event..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-12 pr-10 h-12 text-base bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl transition-all"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Suche löschen"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Filter Pills - Vibrant Energy */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600 mr-1">Distanz:</span>
        {DISTANCE_OPTIONS.map((option) => {
          const isActive = distanceFilters.includes(option.value);
          const colors = getDistanceColors(option.value);
          return (
            <button
              key={option.value}
              onClick={() => toggleDistanceFilter(option.value)}
              className="relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 hover:scale-105"
              style={{
                background: isActive ? colors.hex : '#f1f5f9',
                color: isActive ? 'white' : '#475569',
                boxShadow: isActive ? `0 4px 14px ${colors.glow}` : 'none',
              }}
            >
              {option.label}
              {isActive && (
                <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/20">
                  <X className="h-3 w-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Result Count & Clear Filters */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="text-sm text-slate-600">
          {hasActiveFilters ? (
            <>
              <span className="font-semibold text-slate-900">{resultCount}</span> von{' '}
              <span className="font-semibold text-slate-900">{totalCount}</span> Plänen
            </>
          ) : (
            <>
              <span className="font-semibold text-slate-900">{totalCount}</span>{' '}
              {totalCount === 1 ? 'Plan' : 'Pläne'} gesamt
            </>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Filter zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}
