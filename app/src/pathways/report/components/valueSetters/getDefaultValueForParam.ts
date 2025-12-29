import { ParameterMetadata } from '@/types/metadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { getParameterByName } from '@/types/subIngredients/parameter';
import { ValueIntervalCollection, ValuesList } from '@/types/subIngredients/valueInterval';

/**
 * Helper function to get default value for a parameter at a specific date
 * Priority: 1) User's reform value, 2) Fetched baseline values, 3) Param metadata values
 *
 * @param param - The parameter metadata
 * @param policy - The user's policy with any reform values
 * @param date - The date to get the value for
 * @param baselineValues - Optional baseline values fetched from V2 API
 */
export function getDefaultValueForParam(
  param: ParameterMetadata,
  policy: PolicyStateProps | null,
  date: string,
  baselineValues?: ValuesList
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

  // Use fetched baseline values if available (V2 API)
  if (baselineValues && Object.keys(baselineValues).length > 0) {
    const collection = new ValueIntervalCollection(baselineValues);
    const value = collection.getValueAtDate(date);
    if (value !== undefined) {
      return value;
    }
  }

  // Fall back to baseline current law value from param metadata (backward compatibility)
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
