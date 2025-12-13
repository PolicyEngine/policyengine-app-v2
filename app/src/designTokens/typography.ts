// Comments indicate font variable names from Figma; these can be removed in the future

export const typography = {
  fontFamily: {
    display: "'Instrument Serif', Georgia, serif",
    primary: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    secondary: 'Public Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'JetBrains Mono, "Fira Code", Consolas, monospace',
  },

  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500, // Text sm/Medium from Figma
    semibold: 600, // Text sm/Semibold from Figma
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Font sizes and line heights from Figma
  fontSize: {
    xs: '12px',
    sm: '14px', // Text sm/Medium, Text sm/Semibold from Figma
    base: '16px', // text-md/lineHeight-6/font-normal, H5/regular from Figma
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
    // Specific line heights from Figma
    '20': '20px', // Text sm/Medium, Text sm/Semibold from Figma
    '22': '22px', // Body/regular from Figma
    '24': '24px', // text-md/lineHeight-6/font-normal, H5/regular from Figma
  },

  // TODO: Do we, in fact, use these styles?
  // Text styles from Figma design
  textStyles: {
    // Small text styles
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

    // Medium text styles
    'md-normal': {
      fontFamily: 'Public Sans',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },

    // Body text styles
    'body-regular': {
      fontFamily: 'Roboto',
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '22px',
    },

    // Heading styles
    'h5-regular': {
      fontFamily: 'Roboto',
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: '24px',
    },
  },
};
