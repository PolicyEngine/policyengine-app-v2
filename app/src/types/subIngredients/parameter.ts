import { Policy } from '../ingredients/Policy';
import { ValueInterval } from './valueInterval';

export interface Parameter {
  name: string;
  values: ValueInterval[]; // Redux requires serializable state, so we use ValueInterval[] instead of ValueIntervalCollection
}

export function getParameterByName(policy: Policy, name: string): Parameter | undefined {
  return policy.params.find((param) => param.name === name);
}
