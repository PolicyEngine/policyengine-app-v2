import { intervalValueAt, type TrackedBillProvision } from '@/api/billFeed';
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
