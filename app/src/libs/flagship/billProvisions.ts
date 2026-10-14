import { intervalValueAt, type BillChange, type TrackedBillProvision } from '@/api/billFeed';
import { isAlreadyCurrentLaw, lawValuesFrom } from '@/libs/flagship/billMetrics';
import type { RunReportProvision } from '@/libs/flagship/runReport';
import type { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';
import { formatLabelParts, getHierarchicalLabels } from '@/utils/parameterLabels';

/** The value current law gives a parameter on a date. */
function lawValueOn(values: Record<string, unknown> | undefined | null, date: string): unknown {
  return lawValuesFrom(values, date, date)[0];
}

/** The value the tracker compared a provision with in the run year, when it stored it. */
function scoredBaseline(provision: TrackedBillProvision, date: string): unknown {
  const intervals = provision.baselineIntervals;
  if (!intervals || intervals.length === 0) {
    return undefined;
  }
  const inRunYear = intervalValueAt(intervals, date);
  return inRunYear === undefined ? intervals[0].value : inRunYear;
}

/**
 * A tracked bill's provisions as report provisions: each keeps every
 * dated value the bill sets, and reads against the law in effect when
 * the bill's run year starts — not today's, which for a bill from 2027
 * can differ (an indexed amount, a scheduled rate cut).
 *
 * A bill that is already law (`priorLaw`) reads against the law the
 * tracker compared it with instead: today's values include the bill, so
 * they say nothing about what it changed. The tracker's values also
 * stand in where the model's metadata lacks a parameter.
 */
export function billReportProvisions(
  provisions: TrackedBillProvision[],
  parameters: ParameterMetadataCollection | null | undefined,
  year: number,
  { priorLaw = false }: { priorLaw?: boolean } = {}
): RunReportProvision[] {
  const runStart = `${year}-01-01`;
  return provisions.map((provision) => {
    const metadata = parameters?.[provision.path];
    const scored = scoredBaseline(provision, runStart);
    const law = lawValueOn(metadata?.values, runStart);
    return {
      path: provision.path,
      breadcrumb:
        metadata && parameters
          ? formatLabelParts(getHierarchicalLabels(provision.path, parameters))
          : (provision.fallbackBreadcrumb ?? provision.path),
      unit: metadata?.unit ?? null,
      baselineValue: (priorLaw && scored !== undefined) || law === undefined ? scored : law,
      value: provision.value,
      ...(provision.intervals ? { intervals: provision.intervals } : {}),
    };
  });
}

/**
 * Whether today's law already has every value the bill sets, from its
 * run year on — an enacted bill. Each dated value is checked against the
 * law over its own dates, so a one-year change that matches that year's
 * law counts, and a bill that freezes a value current law schedules to
 * change does not.
 */
export function billAlreadyCurrentLaw(
  provisions: TrackedBillProvision[],
  parameters: ParameterMetadataCollection | null | undefined,
  year: number
): boolean {
  const runStart = `${year}-01-01`;
  return isAlreadyCurrentLaw(
    provisions.flatMap((provision) => {
      const values = parameters?.[provision.path]?.values;
      if (!provision.intervals) {
        return [{ value: provision.value, lawValues: lawValuesFrom(values, runStart) }];
      }
      return (
        provision.intervals
          // Dates before the run year are not scored.
          .filter((interval) => interval.endDate >= runStart)
          .map((interval) => {
            const from = interval.startDate > runStart ? interval.startDate : runStart;
            return {
              value: interval.value,
              lawValues: lawValuesFrom(values, from, interval.endDate),
            };
          })
      );
    })
  );
}

/**
 * A write-up value that is one plain number — "4.45%", "$2,000", "-0.5" —
 * with how far its rounding lets the true value lie: half its last digit.
 * Anything else (words, ranges, several values) reads as nothing.
 */
function writeUpNumber(text: string): { value: number; tolerance: number } | undefined {
  const match = text
    .trim()
    .match(/^([-\u2212+]?)\s*\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?\s*%?$/);
  if (!match) {
    return undefined;
  }
  const [, sign, whole, decimals = ''] = match;
  const magnitude = Number(`${whole.replace(/,/g, '')}.${decimals || '0'}`);
  return {
    value: sign === '-' || sign === '\u2212' ? -magnitude : magnitude,
    tolerance: 0.5 * 10 ** -decimals.length,
  };
}

/** Whether a change's parameter, which can hold "{filing_status}", names this path. */
function changeNamesPath(parameter: string, path: string): boolean {
  const pattern = parameter
    .split(/\{[^}]+\}/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^.]+');
  return new RegExp(`^${pattern}$`).test(path);
}

/**
 * Whether the values a bill's run would score disagree with the tracker's
 * write-up of its changes — the "after" it shows in the Policy changes
 * table. A change is checked against the provisions it names, or against
 * a bill's only provision when the write-up has one change; one that
 * cannot be paired, or whose value is not one number, is not checked. A
 * written value agrees with any value the bill sets, as written or as a
 * percent of it ("4.45%" is 0.0445), within the write-up's rounding.
 *
 * When they disagree the stored parameters do not describe the bill as
 * written up (a tracker row with its reform and baseline swapped scores
 * the law before the bill), and a run would score some other change.
 */
export function billScoresOtherThanWriteUp(
  provisions: Array<Pick<TrackedBillProvision, 'path' | 'value' | 'intervals'>>,
  changes: BillChange[] | undefined
): boolean {
  if (!changes || changes.length === 0) {
    return false;
  }
  return changes.some((change) => {
    const written = writeUpNumber(change.after);
    if (!written) {
      return false;
    }
    const described = change.parameter
      ? provisions.filter((provision) => changeNamesPath(change.parameter!, provision.path))
      : provisions.length === 1 && changes.length === 1
        ? provisions
        : [];
    const near = (scored: number) =>
      Math.abs(scored - written.value) <=
      written.tolerance + 1e-9 * Math.max(1, Math.abs(written.value));
    return described.some((provision) => {
      const scored = [
        provision.value,
        ...(provision.intervals ?? []).map((interval) => interval.value),
      ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      return scored.length > 0 && !scored.some((value) => near(value) || near(value * 100));
    });
  });
}
