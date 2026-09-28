import type { PolicyParameterValue } from '@/types/metadata/policyMetadata';

type ValueType = 'float' | 'int' | 'bool' | 'Enum' | 'str' | string;

const NUMERIC_VALUE_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

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

/**
 * Validates and normalizes a policy value at API serialization/deserialization
 * boundaries. Numeric and boolean strings are cast while legitimate JSON text
 * and structured parameter values are preserved.
 */
export function coercePolicyParameterValue(value: unknown): PolicyParameterValue {
  if (value === null) {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return toPolicyNumber(value);
  }

  if (typeof value === 'string') {
    if (value === 'true' || value === 'false') {
      return value === 'true';
    }
    if (NUMERIC_VALUE_PATTERN.test(value.trim())) {
      return toPolicyNumber(value);
    }
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(coercePolicyParameterValue);
  }

  if (typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Policy parameter objects must be plain JSON objects');
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        coercePolicyParameterValue(nestedValue),
      ])
    );
  }

  throw new TypeError(`Invalid policy parameter value: ${String(value)}`);
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

function toPolicyBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === 1) {
    return true;
  }
  if (value === 'false' || value === 0) {
    return false;
  }
  throw new TypeError(`Invalid boolean policy parameter value: ${String(value)}`);
}

function toPolicyNumber(value: unknown): number {
  if (typeof value === 'number') {
    if (Number.isFinite(value)) {
      return value;
    }
    throw new TypeError(`Policy parameter values must be finite: ${String(value)}`);
  }

  if (typeof value === 'string' && NUMERIC_VALUE_PATTERN.test(value.trim())) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new TypeError(`Invalid numeric policy parameter value: ${String(value)}`);
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
