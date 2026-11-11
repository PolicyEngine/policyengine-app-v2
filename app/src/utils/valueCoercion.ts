import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import type { PolicyParameterValue } from '@/types/metadata/policyMetadata';

type ValueType = 'float' | 'int' | 'bool' | 'Enum' | 'str' | string;

const NUMERIC_VALUE_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const POSITIVE_INFINITY_MARKERS = new Set(['infinity', '+infinity', 'inf', '+inf']);
const NEGATIVE_INFINITY_MARKERS = new Set(['-infinity', '-inf']);

export type PolicyInfinity = 'Infinity' | '-Infinity';

export type PolicyParameterValueSpec =
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'string' }
  | { kind: 'null' }
  | { kind: 'array'; item: PolicyParameterValueSpec }
  | {
      kind: 'object';
      properties: Readonly<Record<string, PolicyParameterValueSpec>>;
    };

/**
 * Coerces a value based on the variable's valueType.
 * Used for household variable inputs.
 */
export function coerceByValueType(value: unknown, valueType: ValueType): number | boolean | string {
  switch (valueType) {
    case 'bool':
      return toBoolean(value);

    case 'float':
      return toFloat(value);

    case 'int':
      return toInt(value);

    case 'Enum':
    case 'str':
      return toString(value);

    default:
      // Unknown type - attempt numeric coercion as safe default
      return toFloat(value);
  }
}

/**
 * Coerces a value based on the parameter's unit.
 * Used for policy parameter inputs.
 */
export function coerceByUnit(value: unknown, unit: string | null | undefined): number | boolean {
  if (unit === 'bool') {
    return toPolicyBoolean(value);
  }

  // All other units (currency, percentage, year, etc.) are numeric
  return toPolicyNumber(value);
}

/** Resolve the required JSON value shape from typed current-law metadata. */
export function resolvePolicyParameterValueSpec(
  parameterName: string,
  parameters: ParameterMetadataCollection
): PolicyParameterValueSpec {
  const metadata = parameters[parameterName];
  if (!metadata || metadata.type !== 'parameter') {
    throw new TypeError(`Missing parameter metadata for ${parameterName}`);
  }

  const references = Object.entries(metadata.values ?? {})
    .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
    .map(([, value]) => value);
  if (references.length === 0) {
    throw new TypeError(`Parameter metadata for ${parameterName} has no typed values`);
  }

  const nonNullReferences = references.filter(
    (value): value is Exclude<PolicyParameterValue, null> => value !== null
  );
  if (nonNullReferences.length === 0) {
    return { kind: 'null' };
  }

  const emptyArrayItemSpec = metadata.unit === 'list' ? ({ kind: 'string' } as const) : undefined;
  let resolved = specFromReference(nonNullReferences[0], parameterName, emptyArrayItemSpec);
  for (const reference of nonNullReferences.slice(1)) {
    const candidate = specFromReference(reference, parameterName, emptyArrayItemSpec);
    resolved = mergeValueSpecs(resolved, candidate, parameterName);
  }
  return resolved;
}

/** Coerce a policy value according to the exact parameter metadata schema. */
export function coercePolicyParameterValue(
  value: unknown,
  spec: PolicyParameterValueSpec,
  parameterName: string
): PolicyParameterValue {
  const context = `policy parameter ${parameterName}`;
  switch (spec.kind) {
    case 'number':
      return toPolicyNumericValue(value, context);
    case 'boolean':
      return toPolicyBoolean(value, context);
    case 'string':
      if (typeof value !== 'string') {
        throw new TypeError(`Invalid string ${context} value: ${String(value)}`);
      }
      return value;
    case 'null':
      if (value !== null) {
        throw new TypeError(`Invalid null ${context} value: ${String(value)}`);
      }
      return null;
    case 'array': {
      if (!Array.isArray(value)) {
        throw new TypeError(`Invalid array ${context} value`);
      }
      return value.map((item, index) =>
        coercePolicyParameterValue(item, spec.item, `${parameterName}[${index}]`)
      );
    }
    case 'object': {
      if (!isPlainObject(value)) {
        throw new TypeError(`Invalid object ${context} value`);
      }
      const expectedKeys = Object.keys(spec.properties).sort();
      const actualKeys = Object.keys(value).sort();
      if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
        throw new TypeError(`Invalid object ${context} keys: expected ${expectedKeys.join(', ')}`);
      }
      const result: Record<string, PolicyParameterValue> = {};
      for (const key of expectedKeys) {
        result[key] = coercePolicyParameterValue(
          value[key],
          spec.properties[key],
          `${parameterName}.${key}`
        );
      }
      return result;
    }
  }
}

// --- Primitive coercion helpers ---

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === 1) {
    return true;
  }
  return false;
}

function toPolicyBoolean(value: unknown, context = 'policy parameter'): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === 1) {
    return true;
  }
  if (value === 'false' || value === 0) {
    return false;
  }
  throw new TypeError(`Invalid boolean ${context} value: ${String(value)}`);
}

function toPolicyNumber(value: unknown, context = 'policy parameter'): number {
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value;
    }
    const subject = `${context.charAt(0).toUpperCase()}${context.slice(1)}`;
    throw new TypeError(`${subject} values must be finite: ${String(value)}`);
  }

  if (typeof value === 'string' && NUMERIC_VALUE_PATTERN.test(value.trim())) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new TypeError(`Invalid numeric ${context} value: ${String(value)}`);
}

function toPolicyNumericValue(
  value: unknown,
  context = 'policy parameter'
): number | PolicyInfinity {
  const infinity = normalizePolicyInfinity(value);
  if (infinity !== null) {
    return infinity;
  }

  return toPolicyNumber(value, context);
}

function normalizePolicyInfinity(value: unknown): PolicyInfinity | null {
  if (value === Number.POSITIVE_INFINITY) {
    return 'Infinity';
  }
  if (value === Number.NEGATIVE_INFINITY) {
    return '-Infinity';
  }
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (POSITIVE_INFINITY_MARKERS.has(normalized)) {
    return 'Infinity';
  }
  if (NEGATIVE_INFINITY_MARKERS.has(normalized)) {
    return '-Infinity';
  }
  return null;
}

function specFromReference(
  value: PolicyParameterValue,
  parameterName: string,
  emptyArrayItemSpec?: PolicyParameterValueSpec
): PolicyParameterValueSpec {
  if (value === null) {
    return { kind: 'null' };
  }
  if (typeof value === 'number') {
    toPolicyNumericValue(value, `metadata for ${parameterName}`);
    return { kind: 'number' };
  }
  if (typeof value === 'boolean') {
    return { kind: 'boolean' };
  }
  if (typeof value === 'string') {
    if (normalizePolicyInfinity(value) !== null) {
      return { kind: 'number' };
    }
    return { kind: 'string' };
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      if (emptyArrayItemSpec === undefined) {
        throw new TypeError(`Parameter metadata for ${parameterName} has no typed array items`);
      }
      return { kind: 'array', item: emptyArrayItemSpec };
    }
    let item = specFromReference(value[0], parameterName);
    for (const candidateValue of value.slice(1)) {
      item = mergeValueSpecs(item, specFromReference(candidateValue, parameterName), parameterName);
    }
    return {
      kind: 'array',
      item,
    };
  }
  const properties: Record<string, PolicyParameterValueSpec> = {};
  for (const key of Object.keys(value).sort()) {
    properties[key] = specFromReference(value[key], parameterName);
  }
  return { kind: 'object', properties };
}

function mergeValueSpecs(
  first: PolicyParameterValueSpec,
  second: PolicyParameterValueSpec,
  parameterName: string
): PolicyParameterValueSpec {
  if (first.kind !== second.kind) {
    throw new TypeError(`Parameter metadata for ${parameterName} has inconsistent value shapes`);
  }
  if (first.kind === 'array' && second.kind === 'array') {
    return {
      kind: 'array',
      item: mergeValueSpecs(first.item, second.item, parameterName),
    };
  }
  if (first.kind === 'object' && second.kind === 'object') {
    const firstKeys = Object.keys(first.properties).sort();
    const secondKeys = Object.keys(second.properties).sort();
    if (JSON.stringify(firstKeys) !== JSON.stringify(secondKeys)) {
      throw new TypeError(`Parameter metadata for ${parameterName} has inconsistent value shapes`);
    }
    const properties: Record<string, PolicyParameterValueSpec> = {};
    for (const key of firstKeys) {
      properties[key] = mergeValueSpecs(
        first.properties[key],
        second.properties[key],
        parameterName
      );
    }
    return { kind: 'object', properties };
  }
  return first;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function toFloat(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value !== '') {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function toInt(value: unknown): number {
  return Math.round(toFloat(value));
}

function toString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return '';
  }
  return String(value);
}
