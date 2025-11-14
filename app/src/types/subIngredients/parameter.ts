import { Policy } from '../ingredients/Policy';
import { ValueInterval, ValueIntervalCollection } from './valueInterval';

export interface Parameter {
  name: string;
  values: ValueInterval[]; // Redux requires serializable state, so we use ValueInterval[] instead of ValueIntervalCollection
}

export function getParameterByName(policy: Policy, name: string): Parameter | undefined {
  return policy.parameters?.find((param) => param.name === name);
}

/**
 * Adds a value interval to a parameter, handling overlaps automatically.
 * Creates the parameter if it doesn't exist.
 *
 * This follows the same pattern as the Redux reducer (policyReducer.addPolicyParamAtPosition)
 * but returns a new immutable array instead of mutating state.
 *
 * @param parameters - Current parameters array
 * @param name - Parameter name
 * @param valueInterval - Value interval to add
 * @returns New parameters array with the interval added
 */
export function addParameterInterval(
  parameters: Parameter[],
  name: string,
  valueInterval: ValueInterval
): Parameter[] {
  // Find existing parameter using the same helper as Redux reducer
  const existingParam = getParameterByName({ parameters } as any, name);

  // Create collection from existing values (or empty if new parameter)
  const paramCollection = new ValueIntervalCollection(existingParam?.values || []);
  paramCollection.addInterval(valueInterval);
  const newValues = paramCollection.getIntervals();

  if (existingParam) {
    // Update existing parameter immutably
    return parameters.map((p) =>
      p.name === name ? { ...p, values: newValues } : p
    );
  } else {
    // Add new parameter
    return [...parameters, { name, values: newValues }];
  }
}
