/**
 * Colors submodule for Mantine theme
 *
 * "Quantitative Editorial" Design System
 * Maps design token colors to Mantine color tuples.
 */
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

  // Accent (gold) for CTAs
  accent: [
    colors.accent[50],
    colors.accent[100],
    colors.accent[200],
    colors.accent[300],
    colors.accent[400],
    colors.accent[500],
    colors.accent[600],
    colors.accent[700],
    colors.accent[800],
    colors.accent[900],
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

  // Alias: teal maps to primary
  teal: [
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
};
