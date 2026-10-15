import type { FlagshipReportRecord } from '@/api/flagshipReportStore';
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
 * The report a saved reform's "View full impact report" opens: its newest
 * report for the year it runs, against current law, that ran the reform's
 * values as they are now. Null when there is none — then it runs one.
 * A report still computing is the one to open: its calculation goes on
 * on the server, so a new run would only start the wait again.
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
    if (report.year !== String(year) || readReportMeta(report.apiReportId)?.baseline) {
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
