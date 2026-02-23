/**
 * Vibrant energy palette for race distances
 * Using bold, athletic colors that create visual impact as accents
 */

export type RaceDistance = '5K' | '10K' | 'HM' | 'M' | 'CUSTOM';

interface DistanceColorScheme {
  // Primary hex color (the main accent)
  hex: string;

  // Lighter version for backgrounds
  hexLight: string;

  // Text color (readable on light backgrounds)
  textOnLight: string;

  // For glow effects and shadows
  glow: string;
}

export const DISTANCE_COLORS: Record<RaceDistance, DistanceColorScheme> = {
  '5K': {
    hex: '#ffbd00',        // Bright yellow - energy and speed
    hexLight: '#fff4cc',   // Pale yellow tint
    textOnLight: '#7d5e00', // Dark yellow for readability
    glow: 'rgba(255, 189, 0, 0.25)',
  },
  '10K': {
    hex: '#ff5400',        // Vibrant orange - intensity
    hexLight: '#ffe5d6',   // Pale orange tint
    textOnLight: '#7d2a00', // Dark orange for readability
    glow: 'rgba(255, 84, 0, 0.25)',
  },
  'HM': {
    hex: '#ff0054',        // Hot pink - endurance
    hexLight: '#ffcce0',   // Pale pink tint
    textOnLight: '#7d002a', // Dark pink for readability
    glow: 'rgba(255, 0, 84, 0.25)',
  },
  'M': {
    hex: '#9e0059',        // Magenta - power
    hexLight: '#f5ccdf',   // Pale magenta tint
    textOnLight: '#4f002d', // Dark magenta for readability
    glow: 'rgba(158, 0, 89, 0.25)',
  },
  'CUSTOM': {
    hex: '#390099',        // Deep purple - unique
    hexLight: '#daccf5',   // Pale purple tint
    textOnLight: '#1d004d', // Dark purple for readability
    glow: 'rgba(57, 0, 153, 0.25)',
  },
};

/**
 * Get color scheme for a specific distance
 */
export function getDistanceColors(distance: RaceDistance): DistanceColorScheme {
  return DISTANCE_COLORS[distance] || DISTANCE_COLORS.CUSTOM;
}

/**
 * Get readable distance label for display
 */
export function getDistanceLabel(distance: RaceDistance, customDistance?: number): string {
  if (distance === 'CUSTOM' && customDistance) {
    return `${customDistance} km`;
  }
  return distance;
}
