import type { CountryId } from '@/libs/countries';
import { absoluteChangeMessage, relativeChangeMessage } from '@/utils/chartMessages';
import { formatNumber, formatPercent } from '@/utils/formatters';

/** What a bar reads when its group has no baseline rate to compare with. */
export const NO_RELATIVE_CHANGE_LABEL = 'n/a';

/**
 * A rate's change relative to its baseline, reform / baseline − 1; null
 * when the baseline is zero, so there is no ratio (a small region can
 * have no seniors in deep poverty, for example).
 */
export function relativeChange(reform: number, baseline: number): number | null {
  const change = reform / baseline - 1;
  return Number.isFinite(change) ? change : null;
}

/**
 * A bar of relative change: its value and its label. A group with no
 * ratio draws a bar of zero that reads "n/a". Recharts draws no bar for
 * a value that is not a number, and the value labels go by the index of
 * the bars it draws, so a missing bar would move every later label onto
 * the next group.
 */
export function relativeBar(
  change: number | null,
  format: (value: number) => string
): { value: number; label: string } {
  if (change === null) {
    return { value: 0, label: NO_RELATIVE_CHANGE_LABEL };
  }
  return { value: change, label: (change > 0 ? '+' : '') + format(change) };
}

/**
 * The hover message for a rate's change, "This reform would decrease …
 * by 4.0% from 2.5% to 2.4%". With no baseline rate it gives the change
 * in percentage points instead, or says there is none.
 */
export function rateChangeMessage(
  objectTerm: string,
  baseline: number,
  reform: number,
  countryId: CountryId,
  format: (value: number) => string
): string {
  const change = relativeChange(reform, baseline);
  if (change === null) {
    const fromTo = `from ${format(baseline)} to ${format(reform)}`;
    return absoluteChangeMessage(
      'This reform',
      objectTerm,
      reform - baseline,
      0.001,
      (points) => `${(points * 100).toFixed(1)}pp, ${fromTo}`
    );
  }
  return relativeChangeMessage('This reform', objectTerm, change, 0.001, countryId, {
    baseline,
    reform,
    formatter: format,
  });
}

/**
 * A chart title for a rate's change, "This reform would decrease the
 * poverty rate in Maryland by 4.0% (0.1pp)". From a rate of zero there
 * is no relative change, so only the points show.
 */
export function rateChangeTitle(
  objectTerm: string,
  baseline: number,
  reform: number,
  countryId: CountryId,
  regionPhrase: string
): string {
  const absTerm = formatNumber(Math.round(Math.abs(reform - baseline) * 1000) / 10, countryId, {
    maximumFractionDigits: 2,
  });
  if (absTerm === '0') {
    return `This reform would have no effect on ${objectTerm}${regionPhrase}`;
  }
  const change = relativeChange(reform, baseline);
  const term =
    change === null
      ? `${absTerm}pp`
      : `${formatPercent(Math.abs(change), countryId, { maximumFractionDigits: 1 })} (${absTerm}pp)`;
  const signTerm = reform > baseline ? 'increase' : 'decrease';
  return `This reform would ${signTerm} ${objectTerm}${regionPhrase} by ${term}`;
}
