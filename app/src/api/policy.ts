import { API_V2_BASE_URL } from '@/api/v2/taxBenefitModels';

/**
 * V2 Policy parameter value - represents a single parameter change
 */
export interface V2PolicyParameterValue {
  parameter_id: string; // UUID of the parameter
  value_json: number | string | boolean | Record<string, unknown>;
  start_date: string; // ISO timestamp (e.g., "2025-01-01T00:00:00Z")
  end_date: string | null; // ISO timestamp or null for indefinite
}

/**
 * V2 Policy creation payload
 */
export interface V2PolicyCreatePayload {
  name: string;
  description?: string;
  tax_benefit_model_id: string; // UUID of the tax benefit model
  parameter_values: V2PolicyParameterValue[];
}

/**
 * V2 Policy response from API
 */
export interface V2PolicyResponse {
  id: string;
  name: string;
  description: string | null;
  tax_benefit_model_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch a policy by ID from v2 API
 */
export async function fetchPolicyById(policyId: string): Promise<V2PolicyResponse> {
  const url = `${API_V2_BASE_URL}/policies/${policyId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch policy ${policyId}`);
  }

  return res.json();
}

/**
 * Create a new policy via v2 API
 */
export async function createPolicy(payload: V2PolicyCreatePayload): Promise<V2PolicyResponse> {
  const url = `${API_V2_BASE_URL}/policies/`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to create policy: ${res.status} ${errorText}`);
  }

  return res.json();
}
