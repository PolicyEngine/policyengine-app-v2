// Colors submodule for Mantine theme
import type { MantineColorsTuple } from '@mantine/core';
import { colors } from '../designTokens';

export const themeColors: Record<string, MantineColorsTuple> = {
  primary: [
    colors.primary[50],
    colors.primary[100],
    colors.primary[200],
    colors.primary[300],
    colors.primary[400],
    colors.primary[500],
    colors.primary[600],
    colors.primary[700],
    colors.primary[800],
    colors.primary[900],
  ] as MantineColorsTuple,

  secondary: [
    colors.secondary[50],
    colors.secondary[100],
    colors.secondary[200],
    colors.secondary[300],
    colors.secondary[400],
    colors.secondary[500],
    colors.secondary[600],
    colors.secondary[700],
    colors.secondary[800],
    colors.secondary[900],
  ] as MantineColorsTuple,

  blue: [
    colors.blue[50],
    colors.blue[100],
    colors.blue[200],
    colors.blue[300],
    colors.blue[400],
    colors.blue[500],
    colors.blue[600],
    colors.blue[700],
    colors.blue[800],
    colors.blue[900],
  ] as MantineColorsTuple,

  gray: [
    colors.gray[50],
    colors.gray[100],
    colors.gray[200],
    colors.gray[300],
    colors.gray[400],
    colors.gray[500],
    colors.gray[600],
    colors.gray[700],
    colors.gray[800],
    colors.gray[900],
  ] as MantineColorsTuple,

  // Teal uses raw hex values (not CSS vars) for Mantine's internal color calculations
  // Structured so primaryShade can select correct color for light (6) and dark (4) modes
  teal: [
    '#E6FFFA', // 0 - lightest
    '#B2F5EA', // 1
    '#81E6D9', // 2
    '#4FD1C5', // 3
    '#0D9488', // 4 - dark mode button color (from redesign)
    '#319795', // 5
    '#2C7A7B', // 6 - light mode button color
    '#285E61', // 7
    '#234E52', // 8
    '#1D4044', // 9 - darkest
  ] as MantineColorsTuple,
};
