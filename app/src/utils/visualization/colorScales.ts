import { colors } from '@/designTokens/colors';

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
 * Gray (negative) → Light gray (neutral) → Blue (positive)
 *
 * Uses design tokens from the existing color palette:
 * - Dark gray (#344054) for most negative values
 * - Medium gray (#9CA3AF) for moderately negative values
 * - Light gray (#F2F4F7) for neutral/near-zero values
 * - Light blue (#BAE6FD) for moderately positive values
 * - Blue (#0284C7) for most positive values
 */
export const DIVERGING_GRAY_BLUE: ColorScale = {
  name: 'diverging-gray-blue',
  colors: [
    colors.gray[700], // Dark gray (most negative) - #344054
    colors.gray[400], // Medium gray - #9CA3AF
    colors.gray[100], // Light gray (neutral) - #F2F4F7
    colors.blue[200], // Light blue - #BAE6FD
    colors.blue[600], // Blue (most positive) - #0284C7
  ],
  description: 'Gray for negative, blue for positive values',
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
 * // colors = ['#344054', '#9CA3AF', '#F2F4F7', '#BAE6FD', '#0284C7']
 * ```
 */
export function getColorScale(name?: string): string[] {
  if (name === 'diverging-gray-blue') {
    return DIVERGING_GRAY_BLUE.colors;
  }
  return DIVERGING_GRAY_BLUE.colors; // Default
}
