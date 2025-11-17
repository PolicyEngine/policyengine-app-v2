import { PolicyStateProps } from '@/types/pathwayState';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { getParameterByName } from '@/types/subIngredients/parameter';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

/**
 * Helper function to get default value for a parameter at a specific date
 * Priority: 1) User's reform value, 2) Baseline current law value
 */
export function getDefaultValueForParam(
  param: ParameterMetadata,
  policy: PolicyStateProps | null,
  date: string
): any {
  // First check if user has set a reform value for this parameter
  if (policy) {
    const userParam = getParameterByName(policy, param.parameter);
    if (userParam && userParam.values && userParam.values.length > 0) {
      const userCollection = new ValueIntervalCollection(userParam.values);
      const userValue = userCollection.getValueAtDate(date);
      if (userValue !== undefined) {
        return userValue;
      }
    }
  }

  // Fall back to baseline current law value from metadata
  if (param.values) {
    const collection = new ValueIntervalCollection(param.values as any);
    const value = collection.getValueAtDate(date);
    if (value !== undefined) {
      return value;
    }
  }

  // Last resort: default based on unit type
  return param.unit === 'bool' ? false : 0;
}
