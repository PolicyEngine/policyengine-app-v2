import { BASE_URL } from '@/constants';
import { PolicyMetadata } from '@/types/metadata/policyMetadata';
import { PolicyCreationPayload } from '@/types/payloads';

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

  const json = await res.json();

  return json.result;
}

export async function createPolicy(
  data: PolicyCreationPayload
): Promise<{ result: { policy_id: string } }> {
  const url = `${BASE_URL}/us/policy`;

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
