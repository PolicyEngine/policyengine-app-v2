import { useId, type CSSProperties } from 'react';
import { Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { FlagshipHouseholdImpact, HouseholdLineChange } from '@/libs/flagship/householdRun';
import { formatCurrency } from '@/utils/formatters';

/** Whole dollars, with a true minus sign: "−$1,200". */
function money(value: number): string {
  const rounded = Math.round(value);
  const text = formatCurrency(Math.abs(rounded), 'us', { maximumFractionDigits: 0 });
  return rounded < 0 ? `−${text}` : text;
}

/** A change, always signed: "+$1,200", "−$300", "$0". */
function signedMoney(value: number): string {
  const rounded = Math.round(value);
  return rounded > 0 ? `+${money(rounded)}` : money(rounded);
}

/** Gains read in the brand teal, losses in red. */
const effectColor = (effect: number) =>
  Math.round(effect) > 0
    ? colors.primary[700]
    : Math.round(effect) < 0
      ? colors.error
      : colors.text.primary;

const headerCell: CSSProperties = {
  padding: `0 ${spacing.md} ${spacing.sm}`,
  textAlign: 'right',
  fontSize: typography.fontSize.xs,
  fontWeight: typography.fontWeight.medium,
  color: colors.text.secondary,
  whiteSpace: 'nowrap',
};

const bodyCell: CSSProperties = {
  padding: `${spacing.sm} ${spacing.md}`,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

function ChangeTable({
  label,
  lines,
  total,
}: {
  label: string;
  lines: HouseholdLineChange[];
  total?: HouseholdLineChange;
}) {
  const rows = total ? [...lines, total] : lines;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        aria-label={label}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: typography.fontSize.sm,
          fontFamily: typography.fontFamily.primary,
        }}
      >
        <thead>
          <tr>
            <th scope="col" style={{ ...headerCell, textAlign: 'left', paddingLeft: 0 }}>
              {label}
            </th>
            <th scope="col" style={headerCell}>
              Baseline
            </th>
            <th scope="col" style={headerCell}>
              Reform
            </th>
            <th scope="col" style={headerCell}>
              Change
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((line) => {
            const isTotal = line === total;
            return (
              <tr
                key={line.id}
                style={{
                  borderTop: `1px solid ${isTotal ? colors.border.medium : colors.border.light}`,
                  fontWeight: isTotal ? typography.fontWeight.semibold : undefined,
                }}
              >
                <th
                  scope="row"
                  style={{
                    ...bodyCell,
                    textAlign: 'left',
                    paddingLeft: 0,
                    whiteSpace: 'normal',
                    fontWeight: isTotal
                      ? typography.fontWeight.semibold
                      : typography.fontWeight.normal,
                  }}
                >
                  {line.label}
                </th>
                <td style={bodyCell}>{line.baseline === null ? '—' : money(line.baseline)}</td>
                <td style={bodyCell}>{line.reform === null ? '—' : money(line.reform)}</td>
                <td style={{ ...bodyCell, color: effectColor(line.effect) }}>
                  {signedMoney(line.change)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * A household's result: the change in its net income first, then the
 * taxes and benefits that make it up, then the credits and benefits
 * within them that the reform changes.
 */
export default function HouseholdImpactResult({
  impact,
  summary,
}: {
  impact: FlagshipHouseholdImpact;
  /** The household the result is for, e.g. "Single · no children · $50,000 earnings · Ohio · 2026". */
  summary: string;
}) {
  const { netIncome, components, programs } = impact;
  const change = Math.round(netIncome.change);
  const percent =
    netIncome.baseline > 0 && change !== 0 ? (netIncome.change / netIncome.baseline) * 100 : null;
  const noChange = change === 0 && components.length === 0 && programs.length === 0;
  const id = useId();

  return (
    <section
      aria-labelledby={`${id}-heading`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        background: colors.background.primary,
      }}
    >
      <Stack style={{ gap: spacing.xs }}>
        <Title id={`${id}-heading`} order={3} style={{ margin: 0 }}>
          Household impact
        </Title>
        <Text style={{ margin: 0, fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
          {summary}
        </Text>
      </Stack>

      <div
        role="group"
        aria-labelledby={`${id}-net`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
          borderLeft: `2px solid ${colors.primary[200]}`,
          paddingLeft: spacing.lg,
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.semibold,
            fontVariantNumeric: 'tabular-nums',
            color: effectColor(change),
          }}
        >
          {signedMoney(change)}
        </span>
        <span
          id={`${id}-net`}
          style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}
        >
          Change in annual net income
        </span>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {money(netIncome.baseline)} → {money(netIncome.reform)}
          {percent !== null &&
            ` (${percent > 0 ? '+' : '−'}${Math.abs(percent) < 0.1 ? '<0.1' : Math.abs(percent).toFixed(1)}%)`}
        </span>
      </div>

      {noChange ? (
        <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
          No change in this household&apos;s taxes or benefits.
        </Text>
      ) : (
        <>
          {(components.length > 0 || change !== 0) && (
            <ChangeTable
              label="Taxes and benefits"
              lines={components}
              total={{
                id: 'net_income',
                label: 'Net income',
                baseline: netIncome.baseline,
                reform: netIncome.reform,
                change: netIncome.change,
                effect: netIncome.change,
              }}
            />
          )}
          {programs.length > 0 && <ChangeTable label="Credits and benefits" lines={programs} />}
        </>
      )}
    </section>
  );
}
