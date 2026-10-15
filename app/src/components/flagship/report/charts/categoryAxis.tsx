/**
 * A category axis that names every bar. Recharts' own axis drops a name
 * that would touch its neighbour, so on a phone a bar could lose its name
 * ("State and local income taxes", "Top 10% share", "Hispanic") while
 * its value label stays. This axis keeps every name: in full where it
 * fits under its bar, else in its short form, else over two lines, else
 * in a smaller font.
 */

import {
  fitFontSize,
  measureTextWidth,
  X_AXIS_HEIGHT,
  type MeasureText,
} from '@/components/flagship/report/charts/barLayout';
import { RECHARTS_FONT_STYLE } from '@/utils/chartUtils';

/** Space kept clear between neighbouring names, px. */
const NAME_GAP = 6;
/** The most lines a name wraps onto. */
const MAX_LINES = 2;
/** Distance from one line of a wrapped name to the next, px. */
const LINE_HEIGHT = 14;
/** The smallest font a name shrinks to, px. */
const MIN_FONT_SIZE = 9;
/** Puts a name's first line just under the tick, as Recharts' own text does. */
const FIRST_LINE_DY = '0.71em';

/** A bar's name as the axis draws it. */
export interface FittedName {
  lines: string[];
  fontSize: number;
}

interface FitOptions {
  /** Show the short name even where the full one fits, as a compact card does. */
  preferShort?: boolean;
  measure?: MeasureText;
}

/** A text's words in as few lines as fit `room`; null when one word alone is wider. */
function wrapWords(text: string, room: number, fontSize: number, measure: MeasureText) {
  const lines: string[] = [];
  for (const word of text.split(' ').filter(Boolean)) {
    if (measure(word, fontSize) > room) {
      return null;
    }
    const joined = lines.length > 0 ? `${lines[lines.length - 1]} ${word}` : null;
    if (joined !== null && measure(joined, fontSize) <= room) {
      lines[lines.length - 1] = joined;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

/**
 * How a bar's name fits `room` px: the full name on one line, else the
 * short name, else the shorter one over at most two lines, else the
 * shorter one on one line in the largest font that fits. With
 * `preferShort` the short name stands in for the full one.
 */
export function fitCategoryName(
  name: string,
  shortName: string | undefined,
  room: number,
  { preferShort = false, measure = measureTextWidth }: FitOptions = {}
): FittedName {
  const fontSize = RECHARTS_FONT_STYLE.fontSize;
  const forms =
    shortName && shortName !== name ? (preferShort ? [shortName] : [name, shortName]) : [name];
  const fitting = forms.find((form) => measure(form, fontSize) <= room);
  if (fitting !== undefined) {
    return { lines: [fitting], fontSize };
  }
  const shortest = forms[forms.length - 1];
  const wrapped = wrapWords(shortest, room, fontSize, measure);
  if (wrapped && wrapped.length <= MAX_LINES) {
    return { lines: wrapped, fontSize };
  }
  return {
    lines: [shortest],
    fontSize:
      fitFontSize(shortest, room, { max: fontSize, min: MIN_FONT_SIZE, measure }) ?? MIN_FONT_SIZE,
  };
}

/** One bar's name under its tick, drawn from the lines `fitCategoryName` chose. */
function CategoryTick({
  x,
  y,
  name,
}: {
  x?: number | string;
  y?: number | string;
  name: FittedName;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      className="recharts-text recharts-cartesian-axis-tick-value"
      fontFamily={RECHARTS_FONT_STYLE.fontFamily}
      fontSize={name.fontSize}
      fill={RECHARTS_FONT_STYLE.fill}
    >
      {name.lines.map((line, index) => (
        <tspan key={index} x={x} dy={index === 0 ? FIRST_LINE_DY : LINE_HEIGHT}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/**
 * Props for a category `XAxis` that names every bar: no name is dropped,
 * each fits its bar's share of `plotWidth`, and the axis grows a line
 * when a name wraps. `shortNames` gives a shorter form for long names.
 */
export function categoryAxisProps(
  names: string[],
  plotWidth: number,
  { shortNames = {}, ...options }: FitOptions & { shortNames?: Record<string, string> } = {}
) {
  const room = plotWidth / Math.max(names.length, 1) - NAME_GAP;
  const fitted = new Map(
    names.map((name) => [name, fitCategoryName(name, shortNames[name], room, options)])
  );
  const lines = Math.max(1, ...Array.from(fitted.values(), (name) => name.lines.length));
  return {
    interval: 0,
    height: X_AXIS_HEIGHT + (lines - 1) * LINE_HEIGHT,
    tick: (props: { x?: number | string; y?: number | string; payload?: { value?: unknown } }) => {
      const value = String(props.payload?.value ?? '');
      return (
        <CategoryTick
          x={props.x}
          y={props.y}
          name={fitted.get(value) ?? { lines: [value], fontSize: RECHARTS_FONT_STYLE.fontSize }}
        />
      );
    },
  } as const;
}
