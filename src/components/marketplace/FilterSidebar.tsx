import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { UserProfile } from '../../types/userProfile';
import { cn } from '../../lib/designSystem';

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
      <div className="mb-6">
        <button
          onClick={() => toggleSection(section)}
          className="flex items-center justify-between w-full mb-4 group"
        >
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{title}</h3>
          <div className="p-1 rounded-lg group-hover:bg-slate-100 transition-colors">
            {isExpanded ? (
              <ChevronUp size={16} className="text-slate-500" />
            ) : (
              <ChevronDown size={16} className="text-slate-500" />
            )}
          </div>
        </button>

        {isExpanded && <div>{children}</div>}
      </div>
    );
  };

  const totalFilters = selectedDistances.length + selectedIntensities.length + selectedTags.length +
    (targetTimeRange.min || targetTimeRange.max ? 1 : 0);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-slate-900">Filter</h2>
          {totalFilters > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
              {totalFilters} aktiv
            </div>
          )}
        </div>
        <p className="text-sm text-slate-600">Finde deinen perfekten Trainingsplan</p>
      </div>

      {/* Filters - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-2"  style={{ scrollbarGutter: 'stable' }}>
        {/* Distance Filter - Pill Buttons */}
        <FilterSection title="Distanz" section="distance">
          <div className="grid grid-cols-2 gap-2">
            {distances.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => onDistanceToggle(value)}
                className={cn(
                  'px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200',
                  'border-2 text-center',
                  selectedDistances.includes(value)
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/25'
                    : 'bg-white text-slate-700 border-gray-200 hover:border-slate-400 hover:shadow-md'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Intensity Filter - Colorful Emoji Buttons */}
        {runnerProfile && (
          <FilterSection title="Intensität für dich" section="intensity">
            <div className="space-y-2 mb-3">
              {intensities.map(({ label, value, emoji }) => (
                <button
                  key={value}
                  onClick={() => onIntensityToggle(value)}
                  className={cn(
                    'w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200',
                    'border-2 flex items-center gap-3',
                    selectedIntensities.includes(value)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg'
                      : 'bg-white text-slate-700 border-gray-200 hover:border-slate-400 hover:shadow-md'
                  )}
                >
                  <span className="text-lg">{emoji}</span>
                  <span className="flex-1 text-left">{label}</span>
                  {selectedIntensities.includes(value) && (
                    <X size={16} className="text-white" />
                  )}
                </button>
              ))}
            </div>
            <div className="px-3 py-2 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Dein VDOT:</span> {runnerProfile.vdot?.toFixed(1) || 'N/A'}
              </p>
            </div>
          </FilterSection>
        )}

        {/* Target Time Filter - Modern Range Selector */}
        <FilterSection title="Zielzeit" section="time">
          <div className="space-y-3 bg-slate-50 rounded-xl p-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block uppercase tracking-wide">
                Von
              </label>
              <select
                value={targetTimeRange.min || ''}
                onChange={(e) =>
                  onTargetTimeChange({
                    ...targetTimeRange,
                    min: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {timeOptions.map(({ label, value }) => (
                  <option key={label} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center">
              <div className="h-px w-8 bg-gray-300"></div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 mb-2 block uppercase tracking-wide">
                Bis
              </label>
              <select
                value={targetTimeRange.max || ''}
                onChange={(e) =>
                  onTargetTimeChange({
                    ...targetTimeRange,
                    max: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2.5 text-sm font-medium border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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

        {/* Tags Filter - Compact Pills */}
        <FilterSection title="Tags" section="tags">
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagToggle(tag)}
                className={cn(
                  'px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 border',
                  selectedTags.includes(tag)
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-600 border-gray-200 hover:border-slate-400'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Footer Actions - Sticky */}
      <div className="flex-shrink-0 px-6 pb-6 pt-4 border-t border-gray-100 space-y-2 bg-white">
        <button
          onClick={onApply}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5"
        >
          Filter anwenden
        </button>
        {totalFilters > 0 && (
          <button
            onClick={onClear}
            className="w-full py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
          >
            <X size={16} />
            Alle zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}
