import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import type { HouseholdCalculationOutput } from '@/types/calculation/household';
import VariableArithmetic from './VariableArithmetic';

interface HouseholdBreakdownProps {
  baseline: HouseholdCalculationOutput;
  reform: HouseholdCalculationOutput | null;
  borderColor: string;
  /** Unchanged lines show their value, not a change of 0; off by default. */
  unchangedShowsValue?: boolean;
}

/**
 * Renders the recursive breakdown of household net income
 * Shows the hierarchy of income components that sum to net income
 */
export default function HouseholdBreakdown({
  baseline,
  reform,
  borderColor,
  unchangedShowsValue = false,
}: HouseholdBreakdownProps) {
  const variables = useSelector((state: RootState) => state.metadata.variables);

  const rootVariable = variables.household_net_income;
  if (!rootVariable) {
    return null;
  }

  return (
    <div
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
        childVisibility="all"
        unchangedShowsValue={unchangedShowsValue}
      />
    </div>
  );
}
