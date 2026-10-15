/**
 * Calibration matching: the data-side check for a reform.
 *
 * A reform's parameter paths reach a set of model variables (via the
 * traced dependency map). Each of those variables may be a calibration
 * target of the microdata: an administrative total the survey weights
 * were fit to, with a known relative error in the current populace
 * release. This module joins the two: which of the variables this reform
 * moves are calibrated, how well, and how close to the reform they sit.
 *
 * Depth is the ring. 0–1 is the primary variable the parameter feeds,
 * 2–4 is the mechanism it flows through, deeper is the tax-benefit system
 * echoing the change. The deepest calibrated variable within the
 * mechanism is usually the interacted quantity that bounds the data-side
 * bias of the estimate, so ordering is by depth, nearest first.
 */
import { relevantComparisons, type ReformScope } from '@/libs/flagship/comparisonRelevance';
import {
  DEFAULT_MAX_DEPTH,
  loadParameterDependencies,
  ReachedVariable,
  readersOfPath,
  variablesReachedByPaths,
} from '@/libs/flagship/parameterDependencies';

export interface CalibrationTargetRow {
  name: string;
  source: string;
  sourceLabel: string | null;
  /** The dashboard's label for the measured quantity, e.g. "refundable ctc". */
  variable: string;
  policyengineVariables: string[];
  measure: string | null;
  /** The dashboard's id for the measured quantity, e.g. "ctc_amount". */
  sourceMeasureId?: string | null;
  /** The target's slice of the source table, e.g. "18k to 19k · no qualifying children · All". */
  breakdown?: string | null;
  level: 'national' | 'state';
  /** "US" for national targets, else the state code. */
  geography: string;
  period: number | string | null;
  target: number | null;
  estimate: number | null;
  /** (estimate − target) ÷ target, as a fraction. */
  relativeError: number | null;
  targetRole: string | null;
  sourceUrl: string | null;
}

export type CalibrationRing = 'primary' | 'mechanism' | 'downstream';

export interface CalibrationVariableMatch {
  variable: string;
  depth: number;
  via: string;
  ring: CalibrationRing;
  targets: CalibrationTargetRow[];
  targetCount: number;
  /**
   * |relativeError| averaged across the variable's targets, weighted by
   * |target| so a tiny AGI band cannot dominate the aggregate. A fraction.
   */
  meanAbsRelativeError: number;
  /** The target with the largest |relativeError|. */
  worst: CalibrationTargetRow;
}

export interface CalibrationMatches {
  releaseId: string | null;
  geography: string;
  /** The model version the dependency map was traced from. */
  modelVersion: string;
  /** Variables the reform reaches, calibrated or not. */
  reachedCount: number;
  matches: CalibrationVariableMatch[];
  /**
   * Targets in the report's geography that the change reaches through the
   * model but that do not measure a program it changes (federal income tax
   * through a state's SALT deduction), nearest first. Context when nothing
   * measures the change itself.
   */
  related?: CalibrationVariableMatch[];
}

/** How many related groups show when nothing measures the change directly. */
const RELATED_LIMIT = 4;

export const CALIBRATION_DASHBOARD_URL =
  'https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm/targets';

/**
 * The dashboard's targets page filtered the way it accepts: by source and
 * by level (national or state). It does not address a single target or a
 * geography in the URL, so this is the closest deep link.
 */
export function dashboardTargetsUrl(filters: {
  source?: string | null;
  level?: 'national' | 'state' | null;
}): string {
  const params = new URLSearchParams();
  if (filters.source) {
    params.set('source', filters.source);
  }
  if (filters.level) {
    params.set('level', filters.level);
  }
  const query = params.toString();
  return query ? `${CALIBRATION_DASHBOARD_URL}?${query}` : CALIBRATION_DASHBOARD_URL;
}

/** Primary within one hop, mechanism to four, then the system echoing. */
export function ringForDepth(depth: number): CalibrationRing {
  if (depth <= 1) {
    return 'primary';
  }
  if (depth <= 4) {
    return 'mechanism';
  }
  return 'downstream';
}

/**
 * The calibration geography for a report's region. Society-wide reports
 * carry the country as region ("us"); state runs carry "state/ca".
 */
export function geographyForRegion(region: string | null | undefined): string {
  const state = /^state\/([a-z]{2})$/i.exec(region ?? '');
  return state ? state[1].toUpperCase() : 'US';
}

/** |error| weighted by |target|; falls back to the plain mean when targets are missing. */
export function weightedMeanAbsError(rows: CalibrationTargetRow[]): number {
  const weighted = rows.filter((row) => typeof row.target === 'number' && row.target !== 0);
  if (weighted.length === 0) {
    return rows.reduce((sum, row) => sum + Math.abs(row.relativeError!), 0) / rows.length;
  }
  const totalWeight = weighted.reduce((sum, row) => sum + Math.abs(row.target!), 0);
  return (
    weighted.reduce((sum, row) => sum + Math.abs(row.relativeError!) * Math.abs(row.target!), 0) /
    totalWeight
  );
}

/** Group target rows under the reached variables they measure, nearest first. */
export function summarizeMatches(
  reached: ReachedVariable[],
  rows: CalibrationTargetRow[]
): CalibrationVariableMatch[] {
  const byVariable = new Map<string, CalibrationTargetRow[]>();
  for (const row of rows) {
    if (typeof row.relativeError !== 'number') {
      continue;
    }
    for (const variable of row.policyengineVariables) {
      const list = byVariable.get(variable) ?? [];
      list.push(row);
      byVariable.set(variable, list);
    }
  }
  const matches: CalibrationVariableMatch[] = [];
  for (const entry of reached) {
    const targets = byVariable.get(entry.variable);
    if (!targets || targets.length === 0) {
      continue;
    }
    const sorted = [...targets].sort(
      (a, b) => Math.abs(b.relativeError!) - Math.abs(a.relativeError!)
    );
    matches.push({
      variable: entry.variable,
      depth: entry.depth,
      via: entry.via,
      ring: ringForDepth(entry.depth),
      targets: sorted,
      targetCount: sorted.length,
      meanAbsRelativeError: weightedMeanAbsError(sorted),
      worst: sorted[0],
    });
  }
  return matches.sort(
    (a, b) => a.depth - b.depth || b.meanAbsRelativeError - a.meanAbsRelativeError
  );
}

/**
 * The matches whose targets measure a program the reform changes, in the
 * report's jurisdiction (the rule baseline comparisons use). A target's
 * program is the model variables it was computed from; targets of a
 * program the change only echoes into drop, and so does a match left
 * with none.
 */
export function relevantCalibrationMatches(
  matches: CalibrationVariableMatch[],
  reform: ReformScope
): CalibrationVariableMatch[] {
  return matches.flatMap((match) => {
    const targets = relevantComparisons(
      match.targets.map((target) => ({
        program: target.policyengineVariables.join('+'),
        geography: target.geography,
        target,
      })),
      reform
    ).map((entry) => entry.target);
    if (targets.length === 0) {
      return [];
    }
    return [
      {
        ...match,
        targets,
        targetCount: targets.length,
        meanAbsRelativeError: weightedMeanAbsError(targets),
        worst: targets[0],
      },
    ];
  });
}

/** Words that read as acronyms in a model variable's name. */
const ACRONYMS: Record<string, string> = {
  aca: 'ACA',
  agi: 'AGI',
  cdcc: 'CDCC',
  chip: 'CHIP',
  ctc: 'CTC',
  eitc: 'EITC',
  ira: 'IRA',
  liheap: 'LIHEAP',
  ptc: 'PTC',
  salt: 'SALT',
  snap: 'SNAP',
  spm: 'SPM',
  ssi: 'SSI',
  tanf: 'TANF',
  wic: 'WIC',
};

/** Copy for the variables whose model label reads badly on its own. */
const VARIABLE_LABELS: Record<string, string> = {
  refundable_ctc: 'Refundable Child Tax Credit',
  ctc: 'Child Tax Credit',
  income_tax: 'Income tax',
  assigned_aca_ptc: 'Assigned ACA premium tax credit',
};

/**
 * A model variable as a reader names it: our copy, else the model's own
 * label, else its name in words ("ctc_limiting_tax_liability" reads
 * "CTC limiting tax liability").
 */
export function calibrationVariableLabel(variable: string, modelLabel?: string | null): string {
  const label =
    VARIABLE_LABELS[variable] ??
    (modelLabel?.trim() ||
      variable
        .split('_')
        .filter(Boolean)
        .map((word) => ACRONYMS[word] ?? word)
        .join(' '));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** The quantity words a dashboard measure id ends with: ctc_amount, actc_claims, eitc_returns. */
const MEASURE_WORDS = new Set(['amount', 'claims', 'returns', 'total', 'count']);
/** Breakdown parts that name no slice. */
const WHOLE_SLICES = new Set(['', 'all', 'total']);

/**
 * A target as a reader names it, under its variable's heading: the
 * quantity it measures, then the slice of the table it covers, e.g.
 * "Amount", "Claims", "Returns · 18k to 19k · no qualifying children".
 * The dashboard id stays in the target's details.
 */
export function calibrationTargetLabel(target: CalibrationTargetRow): string {
  const id = target.sourceMeasureId ?? '';
  const last = id.split('_').pop() ?? '';
  const quantity = MEASURE_WORDS.has(last)
    ? last
    : id
      ? id.replaceAll('_', ' ')
      : target.measure === 'count'
        ? 'count'
        : 'total';
  const slices = (target.breakdown ?? '')
    .split('·')
    .map((part) => part.trim())
    .filter((part) => !WHOLE_SLICES.has(part.toLowerCase()));
  const label = [quantity, ...slices].join(' · ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Fetches the targets that measure any of `variables` in `geography`.
 * Returns null when the route is unavailable (Vite build, dashboard
 * unreachable) so callers can render an honest note.
 */
export async function fetchCalibrationTargets(
  variables: string[],
  geography: string
): Promise<{ releaseId: string | null; rows: CalibrationTargetRow[] } | null> {
  if (variables.length === 0) {
    return { releaseId: null, rows: [] };
  }
  try {
    const response = await fetch('/api/calibration-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variables, geography }),
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    return {
      releaseId: typeof payload?.releaseId === 'string' ? payload.releaseId : null,
      rows: Array.isArray(payload?.rows) ? payload.rows : [],
    };
  } catch {
    return null;
  }
}

/**
 * The calibration matches for a reform: the variables its paths reach
 * (to `maxDepth`) that are calibration targets in `geography`, with
 * their fit, kept to the programs the reform changes. Null when either
 * the map or the dashboard is unavailable.
 */
export async function calibrationMatchesForPaths(
  paths: string[],
  geography: string,
  maxDepth: number = DEFAULT_MAX_DEPTH
): Promise<CalibrationMatches | null> {
  let map;
  try {
    map = await loadParameterDependencies();
  } catch {
    return null;
  }
  const reached = variablesReachedByPaths(paths, map, maxDepth);
  const fetched = await fetchCalibrationTargets(
    reached.map((entry) => entry.variable),
    geography
  );
  if (fetched === null) {
    return null;
  }
  const reform: ReformScope = {
    countryId: 'us',
    paths,
    readers: Object.fromEntries(paths.map((path) => [path, readersOfPath(path, map)])),
    region: geography === 'US' ? 'us' : `state/${geography.toLowerCase()}`,
  };
  // Every target the change reaches in this geography; the ones measuring
  // a program it changes lead, the rest are context.
  const all = summarizeMatches(reached, fetched.rows);
  const relevant = relevantCalibrationMatches(all, reform);
  const direct = new Set(relevant.map((match) => match.variable));
  return {
    releaseId: fetched.releaseId,
    geography,
    modelVersion: map.model.version,
    reachedCount: reached.length,
    matches: relevant,
    related: all.filter((match) => !direct.has(match.variable)).slice(0, RELATED_LIMIT),
  };
}
