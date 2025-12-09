/**
 * PolicyEngine Design Tokens - Spacing & Layout
 *
 * "Quantitative Editorial" Design System
 *
 * Generous whitespace is key to editorial design. These values support
 * a more spacious, breathable layout while maintaining usability.
 */

export const spacing = {
  // Base spacing scale (rem-based for accessibility)
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  lg: '1rem', // 16px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem', // 32px
  '4xl': '3rem', // 48px
  '5xl': '4rem', // 64px
  '6xl': '6rem', // 96px
  '7xl': '8rem', // 128px

  // Component-specific spacing
  component: {
    button: {
      paddingXS: '0.5rem 0.875rem',
      paddingSM: '0.625rem 1rem',
      paddingMD: '0.75rem 1.25rem',
      paddingLG: '0.875rem 1.5rem',
      height: '2.5rem', // 40px
    },
    input: {
      padding: '0.625rem 0.875rem',
      height: '2.5rem',
      compactWidth: '7.5rem',
    },
    badge: {
      padding: '0.25rem 0.625rem',
    },
    card: {
      padding: '1.5rem', // 24px
      paddingLG: '2rem', // 32px
      gap: '1.25rem', // 20px
    },
    menu: {
      itemPadding: '0.625rem 1rem',
      itemHeight: '2.5rem',
    },
    tab: {
      padding: '0.875rem 1.25rem',
    },
  },

  // Layout dimensions
  layout: {
    header: '4rem', // 64px - slightly taller for editorial presence
    headerLarge: '5rem', // 80px - for marketing pages
    sidebarWidth: '17.5rem', // 280px
    sidebarCollapsed: '4rem', // 64px
    content: '85rem', // 1360px
    container: '64rem', // 1024px - standard content width
    containerNarrow: '48rem', // 768px - for long-form reading
    containerWide: '80rem', // 1280px - for data-heavy pages
    sideGutter: '12.5rem', // 200px
  },

  // AppShell design tokens
  appShell: {
    header: {
      height: '4rem',
      padding: '0.75rem 1.5rem',
    },
    navbar: {
      width: '18rem',
      padding: '0',
      breakpoint: 'sm',
    },
    aside: {
      width: '18rem',
      padding: '1rem',
      breakpoint: 'md',
    },
    footer: {
      height: '4rem',
      padding: '1rem 2rem',
    },
    main: {
      padding: '2rem',
      minHeight: '100vh',
    },
  },

  // Container padding (responsive)
  container: {
    xs: '1rem',
    sm: '1.5rem',
    md: '2rem',
    lg: '3rem',
    xl: '4rem',
    '2xl': '6rem',
  },

  // Section spacing for page layouts
  section: {
    paddingY: '4rem', // 64px
    paddingYLarge: '6rem', // 96px
    gap: '3rem', // 48px between sections
  },

  // Grid gutters
  grid: {
    gap: '1.5rem', // 24px
    gapLG: '2rem', // 32px
    gapXL: '3rem', // 48px
  },

  // Border radius scale
  radius: {
    none: '0',
    xs: '0.125rem', // 2px
    sm: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    '4xl': '2rem', // 32px
    full: '9999px', // Pill shape
  },

  // Shadows
  shadow: {
    xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
    sm: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
    xl: '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
    '2xl': '0 25px 50px -12px rgba(15, 23, 42, 0.2)',
    inner: 'inset 0 2px 4px rgba(15, 23, 42, 0.06)',
    // Colored shadow for hover states
    glow: '0 0 20px rgba(26, 158, 145, 0.15)',
    glowStrong: '0 0 40px rgba(26, 158, 145, 0.25)',
  },

  // Transitions
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Z-index scale
  zIndex: {
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modalBackdrop: 400,
    modal: 500,
    popover: 600,
    tooltip: 700,
    toast: 800,
  },
};
