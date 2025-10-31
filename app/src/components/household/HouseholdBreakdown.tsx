import { useSelector } from 'react-redux';
import { Box } from '@mantine/core';
import { RootState } from '@/store';
import { Household } from '@/types/ingredients/Household';
import VariableArithmetic from './VariableArithmetic';

interface HouseholdBreakdownProps {
  baseline: Household;
  reform: Household | null;
  borderColor: string;
}

/**
 * Renders the recursive breakdown of household net income
 * Shows the hierarchy of income components that sum to net income
 */
export default function HouseholdBreakdown({
  baseline,
  reform,
  borderColor,
}: HouseholdBreakdownProps) {
  const metadata = useSelector((state: RootState) => state.metadata);

  const rootVariable = metadata.variables.household_net_income;
  if (!rootVariable) {
    return null;
  }

  return (
    <Box
      style={{
        borderLeft: `3px solid ${borderColor}`,
      }}
    >
      <VariableArithmetic
        variableName="household_net_income"
        baseline={baseline}
        reform={reform}
        isAdd
        defaultExpanded={false}
        childrenOnly
      />
    </Box>
  );
}
