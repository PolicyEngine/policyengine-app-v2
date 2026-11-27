import { colors } from '@/designTokens';

/** Where a value sits between the low and the high end of a measure: 0 to 1. */
export interface ReliefScale {
  low: number;
  high: number;
  position: (value: number) => number;
}

function quantile(sorted: number[], q: number): number {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))];
}

/**
 * The scale the relief model and the skyline share. Its ends are the
 * 2nd and 98th percentiles, so one extreme state does not flatten the
 * other fifty; values past an end sit at that end.
 */
export function reliefScale(values: number[]): ReliefScale {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const low = sorted.length ? quantile(sorted, 0.02) : 0;
  const high = sorted.length ? quantile(sorted, 0.98) : 0;
  const span = high - low;
  return {
    low,
    high,
    position: (value) => (span > 0 ? Math.min(1, Math.max(0, (value - low) / span)) : 0.5),
  };
}

/** One hue, light to dark: a taller block is also a darker one. */
const STOPS = [colors.primary[50], colors.primary[400], colors.primary[900]] as const;

function channels(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** The color for a position on the scale (0 to 1), as "#rrggbb". */
export function reliefColor(position: number): string {
  const t = Math.min(1, Math.max(0, position)) * (STOPS.length - 1);
  const index = Math.min(STOPS.length - 2, Math.floor(t));
  const from = channels(STOPS[index]);
  const to = channels(STOPS[index + 1]);
  const mixed = from.map((channel, i) => Math.round(channel + (to[i] - channel) * (t - index)));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
