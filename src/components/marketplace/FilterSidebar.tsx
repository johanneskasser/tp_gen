import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { UserProfile } from '../../types/userProfile';
import { typography, cn } from '../../lib/designSystem';
import { Badge } from '../ui';

interface FilterSidebarProps {
  // Distance
  selectedDistances: number[];
  onDistanceToggle: (distance: number) => void;

  // Intensity
  selectedIntensities: string[];
  onIntensityToggle: (intensity: string) => void;
  runnerProfile?: UserProfile;

  // Target Time
  targetTimeRange: { min?: number; max?: number };
  onTargetTimeChange: (range: { min?: number; max?: number }) => void;

  // Tags
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];

  // Actions
  onApply: () => void;
  onClear: () => void;
}

export function FilterSidebar({
  selectedDistances,
  onDistanceToggle,
  selectedIntensities,
  onIntensityToggle,
  runnerProfile,
  targetTimeRange,
  onTargetTimeChange,
  selectedTags,
  onTagToggle,
  availableTags,
  onApply,
  onClear,
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['distance', 'intensity', 'time', 'tags'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const distances = [
    { label: '5K', value: 5 },
    { label: '10K', value: 10 },
    { label: 'Halbmarathon', value: 21.0975 },
    { label: 'Marathon', value: 42.195 },
  ];

  const intensities = [
    { label: 'Sehr Leicht', value: 'very_easy', emoji: '😌' },
    { label: 'Leicht', value: 'easy', emoji: '🙂' },
    { label: 'Moderat', value: 'moderate', emoji: '💪' },
    { label: 'Herausfordernd', value: 'challenging', emoji: '🔥' },
    { label: 'Sehr Anspruchsvoll', value: 'very_challenging', emoji: '💥' },
    { label: 'Extrem', value: 'extreme', emoji: '⚠️' },
  ];

  const timeOptions = [
    { label: 'Beliebig', value: '' },
    { label: '20 min', value: 20 },
    { label: '30 min', value: 30 },
    { label: '45 min', value: 45 },
    { label: '1 Std', value: 60 },
    { label: '1:30 Std', value: 90 },
    { label: '2 Std', value: 120 },
    { label: '2:30 Std', value: 150 },
    { label: '3 Std', value: 180 },
    { label: '3:30 Std', value: 210 },
    { label: '4 Std', value: 240 },
    { label: '5 Std', value: 300 },
  ];

  const FilterSection = ({ title, section, children }: { title: string; section: string; children: React.ReactNode }) => {
    const isExpanded = expandedSections.has(section);

    return (
      <div className="border-b border-border-light pb-6">
        <button
          onClick={() => toggleSection(section)}
          className="flex items-center justify-between w-full mb-3 hover:text-primary-700 transition-colors"
        >
          <h3 className={cn(typography.h4, 'text-left')}>{title}</h3>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {isExpanded && <div className="space-y-2">{children}</div>}
      </div>
    );
  };

  const totalFilters = selectedDistances.length + selectedIntensities.length + selectedTags.length +
    (targetTimeRange.min || targetTimeRange.max ? 1 : 0);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-border-light">
        <div className="flex items-center justify-between mb-2">
          <h2 className={typography.h3}>Filter</h2>
          {totalFilters > 0 && (
            <Badge className="bg-primary-700 text-white">
              {totalFilters}
            </Badge>
          )}
        </div>
        <p className="text-sm text-text-tertiary">
          Finde den perfekten Trainingsplan
        </p>
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Distance Filter */}
        <FilterSection title="Distanz" section="distance">
          <div className="space-y-2">
            {distances.map(({ label, value }) => (
              <label
                key={value}
                className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedDistances.includes(value)}
                  onChange={() => onDistanceToggle(value)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-700 focus:ring-primary-700"
                />
                <span className="text-sm text-text-secondary">{label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Intensity Filter */}
        {runnerProfile && (
          <FilterSection title="Intensität (für dich)" section="intensity">
            <div className="space-y-2">
              {intensities.map(({ label, value, emoji, color }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIntensities.includes(value)}
                    onChange={() => onIntensityToggle(value)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-700 focus:ring-primary-700"
                  />
                  <span className="text-sm text-text-secondary flex items-center gap-2">
                    <span>{emoji}</span>
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-text-tertiary mt-2 pl-7">
              Basierend auf deinem VDOT: {runnerProfile.vdot?.toFixed(1) || 'N/A'}
            </p>
          </FilterSection>
        )}

        {/* Target Time Filter */}
        <FilterSection title="Zielzeit" section="time">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Von</label>
              <select
                value={targetTimeRange.min || ''}
                onChange={(e) =>
                  onTargetTimeChange({
                    ...targetTimeRange,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-700"
              >
                {timeOptions.map(({ label, value }) => (
                  <option key={label} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-text-tertiary mb-1 block">Bis</label>
              <select
                value={targetTimeRange.max || ''}
                onChange={(e) =>
                  onTargetTimeChange({
                    ...targetTimeRange,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-3 py-2 text-sm border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary-700"
              >
                {timeOptions.map(({ label, value }) => (
                  <option key={label} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FilterSection>

        {/* Tags Filter */}
        <FilterSection title="Tags" section="tags">
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full transition-all border',
                  selectedTags.includes(tag)
                    ? 'bg-primary-700 text-white border-transparent'
                    : 'bg-white text-text-secondary hover:bg-slate-50 border-border-light'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-border-light space-y-2">
        <button
          onClick={onApply}
          className="w-full py-3 bg-primary-700 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors"
        >
          Filter anwenden
        </button>
        {totalFilters > 0 && (
          <button
            onClick={onClear}
            className="w-full py-2 text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Alle Filter zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}
