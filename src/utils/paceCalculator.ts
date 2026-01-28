/**
 * Minimum realistic pace in min/km (~2:30 min/km, world-class sprinting pace).
 * If a MM:SS interpretation yields a pace faster than this, the input is
 * reinterpreted as H:MM (hours:minutes).
 */
const MIN_REALISTIC_PACE = 2.5;

/**
 * Converts time string to total minutes.
 * Accepts formats: HH:MM:SS, H:MM, or MM:SS.
 *
 * When distanceKm is provided and the input has two parts (e.g. "1:40"),
 * the function checks whether treating it as MM:SS would produce an
 * unrealistically fast pace. If so, it reinterprets the input as H:MM.
 */
export function timeStringToMinutes(timeString: string, distanceKm?: number): number {
  if (!timeString || !timeString.trim()) return 0;

  const trimmed = timeString.trim();

  // If no colon, treat as minutes only
  if (!trimmed.includes(':')) {
    const minutes = parseFloat(trimmed);
    if (isNaN(minutes)) return 0;
    return minutes;
  }

  const parts = trimmed.split(':').map(p => parseInt(p, 10));

  // Check for NaN values
  if (parts.some(p => isNaN(p))) {
    console.warn('Invalid time string:', timeString);
    return 0;
  }

  if (parts.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = parts;
    return hours * 60 + minutes + seconds / 60;
  } else if (parts.length === 2) {
    const [a, b] = parts;

    // Default: MM:SS
    const asMMSS = a + b / 60;

    // If we know the distance, check whether MM:SS yields an unrealistic pace
    if (distanceKm && distanceKm > 0) {
      const paceIfMMSS = asMMSS / distanceKm;
      if (paceIfMMSS < MIN_REALISTIC_PACE) {
        // Reinterpret as H:MM (e.g. "1:40" → 1 h 40 min = 100 min)
        return a * 60 + b;
      }
    }

    return asMMSS;
  }

  return 0;
}

/**
 * Calculates pace in min/km from target time and distance
 * @param targetTime - Time string in format HH:MM:SS or MM:SS
 * @param distanceKm - Distance in kilometers
 * @returns Pace string in format M:SS/km
 */
export function calculatePace(targetTime: string, distanceKm: number): string {
  if (!targetTime || !distanceKm || distanceKm === 0) {
    console.log('calculatePace early return:', { targetTime, distanceKm });
    return '';
  }

  const totalMinutes = timeStringToMinutes(targetTime, distanceKm);
  console.log('totalMinutes:', totalMinutes, 'from', targetTime);

  if (totalMinutes === 0) {
    return '';
  }

  const paceMinutes = totalMinutes / distanceKm;
  console.log('paceMinutes:', paceMinutes, '=', totalMinutes, '/', distanceKm);

  const minutes = Math.floor(paceMinutes);
  const seconds = Math.round((paceMinutes - minutes) * 60);

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Formats pace for display
 * @param pace - Pace string (e.g., "4:30")
 * @returns Formatted pace with unit (e.g., "4:30 min/km")
 */
export function formatPace(pace: string): string {
  if (!pace) return '';
  return `${pace} min/km`;
}

/**
 * Formats time for display
 * @param timeString - Time in HH:MM:SS or MM:SS format
 * @returns Formatted time string
 */
export function formatTime(timeString: string): string {
  if (!timeString) return '';

  const parts = timeString.split(':');
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return `${h}:${m}:${s}`;
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return `${m}:${s}`;
  }

  return timeString;
}
