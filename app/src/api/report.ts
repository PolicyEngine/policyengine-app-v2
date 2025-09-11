import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import { ReportCreationPayload, ReportSetOutputPayload } from '@/types/payloads';

export async function fetchReportById(
  countryId: (typeof countryIds)[number],
  reportId: string
): Promise<ReportMetadata> {
  const url = `${BASE_URL}/${countryId}/report-output/${reportId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch report ${reportId}`);
  }

  const json = await res.json();

  // Forcibly convert numeric ID to string to match our types
  json.result.id = String(json.result.id);

  return json.result;
}

export async function createReport(
  countryId: (typeof countryIds)[number],
  data: ReportCreationPayload
): Promise<{ result: { id: string } }> {
  const url = `${BASE_URL}/${countryId}/report-output`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create report');
  }

  const json = await res.json();

  // Forcibly convert numeric ID to string to match our types
  json.result.id = String(json.result.id);

  return json;
}

export async function updateReport(
  countryId: (typeof countryIds)[number],
  reportId: string,
  data: ReportSetOutputPayload
): Promise<{ result: ReportMetadata }> {
  const url = `${BASE_URL}/${countryId}/report-output/${reportId}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Failed to update report ${reportId}`);
  }

  const json = await res.json();

  // Forcibly convert numeric ID to string to match our types
  json.result.id = String(json.result.id);

  return json;
}