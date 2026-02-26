import { useSelector } from 'react-redux';
import { Stack, Text, Title } from '@mantine/core';
import VariableArithmetic from '@/components/household/VariableArithmetic';
import { spacing } from '@/designTokens';
import { useReportYear } from '@/hooks/useReportYear';
import type { RootState } from '@/store';
import type { Household } from '@/types/ingredients/Household';
import { formatVariableValue, getValueFromHousehold } from '@/utils/householdValues';

interface Props {
  baseline: Household;
  reform: Household | null;
}

/**
 * Net Income Breakdown page
 * Shows interactive tree of household_net_income calculation breakdown
 * Supports both single mode (baseline only) and comparison mode (baseline vs reform)
 */
export default function NetIncomeSubPage({ baseline, reform }: Props) {
  const metadata = useSelector((state: RootState) => state.metadata);
  const reportYear = useReportYear();

  // Check if we have the household_net_income variable
  const netIncomeVariable = metadata.variables.household_net_income;
  if (!netIncomeVariable) {
    return (
      <Stack gap={spacing.md}>
        <Text c="red">Error: household_net_income variable not found in metadata</Text>
      </Stack>
    );
  }

  // Extract net income values
  const baselineValue = getValueFromHousehold(
    'household_net_income',
    reportYear,
    null,
    baseline,
    metadata
  );

  const reformValue = reform
    ? getValueFromHousehold('household_net_income', reportYear, null, reform, metadata)
    : null;

  // Calculate comparison
  const isComparison = reform !== null && reformValue !== null;
  const difference = isComparison ? (reformValue as number) - (baselineValue as number) : 0;

  // Format values for display
  const formatValue = (val: number) => formatVariableValue(netIncomeVariable, val, 0);

  // Generate title
  const getTitle = () => {
    if (!isComparison) {
      return `Your household would have a net income of ${formatValue(baselineValue as number)} in ${reportYear}`;
    }

    if (difference === 0) {
      return `This reform would have no effect on your household net income in ${reportYear}`;
    }

    const sign = difference > 0 ? 'increase' : 'decrease';
    const absChange = formatValue(Math.abs(difference));
    const reformFormatted = formatValue(reformValue as number);

    return `This reform would ${sign} your household net income by ${absChange} to ${reformFormatted} in ${reportYear}`;
  };

  return (
    <Stack gap={spacing.lg}>
      <Title order={3}>{getTitle()}</Title>

      <Text size="sm" c="dimmed">
        Click on any component to expand and see its breakdown.
      </Text>

      <VariableArithmetic
        variableName="household_net_income"
        baseline={baseline}
        reform={reform}
        isAdd
        defaultExpanded
        childrenOnly
      />
    </Stack>
  );
}
