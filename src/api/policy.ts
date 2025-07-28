import { BASE_URL } from '@/constants';
import { PolicyState } from '@/reducers/policyReducer';

export async function fetchPolicyById(country: string, policyId: string) {
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

  // Normalize as array (if you ever want to display a list)
  return Array.isArray(json.result) ? json.result : [json.result];
}

export async function createPolicy(data: any) {
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

interface PolicyCreationPayload {
  label?: string;
  data: Record<string, any>;
}

export function serializePolicyCreationPayload(policy: PolicyState): PolicyCreationPayload {
  const { label, params } = policy;

  // Fill payload with keys we already know
  const payload = {
    label,
    data: {} as Record<string, any>,
  };

  // Convert params and their valueIntervals into expected JSON format
  params.forEach((param) => {
    payload.data[param.name] = param.values.reduce((acc, cur) => {
      return { ...acc, [`${cur.startDate}..${cur.endDate}`]: cur.value };
    }, {});
  });

  return payload;
}
