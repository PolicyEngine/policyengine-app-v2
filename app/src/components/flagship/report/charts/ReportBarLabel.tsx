import {
  BAR_SHARE_OF_SLOT,
  fitFontSize,
  VALUE_LABEL_GAP,
  VALUE_LABEL_MIN_FONT_SIZE,
  type LabelPlacement,
  type ValueBarLayout,
} from '@/components/flagship/report/charts/barLayout';
import { colors, typography } from '@/designTokens';

/** Padding either side of a label inside its bar, px. */
const INSIDE_PADDING = 4;
/** Inside labels: the waterfall's larger, medium-weight text. */
const INSIDE_FONT_SIZE = 13;
const INSIDE_MIN_FONT_SIZE = 10;
/** A digit's height as a share of its font size: puts a label's top at the gap below a bar. */
const CAP_HEIGHT_SHARE = 0.75;

export interface BarRect {
  x: number;
  y: number;
  width: number;
  /** Negative when the bar grows downward from `y`, as Recharts draws negative bars. */
  height: number;
}

/**
 * A bar's value label, inside the bar or just past its end as `placement`
 * says. Without a `fontSize`, a label shrinks to fit its bar (inside) or
 * its category slot (outside), down to the smallest font.
 */
export function BarValueText({
  rect,
  text,
  placement,
  fontSize: outsideFontSize,
}: {
  rect: BarRect;
  text: string;
  placement: LabelPlacement;
  fontSize?: number;
}) {
  const top = Math.min(rect.y, rect.y + rect.height);
  const bottom = Math.max(rect.y, rect.y + rect.height);
  const centerX = rect.x + rect.width / 2;

  if (placement === 'inside') {
    const fontSize =
      fitFontSize(text, rect.width - 2 * INSIDE_PADDING, {
        max: INSIDE_FONT_SIZE,
        min: INSIDE_MIN_FONT_SIZE,
      }) ?? INSIDE_MIN_FONT_SIZE;
    return (
      <text
        x={centerX}
        y={(top + bottom) / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={typography.fontWeight.medium}
        fontFamily={typography.fontFamily.primary}
        fill={colors.white}
      >
        {text}
      </text>
    );
  }

  const fontSize =
    outsideFontSize ??
    fitFontSize(text, rect.width / BAR_SHARE_OF_SLOT - 2) ??
    VALUE_LABEL_MIN_FONT_SIZE;
  const y =
    placement === 'up'
      ? top - VALUE_LABEL_GAP
      : bottom + VALUE_LABEL_GAP + Math.round(fontSize * CAP_HEIGHT_SHARE);
  return (
    <text
      x={centerX}
      y={y}
      textAnchor="middle"
      fontSize={fontSize}
      fontFamily={typography.fontFamily.primary}
      fill={colors.gray[700]}
    >
      {text}
    </text>
  );
}

interface ReportBarLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  index?: number;
  data: Array<{ label: string }>;
  layout: Pick<ValueBarLayout, 'directions' | 'labelFontSize' | 'labelVisible'>;
}

/**
 * Value label for the report's bar charts, passed as a Bar's `label`. The
 * chart's layout points each label away from zero, leaves room for it in
 * the domain and sizes it clear of its neighbours, so labels stay inside
 * the plot, clear of the axes and the category labels.
 */
export function ReportBarLabel({ x, y, width, height, index, data, layout }: ReportBarLabelProps) {
  if (index === undefined || x === undefined || y === undefined || width === undefined) {
    return null;
  }
  const entry = data[index];
  const direction = layout.directions[index];
  if (!entry || !direction || !layout.labelVisible[index]) {
    return null;
  }
  return (
    <BarValueText
      rect={{ x: Number(x), y: Number(y), width: Number(width), height: Number(height ?? 0) }}
      text={entry.label}
      placement={direction}
      fontSize={layout.labelFontSize}
    />
  );
}
