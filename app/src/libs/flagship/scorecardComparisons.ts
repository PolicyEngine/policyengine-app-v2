import { normalizeParameterPath } from './parameterDependencies';

/** Published scorecard claims; values always belong to the source's policy world. */
export interface ScorecardClaim {
  claim_id: string;
  country: string;
  name: string;
  source: string;
  source_column?: string;
  url?: string;
  publication_title?: string;
  conditions?: { bill_version?: string; provision?: string; option?: string };
  program?: string | null;
  geography?: string;
  metric: string;
  unit_concept: string;
  period: number | string;
  period_start?: number | null;
  period_end?: number | null;
  time_basis?: string;
  window?: string;
  reform_framework: string;
  reform_key: string;
  external_value: number;
  calibration_relationship?: string;
  claim_baseline?: string;
  diagnosis?: { title?: string; classification?: string } | null;
  latest?: {
    value: number | null;
    status: string;
    status_effective?: string;
    policyengine_variables?: string[];
    engine_version?: string;
    data_bundle?: string;
    computed_at?: string;
    construction?: string;
    annotations?: string[];
    baseline?: string;
    ratio?: number | null;
  } | null;
}
export interface RelatedScorecardClaim extends ScorecardClaim {
  matchBasis: 'variable' | 'parameter' | 'program' | 'related-policy';
}
export interface ScorecardComparisonsResult {
  built: string | null;
  rows: RelatedScorecardClaim[];
  unmappedCount: number;
}

/** No fuzzy title matching and no inference that a related policy equals this reform.
 * Legacy claims sometimes record parameter paths in their construction receipt.
 * A shared reform key carries that policy association to other years of the SAME
 * reform, never from the common baseline key to every baseline claim.
 */
export function matchScorecardClaims(
  rows: ScorecardClaim[],
  country: string,
  paths: string[],
  variables: string[]
): Omit<ScorecardComparisonsResult, 'built'> {
  const names = new Set(variables);
  const normalized = new Set(paths.map(normalizeParameterPath));
  const scoped = rows.filter((row) => row.country.toLowerCase() === country.toLowerCase());
  const basis = new Map<string, RelatedScorecardClaim['matchBasis']>();
  const policyKeys = new Set<string>();
  // A bill-wide reform key can cover many provisions. Only carry a match
  // between years of the same source line item and metric.
  const policyLine = (row: ScorecardClaim) =>
    JSON.stringify([
      row.source,
      row.reform_key,
      row.source_column ?? row.name,
      row.metric,
      row.geography,
    ]);
  for (const row of scoped) {
    const receiptPaths = (row.latest?.construction ?? '').match(/gov\.[a-zA-Z0-9_.[\]]+/g) ?? [];
    let match: RelatedScorecardClaim['matchBasis'] | undefined;
    if (row.latest?.policyengine_variables?.some((variable) => names.has(variable))) {
      match = 'variable';
    } else if (receiptPaths.some((path) => normalized.has(normalizeParameterPath(path)))) {
      match = 'parameter';
    } else if (row.program && names.has(row.program)) {
      match = 'program';
    }
    if (match) {
      basis.set(row.claim_id, match);
      if (row.reform_framework !== 'baseline' && row.reform_key) {
        policyKeys.add(policyLine(row));
      }
    }
  }
  const result = scoped.flatMap((row): RelatedScorecardClaim[] => {
    const matchBasis =
      basis.get(row.claim_id) ??
      (row.reform_framework !== 'baseline' && policyKeys.has(policyLine(row))
        ? 'related-policy'
        : undefined);
    return matchBasis ? [{ ...row, matchBasis }] : [];
  });
  return {
    rows: result.sort(
      (a, b) =>
        a.name.localeCompare(b.name) ||
        String(a.period).localeCompare(String(b.period)) ||
        a.claim_id.localeCompare(b.claim_id)
    ),
    unmappedCount: scoped.filter(
      (row) =>
        !row.program &&
        !row.latest?.policyengine_variables?.length &&
        !(row.latest?.construction ?? '').includes('gov.') &&
        !policyKeys.has(policyLine(row))
    ).length,
  };
}

export function claimPeriod(row: ScorecardClaim): string {
  if (row.window) {
    return row.window;
  }
  const period =
    row.period_start != null && row.period_end != null
      ? `${row.period_start}–${row.period_end}`
      : String(row.period);
  return `${period} · ${(row.time_basis ?? 'time basis not recorded').replaceAll('_', ' ')}`;
}

export function claimValue(value: number | null | undefined, unit: string): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'Not computed';
  }
  // Unit controls presentation; a count and a fraction must never become dollars.
  const currency = { usd: 'USD', gbp: 'GBP', eur: 'EUR', nzd: 'NZD' }[unit];
  if (currency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3, notation: 'compact' }).format(
    value
  );
}
