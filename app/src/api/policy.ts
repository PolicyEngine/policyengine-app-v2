import { PolicyMetadata } from '@/types/metadata/policyMetadata';
import { PolicyCreationPayload } from '@/types/payloads';
import { policiesAPI } from './v2/policies';

export async function fetchPolicyById(country: string, policyId: string): Promise<PolicyMetadata> {
  const policy = await policiesAPI.getWithParameters(policyId);
  // Transform to legacy format for compatibility
  return {
    id: policy.id,
    name: policy.name,
    description: policy.description,
    country_id: policy.country || country,
    parameters: policy.parameters.reduce(
      (acc, pv) => {
        acc[pv.parameter_id] = pv.value;
        return acc;
      },
      {} as Record<string, any>
    ),
  } as PolicyMetadata;
}

export async function createPolicy(
  data: PolicyCreationPayload
): Promise<{ result: { policy_id: string } }> {
  // Extract parameter values from the payload
  const parameterValues = Object.entries(data.reform || {}).map(([parameterId, value]) => ({
    parameter_id: parameterId,
    value,
  }));

  const policy = await policiesAPI.createWithParameters(
    {
      name: data.label || 'New Policy',
      description: data.baseline_id ? `Based on baseline ${data.baseline_id}` : undefined,
      country: data.country_id || 'us',
    },
    parameterValues
  );

  return {
    result: {
      policy_id: policy.id,
    },
  };
}
