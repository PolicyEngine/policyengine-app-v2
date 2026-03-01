/**
 * Chart color constants for PolicyEngine chart styling
 */

import { colors } from '@/designTokens';

export const CHART_COLORS = {
  /** Teal-700 color for reform line (matches buttons and primary brand color) */
  REFORM_LINE: colors.primary[700],

  /** Full black for base line when no reform exists */
  BASE_LINE_ALONE: colors.black,

  /** Lighter gray for base line when reform exists (to de-emphasize) */
  BASE_LINE_WITH_REFORM: colors.gray[400],

  /** Size of markers on data points */
  MARKER_SIZE: 6,

  /** Full black for chart text, labels, and axes */
  CHART_TEXT: colors.black,

  /** White background for plot area */
  PLOT_BACKGROUND: colors.white,

  /** Transparent background for overall chart */
  CHART_BACKGROUND: 'transparent',
} as const;
