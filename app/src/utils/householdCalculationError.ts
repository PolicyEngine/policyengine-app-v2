import type { CalcError } from '@/types/calculation';

const CORRECTIVE_SPM_CODES = new Set([
  'SPM_SETTINGS_INVALID',
  'SPM_GEOGRAPHY_REQUIRED',
  'SPM_GEOGRAPHY_UNAVAILABLE',
  'SPM_COMPOSITION_REQUIRED',
  'SPM_YEAR_UNAVAILABLE',
]);

export function isCorrectiveSPMError(code?: string): boolean {
  return !!code && CORRECTIVE_SPM_CODES.has(code);
}

/** Keep API validation codes so invalid inputs can be corrected before retrying. */
export function householdCalculationError(
  error: unknown,
  fallback = 'Household calculation failed'
): CalcError {
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : 'HOUSEHOLD_CALC_FAILED';

  return {
    code,
    message: error instanceof Error ? error.message : fallback,
    retryable: !isCorrectiveSPMError(code),
  };
}
