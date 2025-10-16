import { CURRENT_YEAR } from '@/constants';

/**
 * Default start date for parameter-over-time charts
 * Used to establish the minimum x-axis range
 */
export const DEFAULT_CHART_START_DATE = '1900-01-01';

/**
 * Default end date for parameter-over-time charts
 * Set to 10 years from current year to prevent charts from extending too far into the future
 */
export const DEFAULT_CHART_END_DATE = `${parseInt(CURRENT_YEAR) + 10}-12-31`;

/**
 * Chart colors for parameter visualization
 */
export const CHART_COLORS = {
  /** Color for reform/proposed policy trace (blue) */
  REFORM: '#2563eb', // blue.600 from Mantine theme
  /** Color for baseline trace when reform exists (medium gray) */
  BASELINE_WITH_REFORM: '#6b7280', // gray.600 from Mantine theme
  /** Color for baseline trace when no reform exists (dark gray) */
  BASELINE_NO_REFORM: '#374151', // gray.800 from Mantine theme
  /** Background color for chart plot area */
  PLOT_BACKGROUND: '#f8f9fa', // gray.0 from Mantine theme
  /** Grid line color */
  GRID: '#e9ecef', // gray.2 from Mantine theme
  /** Axis line color */
  AXIS_LINE: '#dee2e6', // gray.3 from Mantine theme
} as const;

/**
 * Chart dimensions and responsive breakpoints
 */
export const CHART_DIMENSIONS = {
  /** Desktop chart height in pixels */
  DESKTOP_HEIGHT: 400,
  /** Mobile chart height as fraction of viewport height */
  MOBILE_HEIGHT_RATIO: 0.5,
  /** Minimum chart height in pixels */
  MIN_HEIGHT: 300,
} as const;

/**
 * Chart margins for responsive design
 */
export const CHART_MARGINS = {
  DESKTOP: {
    top: 60,
    right: 40,
    left: 60,
    bottom: 40,
  },
  MOBILE: {
    top: 80,
    right: 50,
    left: 50,
    bottom: 30,
  },
} as const;
