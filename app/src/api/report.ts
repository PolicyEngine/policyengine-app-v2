import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { ReportMetadata } from '@/types/metadata/reportMetadata';

/**
 * Fetch a report by ID from the v1 API.
 *
 * @deprecated Use v2 analysis endpoints instead. This remains for backward
 * compatibility with reports created before the v2 migration. V2 reports
 * construct their Report object from UserReport metadata and never call this.
 */
export async function fetchReportById(
  countryId: (typeof countryIds)[number],
  reportId: string
): Promise<ReportMetadata> {
  const url = `${BASE_URL}/${countryId}/report/${reportId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    console.error('[fetchReportById] Failed:', res.status, res.statusText);
    throw new Error(`Failed to fetch report ${reportId}`);
  }

  const json = await res.json();
  return json.result;
}
