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
  bill: Pick<TrackedBill, 'impacts' | 'impactData'>,
  countryId: Parameters<typeof formatCurrencyAbbr>[1]
): ReportMetric[] {
  const impact = bill.impactData;
  const metrics: ReportMetric[] = [];

  const revenue = impact?.budgetary?.stateRevenueImpact ?? bill.impacts?.revenue;
  if (typeof revenue === 'number' && Number.isFinite(revenue)) {
    metrics.push({
      value: formatCurrencyAbbr(Math.abs(revenue), countryId, { maximumFractionDigits: 1 }),
      label:
        revenue < 0
          ? 'Annual revenue loss'
          : revenue > 0
            ? 'Annual revenue gain'
            : 'Annual revenue change',
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
 * Whether every provision already matches current law, as for an enacted
 * bill. Scored against current law such a bill changes nothing, so its
 * only meaningful estimate is the tracker's, against the law before it.
 */
export function isAlreadyCurrentLaw(
  provisions: Array<{ value: unknown; baselineValue: unknown }>
): boolean {
  return (
    provisions.length > 0 &&
    provisions.every((provision) => sameValue(provision.value, provision.baselineValue))
  );
}
