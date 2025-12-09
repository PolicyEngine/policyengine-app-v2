/**
 * PolicyEngine Design Tokens - Typography
 *
 * "Quantitative Editorial" Design System
 *
 * Font Pairing Strategy:
 * - Display/Headlines: "Fraunces" - A characterful variable serif with subtle quirks
 *   that feels both authoritative and approachable (think: The Economist meets modern)
 * - Body/UI: "IBM Plex Sans" - A technical yet humanist sans-serif that reads
 *   beautifully at all sizes, perfect for data-heavy interfaces
 * - Monospace: "IBM Plex Mono" - Matching mono for code and data
 *
 * Note: Fonts are loaded via Google Fonts in index.html
 */

export const typography = {
  fontFamily: {
    // Display/Headlines - characterful serif for editorial impact
    display:
      '"Fraunces", "Playfair Display", Georgia, "Times New Roman", serif',

    // Primary UI - humanist technical sans
    primary:
      '"IBM Plex Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

    // Secondary - for contrast and emphasis
    secondary:
      '"Source Serif 4", "Merriweather", Georgia, serif',

    // Body - optimized for long-form reading
    body: '"IBM Plex Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

    // Monospace - for code and data
    mono: '"IBM Plex Mono", "JetBrains Mono", "Fira Code", Consolas, monospace',
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

  // Type scale - slightly larger for editorial impact
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem', // 72px
  },

  lineHeight: {
    none: '1',
    tight: '1.15',
    snug: '1.3',
    normal: '1.5',
    relaxed: '1.625',
    loose: '1.8',
    // Specific pixel values for legacy support
    '20': '20px',
    '22': '22px',
    '24': '24px',
    '28': '28px',
    '32': '32px',
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    caps: '0.15em', // For uppercase labels
  },

  // Pre-composed text styles
  textStyles: {
    // Hero headline - dramatic serif
    'hero-display': {
      fontFamily:
        '"Fraunces", "Playfair Display", Georgia, serif',
      fontSize: '4rem', // 64px
      fontWeight: 600,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },

    // Section headlines
    'section-title': {
      fontFamily:
        '"Fraunces", "Playfair Display", Georgia, serif',
      fontSize: '2.5rem', // 40px
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.015em',
    },

    // Card titles
    'card-title': {
      fontFamily:
        '"IBM Plex Sans", sans-serif',
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },

    // Editorial body - optimized for reading
    'body-editorial': {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '1.125rem', // 18px
      fontWeight: 400,
      lineHeight: 1.7,
      letterSpacing: '0',
    },

    // UI body
    'body-ui': {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: 1.5,
    },

    // Small body
    'body-small': {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: 1.5,
    },

    // Labels - uppercase small
    label: {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '0.75rem', // 12px
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
    },

    // Data/metrics
    'metric-large': {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '3rem', // 48px
      fontWeight: 700,
      lineHeight: 1,
      letterSpacing: '-0.02em',
    },

    // Code/technical
    code: {
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: 1.5,
    },

    // Navigation
    nav: {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '0.9375rem', // 15px
      fontWeight: 500,
      lineHeight: 1.2,
      letterSpacing: '0.01em',
    },

    // Button text
    button: {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '0.9375rem', // 15px
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '0.02em',
    },

    // Legacy support
    'sm-medium': {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '14px',
      fontWeight: 500,
      lineHeight: '20px',
    },
    'sm-semibold': {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '14px',
      fontWeight: 600,
      lineHeight: '20px',
    },
    'md-normal': {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },
    'body-regular': {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '22px',
    },
    'h5-regular': {
      fontFamily: '"IBM Plex Sans", sans-serif',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },
  },
};
