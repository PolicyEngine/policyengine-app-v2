/**
 * PolicyEngine Chart Utilities
 * Shared chart formatting for Plotly.js charts
 */

import { colors, TEAL_PRIMARY } from '../tokens/colors';
import { typography } from '../tokens/typography';

/**
 * Standard chart colors for PolicyEngine visualizations
 */
export const chartColors = {
  primary: TEAL_PRIMARY,
  secondary: colors.gray[400],
  baseline: colors.gray[300],
  positive: colors.success,
  negative: colors.error,
  neutral: colors.gray[500],
  // For multi-series charts
  series: [
    TEAL_PRIMARY,
    colors.blue[500],
    colors.primary[700],
    colors.blue[700],
    colors.gray[500],
  ],
} as const;

/**
 * Standard Plotly layout configuration for PolicyEngine charts
 */
export const chartLayout = {
  font: {
    family: typography.fontFamily.chart,
    color: colors.text.primary,
    size: 14,
  },
  paper_bgcolor: colors.white,
  plot_bgcolor: colors.white,
  margin: {
    l: 60,
    r: 40,
    t: 40,
    b: 60,
  },
  showlegend: true,
  legend: {
    orientation: 'h' as const,
    yanchor: 'bottom' as const,
    y: 1.02,
    xanchor: 'right' as const,
    x: 1,
  },
  xaxis: {
    gridcolor: colors.border.light,
    zerolinecolor: colors.border.medium,
  },
  yaxis: {
    gridcolor: colors.border.light,
    zerolinecolor: colors.border.medium,
  },
} as const;

/**
 * Standard chart dimensions
 */
export const chartDimensions = {
  default: {
    width: 800,
    height: 600,
  },
  compact: {
    width: 600,
    height: 400,
  },
  wide: {
    width: 1000,
    height: 500,
  },
  square: {
    width: 600,
    height: 600,
  },
} as const;

/**
 * PolicyEngine logo image configuration for chart watermarks
 */
export const chartLogo = {
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
} as const;

/**
 * Format configuration object for creating Plotly charts
 * Compatible with both React (react-plotly.js) and Python (plotly.py)
 */
export interface ChartConfig {
  layout: typeof chartLayout;
  config: {
    displayModeBar: boolean;
    responsive: boolean;
  };
  style: {
    width: string;
    height: string;
  };
}

export function getChartConfig(
  dimensions: keyof typeof chartDimensions = 'default'
): ChartConfig {
  const dims = chartDimensions[dimensions];
  return {
    layout: chartLayout,
    config: {
      displayModeBar: false,
      responsive: true,
    },
    style: {
      width: `${dims.width}px`,
      height: `${dims.height}px`,
    },
  };
}

/**
 * Currency formatter for chart axis labels
 */
export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(1)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Percentage formatter for chart axis labels
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
