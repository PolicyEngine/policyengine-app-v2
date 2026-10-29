import { BASE_URL } from '@/constants';
import { canonicalRegionCode } from '@/models/region';
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

  return withCanonicalRegionCodes(await res.json());
}

/**
 * The metadata with each region listed by the code the app uses, so that
 * "country/ni" reads as "country/northern_ireland" whichever code the
 * Public API lists.
 */
function withCanonicalRegionCodes(payload: MetadataApiPayload): MetadataApiPayload {
  const regions = payload.result?.economy_options?.region;
  if (!Array.isArray(regions)) {
    return payload;
  }

  return {
    ...payload,
    result: {
      ...payload.result,
      economy_options: {
        ...payload.result.economy_options,
        region: regions.map((region) => ({ ...region, name: canonicalRegionCode(region.name) })),
      },
    },
  };
}
