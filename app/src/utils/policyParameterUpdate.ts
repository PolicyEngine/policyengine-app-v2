/**
 * Utility functions for immutably updating policy parameters
 *
 * These functions ensure proper immutability when updating policy state,
 * avoiding the React state mutation bugs that can occur with shallow copies.
 *
 * Issue #602: Boolean policy parameters not being saved to API
 */

import { PolicyStateProps } from '@/types/pathwayState';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval, ValueIntervalCollection } from '@/types/subIngredients/valueInterval';

/**
 * Adds parameter intervals to a policy, returning a new policy object.
 *
 * This function ensures proper immutability by:
 * 1. Creating a new parameters array (not mutating the original)
 * 2. Creating new parameter objects when modifying existing ones
 * 3. Creating new value arrays
 *
 * @param policy - The current policy state
 * @param parameterName - The name of the parameter to add/update
 * @param intervals - The intervals to add
 * @returns A new policy object with the updated parameters
 */
export function addParameterToPolicy(
  policy: PolicyStateProps,
  parameterName: string,
  intervals: ValueInterval[]
): PolicyStateProps {
  // Create a deep copy of the parameters array
  const newParameters: Parameter[] = (policy.parameters || []).map((param) => ({
    ...param,
    values: [...param.values],
  }));

  // Find existing parameter index
  const existingIndex = newParameters.findIndex((p) => p.name === parameterName);

  if (existingIndex === -1) {
    // Create new parameter entry
    const newParam: Parameter = {
      name: parameterName,
      values: [],
    };

    // Use ValueIntervalCollection to add intervals
    const paramCollection = new ValueIntervalCollection(newParam.values);
    intervals.forEach((interval) => {
      paramCollection.addInterval(interval);
    });
    newParam.values = paramCollection.getIntervals();

    newParameters.push(newParam);
  } else {
    // Update existing parameter with new values array
    const existingParam = newParameters[existingIndex];
    const paramCollection = new ValueIntervalCollection([...existingParam.values]);

    intervals.forEach((interval) => {
      paramCollection.addInterval(interval);
    });

    // Create a new parameter object with new values
    newParameters[existingIndex] = {
      ...existingParam,
      values: paramCollection.getIntervals(),
    };
  }

  // Return new policy object with new parameters array
  return {
    ...policy,
    parameters: newParameters,
  };
}
