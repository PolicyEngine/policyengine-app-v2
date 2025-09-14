import { ReportAdapter } from '@/adapters/ReportAdapter';
import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { Report } from '@/types/ingredients/Report';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import { ReportCreationPayload, ReportSetOutputPayload } from '@/types/payloads';

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
    throw new Error(`Failed to fetch report ${reportId}`);
  }

  const json = await res.json();
  return json.result;
}

export async function createReport(
  countryId: (typeof countryIds)[number],
  data: ReportCreationPayload
): Promise<ReportMetadata> {
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
  return json.result;
}

async function updateReport(
  countryId: (typeof countryIds)[number],
  reportId: string,
  data: ReportSetOutputPayload
): Promise<ReportMetadata> {
  const url = `${BASE_URL}/${countryId}/report`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`Failed to update report ${reportId}`);
  }

  const json = await res.json();
  return json.result;
}

export async function markReportCompleted(
  countryId: (typeof countryIds)[number],
  reportId: string,
  report: Report
): Promise<ReportMetadata> {
  const data = ReportAdapter.toCompletedReportPayload(report);
  return updateReport(countryId, reportId, data);
}

export async function markReportError(
  countryId: (typeof countryIds)[number],
  reportId: string,
  report: Report
): Promise<ReportMetadata> {
  const data = ReportAdapter.toErrorReportPayload(report);
  return updateReport(countryId, reportId, data);
}
