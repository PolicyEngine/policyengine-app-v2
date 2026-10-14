/**
 * Layout rules for the report's bar charts: the value axis hugs the data,
 * and every value label has room inside the plot, clear of the axes, the
 * category labels and the card around the chart.
 *
 * Label room is in pixels, so the rules take the plot's measured size.
 */

import { typography } from '@/designTokens';
import { getNiceTicks } from '@/utils/chartUtils';

/** Which way an outside value label points from its bar's end. */
export type LabelDirection = 'up' | 'down';

/** Where a bar's value label sits: inside the bar, or just past its end. */
export type LabelPlacement = 'inside' | LabelDirection;

/** Font size of a value label, px. */
export const VALUE_LABEL_FONT_SIZE = 12;
/** Smallest font a value label shrinks to before it is left off, px. */
export const VALUE_LABEL_MIN_FONT_SIZE = 9;
/** Gap between a bar's end and its outside label, px. */
export const VALUE_LABEL_GAP = 4;
/** Room an outside label takes past its bar's end: gap, text and a margin, px. */
export const OUTSIDE_LABEL_SPACE = 20;
/** Shortest bar, px, that holds its label inside. */
export const INSIDE_LABEL_MIN_HEIGHT = 20;
/** Room past a bar that carries no outside label, px. */
const EDGE_SPACE = 6;
/** Closest a gridline comes to the plot's bottom edge, where the category labels sit, px. */
const MIN_BOTTOM_GRIDLINE_GAP = 8;
/** Plot size assumed until the chart is measured, px. */
export const FALLBACK_PLOT_HEIGHT = 160;
export const FALLBACK_PLOT_WIDTH = 300;
/** Clear space kept between two value labels side by side, px. */
const LABEL_SIDE_GAP = 2;
/** Recharts' default x-axis height, where the category labels sit, px. */
export const X_AXIS_HEIGHT = 30;
/**
 * A bar fills 80% of its category slot (Recharts' default 10% gap each
 * side), so an outside label may be this much wider than its bar.
 */
export const BAR_SHARE_OF_SLOT = 0.8;

/** The true minus sign, so "−$100m" never reads as a hyphen. */
export const MINUS = '−';

// ---------------------------------------------------------------------------
// Currency units
// ---------------------------------------------------------------------------

export interface CurrencyUnit {
  divisor: number;
  suffix: '' | 'k' | 'm' | 'bn' | 'tn';
}

const CURRENCY_UNITS: CurrencyUnit[] = [
  { divisor: 1e12, suffix: 'tn' },
  { divisor: 1e9, suffix: 'bn' },
  { divisor: 1e6, suffix: 'm' },
  { divisor: 1e3, suffix: 'k' },
];

/**
 * The unit an axis of currency amounts reads in, from the largest amount:
 * millions while every amount is under a billion, and so on.
 */
export function pickCurrencyUnit(values: number[]): CurrencyUnit {
  const largest = values.reduce(
    (max, value) => (Number.isFinite(value) ? Math.max(max, Math.abs(value)) : max),
    0
  );
  return CURRENCY_UNITS.find((unit) => largest >= unit.divisor) ?? { divisor: 1, suffix: '' };
}

/**
 * An amount already in `unit`, as "−$100m", "$2.5bn" or "$0": the minus
 * sign before the currency symbol, and no unit on zero.
 */
export function formatUnitAmount(
  value: number,
  unit: CurrencyUnit,
  symbol: string,
  decimals = 0
): string {
  const magnitude = Number(Math.abs(value).toFixed(decimals));
  if (magnitude === 0) {
    return `${symbol}0`;
  }
  const digits = magnitude.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${value < 0 ? MINUS : ''}${symbol}${digits}${unit.suffix}`;
}

/** The fewest decimals that write every tick exactly: 0.25 needs two, 0.5 one. */
export function tickDecimals(ticks: number[], maxDecimals = 6): number {
  for (let decimals = 0; decimals < maxDecimals; decimals++) {
    if (ticks.every((tick) => Math.abs(Number(tick.toFixed(decimals)) - tick) < 1e-9)) {
      return decimals;
    }
  }
  return maxDecimals;
}

// ---------------------------------------------------------------------------
// Value axis
// ---------------------------------------------------------------------------

/** A fixed-height chart's plot height: what its margins and x-axis leave, px. */
export function fixedPlotHeight(
  chartHeight: number,
  margin: { top: number; bottom: number }
): number {
  return Math.max(chartHeight - margin.top - margin.bottom - X_AXIS_HEIGHT, 1);
}

/**
 * Outside labels point away from zero. A zero bar's label points the way
 * the other bars go, so an all-negative chart needs no room above zero.
 */
export function labelDirections(values: number[]): LabelDirection[] {
  const zeroDirection: LabelDirection =
    values.some((value) => value > 0) || !values.some((value) => value < 0) ? 'up' : 'down';
  return values.map((value) => (value > 0 ? 'up' : value < 0 ? 'down' : zeroDirection));
}

/** The value an outside label is pinned to, and which way it points. */
export interface LabelAnchor {
  value: number;
  direction: LabelDirection;
}

/** The data's extent with zero in it: bars grow from zero. */
function withZero([min, max]: [number, number]): [number, number] {
  return [Math.min(0, min), Math.max(0, max)];
}

/**
 * The value axis's domain: the data with zero, plus just enough room past
 * the ends for the outside labels in `anchors` and a few pixels for bars
 * that carry none. A side with no data gets no room, so an all-negative
 * chart tops out at zero.
 */
export function getLabelledDomain(
  extent: [number, number],
  anchors: LabelAnchor[],
  plotHeight: number
): [number, number] {
  const [dataMin, dataMax] = withZero(extent);
  if (dataMin === dataMax) {
    // Nothing changes: zero sits mid-plot with its labels above it.
    return [-1, 1];
  }
  const height = Math.max(plotHeight, 1);
  // Shares of the domain's span; capped so a tiny plot still shows its bars.
  const labelShare = Math.min(OUTSIDE_LABEL_SPACE / height, 0.3);
  const edgeShare = Math.min(EDGE_SPACE / height, 0.1);
  const up = anchors.filter((a) => a.direction === 'up').map((a) => a.value);
  const down = anchors.filter((a) => a.direction === 'down').map((a) => a.value);
  const highestUp = up.length > 0 ? Math.max(...up) : undefined;
  const lowestDown = down.length > 0 ? Math.min(...down) : undefined;

  // The room grows the span and the span grows the room: iterate to the
  // fixed point, which converges since the shares add up to under one.
  let span = dataMax - dataMin;
  let low = dataMin;
  let high = dataMax;
  for (let i = 0; i < 60; i++) {
    high = Math.max(
      dataMax > 0 ? dataMax + edgeShare * span : 0,
      highestUp !== undefined ? highestUp + labelShare * span : -Infinity
    );
    low = Math.min(
      dataMin < 0 ? dataMin - edgeShare * span : 0,
      lowestDown !== undefined ? lowestDown - labelShare * span : Infinity
    );
    const next = high - low;
    if (Math.abs(next - span) <= 1e-12 * next) {
      break;
    }
    span = next;
  }
  return [low, high];
}

/**
 * Gridline values for a domain: nice steps of the data, only inside the
 * domain, none on a side with no data, and none so near the bottom edge
 * that the category labels would sit on it. Zero is always one.
 */
export function getDomainTicks(
  domain: [number, number],
  extent: [number, number],
  plotHeight: number,
  count = 5
): number[] {
  const [dataMin, dataMax] = withZero(extent);
  if (dataMin === dataMax) {
    return [0];
  }
  const [low, high] = domain;
  const span = high - low;
  const tolerance = span * 1e-9;
  const bottomGap = (MIN_BOTTOM_GRIDLINE_GAP / Math.max(plotHeight, 1)) * span;
  const ticks = getNiceTicks([dataMin, dataMax], count).filter((tick) => {
    if (tick === 0) {
      return true;
    }
    if (tick < low - tolerance || tick > high + tolerance) {
      return false;
    }
    if ((tick > 0 && dataMax <= 0) || (tick < 0 && dataMin >= 0)) {
      return false;
    }
    return tick - low >= bottomGap;
  });
  return ticks.includes(0) ? ticks : [...ticks, 0].sort((a, b) => a - b);
}

/** How a chart of bars from zero lays out its value axis and its value labels. */
export interface ValueBarLayout {
  domain: [number, number];
  ticks: number[];
  /** Each bar's label, just past its end. */
  directions: LabelDirection[];
  /** One font size for every label, px. */
  labelFontSize: number;
  /** Whether each bar's label shows: false only where labels would crowd. */
  labelVisible: boolean[];
}

/**
 * Domain, gridlines and value labels for a chart of bars from zero, every
 * label just past its bar's end, inside the plot.
 */
export function getValueBarLayout(
  rawValues: number[],
  labels: string[],
  plot: { width: number; height: number },
  measure: MeasureText = measureTextWidth
): ValueBarLayout {
  // A rate with a zero baseline divides to NaN; it draws as no bar.
  const values = rawValues.map((value) => (Number.isFinite(value) ? value : 0));
  const directions = labelDirections(values);
  const extent: [number, number] = [Math.min(0, ...values), Math.max(0, ...values)];
  const anchors = values.map((value, i) => ({ value, direction: directions[i] }));
  const domain = getLabelledDomain(extent, anchors, plot.height);
  const ticks = getDomainTicks(domain, extent, plot.height);
  const { fontSize, visible } = fitValueLabels({
    texts: labels,
    values,
    directions,
    domain,
    plotWidth: plot.width,
    plotHeight: plot.height,
    measure,
  });
  return { domain, ticks, directions, labelFontSize: fontSize, labelVisible: visible };
}

/** A waterfall bar: its signed change and the values it spans. */
export interface WaterfallBarExtent {
  value: number;
  range: [number, number];
}

/** A waterfall bar's outside label: past the end its change moves to. */
function outwardAnchor(bar: WaterfallBarExtent): LabelAnchor {
  return bar.value < 0
    ? { value: bar.range[0], direction: 'down' }
    : { value: bar.range[1], direction: 'up' };
}

/**
 * Domain, gridlines and label placements for a waterfall: a label sits
 * inside a bar tall enough to hold it, and just past the bar's end
 * otherwise, with room for it in the domain.
 */
export function getWaterfallLayout(bars: WaterfallBarExtent[], plotHeight: number) {
  const extent: [number, number] = [
    Math.min(0, ...bars.map((bar) => bar.range[0])),
    Math.max(0, ...bars.map((bar) => bar.range[1])),
  ];
  // With room for every label outside the scale is at its smallest, so a
  // bar that holds its label at this scale holds it at the final one.
  const widest = getLabelledDomain(extent, bars.map(outwardAnchor), plotHeight);
  const pixelsPerUnit = plotHeight / (widest[1] - widest[0]);
  const placements: LabelPlacement[] = bars.map((bar) =>
    (bar.range[1] - bar.range[0]) * pixelsPerUnit >= INSIDE_LABEL_MIN_HEIGHT
      ? 'inside'
      : outwardAnchor(bar).direction
  );
  const anchors = bars.filter((_, i) => placements[i] !== 'inside').map(outwardAnchor);
  const domain = getLabelledDomain(extent, anchors, plotHeight);
  const ticks = getDomainTicks(domain, extent, plotHeight);
  return { domain, ticks, placements };
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export type MeasureText = (text: string, fontSize: number) => number;

let measureContext: CanvasRenderingContext2D | null | undefined;

/** A text's width in the chart font, px; estimated where no canvas measures it. */
export const measureTextWidth: MeasureText = (text, fontSize) => {
  if (measureContext === undefined && typeof document !== 'undefined') {
    measureContext = document.createElement('canvas').getContext('2d');
  }
  if (measureContext) {
    measureContext.font = `${fontSize}px ${typography.fontFamily.primary}`;
    const { width } = measureContext.measureText(text);
    if (width > 0) {
      return width;
    }
  }
  return text.length * fontSize * 0.6;
};

/** The largest font, from `max` down to `min`, that fits `text` in `room` px; null when none does. */
export function fitFontSize(
  text: string,
  room: number,
  {
    max = VALUE_LABEL_FONT_SIZE,
    min = VALUE_LABEL_MIN_FONT_SIZE,
    measure = measureTextWidth,
  }: { max?: number; min?: number; measure?: MeasureText } = {}
): number | null {
  for (let size = max; size >= min; size--) {
    if (measure(text, size) <= room) {
      return size;
    }
  }
  return null;
}

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/**
 * One font size for every outside value label of a chart of bars from
 * zero, and which labels show. Each label stays inside the plot and clear
 * of the other labels and bars: the font shrinks to fit, and when even the
 * smallest font crowds, the larger changes keep their labels.
 */
export function fitValueLabels({
  texts,
  values,
  directions,
  domain,
  plotWidth,
  plotHeight,
  measure = measureTextWidth,
}: {
  texts: string[];
  values: number[];
  directions: LabelDirection[];
  domain: [number, number];
  plotWidth: number;
  plotHeight: number;
  measure?: MeasureText;
}): { fontSize: number; visible: boolean[] } {
  const count = texts.length;
  if (count === 0) {
    return { fontSize: VALUE_LABEL_FONT_SIZE, visible: [] };
  }
  const slot = plotWidth / count;
  const toY = (value: number) => ((domain[1] - value) / (domain[1] - domain[0] || 1)) * plotHeight;
  const zeroY = toY(0);
  const bars: Box[] = values.map((value, i) => ({
    left: slot * i + (slot * (1 - BAR_SHARE_OF_SLOT)) / 2,
    right: slot * (i + 1) - (slot * (1 - BAR_SHARE_OF_SLOT)) / 2,
    top: Math.min(toY(value), zeroY),
    bottom: Math.max(toY(value), zeroY),
  }));
  const boxesAt = (fontSize: number): Box[] =>
    texts.map((text, i) => {
      const half = measure(text, fontSize) / 2 + LABEL_SIDE_GAP / 2;
      const center = slot * (i + 0.5);
      return directions[i] === 'up'
        ? {
            left: center - half,
            right: center + half,
            top: bars[i].top - VALUE_LABEL_GAP - fontSize,
            bottom: bars[i].top - VALUE_LABEL_GAP,
          }
        : {
            left: center - half,
            right: center + half,
            top: bars[i].bottom + VALUE_LABEL_GAP,
            bottom: bars[i].bottom + VALUE_LABEL_GAP + fontSize,
          };
    });
  // Half a pixel of slack for rounding at the plot's edges.
  const fitsOnItsOwn = (box: Box, i: number) =>
    box.left >= -0.5 &&
    box.right <= plotWidth + 0.5 &&
    box.top >= -0.5 &&
    box.bottom <= plotHeight + 0.5 &&
    bars.every((bar, j) => j === i || !overlaps(box, bar));

  for (let fontSize = VALUE_LABEL_FONT_SIZE; fontSize >= VALUE_LABEL_MIN_FONT_SIZE; fontSize--) {
    const boxes = boxesAt(fontSize);
    const fits = boxes.every(
      (box, i) => fitsOnItsOwn(box, i) && boxes.every((other, j) => j <= i || !overlaps(box, other))
    );
    if (fits) {
      return { fontSize, visible: texts.map(() => true) };
    }
  }

  // Too crowded at the smallest font: the larger changes keep their labels.
  const fontSize = VALUE_LABEL_MIN_FONT_SIZE;
  const boxes = boxesAt(fontSize);
  const visible = texts.map(() => false);
  const order = values
    .map((value, i) => ({ i, size: Math.abs(value) }))
    .sort((a, b) => b.size - a.size || a.i - b.i);
  for (const { i } of order) {
    visible[i] =
      fitsOnItsOwn(boxes[i], i) &&
      visible.every((shown, j) => !shown || !overlaps(boxes[i], boxes[j]));
  }
  return { fontSize, visible };
}

/**
 * The first axis title that fits along the plot's height, so a rotated
 * title never runs past the plot into the controls or the card's edge.
 */
export function fitAxisTitle(
  candidates: string[],
  plotHeight: number,
  measure: MeasureText = measureTextWidth
): string | undefined {
  return candidates.find((title) => measure(title, VALUE_LABEL_FONT_SIZE) <= plotHeight);
}
