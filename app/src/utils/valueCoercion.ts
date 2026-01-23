type ValueType = 'float' | 'int' | 'bool' | 'Enum' | 'str' | string;

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
    return toBoolean(value);
  }

  // All other units (currency, percentage, year, etc.) are numeric
  return toFloat(value);
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
