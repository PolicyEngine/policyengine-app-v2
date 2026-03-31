/**
 * Analysis Options API - v2 Alpha
 *
 * Fetches the list of available economy-wide calculation modules.
 * Used by the custom analysis feature to let users select which
 * computations to run.
 *
 * API Endpoint:
 * - GET /analysis/options?country={us|uk}  - List available modules
 */

import { API_V2_BASE_URL } from './taxBenefitModels';

// ============================================================================
// Types
// ============================================================================

/** A single computation module available for economy analysis */
export interface ModuleOption {
  name: string;
  label: string;
  description: string;
  response_fields: string[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch available economy analysis modules.
 * GET /analysis/options?country={country}
 */
export async function fetchAnalysisOptions(country?: string): Promise<ModuleOption[]> {
  const params = country ? `?country=${encodeURIComponent(country)}` : '';
  const res = await fetch(`${API_V2_BASE_URL}/analysis/options${params}`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch analysis options: ${res.status} ${errorText}`);
  }

  return res.json();
}
