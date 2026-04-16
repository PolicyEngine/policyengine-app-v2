import { BASE_URL } from '@/constants';
import type { V1HouseholdMetadataEnvelope } from '@/models/household/v1Types';
import { HouseholdCreationPayload } from '@/types/payloads';

export async function fetchHouseholdById(
  country: string,
  household: string
): Promise<V1HouseholdMetadataEnvelope> {
  const url = `${BASE_URL}/${country}/household/${household}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch household ${household}`);
  }

  let json;
  try {
    json = await res.json();
  } catch (error) {
    throw new Error(`Failed to parse household response: ${error}`);
  }

  if (json.status !== 'ok') {
    throw new Error(json.message || `Failed to fetch household ${household}`);
  }

  // Forcibly convert numeric ID to string
  json.result.id = String(json.result.id);

  return json.result;
}

export async function createHousehold(
  data: HouseholdCreationPayload
): Promise<{ result: { household_id: string } }> {
  const url = `${BASE_URL}/${data.country_id}/household`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create household');
  }

  return res.json();
}
