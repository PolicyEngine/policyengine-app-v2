import { colors } from '@/designTokens';

export const TEST_DIRECTIONS = {
  INCREASE: 'increase' as const,
  DECREASE: 'decrease' as const,
  NO_CHANGE: 'no-change' as const,
};

export const EXPECTED_COLORS = {
  POSITIVE: colors.primary[700],
  NEGATIVE: colors.text.secondary,
};

export const EXPECTED_ARROW_DIRECTIONS = {
  UP: 'up' as const,
  DOWN: 'down' as const,
};
