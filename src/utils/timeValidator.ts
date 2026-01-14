/**
 * Time Validation Utilities
 * Validates running time inputs in MM:SS or HH:MM:SS format
 */

export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
  formattedTime?: string;
  totalSeconds?: number;
}

/**
 * Validates a time string and returns validation result
 * Accepts formats: MM:SS or HH:MM:SS
 */
export function validateTimeInput(timeStr: string): TimeValidationResult {
  if (!timeStr || timeStr.trim() === '') {
    return {
      isValid: false,
      error: 'Zeit ist erforderlich',
    };
  }

  // Remove any whitespace
  const cleaned = timeStr.trim();

  // Check for valid characters (only digits and colons)
  if (!/^[\d:]+$/.test(cleaned)) {
    return {
      isValid: false,
      error: 'Nur Zahlen und Doppelpunkte erlaubt',
    };
  }

  const parts = cleaned.split(':');

  // Must have 2 or 3 parts (MM:SS or HH:MM:SS)
  if (parts.length < 2 || parts.length > 3) {
    return {
      isValid: false,
      error: 'Format: MM:SS oder HH:MM:SS',
    };
  }

  // Parse the parts
  const numbers = parts.map(p => parseInt(p, 10));

  // Check if all parts are valid numbers
  if (numbers.some(n => isNaN(n))) {
    return {
      isValid: false,
      error: 'Ungültige Zahlen',
    };
  }

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (numbers.length === 3) {
    // HH:MM:SS format
    [hours, minutes, seconds] = numbers;
  } else {
    // MM:SS format
    [minutes, seconds] = numbers;
  }

  // Validate ranges
  if (hours < 0 || hours > 23) {
    return {
      isValid: false,
      error: 'Stunden müssen zwischen 0 und 23 liegen',
    };
  }

  if (minutes < 0 || minutes > 59) {
    return {
      isValid: false,
      error: 'Minuten müssen zwischen 0 und 59 liegen',
    };
  }

  if (seconds < 0 || seconds > 59) {
    return {
      isValid: false,
      error: 'Sekunden müssen zwischen 0 und 59 liegen',
    };
  }

  // Calculate total seconds
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  // Must be at least 1 second
  if (totalSeconds < 1) {
    return {
      isValid: false,
      error: 'Zeit muss mindestens 1 Sekunde sein',
    };
  }

  // Format the time consistently
  const formattedTime = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return {
    isValid: true,
    formattedTime,
    totalSeconds,
  };
}

/**
 * Check if a time string is reasonable for a given distance
 * Returns a warning if the time seems unusual (but still valid)
 */
export function getTimeWarning(distanceKm: number, totalSeconds: number): string | null {
  const pacePerKm = totalSeconds / distanceKm;

  // Format pace for display
  const paceMinutes = Math.floor(pacePerKm / 60);
  const paceSeconds = Math.floor(pacePerKm % 60);
  const paceDisplay = `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}/km`;

  // Unrealistically fast (< 2:30/km) - faster than world record pace
  if (pacePerKm < 150) {
    // Check if this might be a format issue (user meant HH:MM:SS but entered MM:SS)
    if (totalSeconds < 300 && distanceKm > 20) {
      return `Diese Zeit erscheint unrealistisch (Tempo: ${paceDisplay}). Hast du das Format HH:MM:SS gemeint? Beispiel: 2:59:00 für 2 Stunden 59 Minuten.`;
    }
    return `Diese Zeit ist unrealistisch schnell (Tempo: ${paceDisplay}). Das ist schneller als Weltrekord-Tempo. Bitte überprüfe die Eingabe.`;
  }

  // Extremely fast (< 3:00/km) - world-class pace
  if (pacePerKm < 180) {
    return `Diese Zeit ist sehr schnell (Tempo: ${paceDisplay}, Weltklasse-Niveau). Bitte überprüfe die Eingabe.`;
  }

  // Very slow (> 12:00/km) - walking pace
  if (pacePerKm > 720) {
    return `Diese Zeit ist sehr langsam (Tempo: ${paceDisplay}, Gehgeschwindigkeit). Bitte überprüfe die Eingabe.`;
  }

  return null;
}

/**
 * Parse a time string into components
 */
export function parseTimeString(timeStr: string): { hours: number; minutes: number; seconds: number } | null {
  const result = validateTimeInput(timeStr);
  if (!result.isValid || !result.totalSeconds) {
    return null;
  }

  const totalSeconds = result.totalSeconds;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { hours, minutes, seconds };
}
