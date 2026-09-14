/**
 * Model track record: which scorecard programs a reform touches, and
 * the compact comparison rows the calculator's /api/model-validation
 * route serves for them (PolicyEngine vs external analyses, from the
 * PolicyEngine scorecard).
 *
 * The join is the model variable name, the same walk calibration does:
 * a reform's parameter paths reach a set of variables in the traced
 * dependency map, and every scorecard row names the variables its
 * PolicyEngine value was computed from. Depth is the ring: a program
 * whose output reads the parameter directly is primary context, one a
 * few formula steps away is the mechanism, deeper is the tax-benefit
 * system echoing the change.
 */

import { CalibrationRing, ringForDepth } from '@/libs/flagship/calibrationMatching';
import {
  DEFAULT_MAX_DEPTH,
  loadParameterDependencies,
  ReachedVariable,
  variablesReachedByPaths,
} from '@/libs/flagship/parameterDependencies';

export interface ModelValidationRow {
  source: string;
  /** The external source's name and page, when the scorecard knows them. */
  sourceName?: string | null;
  sourceUrl?: string | null;
  program: string;
  metric: string;
  period: string | null;
  status: 'comparable' | 'constructed';
  unitConcept: string | null;
  externalValue: number;
  peValue: number;
  ratio: number;
  /** True when the dataset was not calibrated to this comparison. */
  heldOut: boolean;
  /** The model variables the PolicyEngine value was computed from. */
  policyengineVariables: string[];
}

export const SCORECARD_URL = 'https://www.policyengine.org/scorecard';
/** The scorecard's comparison table and its sources-and-method page. */
export const SCORECARD_COMPARISON_URL = `${SCORECARD_URL}?view=scorecard`;
export const SCORECARD_METHOD_URL = `${SCORECARD_URL}?view=about`;

export const PROGRAM_LABELS: Record<string, string> = {
  snap: 'SNAP',
  wic: 'WIC',
  tanf: 'TANF',
  ssi: 'SSI',
  liheap: 'LIHEAP',
  ccdf: 'CCDF',
  eitc: 'EITC',
  ctc_refund: 'Refundable CTC',
  housing: 'Housing assistance',
  spm_poverty: 'SPM poverty',
};

export const METRIC_LABELS: Record<string, string> = {
  eligible_count: 'Eligible people',
  eligibility_rate: 'Eligibility rate',
  participant_count: 'Participants',
  participation_rate: 'Participation rate',
  participation_gap_count: 'Eligible non-participants',
  benefit_total: 'Total benefits',
  average_benefit: 'Average benefit',
  poverty_rate: 'Poverty rate',
  poverty_rate_fullpart: 'Poverty rate at full participation',
  poverty_count_change_fullpart: 'People lifted out of poverty at full participation',
  poverty_rate_relative_change_fullpart: 'Poverty rate change at full participation',
};

export interface ScorecardProgramMatch {
  program: string;
  /** The nearest reached variable the program's rows were computed from. */
  variable: string;
  depth: number;
  ring: CalibrationRing;
}

export interface ScorecardMatches {
  /** The model version the dependency map was traced from. */
  modelVersion: string;
  /** Variables the reform reaches, measured by the scorecard or not. */
  reachedCount: number;
  /** Programs the reform moves, nearest first. */
  programs: ScorecardProgramMatch[];
  /** Comparison rows grouped in program order. */
  rows: ModelValidationRow[];
}

/**
 * Group scorecard rows under the programs they measure, each program at
 * the depth of the nearest reached variable its rows were computed from.
 * Nearest program first; rows follow program order, keeping the route's
 * order within a program (held-out comparisons lead).
 */
export function summarizeScorecardPrograms(
  reached: ReachedVariable[],
  rows: ModelValidationRow[]
): { programs: ScorecardProgramMatch[]; rows: ModelValidationRow[] } {
  const depthOf = new Map(reached.map((entry) => [entry.variable, entry]));
  const programs = new Map<string, ScorecardProgramMatch>();
  for (const row of rows) {
    for (const variable of row.policyengineVariables) {
      const entry = depthOf.get(variable);
      if (!entry) {
        continue;
      }
      const current = programs.get(row.program);
      if (!current || entry.depth < current.depth) {
        programs.set(row.program, {
          program: row.program,
          variable,
          depth: entry.depth,
          ring: ringForDepth(entry.depth),
        });
      }
    }
  }
  const ordered = [...programs.values()].sort(
    (a, b) => a.depth - b.depth || a.program.localeCompare(b.program)
  );
  const rank = new Map(ordered.map((match, index) => [match.program, index]));
  return {
    programs: ordered,
    rows: rows
      .filter((row) => rank.has(row.program))
      .sort((a, b) => rank.get(a.program)! - rank.get(b.program)!),
  };
}

/**
 * Fetches comparison rows computed from any of `variables`. Returns null
 * when the route is unavailable (Vite build, scorecard unreachable) so
 * callers can render an honest note.
 */
export async function fetchModelValidation(
  variables: string[]
): Promise<ModelValidationRow[] | null> {
  if (variables.length === 0) {
    return [];
  }
  try {
    const response = await fetch('/api/model-validation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables }),
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    return Array.isArray(payload?.rows) ? payload.rows : [];
  } catch {
    return null;
  }
}

/**
 * The scorecard matches for a reform: the programs whose comparison rows
 * were computed from variables its paths reach (to `maxDepth`), with the
 * rows. Null when either the map or the scorecard is unavailable.
 */
export async function scorecardMatchesForPaths(
  paths: string[],
  maxDepth: number = DEFAULT_MAX_DEPTH
): Promise<ScorecardMatches | null> {
  let map;
  try {
    map = await loadParameterDependencies();
  } catch {
    return null;
  }
  const reached = variablesReachedByPaths(paths, map, maxDepth);
  const fetched = await fetchModelValidation(reached.map((entry) => entry.variable));
  if (fetched === null) {
    return null;
  }
  return {
    modelVersion: map.model.version,
    reachedCount: reached.length,
    ...summarizeScorecardPrograms(reached, fetched),
  };
}

/**
 * The scorecard's claim shape, as our validation lingua franca: every
 * external number — tracker fiscal notes today, scorecard shards, and
 * future sources — normalizes to this row, mirroring the deployed
 * scorecard's data contract (policy-keyed, provenance-carrying).
 */
export interface ValidationClaim {
  /** Source label, e.g. "Official fiscal note", "CRFB", "urban_sotsn" */
  source: string;
  sourceUrl?: string;
  /** The policy the claim scores — bill id for tracker claims */
  policy: string;
  metric: string;
  externalValue: number;
  peValue?: number;
  /** PE ÷ external, when both sides exist */
  ratio?: number;
  notes?: string;
}

/** Tracker validation_metadata → scorecard-shaped claims. */
export function claimsFromBillValidation(
  billId: string,
  validation: {
    fiscalNoteEstimate?: number;
    fiscalNoteUrl?: string;
    peEstimate?: number;
    discrepancyExplanation?: string;
    externalAnalyses?: Array<{ source?: string; url?: string; estimate?: number; notes?: string }>;
  }
): ValidationClaim[] {
  const pe = validation.peEstimate;
  const claim = (
    source: string,
    externalValue: number,
    extra: Partial<ValidationClaim> = {}
  ): ValidationClaim => ({
    source,
    policy: billId,
    metric: 'budgetary_impact',
    externalValue,
    peValue: pe,
    ratio: typeof pe === 'number' && externalValue !== 0 ? pe / externalValue : undefined,
    ...extra,
  });
  return [
    ...(typeof validation.fiscalNoteEstimate === 'number'
      ? [
          claim('Official fiscal note', validation.fiscalNoteEstimate, {
            sourceUrl: validation.fiscalNoteUrl,
            notes: validation.discrepancyExplanation,
          }),
        ]
      : []),
    ...(validation.externalAnalyses ?? [])
      .filter((analysis) => analysis.source && typeof analysis.estimate === 'number')
      .map((analysis) =>
        claim(analysis.source!, analysis.estimate!, {
          sourceUrl: analysis.url,
          notes: analysis.notes,
        })
      ),
  ];
}
