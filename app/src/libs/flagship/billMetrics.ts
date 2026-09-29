import type { TrackedBill } from '@/api/billFeed';
import type { ReportMetric } from '@/components/flagship/ReportContents';
import { formatCurrencyAbbr } from '@/utils/formatters';

function relativeChange(percentChange: number): string {
  if (percentChange === 0) {
    return 'No change';
  }
  const magnitude = Math.abs(percentChange);
  return `${magnitude < 0.1 ? '<0.1' : magnitude.toFixed(1)}% ${percentChange < 0 ? 'decrease' : 'increase'}`;
}

/**
 * A tracked bill's stored headline numbers, shaped like a completed
 * report's overview metrics so the page reads the same before the full
 * results arrive. Metrics the tracker did not store are left out.
 */
export function storedBillMetrics(
  bill: Pick<TrackedBill, 'state' | 'impacts' | 'impactData'>,
  countryId: Parameters<typeof formatCurrencyAbbr>[1]
): ReportMetric[] {
  const impact = bill.impactData;
  const metrics: ReportMetric[] = [];

  const revenue = impact?.budgetary?.stateRevenueImpact ?? bill.impacts?.revenue;
  if (typeof revenue === 'number' && Number.isFinite(revenue)) {
    metrics.push({
      value: formatCurrencyAbbr(Math.abs(revenue), countryId, { maximumFractionDigits: 1 }),
      // A state bill's stored figure is that state's revenue.
      label: `Annual ${bill.state ? 'state ' : ''}revenue ${
        revenue < 0 ? 'loss' : revenue > 0 ? 'gain' : 'change'
      }`,
    });
  }

  const winners = impact?.winnersLosers;
  if (winners && (winners.gainMore5Pct !== undefined || winners.gainLess5Pct !== undefined)) {
    const gains = (winners.gainMore5Pct ?? 0) + (winners.gainLess5Pct ?? 0);
    metrics.push({ value: `${(gains * 100).toFixed(1)}%`, label: 'Households gaining' });
  }

  const childPoverty = impact?.childPoverty?.percentChange;
  const poverty = impact?.poverty?.percentChange ?? bill.impacts?.povertyPercentChange;
  if (typeof childPoverty === 'number') {
    metrics.push({ value: relativeChange(childPoverty), label: 'Child poverty · relative change' });
  } else if (typeof poverty === 'number') {
    metrics.push({ value: relativeChange(poverty), label: 'Poverty · relative change' });
  }

  return metrics;
}

function sameValue(value: unknown, baselineValue: unknown): boolean {
  if (baselineValue === undefined || baselineValue === null) {
    return false;
  }
  if (typeof value === 'boolean' || typeof baselineValue === 'boolean') {
    return value === baselineValue;
  }
  const a = Number(value);
  const b = Number(baselineValue);
  if (value !== '' && baselineValue !== '' && Number.isFinite(a) && Number.isFinite(b)) {
    return Math.abs(a - b) < 1e-12;
  }
  return value === baselineValue;
}

/**
 * The values current law gives a parameter from `fromDate` on: the one in
 * effect that day and every later scheduled change.
 */
export function lawValuesFrom(
  values: Record<string, unknown> | undefined | null,
  fromDate: string
): unknown[] {
  if (!values) {
    return [];
  }
  const dates = Object.keys(values).sort();
  const inEffect = dates.filter((date) => date <= fromDate).pop();
  const later = dates.filter((date) => date > fromDate);
  return [...(inEffect ? [inEffect] : []), ...later].map((date) => values[date]);
}

/**
 * Whether every provision already matches current law for the whole run
 * and beyond, as for an enacted bill. Scored against current law such a
 * bill changes nothing, so its only meaningful estimate is the tracker's,
 * against the law before it. A bill that freezes a value current law
 * schedules to change does not count.
 */
export function isAlreadyCurrentLaw(
  provisions: Array<{ value: unknown; lawValues: unknown[] }>
): boolean {
  return (
    provisions.length > 0 &&
    provisions.every(
      (provision) =>
        provision.lawValues.length > 0 &&
        provision.lawValues.every((lawValue) => sameValue(provision.value, lawValue))
    )
  );
}
