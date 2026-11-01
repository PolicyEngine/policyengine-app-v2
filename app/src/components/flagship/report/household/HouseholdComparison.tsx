import type { CSSProperties } from 'react';
import {
  effectColor,
  money,
  signedMoney,
} from '@/components/flagship/report/household/householdMoney';
import type { HouseholdTile } from '@/components/flagship/report/household/HouseholdSwitcher';
import { Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import type { CountryId } from '@/libs/countries';

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
  borderTop: `1px solid ${colors.border.light}`,
};

/** Where a household without a result stands, in the comparison's words. */
function pendingText(state: string | undefined): string {
  if (state === 'running') {
    return 'Calculating…';
  }
  if (state === 'failed') {
    return 'Could not calculate';
  }
  return 'Not calculated yet';
}

/**
 * Every household's annual net income under the report's baseline and
 * reform, one row each, so the households compare in one place. A
 * household's name opens its own results.
 */
export default function HouseholdComparison({
  households,
  countryId,
  year,
  onOpen,
}: {
  households: HouseholdTile[];
  countryId: CountryId;
  year: string;
  onOpen: (key: number) => void;
}) {
  return (
    <section
      aria-label="All households"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        padding: spacing.lg,
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.radius.container,
        background: colors.background.primary,
        minWidth: 0,
      }}
    >
      <Text style={{ margin: 0, fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
        Annual net income in {year} under the report's baseline and reform.
      </Text>
      <div style={{ overflowX: 'auto' }}>
        <table
          aria-label="Households compared"
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
                Household
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
            {households.map(({ key, name, status }) => {
              const net = status?.state === 'done' ? status.netIncome : undefined;
              return (
                <tr key={key}>
                  <th
                    scope="row"
                    style={{
                      ...bodyCell,
                      textAlign: 'left',
                      paddingLeft: 0,
                      whiteSpace: 'normal',
                      fontWeight: typography.fontWeight.normal,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onOpen(key)}
                      className="tw:cursor-pointer tw:hover:underline"
                      style={{
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        textAlign: 'left',
                        font: 'inherit',
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.primary[700],
                      }}
                    >
                      {name}
                    </button>
                    {status?.summary && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: typography.fontSize.xs,
                          color: colors.text.secondary,
                        }}
                      >
                        {status.summary}
                        {net && status.stale ? ' · inputs changed since' : ''}
                      </span>
                    )}
                  </th>
                  {net ? (
                    <>
                      <td style={bodyCell}>{money(net.baseline, countryId)}</td>
                      <td style={bodyCell}>{money(net.reform, countryId)}</td>
                      <td
                        style={{
                          ...bodyCell,
                          fontWeight: typography.fontWeight.semibold,
                          color: effectColor(net.change),
                        }}
                      >
                        {signedMoney(net.change, countryId)}
                      </td>
                    </>
                  ) : (
                    <td
                      colSpan={3}
                      style={{
                        ...bodyCell,
                        color: status?.state === 'failed' ? colors.error : colors.text.secondary,
                      }}
                    >
                      {pendingText(status?.state)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
