import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { Parameter, getParameterByName } from '@/types/subIngredients/parameter';
import { ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

/**
 * Helper function to get default value for a parameter at a specific date
 * Priority: 1) User's reform value, 2) Baseline current law value
 */
export function getDefaultValueForParam(
  param: ParameterMetadata,
  currentParameters: Parameter[],
  date: string
): any {
  // First check if user has set a reform value for this parameter
  const userParam = getParameterByName({ parameters: currentParameters } as any, param.parameter);
  if (userParam && userParam.values && userParam.values.length > 0) {
    const userCollection = new ValueIntervalCollection(userParam.values);
    const userValue = userCollection.getValueAtDate(date);
    if (userValue !== undefined) {
      return userValue;
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
