import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Box, Stack, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useEntities } from '@/hooks/useStaticMetadata';
import { RootState } from '@/store';
import { Household } from '@/types/ingredients/Household';
import { calculateVariableComparison } from '@/utils/householdComparison';
import { formatVariableValue, HouseholdMetadataContext } from '@/utils/householdValues';
import HouseholdBreakdown from './HouseholdBreakdown';

interface HouseholdSummaryCardProps {
  baseline: Household;
  reform: Household | null;
  policyLabels?: string[];
}

/**
 * Displays the main summary card for household overview
 * Shows net income title and recursive breakdown
 */
export default function HouseholdSummaryCard({
  baseline,
  reform,
  policyLabels,
}: HouseholdSummaryCardProps) {
  const countryId = useCurrentCountry();
  const reduxMetadata = useSelector((state: RootState) => state.metadata);
  const entities = useEntities(countryId);

  // Build HouseholdMetadataContext
  const metadataContext: HouseholdMetadataContext = useMemo(
    () => ({ variables: reduxMetadata.variables, entities }),
    [reduxMetadata.variables, entities]
  );

  const rootVariable = reduxMetadata.variables.household_net_income;
  if (!rootVariable) {
    return (
      <Box>
        <Text c="red">Error: household_net_income variable not found in metadata</Text>
      </Box>
    );
  }

  // Calculate comparison for net income
  const isComparisonMode = reform !== null;
  const comparison = calculateVariableComparison(
    'household_net_income',
    baseline,
    reform,
    metadataContext
  );

  // Format the value
  const formattedValue = formatVariableValue(rootVariable, comparison.displayValue, 0);

  // Get policy labels
  const baselineLabel = policyLabels?.[0] || 'baseline';
  const reformLabel = policyLabels?.[1] || 'reform';

  // Get title text with policy context
  let titleText: string;
  if (!isComparisonMode) {
    titleText = `Your net income is ${formattedValue}`;
  } else if (comparison.direction === 'no-change') {
    titleText = `Your net income stayed the same under "${reformLabel}" compared to "${baselineLabel}"`;
  } else {
    const verb = comparison.direction === 'increase' ? 'increased' : 'decreased';
    titleText = `Your net income ${verb} by ${formattedValue} under "${reformLabel}" compared to "${baselineLabel}"`;
  }

  // Determine border color based on mode and direction
  const borderColor = isComparisonMode
    ? comparison.direction === 'increase'
      ? colors.primary[700]
      : colors.text.secondary
    : colors.primary[700];

  return (
    <Box
      p={spacing.xl}
      style={{
        border: `1px solid ${colors.border.light}`,
        borderRadius: spacing.sm,
        backgroundColor: colors.background.primary,
      }}
    >
      <Stack gap={spacing.lg}>
        {/* Main Title */}
        <Box>
          <Text size="xl" fw={typography.fontWeight.semibold} c={colors.primary[700]}>
            {titleText}
          </Text>
        </Box>

        {/* Recursive Breakdown */}
        <HouseholdBreakdown baseline={baseline} reform={reform} borderColor={borderColor} />

        {/* Description */}
        <Box ta="center" mt={spacing.sm}>
          <Text size="sm" c={colors.text.secondary}>
            {isComparisonMode
              ? "Here's how the policy change affected your household's net income. Click to expand a section and see the breakdown."
              : "Here's how we calculated your household's net income. Click to expand a section and see the breakdown."}
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
