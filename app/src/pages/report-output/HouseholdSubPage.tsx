import { Box, Text } from '@mantine/core';
import { Household } from '@/types/ingredients/Household';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import { householdsAreEqual } from '@/utils/householdTableData';
import { extractIndividualsFromHousehold, Individual } from '@/utils/householdIndividuals';
import IndividualTable from '@/components/report/IndividualTable';
import { colors, spacing, typography } from '@/designTokens';

interface HouseholdSubPageProps {
  baselineHousehold?: Household;
  reformHousehold?: Household;
  userHouseholds?: UserHouseholdPopulation[];
}

/**
 * HouseholdSubPage - Displays household population information in Design 4 table format
 *
 * Shows baseline and reform households side-by-side in a comparison table.
 * Displays all configured input values extracted from householdData.
 * Collapses columns when both simulations use the same household.
 */
export default function HouseholdSubPage({
  baselineHousehold,
  reformHousehold,
  userHouseholds,
}: HouseholdSubPageProps) {
  if (!baselineHousehold && !reformHousehold) {
    return <div>No household data available</div>;
  }

  // Check if households are the same
  const householdsSame = householdsAreEqual(baselineHousehold, reformHousehold);

  console.log(`[HouseholdSubPage] baselineHousehold:`, baselineHousehold);
  console.log(`[HouseholdSubPage] reformHousehold:`, reformHousehold);
  console.log(`[HouseholdSubPage] userHouseholds:`, userHouseholds);

  // Get custom labels from userHouseholds, fallback to generic labels
  const baselineUserHousehold = userHouseholds?.find(
    (uh) => uh.householdId === baselineHousehold?.id
  );
  const reformUserHousehold = userHouseholds?.find(
    (uh) => uh.householdId === reformHousehold?.id
  );

  const baselineLabel = baselineUserHousehold?.label || 'Baseline';
  const reformLabel = reformUserHousehold?.label || 'Reform';

  // Extract individuals from both households
  const baselineIndividuals = baselineHousehold ? extractIndividualsFromHousehold(baselineHousehold) : [];
  const reformIndividuals = reformHousehold ? extractIndividualsFromHousehold(reformHousehold) : [];

  // Collect all unique individual IDs
  const allIndividualIds = new Set<string>();
  baselineIndividuals.forEach((ind) => allIndividualIds.add(ind.id));
  reformIndividuals.forEach((ind) => allIndividualIds.add(ind.id));

  // Convert to sorted array
  const sortedIndividualIds = Array.from(allIndividualIds).sort();

  return (
    <div>
      <h2>Population Information</h2>

      {sortedIndividualIds.map((individualId) => {
        // Find this individual in baseline and reform households
        const baselineIndividual = baselineIndividuals.find((ind) => ind.id === individualId);
        const reformIndividual = reformIndividuals.find((ind) => ind.id === individualId);

        // Get the name (should be the same from either)
        const individualName = baselineIndividual?.name || reformIndividual?.name || individualId;

        return (
          <Box key={individualId} style={{ marginTop: spacing.xl }}>
            {/* Individual name header */}
            <Text
              size="lg"
              fw={typography.fontWeight.semibold}
              c={colors.text.primary}
              style={{ marginBottom: spacing.md }}
            >
              {individualName}
            </Text>

            {/* Table with baseline/reform comparison */}
            <IndividualTable
              baselineIndividual={baselineIndividual}
              reformIndividual={reformIndividual}
              baselineLabel={baselineLabel}
              reformLabel={reformLabel}
              isSameHousehold={householdsSame}
            />
          </Box>
        );
      })}
    </div>
  );
}
