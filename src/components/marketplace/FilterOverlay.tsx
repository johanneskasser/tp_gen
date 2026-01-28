import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn, typography, flex, focusRing } from '../../lib/designSystem';
import { FilterSidebar } from './FilterSidebar';
import { UserProfile } from '../../types/userProfile';

interface FilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
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

export function FilterOverlay({
  isOpen,
  onClose,
  ...filterProps
}: FilterOverlayProps) {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pointer-events-none">
        <div
          className={cn(
            'relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl',
            'animate-scale-in pointer-events-auto',
            'max-h-[calc(100vh-160px)] flex flex-col'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={cn('flex-shrink-0 px-6 pt-6 pb-4 border-b border-border-light', flex.rowJustified)}>
            <div>
              <h2 className={typography.h3}>Filter</h2>
              <p className={cn(typography.bodySmall, 'mt-1')}>
                Finde deinen perfekten Trainingsplan
              </p>
            </div>
            <button
              onClick={onClose}
              className={cn(
                'p-2 rounded-lg hover:bg-background-tertiary transition-colors',
                focusRing
              )}
            >
              <X size={20} className="text-text-secondary" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <FilterSidebar {...filterProps} />
          </div>
        </div>
      </div>
    </>
  );
}
