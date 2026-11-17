import { colors } from '@/designTokens';
import type { BaselineFile, BaselineMetricKey } from './baselineData';

/** Seven teal steps, light to dark: one hue, so the map reads as "more" and "less". */
export const SCALE_COLORS = [
  colors.primary[50],
  colors.primary[100],
  colors.primary[200],
  colors.primary[300],
  colors.primary[500],
  colors.primary[700],
  colors.primary[900],
] as const;

export const NO_DATA_COLOR = colors.gray[200];

export interface ColorScale {
  color: (value: number | undefined) => string;
  min: number;
  max: number;
}

/**
 * Equal-width steps from the smallest value to the largest. The page
 * builds one scale per metric and level from every region of that level,
 * so a color means the same value at every zoom.
 */
export function colorScale(values: number[]): ColorScale {
  const finite = values.filter(Number.isFinite);
  const min = finite.length ? Math.min(...finite) : 0;
  const max = finite.length ? Math.max(...finite) : 0;
  const span = max - min;
  return {
    min,
    max,
    color: (value) => {
      if (value === undefined || !Number.isFinite(value)) {
        return NO_DATA_COLOR;
      }
      if (span === 0) {
        return SCALE_COLORS[Math.floor(SCALE_COLORS.length / 2)];
      }
      const step = Math.floor(((value - min) / span) * SCALE_COLORS.length);
      return SCALE_COLORS[Math.min(SCALE_COLORS.length - 1, Math.max(0, step))];
    },
  };
}

/**
 * The scale for one metric across every state, or every district: the
 * map and the ranked list share it.
 */
export function levelScale(
  file: BaselineFile,
  metric: BaselineMetricKey,
  level: 'state' | 'district'
): ColorScale {
  const prefix = level === 'district' ? 'congressional_district/' : 'state/';
  return colorScale(
    Object.entries(file.regions)
      .filter(([name]) => name.startsWith(prefix))
      .map(([, region]) => region.metrics[metric])
      .filter((value): value is number => value !== undefined)
  );
}
