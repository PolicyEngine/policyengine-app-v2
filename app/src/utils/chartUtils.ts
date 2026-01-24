/**
 * General chart utility functions
 */

import { typography } from '@/designTokens';

/**
 * Gets the label for the reform policy line in parameter charts
 *
 * Priority order:
 * 1. Policy label (if provided)
 * 2. Policy ID formatted as "Policy #123" (if provided)
 * 3. Default "Reform" label
 *
 * @param policyLabel - Optional custom label for the policy
 * @param policyId - Optional policy ID number
 * @returns The label to display for the reform line
 */
export function getReformPolicyLabel(
  policyLabel?: string | null,
  policyId?: number | null
): string {
  if (policyLabel) {
    return policyLabel;
  }

  if (policyId !== null && policyId !== undefined) {
    return `Policy #${policyId}`;
  }

  return 'Reform';
}

/**
 * Downloads data as a CSV file
 * @param data - 2D array of data to export
 * @param filename - Name of the file to download
 */
export function downloadCsv(data: string[][], filename: string): void {
  const csvContent = data.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement('a');
  tempLink.href = url;
  tempLink.setAttribute('download', filename);
  tempLink.click();
  URL.revokeObjectURL(url);
}

/**
 * Default Plotly chart configuration
 */
export const DEFAULT_CHART_CONFIG = {
  displayModeBar: false,
  responsive: true,
};

/**
 * Default font configuration for all charts
 * Matches the app's primary font (Inter)
 */
export const CHART_FONT = {
  family: typography.fontFamily.primary,
};

/**
 * Default layout properties that should be applied to all charts
 * Spread this into your layout object to automatically include font settings
 */
export const DEFAULT_CHART_LAYOUT = {
  font: CHART_FONT,
};

/**
 * Returns base layout configuration for charts
 * @param mobile - Whether the chart is being rendered on mobile
 * @returns Plotly layout object
 */
export function getBaseChartLayout(mobile: boolean) {
  return {
    ...DEFAULT_CHART_LAYOUT,
    height: mobile ? 300 : 500,
    margin: { t: 40, r: 20, b: 60, l: 80 },
    xaxis: { fixedrange: true },
    yaxis: { fixedrange: true },
  };
}

/**
 * Calculate responsive chart height with min/max constraints
 * @param viewportHeight - Current viewport height in pixels
 * @param mobile - Whether the chart is being rendered on mobile
 * @returns Clamped chart height in pixels
 */
export function getClampedChartHeight(viewportHeight: number, mobile: boolean): number {
  const targetHeight = mobile ? viewportHeight * 0.4 : viewportHeight * 0.5;
  const minHeight = mobile ? 250 : 400;
  const maxHeight = mobile ? 400 : 700;

  return Math.max(minHeight, Math.min(maxHeight, targetHeight));
}

/**
 * Chart logo image configuration for Plotly watermarks
 */
export interface ChartLogoOptions {
  /** X position (0-1, where 1 is right edge) */
  x?: number;
  /** Y position (0-1, where 0 is bottom edge) */
  y?: number;
  /** X size as fraction of chart width */
  sizex?: number;
  /** Y size as fraction of chart height */
  sizey?: number;
  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Default chart logo configuration
 */
const DEFAULT_CHART_LOGO = {
  source: '/assets/logos/policyengine/teal-square.png',
  xref: 'paper' as const,
  yref: 'paper' as const,
  x: 1,
  y: 0,
  sizex: 0.1,
  sizey: 0.1,
  xanchor: 'right' as const,
  yanchor: 'bottom' as const,
  opacity: 0.8,
};

/**
 * Returns the PolicyEngine logo image configuration for Plotly charts
 * Use in layout.images array to add watermark to bottom-right corner
 *
 * @param options - Optional overrides for position, size, or opacity
 * @returns Plotly image configuration object
 *
 * @example
 * const layout = {
 *   images: [getChartLogoImage()],
 *   // ... other layout options
 * };
 */
export function getChartLogoImage(options?: ChartLogoOptions) {
  return {
    ...DEFAULT_CHART_LOGO,
    ...options,
  };
}
