import { Stack } from '@mantine/core';
import HouseholdSummaryCard from '@/components/household/HouseholdSummaryCard';
import { spacing } from '@/designTokens';
import { Household } from '@/types/ingredients/Household';

interface HouseholdOverviewProps {
  outputs: Household[];
  policyLabels?: string[];
}

/**
 * Overview page for household report outputs
 *
 * Displays household net income breakdown in two modes:
 * - Single mode: Shows baseline values (outputs[0])
 * - Comparison mode: Shows change between baseline and reform (outputs[0] vs outputs[1])
 *
 * Structure:
 * - Title showing total net income (or change)
 * - Recursive breakdown of income components
 * - Each component can expand to show its children
 * - Arrows indicate additions (up, blue) or subtractions (down, gray)
 * - In comparison mode, arrows indicate increase (up, blue) or decrease (down, gray)
 */
export default function HouseholdOverview({ outputs, policyLabels }: HouseholdOverviewProps) {
  // Determine mode and extract households
  const isComparisonMode = outputs.length === 2;
  const baseline = outputs[0];
  const reform = isComparisonMode ? outputs[1] : null;

  return (
    <Stack gap={spacing.xl}>
      <HouseholdSummaryCard baseline={baseline} reform={reform} policyLabels={policyLabels} />
    </Stack>
  );
}
