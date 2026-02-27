import { fetchRegionByCode } from '@/api/v2/regions';

/**
 * Looks up the dataset UUID for a region from the v2 API.
 *
 * Each region in the v2 API has a `dataset_id` field linking it to
 * the correct dataset. This replaces the old hardcoded string-based
 * lookup (e.g., 'enhanced_cps') with a proper UUID lookup.
 *
 * @param countryId - The country ID (e.g., 'us', 'uk')
 * @param regionCode - The region code (e.g., 'us', 'uk', 'state/ca')
 * @returns The dataset UUID, or null if lookup fails (lets API use default)
 */
export async function getDatasetIdForRegion(
  countryId: string,
  regionCode: string
): Promise<string | null> {
  try {
    const region = await fetchRegionByCode(countryId, regionCode);
    return region.dataset_id;
  } catch {
    console.warn(
      `[getDatasetIdForRegion] Could not resolve dataset for ${countryId}/${regionCode}, using API default`
    );
    return null;
  }
}
