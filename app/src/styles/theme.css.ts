import { createGlobalTheme } from '@vanilla-extract/css';

export const vars = createGlobalTheme(':root', {
  color: {
    primary: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C5',
      400: '#38B2AC',
      500: '#319795',
      600: '#2C7A7B',
      700: '#285E61',
      800: '#234E52',
      900: '#1D4044',
    },
    gray: {
      50: '#F9FAFB',
      100: '#F2F4F7',
      200: '#E2E8F0',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#344054',
      800: '#1F2937',
      900: '#101828',
    },
    white: '#FFFFFF',
    black: '#000000',
    background: {
      primary: '#FFFFFF',
      secondary: '#F5F9FF',
    },
    border: {
      light: '#E2E8F0',
    },
  },
  font: {
    family: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      chart: 'Roboto Serif, Georgia, "Times New Roman", serif',
      mono: 'JetBrains Mono, "Fira Code", Consolas, monospace',
    },
    size: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
    },
    weight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
  },
  radius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
  },
});
