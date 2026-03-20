import { colors } from '@/designTokens';

/**
 * Color scale definition
 */
export interface ColorScale {
  name: string;
  colors: string[];
  description: string;
}

/**
 * Diverging color scale for positive/negative values
 * Gray (negative) → Subtle background (neutral) → Teal (positive)
 *
 * Uses design tokens from the primary brand palette:
 * - Dark gray (#344054) for most negative values
 * - Medium gray (#9CA3AF) for moderately negative values
 * - Light background (#F1F5F9) for neutral/near-zero values
 * - Light teal (#81E6D9) for moderately positive values
 * - Teal (#2C7A7B) for most positive values
 */
export const DIVERGING_GRAY_BLUE: ColorScale = {
  name: 'diverging-gray-blue',
  colors: [
    colors.gray[700],
    colors.gray[400],
    colors.background.tertiary,
    colors.primary[200],
    colors.primary[600],
  ],
  description: 'Gray for negative, teal for positive values',
};

/**
 * Diverging color scale for positive/negative values using teal primary
 * Gray (negative) → White (neutral) → Teal (positive)
 *
 * Uses design tokens from the primary teal color palette
 */
export const DIVERGING_GRAY_TEAL: ColorScale = {
  name: 'diverging-gray-teal',
  colors: [
    colors.gray[700], // Dark gray (most negative)
    colors.gray[400], // Medium gray
    colors.background.tertiary,
    colors.primary[200], // Light teal
    colors.primary[600], // Teal (most positive)
  ],
  description: 'Gray for negative, teal for positive values',
};

/**
 * Get color scale by name or return default
 *
 * @param name - Name of the color scale to retrieve
 * @returns Array of color strings
 *
 * @example
 * ```typescript
 * const colors = getColorScale('diverging-gray-blue');
 * const tealColors = getColorScale('diverging-gray-teal');
 * ```
 */
export function getColorScale(name?: string): string[] {
  if (name === 'diverging-gray-blue') {
    return DIVERGING_GRAY_BLUE.colors;
  }
  if (name === 'diverging-gray-teal') {
    return DIVERGING_GRAY_TEAL.colors;
  }
  return DIVERGING_GRAY_TEAL.colors; // Default to teal (primary brand color)
}

/**
 * Interpolate a color from a multi-stop color scale based on a value within a range.
 *
 * @param value - The value to map to a color
 * @param min - Minimum of the range
 * @param max - Maximum of the range
 * @param scaleColors - Array of hex color strings defining the scale stops
 * @returns Hex color string (e.g., '#3a7f5c')
 */
export function interpolateColor(
  value: number,
  min: number,
  max: number,
  scaleColors: string[]
): string {
  if (scaleColors.length === 0) {
    return '#000000';
  }
  if (scaleColors.length === 1 || min >= max) {
    return scaleColors[0];
  }

  // Clamp to [0, 1]
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Map t to a position across (scaleColors.length - 1) segments
  const segments = scaleColors.length - 1;
  const segPos = t * segments;
  const segIndex = Math.min(Math.floor(segPos), segments - 1);
  const segT = segPos - segIndex;

  const c0 = parseHex(scaleColors[segIndex]);
  const c1 = parseHex(scaleColors[segIndex + 1]);

  const r = Math.round(c0.r + (c1.r - c0.r) * segT);
  const g = Math.round(c0.g + (c1.g - c0.g) * segT);
  const b = Math.round(c0.b + (c1.b - c0.b) * segT);

  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function parseHex(color: string): { r: number; g: number; b: number } {
  const c = color.replace('#', '');
  return {
    r: parseInt(c.slice(0, 2), 16),
    g: parseInt(c.slice(2, 4), 16),
    b: parseInt(c.slice(4, 6), 16),
  };
}

function hex(n: number): string {
  return n.toString(16).padStart(2, '0');
}
