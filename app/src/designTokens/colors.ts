/**
 * PolicyEngine Design Tokens - Colors
 *
 * "Quantitative Editorial" Design System
 * Inspired by The Economist, Bloomberg, and modern think-tank aesthetics
 *
 * A sophisticated palette that balances analytical authority with warmth.
 * Deep teals anchor the brand, gold accents create visual interest,
 * and a refined gray scale provides professional foundation.
 */

export const colors = {
  // Primary brand colors - Deep Teal (evolved from original)
  // More saturated and dramatic for editorial impact
  primary: {
    50: '#E8FAF8',
    100: '#C3F2ED',
    200: '#8FE5DD',
    300: '#52D4C7',
    400: '#2BB8AA',
    500: '#1A9E91', // Core brand - richer than before
    600: '#147A73', // Header/footer background
    700: '#10605A',
    800: '#0C4A45',
    900: '#082F2C', // Darkest - for dramatic sections
    alpha: {
      10: '#1A9E911A',
      20: '#1A9E9133',
      40: '#1A9E9166',
      60: '#1A9E9199',
    },
  },

  // Accent - Warm Gold/Amber
  // For CTAs, highlights, and data emphasis
  accent: {
    50: '#FFF9E6',
    100: '#FFEFC0',
    200: '#FFE08A',
    300: '#FFD054',
    400: '#FFC629', // Primary CTA
    500: '#E6A800', // Hover state
    600: '#B38200',
    700: '#805C00',
    800: '#4D3700',
    900: '#1A1200',
  },

  // Secondary - Slate Blue Gray
  // For sophisticated neutrals with depth
  secondary: {
    50: '#F7F9FC',
    100: '#EEF2F7',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B', // Deep text
    900: '#0F172A', // Darkest
  },

  // Blue - Data visualization primary
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Semantic colors
  success: '#059669', // Emerald 600
  warning: '#D97706', // Amber 600
  error: '#DC2626', // Red 600
  info: '#0284C7', // Sky 600

  // Core
  white: '#FFFFFF',
  black: '#0A0A0A', // Soft black

  // Gray scale - refined warm-cool balance
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },

  // Background colors
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFBFC', // Subtle cool gray
    tertiary: '#F1F5F9', // Slate 100
    elevated: '#FFFFFF',
    editorial: '#F8F6F3', // Warm paper-like
    dark: '#0F172A', // For inverted sections
  },

  // Text colors
  text: {
    primary: '#1E293B', // Slate 800 - softer than pure black
    secondary: '#475569', // Slate 600
    tertiary: '#64748B', // Slate 500
    muted: '#94A3B8', // Slate 400
    inverse: '#FFFFFF',
    editorial: '#1A1A1A', // For long-form reading
  },

  // Border colors
  border: {
    light: '#E2E8F0',
    medium: '#CBD5E1',
    dark: '#94A3B8',
    editorial: '#D1D5DB', // Slightly warmer
  },

  // Shadow colors
  shadow: {
    light: 'rgba(15, 23, 42, 0.04)',
    medium: 'rgba(15, 23, 42, 0.08)',
    dark: 'rgba(15, 23, 42, 0.16)',
    colored: 'rgba(26, 158, 145, 0.15)', // Teal-tinted shadow
  },

  // Chart/Data visualization palette
  chart: {
    primary: '#1A9E91',
    secondary: '#3B82F6',
    tertiary: '#8B5CF6',
    quaternary: '#EC4899',
    positive: '#059669',
    negative: '#DC2626',
    neutral: '#64748B',
  },

  // Legacy support - mapped to new values
  teal: {
    500: '#1A9E91',
  },
};
