/**
 * Modal design system
 * Centralized styling constants for consistent modal appearance
 */

export const modalDesign = {
  // Animation timings
  animation: {
    duration: 250,
    overlayDuration: 200,
    contentDelay: 50,
  },

  // Sizing
  sizes: {
    xs: 400,
    sm: 500,
    md: 600,
    lg: 800,
    xl: 1000,
  },

  // Border radius
  radius: {
    outer: 16,
    inner: 8,
    button: 8,
  },

  // Spacing
  spacing: {
    header: 24,
    content: 24,
    footer: 20,
    gap: 16,
  },

  // Colors (matching app theme)
  colors: {
    overlay: 'rgba(0, 0, 0, 0.45)',
    border: '#e5e7eb',
    divider: '#f3f4f6',
    iconBackground: '#f9fafb',
    primary: '#319795',
    primaryHover: '#2c8a88',
    secondary: '#64748b',
    secondaryHover: '#475569',
  },

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1) 0px 20px 60px',

  // Transitions
  transitions: {
    fade: {
      in: { opacity: 1 },
      out: { opacity: 0 },
      transitionProperty: 'opacity',
    },
    scale: {
      in: { opacity: 1, transform: 'scale(1)' },
      out: { opacity: 0, transform: 'scale(0.96)' },
      common: { transformOrigin: 'center' },
      transitionProperty: 'opacity, transform',
    },
    slideUp: {
      in: { opacity: 1, transform: 'translateY(0)' },
      out: { opacity: 0, transform: 'translateY(20px)' },
      transitionProperty: 'opacity, transform',
    },
  },
} as const;

/**
 * Step indicator design system
 */
export const stepIndicatorDesign = {
  size: 32,
  lineWidth: 40,
  lineHeight: 2,
  spacing: 8,
  colors: {
    active: '#319795',
    completed: '#319795',
    pending: '#cbd5e1',
    text: {
      active: '#ffffff',
      completed: '#ffffff',
      pending: '#64748b',
    },
  },
} as const;
