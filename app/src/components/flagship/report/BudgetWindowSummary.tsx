import { IconArrowRight } from '@tabler/icons-react';
import { Button, Progress, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useBudgetWindow } from '@/hooks/useBudgetWindow';
import { formatCurrencyAbbr } from '@/utils/formatters';

interface BudgetWindowSummaryProps {
  countryId: string;
  reformPolicyId: string;
  baselinePolicyId: string;
  /** The report's population; the whole country when absent. */
  region?: string;
  /** The window asked for in Build. */
  window: { startYear: number; windowSize: number };
  /** Opens the Economic impacts tab at the Budget window section. */
  onOpen: () => void;
}

/**
 * The budget window asked for in Build, in one line on the overview: its
 * progress while it runs, then the window's total. The Budget window
 * section (Economic impacts) has the years; this shares its query, so it
 * checks on the same run rather than starting another.
 */
export default function BudgetWindowSummary({
  countryId,
  reformPolicyId,
  baselinePolicyId,
  region,
  window: { startYear, windowSize },
  onOpen,
}: BudgetWindowSummaryProps) {
  const budget = useBudgetWindow(
    countryId,
    reformPolicyId,
    baselinePolicyId,
    { region: region ?? countryId, startYear, windowSize },
    { enabled: true }
  );
  const data = budget.data;
  const span = `${startYear}–${startYear + windowSize - 1}`;
  const total = data?.status === 'ok' ? data.result?.totals.budgetaryImpact : undefined;
  const failed = budget.isError || data?.status === 'error';
  const progress = typeof data?.progress === 'number' ? data.progress : 0;

  const totalText =
    typeof total === 'number'
      ? `${total < 0 ? '−' : total > 0 ? '+' : ''}${formatCurrencyAbbr(
          Math.abs(total),
          countryId as 'us' | 'uk',
          { maximumFractionDigits: 1 }
        )}`
      : null;
  const totalLabel =
    typeof total === 'number'
      ? total < 0
        ? `${windowSize}-year government cost`
        : total > 0
          ? `${windowSize}-year government savings`
          : `${windowSize}-year budget change`
      : null;

  return (
    <section
      aria-label="Budget window"
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: `${spacing.sm} ${spacing.lg}`,
        padding: `${spacing.md} ${spacing.lg}`,
        border: `1px solid ${colors.border.light}`,
        borderRadius: 12,
        background: colors.background.primary,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
        <Text style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          Budget, {span}
        </Text>
        {totalText ? (
          <div
            style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: spacing.sm }}
          >
            <span
              style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.semibold,
                fontVariantNumeric: 'tabular-nums',
                color: colors.text.primary,
              }}
            >
              {totalText}
            </span>
            <span style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
              {totalLabel}
            </span>
          </div>
        ) : failed ? (
          <Text
            style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}
          >
            The budget window could not be calculated.
          </Text>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <Text
              style={{
                margin: 0,
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                whiteSpace: 'nowrap',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              Calculating · {Math.round(progress)}%
            </Text>
            <Progress
              value={progress}
              aria-label={`Budget ${span}, about ${Math.round(progress)}%`}
              className="tw:h-1.5 tw:max-w-[200px]"
            />
          </div>
        )}
      </div>
      <Button size="sm" variant="ghost" onClick={onOpen}>
        {totalText ? 'See each year' : 'See its progress'}
        <IconArrowRight size={14} />
      </Button>
    </section>
  );
}
