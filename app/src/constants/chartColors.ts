/**
 * Chart color constants for PolicyEngine chart styling
 */

export const CHART_COLORS = {
  /** Teal-700 color for reform line (matches buttons and primary brand color) */
  REFORM_LINE: '#285E61',

  /** Full black for base line when no reform exists */
  BASE_LINE_ALONE: '#000000',

  /** Lighter gray for base line when reform exists (to de-emphasize) */
  BASE_LINE_WITH_REFORM: '#9CA3AF',

  /** Size of markers on data points */
  MARKER_SIZE: 6,

  /** Full black for chart text, labels, and axes */
  CHART_TEXT: '#000000',

  /** White background for plot area */
  PLOT_BACKGROUND: '#FFFFFF',

  /** Transparent background for overall chart */
  CHART_BACKGROUND: 'transparent',
} as const;
