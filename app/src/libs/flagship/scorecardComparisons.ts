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
  conditions?: {
    bill_version?: string;
    provision?: string;
    option?: string;
    /** The source's sign convention, as free text; see signConvention.ts. */
    sign_convention?: string | null;
    /** "unsigned" when the source prints a size and names the direction in words. */
    change_direction?: string | null;
    /** UK costings: "static", or "post_behavioural" for the leg after behaviour changes. */
    scoring_method?: string | null;
    /** UK costings: the measure as the source's table describes it. */
    reform_hint?: string | null;
  };
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
  /** UK registry measure that the claim scores; the scorecard exports it from its registries. */
  measure?: {
    key: string;
    program?: string | null;
    computability?: string;
    head_variables?: string[];
    parameter_paths?: string[];
  } | null;
}
export interface RelatedScorecardClaim extends ScorecardClaim {
  matchBasis: 'variable' | 'parameter' | 'program' | 'related-policy';
}
/**
 * Related reforms as a reader can take them in: one score per published
 * measure, period and metric, and none that says nothing. A costing that
 * prints a static leg and a post-behavioural leg for the same year keeps
 * the static one, which PolicyEngine's static runs compare with (else the
 * one PolicyEngine marks comparable). A year in which both the source and
 * PolicyEngine score exactly zero, such as a year before the measure
 * starts, is left out.
 */
export function focusRelatedReformClaims(rows: RelatedScorecardClaim[]): RelatedScorecardClaim[] {
  const rank = (row: RelatedScorecardClaim) =>
    (row.conditions?.scoring_method === 'static' ? 0 : 2) +
    ((row.latest?.status_effective ?? row.latest?.status) === 'comparable' ? 0 : 1);
  const keyOf = (row: RelatedScorecardClaim) =>
    [row.measure?.key ?? row.name, row.period, row.metric].join('|');
  const kept = new Map<string, RelatedScorecardClaim>();
  for (const row of rows) {
    if (row.external_value === 0 && row.latest?.value === 0) {
      continue;
    }
    const current = kept.get(keyOf(row));
    if (!current || rank(row) < rank(current)) {
      kept.set(keyOf(row), row);
    }
  }
  return rows.filter((row) => kept.get(keyOf(row)) === row);
}

export interface ScorecardComparisonsResult {
  built: string | null;
  rows: RelatedScorecardClaim[];
  unmappedCount: number;
}

/**
 * Whether two full parameter paths name the same rule: equal, or one is a
 * folder or scale that holds the other. Bracket indices count, so the basic
 * rate (`rates.uk[0].rate`) does not match a threshold (`rates.uk[1].threshold`).
 */
function sameRule(a: string, b: string): boolean {
  const holds = (outer: string, inner: string) =>
    inner === outer || inner.startsWith(`${outer}.`) || inner.startsWith(`${outer}[`);
  return holds(a, b) || holds(b, a);
}

/** No fuzzy title matching and no inference that a related policy equals this reform.
 * Legacy claims sometimes record parameter paths in their construction receipt;
 * UK claims carry their measure's parameter paths and programme.
 * A shared reform key carries that policy association to other years of the SAME
 * reform, never from the common baseline key to every baseline claim.
 */
export function matchScorecardClaims(
  rows: ScorecardClaim[],
  country: string,
  paths: string[],
  variables: string[],
  options: {
    /**
     * Link a claim by its `program` only when it measures the programme as it
     * is (a baseline claim). A policy claim then needs a parameter or variable
     * match. The UK opts in: its programme names come from parameter folders,
     * so a policy claim with the same programme can score a different rule.
     */
    programBaselineOnly?: boolean;
  } = {}
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
  const program = (row: ScorecardClaim) => row.program ?? row.measure?.program;
  for (const row of scoped) {
    const receiptPaths = (row.latest?.construction ?? '').match(/gov\.[a-zA-Z0-9_.[\]]+/g) ?? [];
    const measurePaths = row.measure?.parameter_paths ?? [];
    const rowProgram = program(row);
    let match: RelatedScorecardClaim['matchBasis'] | undefined;
    if (row.latest?.policyengine_variables?.some((variable) => names.has(variable))) {
      match = 'variable';
    } else if (
      receiptPaths.some((path) => normalized.has(normalizeParameterPath(path))) ||
      measurePaths.some((measurePath) => paths.some((path) => sameRule(path, measurePath)))
    ) {
      match = 'parameter';
    } else if (
      rowProgram &&
      names.has(rowProgram) &&
      (!options.programBaselineOnly || row.reform_framework === 'baseline')
    ) {
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
        !program(row) &&
        !row.latest?.policyengine_variables?.length &&
        !(row.latest?.construction ?? '').includes('gov.') &&
        !row.measure?.parameter_paths?.length &&
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
  // An unrecorded time basis says nothing; the period alone stands.
  return row.time_basis ? `${period} · ${row.time_basis.replaceAll('_', ' ')}` : period;
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
      // Set explicitly: left out, the minimum depends on the JavaScript engine
      // ("£1.0B" on older V8, "£1B" on newer), as in formatCalibrationValue.
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 3, notation: 'compact' }).format(
    value
  );
}
