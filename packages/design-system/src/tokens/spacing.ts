/**
 * PolicyEngine spacing system
 * Source of truth for spacing, layout, and border radius
 */

export const spacing = {
  // Base spacing scale
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px',
  '5xl': '64px',

  // Component-specific spacing
  component: {
    button: {
      padding: '8px 14px',
      height: '36px',
    },
    input: {
      padding: '8px 12px',
      height: '40px',
      compactWidth: '120px',
    },
    badge: {
      padding: '4px 12px',
    },
    menu: {
      itemPadding: '6px 24px',
      itemHeight: '40px',
    },
    tab: {
      padding: '12px 16px',
    },
  },

  // Layout spacing
  layout: {
    sidebar: '79px',
    sidebarWidth: '280px',
    header: '58px',
    content: '1361px',
    container: '976px',
    sideGutter: '200px',
  },

  // AppShell design tokens
  appShell: {
    header: {
      height: '58px',
      padding: '8px 16px',
    },
    navbar: {
      width: '300px',
      padding: '0px',
      breakpoint: 'sm',
    },
    aside: {
      width: '300px',
      padding: '16px',
      breakpoint: 'md',
    },
    footer: {
      height: '60px',
      padding: '12px 24px',
    },
    main: {
      padding: '24px',
      minHeight: '100vh',
    },
  },

  // Container padding
  container: {
    xs: '16px',
    sm: '24px',
    md: '32px',
    lg: '48px',
    xl: '64px',
    '2xl': '80px',
  },

  // Border radius scale
  radius: {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    '4xl': '32px',
  },
} as const;

export type Spacing = typeof spacing;
