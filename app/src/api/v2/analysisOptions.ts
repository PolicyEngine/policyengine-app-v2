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
import { v2Fetch } from './v2Fetch';

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

  return v2Fetch<ModuleOption[]>(
    `${API_V2_BASE_URL}/analysis/options${params}`,
    'fetchAnalysisOptions',
    { headers: { Accept: 'application/json' } }
  );
}
