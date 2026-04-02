/**
 * Migration Comparison Logger
 *
 * Structured logging for dual-write shadow validation. Compares v1 and
 * v2 data field-by-field and logs results with filterable prefixes.
 *
 * Log prefixes:
 *   [<prefix>:Detail]  — one line per field with v1/v2 values
 *   [<prefix>:MATCH]   — summary when ALL compared fields match
 *   [<prefix>:DIVERGE] — summary when one or more fields differ
 *
 * The `prefix` parameter (e.g., "PolicyMigration", "HouseholdMigration")
 * appears in every log line for filtering by entity type.
 *
 * Temporary — deleted in Phase 5.
 */

type FieldStatus = 'MATCH' | 'MISMATCH' | 'SKIPPED';

interface FieldResult {
  field: string;
  v1: unknown;
  v2: unknown;
  status: FieldStatus;
}

function valuesEqual(v1: unknown, v2: unknown): boolean {
  if (v1 === v2) {
    return true;
  }
  if (v1 == null && v2 == null) {
    return true;
  }
  if (typeof v1 === 'object' && typeof v2 === 'object') {
    return JSON.stringify(v1) === JSON.stringify(v2);
  }
  return String(v1) === String(v2);
}

function formatValue(val: unknown): string {
  if (val === null) {
    return 'null';
  }
  if (val === undefined) {
    return 'undefined';
  }
  if (typeof val === 'string') {
    return `"${val}"`;
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

export function logMigrationComparison(
  prefix: string,
  operation: string,
  v1: Record<string, unknown>,
  v2: Record<string, unknown>,
  options?: { skipFields?: string[] }
): void {
  const skipSet = new Set(options?.skipFields ?? []);
  const allKeys = [...new Set([...Object.keys(v1), ...Object.keys(v2)])];

  const results: FieldResult[] = allKeys.map((field) => {
    const v1Val = v1[field];
    const v2Val = v2[field];

    if (skipSet.has(field)) {
      return { field, v1: v1Val, v2: v2Val, status: 'SKIPPED' as const };
    }

    const match = valuesEqual(v1Val, v2Val);
    return {
      field,
      v1: v1Val,
      v2: v2Val,
      status: match ? ('MATCH' as const) : ('MISMATCH' as const),
    };
  });

  for (const r of results) {
    console.info(
      `[${prefix}:Detail] ${operation} ${r.field}: v1=${formatValue(r.v1)} v2=${formatValue(r.v2)} ${r.status}`
    );
  }

  const compared = results.filter((r) => r.status !== 'SKIPPED');
  const matches = compared.filter((r) => r.status === 'MATCH').length;
  const mismatches = compared.filter((r) => r.status === 'MISMATCH').length;

  if (mismatches === 0) {
    console.info(
      `[${prefix}:MATCH] ${operation}: ${matches}/${compared.length} compared fields match`
    );
  } else {
    console.info(
      `[${prefix}:DIVERGE] ${operation}: ${matches}/${compared.length} compared fields match, ${mismatches} diverge`
    );
  }
}
