import { reportLink, type FlagshipReportRecord } from '@/api/flagshipReportStore';
import { readReportMeta } from '@/libs/flagship/runReport';
import type { Reform } from '@/types/ingredients/Reform';

/** A parameter's dated values in one fixed form, to compare two reforms by. */
function valueKey(
  path: string,
  intervals: { startDate: string; endDate: string; value: unknown }[]
) {
  return `${path}=${JSON.stringify(
    [...intervals]
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map(({ startDate, endDate, value }) => [startDate, endDate, value])
  )}`;
}

/**
 * Whether a report was compared with something other than current law:
 * the run's details say so in the session that ran it (kept under the
 * report's link), and the record links the saved reform it was compared
 * with.
 */
function comparedWithSavedReform(report: FlagshipReportRecord): boolean {
  return !!readReportMeta(reportLink(report))?.baseline || !!report.baselineReformId;
}

/**
 * The report a saved reform's "View full impact report" opens: its newest
 * report for the year it runs, against current law, that ran the reform's
 * values as they are now. Null when there is none — then it runs one.
 * A report still computing is the one to open: its calculation goes on
 * on the server, so a new run would only start the wait again. Records
 * saved through the API keep no year, so the caller fills it in.
 */
export function latestMatchingReport(
  reform: Reform,
  reports: FlagshipReportRecord[],
  year: number
): FlagshipReportRecord | null {
  const reformKey = reform.parameters
    .map((parameter) => valueKey(parameter.name, parameter.values))
    .sort()
    .join('|');
  const matching = reports.filter((report) => {
    if (report.year !== String(year) || comparedWithSavedReform(report)) {
      return false;
    }
    const reportKey = report.provisions
      .map((provision) =>
        valueKey(
          provision.path,
          provision.intervals ?? [
            { startDate: `${year}-01-01`, endDate: '2100-12-31', value: provision.value },
          ]
        )
      )
      .sort()
      .join('|');
    return reportKey === reformKey;
  });
  return matching.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}
