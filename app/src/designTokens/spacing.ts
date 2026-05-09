/**
 * Spacing tokens - use CSS variables instead where possible
 * Base spacing available as var(--spacing-xs), var(--spacing-sm), etc.
 */

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px',
  '5xl': '64px',

  component: {
    input: {
      height: '40px',
    },
  },
} as const;
