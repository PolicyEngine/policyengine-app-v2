/**
 * Sign conventions of published scorecard claims.
 *
 * A source and PolicyEngine can count the same change with opposite
 * signs: the OBR prints a tax rise as a fall in borrowing (negative),
 * PolicyEngine as a rise in revenue (positive). The scorecard records the
 * source's convention as free text in `conditions.sign_convention`, so a
 * gap is only meaningful once both figures sit on one sign.
 *
 * PolicyEngine's own convention, per metric (from the scorecard results,
 * whose receipts state "PE's own orientation"):
 * - revenue_change: positive = more revenue for the government (a yield,
 *   or less borrowing); PolicyEngine reports Δtax − Δspending.
 * - household income changes: positive = a gain to households.
 * - poverty changes: positive = more people in poverty.
 *
 * Only the most frequent conventions are classified. A rare or unclear
 * one stays "unknown": no gap is better than a wrong one.
 */

/** How a source's sign relates to PolicyEngine's for the claim's metric. */
export type SignRelation = 'same' | 'opposite' | 'magnitude' | 'unknown';

/** The parts of a scorecard claim that say how its figures are signed. */
export interface SignedClaim {
  metric: string;
  external_value: number;
  conditions?: { sign_convention?: string | null; change_direction?: string | null } | null;
  latest?: { value?: number | null; construction?: string; annotations?: string[] } | null;
}

type MetricFamily = 'revenue' | 'household' | 'poverty';

const METRIC_FAMILIES: Record<string, MetricFamily> = {
  revenue_change: 'revenue',
  average_household_income_change: 'household',
  pct_change_after_tax_income: 'household',
  average_annual_gain: 'household',
  poverty_count_change: 'poverty',
  poverty_rate_change: 'poverty',
};

/** Conventions matched on their opening words, lower case, per metric family. */
const RULES: Record<MetricFamily, Array<[RegExp, 'same' | 'opposite']>> = {
  revenue: [
    [/^positive_gain_to_exchequer$/, 'same'],
    [/^positive = (?:revenue )?yield\b/, 'same'],
    [
      /^positive = (?:higher government revenue|net gain to the exchequer|saving to the exchequer)/,
      'same',
    ],
    [/^positive = (?:reduction in public spending|fiscal tightening)/, 'same'],
    [/^as worded[^(]*\(positive = (?:yield|increase in yield)\b/, 'same'],
    [/^note \(verbatim\): here we present higher taxes as positive numbers/, 'same'],
    [/^note \(verbatim\): a positive sign implies an increase in borrowing\.?$/, 'opposite'],
    // One table in that chapter counts higher spending instead; it stays unknown.
    [/^positive = increase in borrowing(?!.*this table:)/, 'opposite'],
    [
      /^note \(verbatim\): (?:this table|the static yield values in this table) uses? the convention that a negative figure means a reduction in psnb\.?$/,
      'opposite',
    ],
    [/^positive = cost to the exchequer$/, 'opposite'],
    [/^as worded \(positive = cost \/ increase in borrowing\)$/, 'opposite'],
  ],
  household: [
    [
      /^positive = (?:gain to (?:households|the affected household|gaining families|the benefiting family|the individual)|higher mean household income)\b/,
      'same',
    ],
    [/^positive = loss to households\b/, 'opposite'],
  ],
  poverty: [
    [
      /^positive = (?:more people in poverty|increase in poverty|rise in the child poverty rate)\b/,
      'same',
    ],
    [
      /^positive = (?:children brought out of poverty|children lifted out of poverty|fewer children in poverty|reduction in the child poverty rate)\b/,
      'opposite',
    ],
  ],
};

/** The scorecard's receipt says it already put PolicyEngine's value on the source's sign. */
const ORIENTED = /PE oriented to it|PE's own orientation|re-oriented to the announced measure/i;

function receipt(row: SignedClaim): string {
  return [row.latest?.construction, ...(row.latest?.annotations ?? [])].join(' ');
}

/** How the claim's published sign relates to PolicyEngine's stored value. */
export function signRelation(row: SignedClaim): SignRelation {
  const convention = row.conditions?.sign_convention?.trim() ?? '';
  if (
    convention === 'magnitude_with_direction_in_label' ||
    row.conditions?.change_direction === 'unsigned'
  ) {
    return 'magnitude';
  }
  if (ORIENTED.test(receipt(row))) {
    return 'same';
  }
  // No recorded convention: the scorecard stores both figures on one sign (every US claim).
  if (!convention) {
    return 'same';
  }
  const text = convention.toLowerCase().replace(/\s+/g, ' ');
  // A level, not a change: there is no sign to disagree on.
  if (text === 'count' || /^level\b/.test(text)) {
    return 'same';
  }
  const family = METRIC_FAMILIES[row.metric];
  const rule = family && RULES[family].find(([pattern]) => pattern.test(text));
  return rule ? rule[1] : 'unknown';
}

/**
 * The two figures a gap compares, on PolicyEngine's sign: the published
 * one flipped when the source counts the other way, both as magnitudes
 * when the source prints no sign. Null when there is nothing to compare.
 */
export function comparableValues(
  row: SignedClaim
): { model: number; published: number; relation: SignRelation } | null {
  const model = row.latest?.value;
  const published = row.external_value;
  const relation = signRelation(row);
  if (typeof model !== 'number' || typeof published !== 'number' || relation === 'unknown') {
    return null;
  }
  if (relation === 'magnitude') {
    return { model: Math.abs(model), published: Math.abs(published), relation };
  }
  return { model, published: relation === 'opposite' ? -published : published, relation };
}

/** One line on how the gap treats the source's sign; null when nothing changed. */
export function signNote(row: SignedClaim): string | null {
  if (typeof row.latest?.value !== 'number') {
    return null;
  }
  switch (signRelation(row)) {
    case 'opposite':
      return 'Different signs: the source counts this change with the opposite sign. The gap uses the published figure with PolicyEngine’s sign.';
    case 'magnitude':
      return 'Different signs: the source publishes a size and gives the direction in words. The gap compares magnitudes.';
    case 'unknown':
      return 'The source’s sign convention is unclear; compare the magnitudes.';
    default:
      return null;
  }
}

/** What a sign means for a revenue comparison, for its detail dialog. */
export function revenueSignText(row: SignedClaim): string {
  if (
    /claim sign: positive = (?:cost|increase in borrowing)[^;]*; PE oriented to it/i.test(
      receipt(row)
    )
  ) {
    return 'Both figures use the source’s sign: positive amounts mean higher borrowing.';
  }
  switch (signRelation(row)) {
    case 'opposite':
      return 'PolicyEngine shows lower tax revenue as a negative amount; the source shows it as a positive amount.';
    case 'magnitude':
      return 'Negative PolicyEngine amounts mean lower tax revenue. The published figure is a size without a sign.';
    case 'unknown':
      return 'Negative PolicyEngine amounts mean lower tax revenue. The source’s sign convention is unclear.';
    default:
      return 'Negative amounts mean lower tax revenue.';
  }
}
