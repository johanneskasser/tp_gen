import { useState } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { cn, typography, flex, focusRing } from '../../lib/designSystem';
import { FilterSidebar } from './FilterSidebar';
import { UserProfile } from '../../types/userProfile';

interface CollapsibleFilterSidebarProps {
  selectedDistances: number[];
  onDistanceToggle: (distance: number) => void;
  selectedIntensities: string[];
  onIntensityToggle: (intensity: string) => void;
  runnerProfile?: UserProfile;
  targetTimeRange: { min?: number; max?: number };
  onTargetTimeChange: (range: { min?: number; max?: number }) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  availableTags: string[];
  onApply: () => void;
  onClear: () => void;
}

export function CollapsibleFilterSidebar(props: CollapsibleFilterSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalFilters =
    props.selectedDistances.length +
    props.selectedIntensities.length +
    props.selectedTags.length +
    (props.targetTimeRange.min || props.targetTimeRange.max ? 1 : 0);

  return (
    <>
      {/* Backdrop overlay when expanded (mobile) */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-30"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Sidebar Panel - Slides from right */}
      <div
        className={cn(
          'fixed right-0 top-32 bottom-0 transition-all duration-300 ease-out',
          isExpanded ? 'z-40' : 'z-30'
        )}
        style={{
          transform: isExpanded ? 'translateX(0)' : 'translateX(calc(100% - 48px))',
          width: '360px',
        }}
      >
        <div className="h-full flex">
          {/* Toggle Tab - Attached to sidebar */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              'flex-shrink-0 w-12 bg-white border-l border-t border-b border-border-light',
              'flex flex-col items-center justify-start pt-6 gap-3',
              'hover:bg-background-secondary transition-colors duration-200',
              'shadow-lg',
              focusRing,
              // Rounded left corners only
              isExpanded ? 'rounded-l-2xl' : 'rounded-l-2xl'
            )}
            style={{
              borderTopLeftRadius: '1rem',
              borderBottomLeftRadius: '1rem',
            }}
          >
            <Filter size={20} className="text-text-secondary" />

            {totalFilters > 0 && (
              <div className="w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                {totalFilters}
              </div>
            )}

            <div className="mt-auto mb-6">
              {isExpanded ? (
                <ChevronRight size={18} className="text-text-tertiary" />
              ) : (
                <ChevronLeft size={18} className="text-text-tertiary" />
              )}
            </div>
          </button>

          {/* Sidebar Content Panel */}
          <div
            className={cn(
              'flex-1 bg-white border-l border-border-light shadow-2xl transition-opacity duration-200',
              isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          >
            <div className="h-full overflow-hidden">
              <FilterSidebar {...props} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
