/**
 * Chart color constants for PolicyEngine chart styling
 */

export const CHART_COLORS = {
  /** Blue color for reform line */
  REFORM_LINE: '#2563EB',

  /** Darker gray for base line when no reform exists */
  BASE_LINE_ALONE: '#4B5563',

  /** Lighter gray for base line when reform exists (to de-emphasize) */
  BASE_LINE_WITH_REFORM: '#9CA3AF',

  /** Size of markers on data points */
  MARKER_SIZE: 6,
} as const;
