/**
 * V1 Report Detection
 *
 * Pure localStorage reads to detect v1 reports without making any API calls.
 * V2 reports always have both `outputType` and `simulationIds` set;
 * v1 reports lack one or both of these fields.
 */

import type { CountryId } from '@/libs/countries';
import type { UserReport } from '@/types/ingredients/UserReport';
import type { V1ReportInfo } from './types';

const LS_REPORT_KEY = 'user-report-associations';

function parseLocalStorageReports(): UserReport[] {
  try {
    const stored = localStorage.getItem(LS_REPORT_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isV1Report(report: UserReport): boolean {
  return !report.outputType || !report.simulationIds?.length;
}

/**
 * Detect v1 reports in localStorage for a given user.
 * Returns info about each v1 report found. Makes zero API calls.
 */
export function detectV1Reports(userId: string): V1ReportInfo[] {
  const allReports = parseLocalStorageReports();

  return allReports
    .filter((r) => r.userId === userId && isV1Report(r))
    .map((r) => ({
      userReportId: r.id,
      reportId: r.reportId,
      label: r.label,
      countryId: r.countryId as CountryId,
    }));
}

/**
 * Convenience check: are there any v1 reports for this user?
 */
export function hasV1Reports(userId: string): boolean {
  return detectV1Reports(userId).length > 0;
}
