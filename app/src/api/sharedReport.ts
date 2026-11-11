import { createV2UserClient, isV2ApiError, type V2UserClient } from '@/api/v2UserClient';
import type { CountryId } from '@/libs/countries';
import { isAssociationCountry, type SharedReportItem, type V2ItemResult } from '@/types/v2User';

/**
 * A saved report by its link, the report's user-report ID, read with no
 * credential: anyone holding the link opens the report with its owner's
 * title, source note, provisions and comparison. Null when no saved report
 * has that ID in the country (deleted, or a bad link).
 */
export async function fetchSharedReport(
  countryId: CountryId,
  userReportId: string,
  client: V2UserClient = createV2UserClient({ credentials: { kind: 'none' } })
): Promise<SharedReportItem | null> {
  // Only the US and UK keep saved reports in the API.
  if (!isAssociationCountry(countryId)) {
    return null;
  }
  try {
    const result = await client.request<V2ItemResult<SharedReportItem>>(
      'GET',
      `shared-reports/${encodeURIComponent(userReportId)}`,
      { query: { country_id: countryId } }
    );
    return result.item;
  } catch (error) {
    if (isV2ApiError(error, 404)) {
      return null;
    }
    throw error;
  }
}
