/**
 * Chart-specific constants for policy parameter visualization
 */

// Chart date ranges
export const DEFAULT_CHART_START_DATE = '2015-01-01';
export const YEARS_INTO_FUTURE_FOR_CHART = 10;

// Calculate dynamically based on current year
const currentYear = new Date().getFullYear();
export const DEFAULT_CHART_END_DATE = `${currentYear + YEARS_INTO_FUTURE_FOR_CHART}-12-31`;

// For visual display extension
export const CHART_DISPLAY_EXTENSION_DATE = '2099-12-31';
