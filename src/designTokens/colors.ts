// Color palette extracted from Figma design
// TODO: Replace placeholder values with actual colors from Figma file
// Figma URL: https://www.figma.com/design/ZZLB3A5QNYy97d7dBEPpQ8/PE-App-Redesign---Final-Screens?node-id=3001-11423&t=MubKLVLmhUhzdzkG-4

export const colors = {
  // Primary brand color - teal
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
  
  // Secondary colors - extract from secondary UI elements, cards, borders
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0', // Light borders, dividers
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b', // Secondary text, icons
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Semantic colors - extract from success, warning, error states
  success: '#22c55e', // Extract from success messages, checkmarks
  warning: '#f59e0b', // Extract from warning messages, alerts
  error: '#ef4444',   // Extract from error messages, validation
  info: '#3b82f6',    // Extract from info messages, tooltips
  
  // Neutral colors - extract from text, backgrounds, borders
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#f9fafb',   // Lightest backgrounds
    100: '#f3f4f6',
    200: '#e5e7eb',  // Light borders
    300: '#d1d5db',
    400: '#9ca3af',  // Placeholder text
    500: '#6b7280',  // Secondary text
    600: '#4b5563',
    700: '#374151',  // Primary text
    800: '#1f2937',
    900: '#111827',  // Darkest text
  },
  
  // Background colors - extract from page backgrounds, cards, modals
  background: {
    primary: '#ffffff',   // Main page background
    secondary: '#f8fafc', // Card backgrounds
    tertiary: '#f1f5f9',  // Modal backgrounds
  },
  
  // Text colors - extract from different text elements
  text: {
    primary: '#111827',   // Main text color
    secondary: '#6b7280', // Secondary text
    tertiary: '#9ca3af',  // Muted text
    inverse: '#ffffff',    // Text on dark backgrounds
  },
};
