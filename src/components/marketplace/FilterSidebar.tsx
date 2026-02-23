import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { UserProfile } from '../../types/userProfile';
import { cn, typography, flex, spacing, focusRing } from '../../lib/designSystem';

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
          className={cn(flex.rowJustified, 'w-full mb-4 group', focusRing, 'rounded-lg')}
        >
          <h3 className={typography.overline}>{title}</h3>
          <div className="p-1 rounded-lg group-hover:bg-background-tertiary transition-colors duration-fast">
            {isExpanded ? (
              <ChevronUp size={16} className="text-text-tertiary" />
            ) : (
              <ChevronDown size={16} className="text-text-tertiary" />
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
    <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-xl border border-border-light">
      {/* Filters - Scrollable */}
      <div className={cn('flex-1 overflow-y-auto px-6 py-6', spacing.normal)} style={{ scrollbarGutter: 'stable' }}>
        {/* Distance Filter - Pill Buttons */}
        <FilterSection title="Distanz" section="distance">
          <div className="grid grid-cols-2 gap-2">
            {distances.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => onDistanceToggle(value)}
                className={cn(
                  typography.bodySmall,
                  'px-4 py-3 font-semibold rounded-xl transition-all duration-base',
                  'border-2 text-center',
                  focusRing,
                  selectedDistances.includes(value)
                    ? 'bg-text-primary text-text-inverse border-text-primary shadow-lg'
                    : 'bg-white text-text-secondary border-border-light hover:border-border-medium hover:shadow-md'
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
            <div className={cn(spacing.tight, 'mb-3')}>
              {intensities.map(({ label, value, emoji }) => (
                <button
                  key={value}
                  onClick={() => onIntensityToggle(value)}
                  className={cn(
                    'w-full px-4 py-3 font-medium rounded-xl transition-all duration-base',
                    'border-2 flex items-center gap-3',
                    typography.bodySmall,
                    focusRing,
                    selectedIntensities.includes(value)
                      ? 'bg-gradient-to-r from-primary-400 to-primary-600 text-white border-transparent shadow-lg'
                      : 'bg-white text-text-secondary border-border-light hover:border-border-medium hover:shadow-md'
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
            <div className="px-3 py-2 bg-background-tertiary rounded-lg">
              <p className={typography.caption}>
                <span className="font-semibold">Dein VDOT:</span> {runnerProfile.vdot?.toFixed(1) || 'N/A'}
              </p>
            </div>
          </FilterSection>
        )}

        {/* Target Time Filter - Modern Range Selector */}
        <FilterSection title="Zielzeit" section="time">
          <div className={cn(spacing.normal, 'bg-background-tertiary rounded-xl p-4')}>
            <div>
              <label className={cn(typography.overline, 'text-text-secondary mb-2 block')}>
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
                className={cn(
                  'w-full px-4 py-2.5 font-medium border-2 border-border-light rounded-lg bg-white',
                  typography.bodySmall,
                  focusRing
                )}
              >
                {timeOptions.map(({ label, value }) => (
                  <option key={label} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center">
              <div className="h-px w-8 bg-border-medium"></div>
            </div>

            <div>
              <label className={cn(typography.overline, 'text-text-secondary mb-2 block')}>
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
                className={cn(
                  'w-full px-4 py-2.5 font-medium border-2 border-border-light rounded-lg bg-white',
                  typography.bodySmall,
                  focusRing
                )}
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
                  'px-3 py-1.5 font-semibold rounded-full transition-all duration-base border',
                  typography.caption,
                  focusRing,
                  selectedTags.includes(tag)
                    ? 'bg-text-primary text-text-inverse border-text-primary shadow-md'
                    : 'bg-white text-text-secondary border-border-light hover:border-border-medium'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Footer Actions - Sticky */}
      <div className={cn('flex-shrink-0 px-6 pb-6 pt-4 border-t border-border-light bg-white', spacing.tight)}>
        <button
          onClick={onApply}
          className={cn(
            'w-full py-3.5 bg-gradient-to-r from-primary-400 to-primary-600 text-white rounded-xl font-bold',
            typography.bodySmall,
            'hover:shadow-xl transition-all duration-slow hover:-translate-y-0.5',
            focusRing
          )}
        >
          Filter anwenden
        </button>
        {totalFilters > 0 && (
          <button
            onClick={onClear}
            className={cn(
              'w-full py-2.5 font-medium text-text-secondary hover:text-text-primary transition-colors',
              typography.bodySmall,
              flex.center,
              'gap-2',
              focusRing,
              'rounded-lg'
            )}
          >
            <X size={16} />
            Alle zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}
