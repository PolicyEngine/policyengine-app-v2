import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import { ReportCreationPayload, ReportSetOutputPayload } from '@/types/payloads';
import { ReportAdapter } from '@/adapters/ReportAdapter';
import { ReportOutput } from '@/types/ingredients/Report';

export async function fetchReportById(
  countryId: (typeof countryIds)[number],
  reportId: number
): Promise<ReportMetadata> {
  const url = `${BASE_URL}/${countryId}/report/${reportId}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch report ${reportId}`);
  }

  const json = await res.json();

  return json.result;
}

export async function createReport(
  countryId: (typeof countryIds)[number],
  data: ReportCreationPayload
): Promise<{ result: { id: number } }> {
  const url = `${BASE_URL}/${countryId}/report`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create report');
  }

  const json = await res.json();

  return json;
}

async function updateReport(
  countryId: (typeof countryIds)[number],
  reportId: string,
  data: ReportSetOutputPayload
): Promise<{ result: ReportMetadata }> {
  const url = `${BASE_URL}/${countryId}/report/${reportId}`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Failed to update report ${reportId}`);
  }

  const json = await res.json();

  return json;
}

export async function markReportCompleted(
  countryId: (typeof countryIds)[number],
  reportId: string,
  output: ReportOutput
): Promise<{ result: ReportMetadata }> {
  const data = ReportAdapter.toCompletedReportPayload(output);
  return updateReport(countryId, reportId, data);
}

export async function markReportError(
  countryId: (typeof countryIds)[number],
  reportId: string
): Promise<{ result: ReportMetadata }> {
  const data = ReportAdapter.toErrorReportPayload();
  return updateReport(countryId, reportId, data);
}
