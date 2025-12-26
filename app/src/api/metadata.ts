import { BASE_URL } from '@/constants';
import { MetadataApiPayload } from '@/types/metadata';

/**
 * Fetch metadata for a country
 *
 * @param countryId - Country code (us, uk)
 */
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

  return res.json();
}
