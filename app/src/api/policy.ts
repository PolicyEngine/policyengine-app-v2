import { BASE_URL } from '@/constants';
import { PolicyMetadata } from '@/types/metadata/policyMetadata';
import { PolicyCreationPayload } from '@/types/payloads';

// ============================================================================
// V2 API policy types (used by app/src/api/v2/ module)
// ============================================================================

export interface V2PolicyResponseParameterValue {
  id: string;
  parameter_id: string;
  parameter_name: string;
  value_json: number | string | boolean | Record<string, unknown>;
  start_date: string;
  end_date: string | null;
  policy_id: string | null;
  dynamic_id: string | null;
  created_at: string;
}

export interface V2PolicyResponse {
  id: string;
  name: string;
  description: string | null;
  tax_benefit_model_id: string;
  created_at: string;
  updated_at: string;
  parameter_values: V2PolicyResponseParameterValue[];
}

// ============================================================================
// V1 API functions
// ============================================================================

export async function fetchPolicyById(country: string, policyId: string): Promise<PolicyMetadata> {
  const url = `${BASE_URL}/${country}/policy/${policyId}`;

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

  let json;
  try {
    json = await res.json();
  } catch (error) {
    throw new Error(`Failed to parse policy response: ${error}`);
  }

  if (json.status !== 'ok') {
    throw new Error(json.message || `Failed to fetch policy ${policyId}`);
  }

  return json.result;
}

export async function createPolicy(
  countryId: string,
  data: PolicyCreationPayload
): Promise<{ result: { policy_id: string } }> {
  const url = `${BASE_URL}/${countryId}/policy`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create policy');
  }

  return res.json();
}
