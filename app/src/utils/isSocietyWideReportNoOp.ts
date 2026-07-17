import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';

/**
 * Fraction of the population in the "No change" bucket that counts as a
 * complete no-op. A genuine no-op leaves every household untouched, so the
 * winners/losers breakdown reports exactly 100% "No change".
 */
const FULLY_UNCHANGED = 1;

function isExactlyZero(value: unknown): boolean {
  return typeof value === 'number' && value === 0;
}

/**
 * Detects whether a society-wide report is a complete no-op — every output is
 * identical to current law.
 *
 * This happens when a reform only edits parameters that don't apply in the
 * simulated year (for example a credit that has sunset, or start dates that
 * don't cover the year), so the report shows "No change" everywhere with no
 * explanation of why.
 *
 * Returns true ONLY when the report is an exact no-op:
 * - budgetary impact is exactly 0
 * - benefit-spending and tax-revenue components are exactly 0
 * - the winners/losers intra-decile breakdown is 100% "No change"
 *
 * All four conditions must hold, so a single zero panel (for example a
 * revenue-neutral reform that still moves money between households) does not
 * trigger it. Missing or malformed fields are treated as NOT a no-op, and the
 * function never throws — both US and UK report shapes are handled.
 */
export function isSocietyWideReportNoOp(
  output: SocietyWideReportOutput | null | undefined
): boolean {
  if (!output || typeof output !== 'object') {
    return false;
  }

  const budget = (output as { budget?: unknown }).budget;
  if (!budget || typeof budget !== 'object') {
    return false;
  }

  const { budgetary_impact, benefit_spending_impact, tax_revenue_impact } = budget as Record<
    string,
    unknown
  >;
  if (
    !isExactlyZero(budgetary_impact) ||
    !isExactlyZero(benefit_spending_impact) ||
    !isExactlyZero(tax_revenue_impact)
  ) {
    return false;
  }

  const intraDecile = (output as { intra_decile?: unknown }).intra_decile;
  if (!intraDecile || typeof intraDecile !== 'object') {
    return false;
  }

  const all = (intraDecile as { all?: unknown }).all;
  if (!all || typeof all !== 'object') {
    return false;
  }

  const noChange = (all as Record<string, unknown>)['No change'];
  return noChange === FULLY_UNCHANGED;
}
