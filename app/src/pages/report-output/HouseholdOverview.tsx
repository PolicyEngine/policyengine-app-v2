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
  console.log('[HouseholdOverview] ========== RECEIVED OUTPUTS ==========');
  console.log('[HouseholdOverview] Total outputs:', outputs.length);
  console.log('[HouseholdOverview] Baseline (outputs[0]):', outputs[0]);
  console.log('[HouseholdOverview] Baseline household data:', outputs[0]?.householdData);
  console.log(
    '[HouseholdOverview] Baseline household data keys:',
    outputs[0]?.householdData ? Object.keys(outputs[0].householdData) : []
  );
  if (outputs[1]) {
    console.log('[HouseholdOverview] Reform (outputs[1]):', outputs[1]);
    console.log('[HouseholdOverview] Reform household data:', outputs[1]?.householdData);
    console.log(
      '[HouseholdOverview] Reform household data keys:',
      outputs[1]?.householdData ? Object.keys(outputs[1].householdData) : []
    );
  }

  // Determine mode and extract households
  const isComparisonMode = outputs.length === 2;
  console.log('[HouseholdOverview] Is comparison mode:', isComparisonMode);
  const baseline = outputs[0];
  console.log('[HouseholdOverview] Extracted baseline household with ID:', baseline?.id);
  const reform = isComparisonMode ? outputs[1] : null;
  console.log('[HouseholdOverview] Extracted reform household with ID:', reform?.id);

  console.log('[HouseholdOverview] Mode:', isComparisonMode ? 'COMPARISON' : 'SINGLE');
  console.log('[HouseholdOverview] Baseline ID:', baseline?.id);
  if (reform) {
    console.log('[HouseholdOverview] Reform ID:', reform?.id);
  }

  return (
    <Stack gap={spacing.xl}>
      <HouseholdSummaryCard baseline={baseline} reform={reform} policyLabels={policyLabels} />
    </Stack>
  );
}
