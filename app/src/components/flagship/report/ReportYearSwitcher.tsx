import { SegmentedControl } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';

/**
 * Which year of a budget window the report's results show. The run
 * scored the first year in full; another year's results are scored when
 * it is picked, and the server keeps them for next time.
 */
export default function ReportYearSwitcher({
  years,
  value,
  onChange,
}: {
  years: string[];
  value: string;
  onChange: (year: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Results year"
      style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}
    >
      <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        Results for
      </span>
      <div className="tw:max-w-full tw:overflow-x-auto">
        <SegmentedControl
          animated
          value={value}
          onValueChange={onChange}
          options={years.map((year) => ({ label: year, value: year }))}
          size="sm"
        />
      </div>
    </div>
  );
}
