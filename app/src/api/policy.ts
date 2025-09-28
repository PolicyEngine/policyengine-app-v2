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
  // Get model_id based on country
  const countryId = (data as any).country_id || 'us';
  const modelIdMap: Record<string, string> = {
    'us': 'policyengine_us',
    'uk': 'policyengine_uk',
    'ca': 'policyengine_ca',
    'ng': 'policyengine_ng',
    'il': 'policyengine_il'
  };
  const modelId = modelIdMap[countryId] || `policyengine_${countryId}`;

  // Extract parameter values from the payload
  const parameterValues = Object.entries((data as any).reform || {}).map(([parameterId, value]) => ({
    parameter_id: parameterId,
    model_id: modelId,
    value: value as string | number | boolean,
  }));

  const policy = await policiesAPI.createWithParameters(
    {
      name: data.label || 'New Policy',
      description: (data as any).baseline_id ? `Based on baseline ${(data as any).baseline_id}` : undefined,
      country: countryId,
    },
    parameterValues
  );

  return {
    result: {
      policy_id: policy.id,
    },
  };
}
