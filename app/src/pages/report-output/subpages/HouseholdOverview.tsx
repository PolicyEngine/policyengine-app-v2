import { Box } from '@mantine/core';
import { Household } from '@/types/ingredients/Household';

interface HouseholdOverviewProps {
  output: Household;
}

/**
 * Overview sub-page for household report outputs
 * Displays key metrics and summary information for household calculations
 */
export default function HouseholdOverview({ output }: HouseholdOverviewProps) {
  // TODO: Implement household overview display
  return <Box>Household Overview - To be implemented</Box>;
}
