/**
 * Converts pace string (e.g., "4:30") to minutes per km
 */
export function paceToMinPerKm(pace: string): number {
  if (!pace) return 0;

  const parts = pace.split(':');
  if (parts.length !== 2) return 0;

  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);

  if (isNaN(minutes) || isNaN(seconds)) return 0;

  return minutes + seconds / 60;
}

/**
 * Converts minutes to kilometers based on pace
 * @param minutes - Time in minutes
 * @param paceMinPerKm - Pace in minutes per kilometer
 * @returns Distance in kilometers
 */
export function minutesToKm(minutes: number, paceMinPerKm: number): number {
  if (!minutes || !paceMinPerKm || paceMinPerKm === 0) return 0;
  return minutes / paceMinPerKm;
}

/**
 * Estimates recovery pace as 50% slower than work pace (1.5x the time)
 * @param workPace - Work pace string (e.g., "4:30")
 * @returns Recovery pace in min/km
 */
export function estimateRecoveryPace(workPace: string): number {
  const workPaceMinPerKm = paceToMinPerKm(workPace);
  if (!workPaceMinPerKm) return 0;

  // Recovery pace is typically 1.5x slower
  return workPaceMinPerKm * 1.5;
}

/**
 * Estimates easy/warm-up pace as 30% slower than work pace (1.3x the time)
 * @param workPace - Work pace string (e.g., "4:30")
 * @returns Easy pace in min/km
 */
export function estimateEasyPace(workPace: string): number {
  const workPaceMinPerKm = paceToMinPerKm(workPace);
  if (!workPaceMinPerKm) return 0;

  // Easy pace is typically 1.3x slower
  return workPaceMinPerKm * 1.3;
}
