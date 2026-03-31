/**
 * Parameter tree API module.
 *
 * Provides lazy tree loading via GET /parameters/children
 * and targeted parameter lookup via POST /parameters/by-name.
 */

import { API_V2_BASE_URL } from './taxBenefitModels';

// ---------------------------------------------------------------------------
// Types (matching API response schema)
// ---------------------------------------------------------------------------

export interface ParameterChildNode {
  path: string;
  label: string;
  type: 'node' | 'parameter';
  child_count: number | null;
  parameter: V2ParameterData | null;
}

export interface ParameterChildrenResponse {
  parent_path: string;
  children: ParameterChildNode[];
}

/** Subset of ParameterRead fields returned for leaf parameters. */
export interface V2ParameterData {
  id: string;
  name: string;
  label: string | null;
  description: string | null;
  data_type: string | null;
  unit: string | null;
  tax_benefit_model_version_id: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

/**
 * Fetch direct children of a parameter path for tree navigation.
 */
export async function fetchParameterChildren(
  parentPath: string,
  countryId: string
): Promise<ParameterChildrenResponse> {
  const params = new URLSearchParams({
    country_id: countryId,
    parent_path: parentPath,
  });

  const res = await fetch(`${API_V2_BASE_URL}/parameters/children?${params}`);

  if (!res.ok) {
    throw new Error(`Failed to fetch parameter children for path "${parentPath}"`);
  }

  return res.json();
}

/**
 * Fetch specific parameters by their exact names.
 */
export async function fetchParametersByName(
  names: string[],
  countryId: string
): Promise<V2ParameterData[]> {
  if (names.length === 0) {
    return [];
  }

  const res = await fetch(`${API_V2_BASE_URL}/parameters/by-name`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names, country_id: countryId }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch parameters by name`);
  }

  return res.json();
}
