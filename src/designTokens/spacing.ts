// Spacing design tokens extracted from Figma design
// Comments indicate spacing usage from Figma; these can be removed in the future
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

  
  // TODO: Evaluate these spacing values
  // Component-specific spacing
  component: {
    button: {
      padding: '8px 14px',
      height: '36px',
    },
    input: {
      padding: '8px 12px',
      height: '40px',
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
  
  // TODO: See if these values can be made dynamic
  // Layout spacing from Figma
  layout: {
    sidebar: '79px',
    header: '76px',
    content: '1361px',
    container: '976px',
    sideGutter: '200px' // TODO: Make this responsive/attempt to use 'container'
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
};
