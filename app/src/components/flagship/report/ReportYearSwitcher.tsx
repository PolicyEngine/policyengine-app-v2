import { IconCircleCheck, IconCircleDashed, IconLoader2 } from '@tabler/icons-react';
import { colors, spacing, typography } from '@/designTokens';

/** Where one year's full results stand. */
export type YearStatus = 'done' | 'computing' | 'not-run' | 'error';

export const ALL_YEARS = 'all';

const STATUS_LABELS: Record<YearStatus, string> = {
  done: 'results ready',
  computing: 'calculating',
  'not-run': 'not calculated yet',
  error: 'could not be calculated',
};

function StatusMark({ status }: { status: YearStatus }) {
  if (status === 'done') {
    return <IconCircleCheck size={14} aria-hidden style={{ color: colors.primary[600] }} />;
  }
  if (status === 'computing') {
    return (
      <IconLoader2
        size={14}
        aria-hidden
        className="tw:motion-safe:animate-spin"
        style={{ color: colors.primary[600] }}
      />
    );
  }
  return (
    <IconCircleDashed
      size={14}
      aria-hidden
      style={{ color: status === 'error' ? colors.error : colors.text.tertiary }}
    />
  );
}

/**
 * Which part of a budget window the report shows: all its years at once
 * (totals and year-by-year figures), or one year's full results. Each
 * year says whether its results are ready, being calculated, or not run.
 */
export default function ReportYearSwitcher({
  years,
  value,
  onChange,
  statusByYear,
}: {
  years: string[];
  /** A year, or ALL_YEARS. */
  value: string;
  onChange: (value: string) => void;
  statusByYear: Record<string, YearStatus>;
}) {
  const options = [ALL_YEARS, ...years];
  return (
    <div
      role="tablist"
      aria-label="Report years"
      className="tw:max-w-full tw:overflow-x-auto"
      style={{
        display: 'inline-flex',
        alignSelf: 'flex-start',
        gap: 2,
        padding: 3,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 10,
        background: colors.background.primary,
      }}
    >
      {options.map((option) => {
        const active = option === value;
        const status = option === ALL_YEARS ? undefined : (statusByYear[option] ?? 'not-run');
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={
              option === ALL_YEARS
                ? `All years, ${years[0]}–${years[years.length - 1]}`
                : `${option}, ${STATUS_LABELS[status!]}`
            }
            onClick={() => onChange(option)}
            className="tw:cursor-pointer tw:max-sm:min-h-10"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: `6px ${spacing.md}`,
              border: 'none',
              borderRadius: 7,
              whiteSpace: 'nowrap',
              fontFamily: typography.fontFamily.primary,
              fontSize: typography.fontSize.sm,
              fontWeight: active ? typography.fontWeight.semibold : typography.fontWeight.medium,
              color: active ? colors.text.inverse : colors.text.primary,
              background: active ? colors.primary[700] : 'transparent',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {option === ALL_YEARS ? (
              'All years'
            ) : (
              <>
                {option}
                <span style={{ display: 'inline-flex', opacity: active ? 0.9 : 1 }}>
                  <StatusMark status={status!} />
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
