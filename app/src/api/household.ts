import { BASE_URL } from '@/constants';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { HouseholdCreationPayload } from '@/types/payloads';

export async function fetchHouseholdById(
  country: string,
  household: string
): Promise<HouseholdMetadata> {
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

  const json = await res.json();

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
