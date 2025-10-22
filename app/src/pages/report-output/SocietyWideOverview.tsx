import { Box, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { colors, spacing } from '@/designTokens';
import { formatBudgetaryImpact } from '@/utils/formatPowers';

interface SocietyWideOverviewProps {
  output: SocietyWideReportOutput;
}

/**
 * Overview sub-page for society-wide report outputs
 * Displays key metrics including budgetary impact, poverty rate change, and winners/losers
 * Follows the conditional display logic from the v1 PolicyBreakdown component
 */
export default function SocietyWideOverview({ output }: SocietyWideOverviewProps) {
  // Calculate budgetary impact
  const budgetaryImpact = output.budget.budgetary_impact;

  // Calculate poverty rate change
  const povertyOverview = output.poverty.poverty.all;
  let povertyRateChange: number | null = null;
  if (povertyOverview.baseline === 0) {
    console.error('SocietyWideOverview: baseline poverty rate reported as 0; API error likely');
    povertyRateChange = Infinity;
  } else {
    povertyRateChange =
      (povertyOverview.reform - povertyOverview.baseline) / povertyOverview.baseline;
  }

  // Calculate winners and losers percentages
  const decileOverview = output.intra_decile.all;
  const winnersPercent = decileOverview['Gain more than 5%'] + decileOverview['Gain less than 5%'];
  const losersPercent = decileOverview['Lose more than 5%'] + decileOverview['Lose less than 5%'];

  // Render budgetary impact metric
  const renderBudgetaryImpact = () => {
    if (budgetaryImpact === 0) {
      return (
        <Box>
          <Text
            variant="metricLabel"
            mb={spacing.xs}
            pb={spacing.xs}
            style={{ borderBottom: `1px solid ${colors.border.light}` }}
          >
            Cost
          </Text>
          <Text variant="metricValue" mt={spacing.sm}>
            Has no impact on the budget
          </Text>
        </Box>
      );
    }

    if (
      budgetaryImpact === null ||
      budgetaryImpact === undefined ||
      Number.isNaN(budgetaryImpact)
    ) {
      return (
        <Box>
          <Text
            variant="metricLabel"
            mb={spacing.xs}
            pb={spacing.xs}
            style={{ borderBottom: `1px solid ${colors.border.light}` }}
          >
            Cost
          </Text>
          <Text variant="metricValue" c="red" mt={spacing.sm}>
            Error calculating budget impact
          </Text>
        </Box>
      );
    }

    const formatted = formatBudgetaryImpact(budgetaryImpact);

    return (
      <Box>
        <Text
          variant="metricLabel"
          mb={spacing.xs}
          pb={spacing.xs}
          style={{ borderBottom: `1px solid ${colors.border.light}` }}
        >
          Cost
        </Text>
        <Text variant="metricValue" c={colors.primary[700]} mt={spacing.sm}>
          ${formatted.display}
          {formatted.label && (
            <Text span variant="metricValue">
              {formatted.label}
            </Text>
          )}
        </Text>
      </Box>
    );
  };

  // Render net income impact (winners/losers) metric
  const renderNetIncomeImpact = () => {
    // Case 1: Both are zero
    if (!winnersPercent && !losersPercent) {
      return (
        <Box>
          <Text
            variant="metricLabel"
            mb={spacing.xs}
            pb={spacing.xs}
            style={{ borderBottom: `1px solid ${colors.border.light}` }}
          >
            Net income
          </Text>
          <Text variant="metricValue" mt={spacing.sm}>
            Does not affect anyone&apos;s net income
          </Text>
        </Box>
      );
    }

    const winnersFormatted = (winnersPercent * 100).toFixed(1);
    const losersFormatted = (losersPercent * 100).toFixed(1);

    // Case 2: Both are non-zero - show both sentences stacked
    if (winnersPercent && losersPercent) {
      return (
        <Box>
          <Text
            variant="metricLabel"
            mb={spacing.xs}
            pb={spacing.xs}
            style={{ borderBottom: `1px solid ${colors.border.light}` }}
          >
            Net income
          </Text>
          <Stack gap={spacing.xs} mt={spacing.sm}>
            <Group gap={spacing.xs} align="baseline">
              <Text variant="metricValue" c={colors.primary[700]}>
                Raises
              </Text>
              <Text variant="metricLabel">net income for</Text>
              <Text variant="metricValue" c={colors.primary[700]}>
                {winnersFormatted}%
              </Text>
              <Text variant="metricDescription">of people</Text>
            </Group>
            <Group gap={spacing.xs} align="baseline">
              <Text variant="metricValue" c={colors.primary[700]}>
                Lowers
              </Text>
              <Text variant="metricLabel">net income for</Text>
              <Text variant="metricValue" c={colors.primary[700]}>
                {losersFormatted}%
              </Text>
              <Text variant="metricDescription">of people</Text>
            </Group>
          </Stack>
        </Box>
      );
    }

    // Case 3: Only one is non-zero
    const hasWinners = winnersPercent > 0;
    const action = hasWinners ? 'Raises' : 'Lowers';
    const value = hasWinners ? winnersFormatted : losersFormatted;

    return (
      <Box>
        <Text
          variant="metricLabel"
          mb={spacing.xs}
          pb={spacing.xs}
          style={{ borderBottom: `1px solid ${colors.border.light}` }}
        >
          Net income
        </Text>
        <Group gap={spacing.xs} align="baseline" mt={spacing.sm}>
          <Text variant="metricValue" c={colors.primary[700]}>
            {action}
          </Text>
          <Text variant="metricLabel">net income for</Text>
          <Text variant="metricValue" c={colors.primary[700]}>
            {value}%
          </Text>
          <Text variant="metricDescription">of people</Text>
        </Group>
      </Box>
    );
  };

  // Render poverty impact metric
  const renderPovertyImpact = () => {
    if (povertyRateChange === 0) {
      return (
        <Box>
          <Text
            variant="metricLabel"
            mb={spacing.xs}
            pb={spacing.xs}
            style={{ borderBottom: `1px solid ${colors.border.light}` }}
          >
            Poverty
          </Text>
          <Text variant="metricValue" mt={spacing.sm}>
            Has no impact on the poverty rate
          </Text>
        </Box>
      );
    }

    if (
      povertyRateChange === null ||
      povertyRateChange === undefined ||
      povertyRateChange === Infinity ||
      Number.isNaN(povertyRateChange)
    ) {
      return (
        <Box>
          <Text
            variant="metricLabel"
            mb={spacing.xs}
            pb={spacing.xs}
            style={{ borderBottom: `1px solid ${colors.border.light}` }}
          >
            Poverty
          </Text>
          <Text variant="metricValue" c="red" mt={spacing.sm}>
            Error calculating poverty impact
          </Text>
        </Box>
      );
    }

    const absChange = Math.abs(povertyRateChange) * 100;
    const formatted = absChange.toFixed(1);
    const action = povertyRateChange < 0 ? 'Lowers' : 'Raises';

    return (
      <Box>
        <Text
          variant="metricLabel"
          mb={spacing.xs}
          pb={spacing.xs}
          style={{ borderBottom: `1px solid ${colors.border.light}` }}
        >
          Poverty
        </Text>
        <Group gap={spacing.xs} align="baseline" mt={spacing.sm}>
          <Text variant="metricValue" c={colors.primary[700]}>
            {action}
          </Text>
          <Text variant="metricLabel">poverty by</Text>
          <Text variant="metricValue" c={colors.primary[700]}>
            {formatted}%
          </Text>
        </Group>
      </Box>
    );
  };

  return (
    <Stack gap={spacing.xl}>
      {/* Summary Card */}
      <Box
        p={spacing.xl}
        style={{
          border: `1px solid ${colors.border.light}`,
          borderRadius: spacing.sm,
          backgroundColor: colors.background.primary,
        }}
      >
        <Stack gap={spacing.lg}>
          {/* Metrics Grid - Always 3 columns */}
          <SimpleGrid cols={3} spacing={spacing.xl}>
            {renderBudgetaryImpact()}
            {renderNetIncomeImpact()}
            {renderPovertyImpact()}
          </SimpleGrid>
        </Stack>
      </Box>
    </Stack>
  );
}
