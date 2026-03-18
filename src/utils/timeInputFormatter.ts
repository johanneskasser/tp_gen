/**
 * Time Input Formatting Utilities
 * Auto-formats time input as user types
 */

/**
 * Format time input as user types
 * Automatically adds colons and formats to HH:MM:SS or MM:SS
 */
export function formatTimeInput(input: string, previousValue: string): string {
  // Remove all non-digit characters
  const digitsOnly = input.replace(/\D/g, '');

  // If user is deleting, just return the cleaned input
  if (input.length < previousValue.length) {
    return input;
  }

  // Format based on number of digits
  if (digitsOnly.length === 0) {
    return '';
  }

  if (digitsOnly.length <= 2) {
    // MM
    return digitsOnly;
  }

  if (digitsOnly.length <= 4) {
    // MM:SS
    return `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2)}`;
  }

  if (digitsOnly.length <= 6) {
    // HH:MM:SS
    return `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2, 4)}:${digitsOnly.slice(4)}`;
  }

  // Max 6 digits (HH:MM:SS)
  return `${digitsOnly.slice(0, 2)}:${digitsOnly.slice(2, 4)}:${digitsOnly.slice(4, 6)}`;
}

/**
 * Get placeholder text based on current input
 */
export function getTimePlaceholder(currentValue: string): string {
  const digitsOnly = currentValue.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    return 'MM:SS';
  }

  if (digitsOnly.length <= 2) {
    return `${currentValue}:SS`;
  }

  if (digitsOnly.length <= 4) {
    return currentValue;
  }

  return currentValue;
}

/**
 * Convert seconds to formatted time string (HH:MM:SS or MM:SS)
 */
export function secondsToTimeString(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get display label for time input (shows format hint)
 */
export function getTimeInputLabel(hasValue: boolean): string {
  if (hasValue) {
    return 'Zeit';
  }
  return 'Zeit (MM:SS oder HH:MM:SS)';
}

/**
 * Format time for display with units
 */
export function formatTimeDisplay(timeStr: string): string {
  const parts = timeStr.split(':');

  if (parts.length === 3) {
    const [h, m, s] = parts;
    return `${h}h ${m}m ${s}s`;
  }

  if (parts.length === 2) {
    const [m, s] = parts;
    return `${m}m ${s}s`;
  }

  return timeStr;
}

/**
 * Get cursor position after formatting
 * Helps maintain cursor position when auto-formatting
 */
export function getAdjustedCursorPosition(
  oldValue: string,
  newValue: string,
  oldCursor: number
): number {
  // If value got shorter (user deleted), keep cursor position
  if (newValue.length < oldValue.length) {
    return oldCursor;
  }

  // If we added a colon, move cursor forward
  const oldColons = (oldValue.match(/:/g) || []).length;
  const newColons = (newValue.match(/:/g) || []).length;

  if (newColons > oldColons) {
    return oldCursor + (newColons - oldColons);
  }

  return oldCursor;
}

/**
 * Format a raw target time string for display.
 * "1:30:00" -> "1h 30min"
 * "0:45:00" -> "45min"
 * "45:00"   -> "45min"
 * "3:00:00" -> "3h"
 */
export function formatTargetTime(timeString: string | undefined | null): string {
  if (!timeString) return '';

  const parts = timeString.split(':').map(Number);
  let hours = 0, minutes = 0;

  if (parts.length === 3) {
    [hours, minutes] = parts;
  } else if (parts.length === 2) {
    // Could be HH:MM or MM:SS — treat as MM:SS if first part <= 60
    if (parts[0] <= 60) {
      minutes = parts[0];
    } else {
      hours = parts[0];
      minutes = parts[1];
    }
  }

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}min`;
  return timeString; // fallback: return as-is
}
