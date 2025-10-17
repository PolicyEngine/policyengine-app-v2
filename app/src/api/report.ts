import { ReportAdapter } from '@/adapters/ReportAdapter';
import { ApiReportStore, LocalStorageReportStore } from '@/api/reportAssociation';
import { BASE_URL } from '@/constants';
import { countryIds } from '@/libs/countries';
import { Report } from '@/types/ingredients/Report';
import { UserReport } from '@/types/ingredients/UserReport';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import { ReportCreationPayload, ReportSetOutputPayload } from '@/types/payloads';

export type CountryId = (typeof countryIds)[number];

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

/**
 * Parameters for creating a report with user association
 */
export interface CreateReportWithAssociationParams {
  countryId: CountryId;
  payload: ReportCreationPayload;
  userId: string | number;
  label?: string;
}

/**
 * Result of creating a report with user association
 * Contains both the base report and the user association
 */
export interface CreateReportWithAssociationResult {
  report: Report; // Domain model, not API metadata
  userReport: UserReport;
  metadata: {
    baseReportId: string;
    userReportId: string;
    countryId: CountryId;
  };
}

/**
 * Create a report and associate it with a user in one operation
 * This combines report creation with user association for a cleaner flow
 *
 * @param params - Parameters including countryId, payload, userId, and optional label
 * @returns Combined result with report, userReport, and metadata
 */
export async function createReportAndAssociateWithUser(
  params: CreateReportWithAssociationParams
): Promise<CreateReportWithAssociationResult> {
  // 1. Create the base report via API
  const reportMetadata = await createReport(params.countryId, params.payload);

  // 2. Convert to domain model (ensures id is string, proper field names)
  const report = ReportAdapter.fromMetadata(reportMetadata);

  // 3. Determine which store to use (localStorage vs API)
  // TODO: Get isLoggedIn from auth context
  const isLoggedIn = false;
  const reportStore = isLoggedIn ? new ApiReportStore() : new LocalStorageReportStore();

  // 4. Create UserReport association
  const userReport = await reportStore.create({
    userId: String(params.userId),
    reportId: report.id!, // Already a string from adapter
    label: params.label,
    isCreated: true,
  });

  // 5. Return combined result with domain model
  return {
    report,
    userReport,
    metadata: {
      baseReportId: report.id!,
      userReportId: userReport.id,
      countryId: params.countryId,
    },
  };
}
