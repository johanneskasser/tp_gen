import { X } from 'lucide-react';
import { cn, typography, flex, focusRing, hoverEffects } from '../../lib/designSystem';

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
    <div className={cn(flex.rowTight, 'flex-wrap')}>
      <span className={cn(typography.bodySmall, 'text-text-tertiary font-medium')}>
        Aktive Filter:
      </span>

      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={chip.onRemove}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-700',
            'rounded-full font-semibold hover:bg-primary-200 transition-all duration-fast',
            typography.caption,
            focusRing,
            hoverEffects.scale
          )}
        >
          <span>{chip.label}</span>
          <X size={14} className="flex-shrink-0" />
        </button>
      ))}

      {chips.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className={cn(
            'font-medium text-text-tertiary hover:text-text-primary underline transition-colors duration-fast',
            typography.bodySmall,
            focusRing,
            'rounded px-1'
          )}
        >
          Alle entfernen
        </button>
      )}
    </div>
  );
}
