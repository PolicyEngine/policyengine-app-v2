/**
 * PolicyEngine typography system
 * Source of truth for fonts, sizes, and text styles
 */

export const typography = {
  fontFamily: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    secondary: 'Public Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'JetBrains Mono, "Fira Code", Consolas, monospace',
    // Chart-specific font
    chart: 'Roboto Serif, Georgia, "Times New Roman", serif',
  },

  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '28px',
    '4xl': '32px',
  },

  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
    '20': '20px',
    '22': '22px',
    '24': '24px',
  },

  // Pre-defined text styles
  textStyles: {
    'sm-medium': {
      fontFamily: 'Inter',
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '20px',
    },
    'sm-semibold': {
      fontFamily: 'Inter',
      fontSize: '14px',
      fontWeight: 600,
      lineHeight: '20px',
    },
    'md-normal': {
      fontFamily: 'Public Sans',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },
    'body-regular': {
      fontFamily: 'Roboto',
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '22px',
    },
    'h5-regular': {
      fontFamily: 'Roboto',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },
  },
} as const;

// Convenience exports for common fonts
export const FONT_UI = typography.fontFamily.primary;
export const FONT_CHART = typography.fontFamily.chart;
export const FONT_MONO = typography.fontFamily.mono;

export type Typography = typeof typography;
