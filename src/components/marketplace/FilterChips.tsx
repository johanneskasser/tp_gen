import { X } from 'lucide-react';
import { cn } from '../../lib/designSystem';

interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll?: () => void;
}

export function FilterChips({ chips, onClearAll }: FilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-text-tertiary">Filter:</span>

      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={chip.onRemove}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-800',
            'rounded-full text-sm font-medium hover:bg-primary-200 transition-colors'
          )}
        >
          <span>{chip.label}</span>
          <X size={14} />
        </button>
      ))}

      {chips.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="text-sm text-text-tertiary hover:text-text-secondary underline transition-colors"
        >
          Alle entfernen
        </button>
      )}
    </div>
  );
}
