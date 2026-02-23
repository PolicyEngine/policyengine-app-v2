import { IconCoin, IconHome, IconUsers } from '@tabler/icons-react';
import { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import MetricCard from '@/components/report/MetricCard';
import { Group, Stack, Text } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { formatBudgetaryImpact } from '@/utils/formatPowers';
import { currencySymbol } from '@/utils/formatters';

interface SocietyWideOverviewProps {
  output: SocietyWideReportOutput;
}

// Fixed size for icon containers to ensure square aspect ratio
const HERO_ICON_SIZE = 48;
const SECONDARY_ICON_SIZE = 36;

/**
 * Overview page for society-wide reports
 *
 * Features:
 * - Hero metric for budgetary impact (most important number)
 * - Secondary metrics for poverty and income distribution
 * - Clean visual hierarchy with trend indicators
 * - Progressive disclosure for details
 */
export default function SocietyWideOverview({ output }: SocietyWideOverviewProps) {
  const countryId = useCurrentCountry();
  const symbol = currencySymbol(countryId);

  // Calculate budgetary impact
  const budgetaryImpact = output.budget.budgetary_impact;
  const budgetFormatted = formatBudgetaryImpact(Math.abs(budgetaryImpact));
  const budgetIsPositive = budgetaryImpact > 0;
  const budgetValue =
    budgetaryImpact === 0
      ? 'No change'
      : `${symbol}${budgetFormatted.display}${budgetFormatted.label ? ` ${budgetFormatted.label}` : ''}`;
  const budgetSubtext =
    budgetaryImpact === 0
      ? 'This policy has no impact on the budget'
      : budgetIsPositive
        ? 'in additional government revenue'
        : 'in additional government spending';

  // Calculate poverty rate change
  const povertyOverview = output.poverty.poverty.all;
  const povertyRateChange =
    povertyOverview.baseline === 0
      ? 0
      : (povertyOverview.reform - povertyOverview.baseline) / povertyOverview.baseline;
  const povertyAbsChange = Math.abs(povertyRateChange) * 100;
  const povertyValue = povertyRateChange === 0 ? 'No change' : `${povertyAbsChange.toFixed(1)}%`;
  // For poverty: decrease is good (positive), increase is bad (negative)
  // Arrow direction should match the actual change direction for clarity
  const povertyTrend =
    povertyRateChange === 0 ? 'neutral' : povertyRateChange < 0 ? 'positive' : 'negative';
  const povertySubtext =
    povertyRateChange === 0
      ? 'Poverty rate unchanged'
      : povertyRateChange < 0
        ? 'decrease in poverty rate'
        : 'increase in poverty rate';

  // Calculate winners and losers
  const decileOverview = output.intra_decile.all;
  const winnersPercent = decileOverview['Gain more than 5%'] + decileOverview['Gain less than 5%'];
  const losersPercent = decileOverview['Lose more than 5%'] + decileOverview['Lose less than 5%'];
  const unchangedPercent = decileOverview['No change'];

  return (
    <Stack className="tw:gap-xl">
      {/* Hero Section - Budgetary Impact */}
      <div
        className="tw:p-xl"
        style={{
          background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.background.primary} 100%)`,
          borderRadius: spacing.radius.container,
          border: `1px solid ${colors.primary[100]}`,
        }}
      >
        <Group className="tw:gap-md tw:items-start">
          <div
            className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
            style={{
              width: HERO_ICON_SIZE,
              height: HERO_ICON_SIZE,
              backgroundColor: colors.primary[100],
              borderRadius: spacing.radius.element,
            }}
          >
            <IconCoin size={28} color={colors.primary[700]} stroke={1.5} />
          </div>
          <div className="tw:flex-1">
            <MetricCard
              label="Budgetary Impact"
              value={budgetValue}
              subtext={budgetSubtext}
              trend={budgetaryImpact === 0 ? 'neutral' : budgetIsPositive ? 'positive' : 'negative'}
              hero
            />
          </div>
        </Group>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="tw:grid tw:grid-cols-1 tw:sm:grid-cols-2 tw:gap-lg">
        {/* Poverty Impact */}
        <div
          className="tw:p-lg"
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: spacing.radius.container,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <Group className="tw:gap-md tw:items-start">
            <div
              className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
              style={{
                width: SECONDARY_ICON_SIZE,
                height: SECONDARY_ICON_SIZE,
                backgroundColor: colors.gray[100],
                borderRadius: spacing.radius.element,
              }}
            >
              <IconHome size={20} color={colors.gray[600]} stroke={1.5} />
            </div>
            <div className="tw:flex-1">
              <MetricCard
                label="Poverty Impact"
                value={povertyValue}
                subtext={povertySubtext}
                trend={povertyTrend as 'positive' | 'negative' | 'neutral'}
                invertArrow
              />
            </div>
          </Group>
        </div>

        {/* Winners and Losers */}
        <div
          className="tw:p-lg"
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: spacing.radius.container,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <Group className="tw:gap-md tw:items-start">
            <div
              className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
              style={{
                width: SECONDARY_ICON_SIZE,
                height: SECONDARY_ICON_SIZE,
                backgroundColor: colors.gray[100],
                borderRadius: spacing.radius.element,
              }}
            >
              <IconUsers size={20} color={colors.gray[600]} stroke={1.5} />
            </div>
            <div className="tw:flex-1">
              <Text
                className="tw:text-xs tw:uppercase"
                style={{
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.secondary,
                  letterSpacing: '0.05em',
                }}
              >
                Winners and losers
              </Text>

              {/* Distribution Bar */}
              <div
                className="tw:flex tw:mt-md tw:overflow-hidden"
                style={{
                  height: 8,
                  borderRadius: spacing.radius.element,
                  backgroundColor: colors.gray[200],
                }}
              >
                <div
                  style={{
                    width: `${winnersPercent * 100}%`,
                    height: '100%',
                    backgroundColor: colors.primary[500],
                    transition: 'width 0.3s ease',
                  }}
                />
                <div
                  style={{
                    width: `${unchangedPercent * 100}%`,
                    height: '100%',
                    backgroundColor: colors.gray[300],
                    transition: 'width 0.3s ease',
                  }}
                />
                <div
                  style={{
                    width: `${losersPercent * 100}%`,
                    height: '100%',
                    backgroundColor: colors.gray[500],
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* Legend */}
              <Group className="tw:gap-lg tw:mt-sm tw:flex-wrap">
                <Group className="tw:gap-xs">
                  <div
                    className="tw:shrink-0"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: spacing.radius.chip,
                      backgroundColor: colors.primary[500],
                    }}
                  />
                  <Text className="tw:text-xs" style={{ color: colors.text.secondary }}>
                    Gain: {(winnersPercent * 100).toFixed(1)}%
                  </Text>
                </Group>
                <Group className="tw:gap-xs">
                  <div
                    className="tw:shrink-0"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: spacing.radius.chip,
                      backgroundColor: colors.gray[300],
                    }}
                  />
                  <Text className="tw:text-xs" style={{ color: colors.text.secondary }}>
                    No change: {(unchangedPercent * 100).toFixed(1)}%
                  </Text>
                </Group>
                <Group className="tw:gap-xs">
                  <div
                    className="tw:shrink-0"
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: spacing.radius.chip,
                      backgroundColor: colors.gray[500],
                    }}
                  />
                  <Text className="tw:text-xs" style={{ color: colors.text.secondary }}>
                    Lose: {(losersPercent * 100).toFixed(1)}%
                  </Text>
                </Group>
              </Group>
            </div>
          </Group>
        </div>
      </div>
    </Stack>
  );
}
