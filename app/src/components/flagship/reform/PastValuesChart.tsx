import { CHART_COLORS } from '@/constants/chartColors';
import { colors, spacing, typography } from '@/designTokens';
import { ParameterOverTimeChart } from '@/pathways/report/components/policyParameterSelector/HistoricalValues';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

interface PastValuesChartProps {
  param: ParameterMetadata;
  baseValues: ValueIntervalCollection;
  /** Absent while the reform leaves this value at current law. */
  reformValues?: ValueIntervalCollection;
  reformLabel: string;
}

/** A legend key: the line as the chart draws it. */
function LegendItem({ label, color, dashed }: { label: string; color: string; dashed: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: spacing.xs }}>
      <svg width="22" height="8" aria-hidden>
        <line
          x1="1"
          y1="4"
          x2="21"
          y2="4"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? '4 3' : undefined}
        />
        <circle cx="11" cy="4" r="3" fill={color} />
      </svg>
      {label}
    </span>
  );
}

/**
 * The policy editor's over-time chart in a card of our own, with its
 * legend set at the top left in the page's type rather than the chart's
 * floating default. The reform's line, and its key, appear only once
 * the reform changes this value.
 */
export default function PastValuesChart({
  param,
  baseValues,
  reformValues,
  reformLabel,
}: PastValuesChartProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.sm,
        padding: spacing.md,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        background: colors.background.primary,
      }}
    >
      <div
        aria-label="Legend"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: spacing.lg,
          fontSize: typography.fontSize.xs,
          fontFamily: typography.fontFamily.primary,
          color: colors.text.secondary,
        }}
      >
        <LegendItem
          label="Current law"
          color={reformValues ? CHART_COLORS.BASE_LINE_WITH_REFORM : CHART_COLORS.BASE_LINE_ALONE}
          dashed={false}
        />
        {reformValues && <LegendItem label={reformLabel} color={CHART_COLORS.REFORM_LINE} dashed />}
      </div>
      {/* The chart's own legend gives way to the one above. */}
      <div className="tw:[&_.recharts-legend-wrapper]:hidden">
        <ParameterOverTimeChart
          param={param}
          baseValuesCollection={baseValues}
          reformValuesCollection={reformValues}
          policyLabel={reformLabel}
          policyId={null}
        />
      </div>
    </div>
  );
}
