export const FOREVER = '2100-12-31';
export const BASE_URL = 'https://api.policyengine.org';
export const CURRENT_YEAR = '2026';

// Certified default US microdata dataset URI, pinned to the revision that
// policyengine.py's bundle manifest resolves as data_releases.us.default_dataset_uri.
// The legacy `policyengine-us-data` Hugging Face repo is deprecated/archived, so any
// generated "Reproduce in Python" snippet for a US national run must point here rather
// than at a `policyengine-us-data` path. Pinned (rather than tracking a floating branch)
// so a copied snippet reproduces the exact certified dataset the app ran against.
// Ported from policyengine-app v1 (POPULACE_US_DEFAULT_DATASET_URI, PR #2846).
// NOTE: subnational (state/CD) and place fallbacks still reference `policyengine-us-data`
// pending Populace place/geo scoping — tracked in policyengine-app-v2#1079 — and are
// intentionally NOT switched to this national URI here.
export const POPULACE_US_DEFAULT_DATASET_URI =
  'hf://policyengine/populace-us/populace_us_2024.h5@populace-us-2024-sparse-l0-refit-57k-71a0887-national-only-20260701';

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
