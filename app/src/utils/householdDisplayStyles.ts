import { colors } from '@/designTokens';

/**
 * Display style configuration for a variable (arrow direction, colors)
 */
export interface DisplayStyleConfig {
  arrowColor: string;
  arrowDirection: 'up' | 'down';
  valueColor: string;
  borderColor: string;
}

/**
 * Determines the display style configuration based on mode and direction
 *
 * In comparison mode: uses increase/decrease direction
 * In single mode: uses adds/subtracts context
 *
 * @param isComparisonMode - Whether we're in comparison mode
 * @param direction - The direction of change ('increase', 'decrease', 'no-change')
 * @param isAdd - Whether this is an addition (used in single mode)
 * @returns Display style configuration
 */
export function getDisplayStyleConfig(
  isComparisonMode: boolean,
  direction: 'increase' | 'decrease' | 'no-change',
  isAdd: boolean
): DisplayStyleConfig {
  if (isComparisonMode) {
    const isPositive = direction === 'increase';
    const color = isPositive ? colors.primary[700] : colors.text.secondary;
    const arrowDirection = isPositive ? 'up' : 'down';

    return {
      arrowColor: color,
      arrowDirection,
      valueColor: color,
      borderColor: color,
    };
  }

  // Single mode: use isAdd to determine direction
  const color = isAdd ? colors.primary[700] : colors.text.secondary;
  const arrowDirection = isAdd ? 'up' : 'down';

  return {
    arrowColor: color,
    arrowDirection,
    valueColor: color,
    borderColor: color,
  };
}
