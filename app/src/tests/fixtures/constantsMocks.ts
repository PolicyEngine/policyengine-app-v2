// Expected values for chart constants

export const EXPECTED_CHART_START_DATE = '1900-01-01';
export const EXPECTED_CURRENT_YEAR = '2025';
export const EXPECTED_CHART_END_DATE = '2035-12-31'; // 2025 + 10 years

// Expected chart colors (matching Mantine theme colors)
export const EXPECTED_COLORS = {
  REFORM: '#2563eb',
  BASELINE_WITH_REFORM: '#6b7280',
  BASELINE_NO_REFORM: '#374151',
  PLOT_BACKGROUND: '#f8f9fa',
  GRID: '#e9ecef',
  AXIS_LINE: '#dee2e6',
} as const;

// Expected chart dimensions
export const EXPECTED_DIMENSIONS = {
  DESKTOP_HEIGHT: 400,
  MOBILE_HEIGHT_RATIO: 0.5,
  MIN_HEIGHT: 300,
} as const;

// Expected chart margins
export const EXPECTED_MARGINS_DESKTOP = {
  top: 60,
  right: 40,
  left: 60,
  bottom: 40,
} as const;

export const EXPECTED_MARGINS_MOBILE = {
  top: 80,
  right: 50,
  left: 50,
  bottom: 30,
} as const;

// Test helper to validate hex color format
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

// Test helper to validate date format (YYYY-MM-DD)
export function isValidDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// Test helper to validate date is parseable
export function isValidDate(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}
