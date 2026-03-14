/**
 * V1 Report Detection
 *
 * Pure localStorage reads to detect v1 reports without making any API calls.
 * V2 reports always have both `outputType` and `simulationIds` set;
 * v1 reports lack one or both of these fields.
 */

import type { CountryId } from '@/libs/countries';
import type { UserReport } from '@/types/ingredients/UserReport';
import type { DetectionResult } from './types';

const LOG = '[migration:detect]';
const LS_REPORT_KEY = 'user-report-associations';

function parseLocalStorageReports(): { reports: UserReport[]; error?: string } {
  try {
    const stored = localStorage.getItem(LS_REPORT_KEY);
    if (!stored) {
      console.info(`${LOG} No data in localStorage key "${LS_REPORT_KEY}"`);
      return { reports: [] };
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      const error = `localStorage key "${LS_REPORT_KEY}" is not an array`;
      console.warn(`${LOG} ${error}`);
      return { reports: [], error };
    }
    console.info(`${LOG} Found ${parsed.length} total report(s) in localStorage`);
    return { reports: parsed };
  } catch (err) {
    const error = `Failed to parse localStorage "${LS_REPORT_KEY}": ${err instanceof Error ? err.message : String(err)}`;
    console.error(`${LOG} ${error}`);
    return { reports: [], error };
  }
}

function isV1Report(report: UserReport): boolean {
  return !report.outputType || !report.simulationIds?.length;
}

/**
 * Detect v1 reports in localStorage for a given user.
 * Returns info about each v1 report found. Makes zero API calls.
 */
export function detectV1Reports(userId: string): DetectionResult {
  console.info(`${LOG} Scanning for v1 reports (userId=${userId})`);
  const { reports: allReports, error } = parseLocalStorageReports();

  const userReports = allReports.filter((r) => r.userId === userId);
  const v1Reports = userReports.filter(isV1Report);

  console.info(`${LOG} ${userReports.length} report(s) for this user, ${v1Reports.length} are v1`);

  if (v1Reports.length > 0) {
    for (const r of v1Reports) {
      console.info(
        `${LOG}   v1 report: id=${r.id}, reportId=${r.reportId}, label="${r.label ?? '(none)'}", ` +
          `country=${r.countryId}, outputType=${r.outputType ?? 'MISSING'}, ` +
          `simulationIds=${r.simulationIds?.length ?? 'MISSING'}`
      );
    }
  }

  return {
    reports: v1Reports.map((r) => ({
      userReportId: r.id,
      reportId: r.reportId,
      label: r.label,
      countryId: r.countryId as CountryId,
    })),
    error,
  };
}

/**
 * Convenience check: are there any v1 reports for this user?
 */
export function hasV1Reports(userId: string): boolean {
  return detectV1Reports(userId).reports.length > 0;
}
