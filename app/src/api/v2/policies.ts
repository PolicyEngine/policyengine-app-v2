import { API_V2_BASE_URL } from './taxBenefitModels';
import { v2Fetch } from './v2Fetch';

export interface PolicyV2ParameterValueCreateRequest {
  parameter_id: string;
  value_json: unknown;
  start_date: string;
  end_date?: string | null;
}

export interface PolicyV2CreateRequest {
  name: string;
  description?: string | null;
  tax_benefit_model_id: string;
  parameter_values: PolicyV2ParameterValueCreateRequest[];
}

export interface PolicyV2ResponseParameterValue {
  id: string;
  parameter_id: string;
  parameter_name: string;
  value_json: unknown;
  start_date: string;
  end_date: string | null;
  policy_id: string | null;
  dynamic_id: string | null;
  created_at: string;
}

export interface PolicyV2Response {
  id: string;
  name: string;
  description: string | null;
  tax_benefit_model_id: string;
  created_at: string;
  updated_at: string;
  parameter_values: PolicyV2ResponseParameterValue[];
}

export async function createPolicyV2(policy: PolicyV2CreateRequest): Promise<PolicyV2Response> {
  return v2Fetch<PolicyV2Response>(`${API_V2_BASE_URL}/policies/`, 'createPolicyV2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(policy),
  });
}

export async function fetchPolicyByIdV2(policyId: string): Promise<PolicyV2Response> {
  return v2Fetch<PolicyV2Response>(
    `${API_V2_BASE_URL}/policies/${policyId}`,
    `fetchPolicyByIdV2(${policyId})`
  );
}
