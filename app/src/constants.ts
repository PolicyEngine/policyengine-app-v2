export const FOREVER = '2100-12-31';
export const BASE_URL = 'https://api.policyengine.org';
export const CURRENT_YEAR = '2026';

// App URLs for the split website/calculator architecture
// In dev mode, these are set via VITE_* env vars to localhost URLs
// In production, they fall back to the prod URLs
export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://policyengine.org';

export const CALCULATOR_URL = import.meta.env.VITE_CALCULATOR_URL || 'https://app.policyengine.org';

/**
 * Get parameter definition date for a given year
 * Used for querying parameter values from metadata at a specific point in time
 *
 * @param year - The year to get the parameter definition date for (e.g., '2025')
 * @returns Date string in format 'YYYY-01-01' for querying parameters
 *
 * @example
 * ```typescript
 * const date = getParamDefinitionDate('2025'); // Returns '2025-01-01'
 * ```
 */
export function getParamDefinitionDate(year?: string): string {
  if (!year) {
    console.error(
      '[getParamDefinitionDate] No year provided - this is likely a bug. ' +
        `Falling back to CURRENT_YEAR (${CURRENT_YEAR}). ` +
        'Please ensure year is passed from report context.'
    );
    return `${CURRENT_YEAR}-01-01`;
  }
  return `${year}-01-01`;
}

/**
 * Mock user ID used for anonymous/unauthenticated users
 * TODO: Replace with actual user ID from auth context when authentication is implemented
 */
export const MOCK_USER_ID = 'anonymous';
