import type { components } from '@/api/publicApi/schema';
import type { PolicyParameterValue } from '@/types/metadata/policyMetadata';

/** A value `/v2/policies` takes: JSON whose numbers are finite. */
export type FiniteJsonValue = components['schemas']['FiniteJsonValue'];

/**
 * Whether a value is JSON made of the kinds the app keeps parameter values
 * as: text, numbers, yes/no values, null, and lists and plain objects of
 * them. With `finite`, every number must be finite.
 */
function isJsonValue(value: unknown, finite: boolean): boolean {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return true;
  }
  if (typeof value === 'number') {
    return finite ? Number.isFinite(value) : !Number.isNaN(value);
  }
  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item, finite));
  }
  if (typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.values(value).every((item) => isJsonValue(item, finite));
  }
  return false;
}

function isParameterValue(value: unknown): value is PolicyParameterValue {
  return isJsonValue(value, false);
}

function isFiniteJsonValue(value: unknown): value is FiniteJsonValue {
  return isJsonValue(value, true);
}

/**
 * A parameter value the Public API sent (typed only as JSON), checked where
 * it arrives so a malformed response fails there, naming the parameter.
 */
export function parameterValueFromApi(value: unknown, parameterName: string): PolicyParameterValue {
  if (!isParameterValue(value)) {
    throw new Error(
      `The Public API sent a value for ${parameterName} that is not a parameter value.`
    );
  }
  return value;
}

/** A parameter value as `/v2/policies` takes it, checked before it is sent. */
export function finiteJsonValueForApi(value: unknown, parameterName: string): FiniteJsonValue {
  if (!isFiniteJsonValue(value)) {
    throw new Error(
      `The value for ${parameterName} cannot be sent to the Public API as finite JSON.`
    );
  }
  return value;
}
