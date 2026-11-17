import { colors, spacing, typography } from '@/designTokens';
import type { BaselineMetricKey } from '@/libs/flagship/explore/baselineData';
import type { ExploreMetric } from '@/libs/flagship/explore/exploreMetrics';

interface MetricPillsProps {
  metrics: ExploreMetric[];
  value: BaselineMetricKey;
  onChange: (key: BaselineMetricKey) => void;
}

/** The measure the map shows: one row of pills, which scrolls sideways on a phone. */
export default function MetricPills({ metrics, value, onChange }: MetricPillsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Measure"
      style={{ display: 'flex', gap: spacing.sm, overflowX: 'auto', scrollbarWidth: 'none' }}
    >
      {metrics.map((metric) => {
        const on = metric.key === value;
        return (
          <button
            key={metric.key}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(metric.key)}
            className="tw:cursor-pointer tw:max-sm:min-h-10"
            style={{
              whiteSpace: 'nowrap',
              padding: `6px ${spacing.md}`,
              borderRadius: 999,
              border: `1px solid ${on ? colors.primary[600] : colors.border.light}`,
              background: on ? colors.primary[600] : colors.white,
              color: on ? colors.white : colors.gray[700],
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              transition: 'background 150ms, color 150ms',
            }}
          >
            {metric.label}
          </button>
        );
      })}
    </div>
  );
}
