import type { VariableComparison } from '@/utils/householdComparison';

export const TEST_VARIABLE_LABELS = {
  NET_INCOME: 'net income',
  BENEFITS: 'benefits',
} as const;

export const TEST_FORMATTED_VALUES = {
  CURRENCY: '$5,000',
  ZERO: '$0',
} as const;

export const mockComparisonIncrease = (): VariableComparison => ({
  displayValue: 5000,
  direction: 'increase',
  baselineValue: 50000,
  reformValue: 55000,
});

export const mockComparisonDecrease = (): VariableComparison => ({
  displayValue: 5000,
  direction: 'decrease',
  baselineValue: 50000,
  reformValue: 45000,
});

export const mockComparisonNoChange = (): VariableComparison => ({
  displayValue: 0,
  direction: 'no-change',
  baselineValue: 50000,
  reformValue: 50000,
});

export const mockComparisonSingleMode = (): VariableComparison => ({
  displayValue: 50000,
  direction: 'no-change',
  baselineValue: 50000,
});
