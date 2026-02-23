/**
 * WeekCoachBadge - Positive Week Status Indicator
 *
 * Shows "Optimal" or "X Vorschläge" (suggestions) - never "errors" or "warnings".
 * The count represents actual training session suggestions, not tips/violations.
 */

import { Sparkles, Plus, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/designSystem';

interface Props {
  tipCount: number; // Actually suggestion count, kept as tipCount for backwards compatibility
  className?: string;
  onClick?: () => void;
}

export function WeekCoachBadge({ tipCount: suggestionCount, className, onClick }: Props) {
  // No suggestions - week is complete or optimal
  if (suggestionCount === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
          'bg-emerald-50 text-emerald-600 text-xs font-medium',
          'border border-emerald-100',
          onClick && 'cursor-pointer hover:bg-emerald-100 transition-colors',
          className
        )}
        onClick={onClick}
        title="Optimal geplant!"
      >
        <CheckCircle className="w-3 h-3" />
        <span className="hidden sm:inline">Optimal</span>
      </span>
    );
  }

  // Few suggestions available
  if (suggestionCount <= 3) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
          'bg-violet-50 text-violet-600 text-xs font-medium',
          'border border-violet-100',
          onClick && 'cursor-pointer hover:bg-violet-100 transition-colors',
          className
        )}
        onClick={onClick}
        title={`${suggestionCount} Vorschlag${suggestionCount !== 1 ? 'e' : ''} verfügbar`}
      >
        <Plus className="w-3 h-3" />
        <span className="hidden sm:inline">{suggestionCount} Vorschlag{suggestionCount !== 1 ? 'e' : ''}</span>
        <span className="sm:hidden">{suggestionCount}</span>
      </span>
    );
  }

  // More suggestions available
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
        'bg-violet-50 text-violet-600 text-xs font-medium',
        'border border-violet-100',
        onClick && 'cursor-pointer hover:bg-violet-100 transition-colors',
        className
      )}
      onClick={onClick}
      title={`${suggestionCount} Vorschläge verfügbar`}
    >
      <Sparkles className="w-3 h-3" />
      <span className="hidden sm:inline">{suggestionCount} Vorschläge</span>
      <span className="sm:hidden">{suggestionCount}</span>
    </span>
  );
}
