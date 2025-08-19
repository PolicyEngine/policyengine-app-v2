import { BASE_URL } from '@/constants';
import { MetadataApiPayload } from '@/types/metadata';

export async function fetchMetadata(countryId: string): Promise<MetadataApiPayload> {
  const url = `${BASE_URL}/${countryId}/metadata`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch metadata for ${countryId}`);
  }

  const json = await res.json();

  return json;
}
