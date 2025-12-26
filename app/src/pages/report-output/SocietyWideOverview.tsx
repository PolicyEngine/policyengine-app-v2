import { IconCoin, IconHome, IconUsers } from '@tabler/icons-react';
import { Box, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import MetricCard from '@/components/report/MetricCard';
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
    <Stack gap={spacing.xl}>
      {/* Hero Section - Budgetary Impact */}
      <Box
        p={spacing.xl}
        style={{
          background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.background.primary} 100%)`,
          borderRadius: spacing.md,
          border: `1px solid ${colors.primary[100]}`,
        }}
      >
        <Group gap={spacing.md} align="flex-start">
          <Box
            style={{
              width: HERO_ICON_SIZE,
              height: HERO_ICON_SIZE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary[100],
              borderRadius: spacing.sm,
              flexShrink: 0,
            }}
          >
            <IconCoin size={28} color={colors.primary[700]} stroke={1.5} />
          </Box>
          <Box style={{ flex: 1 }}>
            <MetricCard
              label="Budgetary Impact"
              value={budgetValue}
              subtext={budgetSubtext}
              trend={budgetaryImpact === 0 ? 'neutral' : budgetIsPositive ? 'positive' : 'negative'}
              hero
            />
          </Box>
        </Group>
      </Box>

      {/* Secondary Metrics Grid */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={spacing.lg}>
        {/* Poverty Impact */}
        <Box
          p={spacing.lg}
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: spacing.md,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <Group gap={spacing.md} align="flex-start">
            <Box
              style={{
                width: SECONDARY_ICON_SIZE,
                height: SECONDARY_ICON_SIZE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.gray[100],
                borderRadius: spacing.xs,
                flexShrink: 0,
              }}
            >
              <IconHome size={20} color={colors.gray[600]} stroke={1.5} />
            </Box>
            <Box style={{ flex: 1 }}>
              <MetricCard
                label="Poverty Impact"
                value={povertyValue}
                subtext={povertySubtext}
                trend={povertyTrend as 'positive' | 'negative' | 'neutral'}
                invertArrow
              />
            </Box>
          </Group>
        </Box>

        {/* Winners and Losers */}
        <Box
          p={spacing.lg}
          style={{
            backgroundColor: colors.background.primary,
            borderRadius: spacing.md,
            border: `1px solid ${colors.border.light}`,
          }}
        >
          <Group gap={spacing.md} align="flex-start">
            <Box
              style={{
                width: SECONDARY_ICON_SIZE,
                height: SECONDARY_ICON_SIZE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.gray[100],
                borderRadius: spacing.xs,
                flexShrink: 0,
              }}
            >
              <IconUsers size={20} color={colors.gray[600]} stroke={1.5} />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text
                size="xs"
                fw={typography.fontWeight.medium}
                c={colors.text.secondary}
                tt="uppercase"
                style={{ letterSpacing: '0.05em' }}
              >
                Winners and losers
              </Text>

              {/* Distribution Bar */}
              <Box
                mt={spacing.md}
                style={{
                  display: 'flex',
                  height: 8,
                  borderRadius: 4,
                  overflow: 'hidden',
                  backgroundColor: colors.gray[200],
                }}
              >
                <Box
                  style={{
                    width: `${winnersPercent * 100}%`,
                    height: '100%',
                    backgroundColor: colors.primary[500],
                    transition: 'width 0.3s ease',
                  }}
                />
                <Box
                  style={{
                    width: `${unchangedPercent * 100}%`,
                    height: '100%',
                    backgroundColor: colors.gray[300],
                    transition: 'width 0.3s ease',
                  }}
                />
                <Box
                  style={{
                    width: `${losersPercent * 100}%`,
                    height: '100%',
                    backgroundColor: colors.gray[500],
                    transition: 'width 0.3s ease',
                  }}
                />
              </Box>

              {/* Legend */}
              <Group gap={spacing.lg} mt={spacing.sm} wrap="wrap">
                <Group gap={spacing.xs}>
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: colors.primary[500],
                      flexShrink: 0,
                    }}
                  />
                  <Text size="xs" c={colors.text.secondary}>
                    Gain: {(winnersPercent * 100).toFixed(1)}%
                  </Text>
                </Group>
                <Group gap={spacing.xs}>
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: colors.gray[300],
                      flexShrink: 0,
                    }}
                  />
                  <Text size="xs" c={colors.text.secondary}>
                    No change: {(unchangedPercent * 100).toFixed(1)}%
                  </Text>
                </Group>
                <Group gap={spacing.xs}>
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      backgroundColor: colors.gray[500],
                      flexShrink: 0,
                    }}
                  />
                  <Text size="xs" c={colors.text.secondary}>
                    Lose: {(losersPercent * 100).toFixed(1)}%
                  </Text>
                </Group>
              </Group>
            </Box>
          </Group>
        </Box>
      </SimpleGrid>
    </Stack>
  );
}
