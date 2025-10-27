import { TrainingSession } from '../types';

export function generateSessionTitle(session: TrainingSession): string {
  const typeLabels: Record<string, string> = {
    easy: 'Locker',
    long: 'Langer Lauf',
    intervals: 'Intervall',
    tempo: 'Tempo',
    recovery: 'Regeneration',
    race: 'Wettkampf',
  };

  const typeLabel = typeLabels[session.type] || session.type;

  // For interval sessions
  if (session.type === 'intervals' && session.intervals && session.intervals.length > 0) {
    // Get the first interval as the main one (most common case)
    const mainInterval = session.intervals[0];

    if (session.intervals.length === 1) {
      // Single interval type: "5x 2km @ 4:30"
      const paceText = mainInterval.pace ? ` @ ${mainInterval.pace}` : '';
      return `${mainInterval.repetitions}x ${mainInterval.distance}km${paceText}`;
    } else {
      // Multiple interval types: "Intervall (5x 2km, 3x 1km)"
      const intervalSummary = session.intervals
        .map(i => `${i.repetitions}x ${i.distance}km`)
        .join(', ');
      return `${typeLabel} (${intervalSummary})`;
    }
  }

  // For distance-based sessions
  if (session.distance) {
    return `${session.distance}km ${typeLabel}`;
  }

  // Fallback to just the type
  return typeLabel;
}
