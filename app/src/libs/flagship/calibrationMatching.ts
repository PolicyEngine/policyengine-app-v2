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
import type { CalibrationCountry, CalibrationTargetRow } from '@/libs/flagship/calibrationTargets';
import { relevantComparisons, type ReformScope } from '@/libs/flagship/comparisonRelevance';
import {
  DEFAULT_MAX_DEPTH,
  loadParameterDependencies,
  ReachedVariable,
  readersOfPath,
  variablesReachedByPaths,
} from '@/libs/flagship/parameterDependencies';
import { ukProgramsForPaths } from '@/libs/flagship/ukCalibrationPrograms';

export type { CalibrationCountry, CalibrationTargetRow };

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
  /** The country whose dashboard the targets came from; unset means the US. */
  countryId?: CalibrationCountry;
  /**
   * UK only: every geography the targets were read in, the report's own
   * first (Wales, then Great Britain and the United Kingdom).
   */
  geographies?: string[];
}

/** How many related groups show when nothing measures the change directly. */
const RELATED_LIMIT = 4;

export const CALIBRATION_DASHBOARD_URL =
  'https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm/targets';

/**
 * The dashboard's targets page filtered by country, source and level
 * (US: national or state; UK: country or region). These are the only
 * target filters its page reads from the URL
 * (calibration-diagnostics frontend/app/microcosm/targets/page.tsx reads
 * scope, source, level, release, start and country); its geography
 * filter always starts empty, so a state or nation is not passed. It
 * does not address a single target in the URL either, so this is the
 * closest deep link. The US view is the default, so only the UK passes
 * a country.
 */
export function dashboardTargetsUrl(filters: {
  source?: string | null;
  level?: CalibrationTargetRow['level'] | null;
  country?: CalibrationCountry | null;
}): string {
  const params = new URLSearchParams();
  if (filters.country && filters.country !== 'us') {
    params.set('country', filters.country);
  }
  if (filters.source) {
    params.set('source', filters.source);
  }
  if (filters.level) {
    params.set('level', filters.level);
  }
  const query = params.toString();
  return query ? `${CALIBRATION_DASHBOARD_URL}?${query}` : CALIBRATION_DASHBOARD_URL;
}

/**
 * What a target's values count. The dashboard serves no unit field; its
 * `measure` says it. Every "total" target in the live release is a
 * money sum (US: SOI amounts, SNAP benefits, TANF funds, SSI payments,
 * tax collections, JCT expenditures; UK: the amounts normalization reads
 * as totals) and every "count" target counts returns, claims, enrollees
 * or people. Money is USD unless the row says GBP.
 */
export type CalibrationValueKind = 'money' | 'count' | 'number';

export function calibrationValueKind(
  target: Pick<CalibrationTargetRow, 'measure'>
): CalibrationValueKind {
  if (target.measure === 'total') {
    return 'money';
  }
  return target.measure === 'count' ? 'count' : 'number';
}

/** Targets a calibration group shows before the reader asks for all of them. */
export const CALIBRATION_PREVIEW = 6;

/**
 * A group's targets in the order the table shows them: its headline totals
 * first, the largest money target and the largest count target (a
 * programme's spending and its caseload), then the rest in the order given
 * (largest gap first). The first `limit` show at once; the rest wait for
 * "Show all".
 */
export function calibrationPreviewTargets(
  targets: CalibrationTargetRow[],
  limit: number = CALIBRATION_PREVIEW
): { ordered: CalibrationTargetRow[]; previewCount: number } {
  const largest = (kind: CalibrationValueKind) =>
    targets
      .filter((target) => calibrationValueKind(target) === kind && target.target !== null)
      .reduce<
        CalibrationTargetRow | undefined
      >((best, target) => (!best || Math.abs(target.target!) > Math.abs(best.target!) ? target : best), undefined);
  const headline = [largest('money'), largest('count')].filter(
    (target): target is CalibrationTargetRow => target !== undefined
  );
  const ordered = [...headline, ...targets.filter((target) => !headline.includes(target))];
  return { ordered, previewCount: Math.min(limit, ordered.length) };
}

/**
 * A target's official or modelled value: compact for the table ("$3.2B",
 * "20.6K"), exact for its details ("$3,212,345.68", "20,601").
 */
export function formatCalibrationValue(
  value: number | null,
  target: Pick<CalibrationTargetRow, 'measure' | 'currency'>,
  style: 'compact' | 'exact' = 'compact'
): string {
  if (value === null) {
    return '—';
  }
  const money = calibrationValueKind(target) === 'money';
  return value.toLocaleString('en-US', {
    ...(money ? { style: 'currency', currency: target.currency ?? 'USD' } : {}),
    ...(style === 'compact' ? { notation: 'compact' } : {}),
    minimumFractionDigits: 0,
    maximumFractionDigits: style === 'compact' ? 1 : 2,
  });
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

/** The UK's nations as the dashboard names them, by the keys a UK region uses. */
const UK_NATION_NAMES: Record<string, string> = {
  england: 'England',
  scotland: 'Scotland',
  wales: 'Wales',
  northern_ireland: 'Northern Ireland',
  ni: 'Northern Ireland',
};

/**
 * The calibration geography for a report's region. US society-wide
 * reports carry the country as region ("us"); state runs carry
 * "state/ca". UK reports carry "uk" or a nation ("country/wales"); a
 * constituency or local authority names no nation the app can read, so
 * it falls back to the United Kingdom.
 */
export function geographyForRegion(
  region: string | null | undefined,
  countryId: string | null | undefined = 'us'
): string {
  if (countryId === 'uk') {
    const key = (region ?? '')
      .trim()
      .toLowerCase()
      .replace(/^country\//, '')
      .replace(/[\s-]+/g, '_');
    return UK_NATION_NAMES[key] ?? 'United Kingdom';
  }
  const state = /^state\/([a-z]{2})$/i.exec(region ?? '');
  return state ? state[1].toUpperCase() : 'US';
}

/**
 * The UK geographies whose targets describe a report on `geography`: the
 * area's own, then the wider areas that contain it, the way a US state
 * report reads federal programmes too. Great Britain covers every nation
 * but Northern Ireland; England and Wales covers those two. A UK-wide
 * report reads the UK's targets and the Great Britain and England and
 * Wales ones, which measure programmes that only run there (DWP
 * benefits are Great Britain's). English regions never show: they are
 * parts of a nation, like a US state's counties.
 */
export function ukCalibrationGeographies(geography: string): string[] {
  switch (geography) {
    case 'England':
    case 'Wales':
      return [geography, 'England and Wales', 'Great Britain', 'United Kingdom'];
    case 'Scotland':
      return [geography, 'Great Britain', 'United Kingdom'];
    case 'Northern Ireland':
      return [geography, 'United Kingdom'];
    default:
      return ['United Kingdom', 'Great Britain', 'England and Wales'];
  }
}

/** Whether a geography is the whole country: "US", "United Kingdom". */
export function isNationalGeography(geography: string): boolean {
  return geography === 'US' || geography === 'United Kingdom';
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
  if (target.targetLabel) {
    return ukTargetLabel(target.targetLabel, target.breakdown);
  }
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
 * A UK target as a reader names it: the dashboard's label, and the band
 * its table row covers when the label names a table by band and not the
 * band itself ("Income Tax liabilities by total income band · Total
 * income from GBP 200 000 to GBP 500 000"). A label with its own
 * numbers ("…, total income 50,000 to 70,000") already names its slice.
 */
function ukTargetLabel(label: string, breakdown: string | null | undefined): string {
  const slice = (breakdown ?? '').split('·')[0].trim();
  return slice && !/\d/.test(label) && /\d/.test(slice) ? `${label} · ${slice}` : label;
}

/**
 * Fetches the targets that measure any of `variables` in `geography`.
 * Returns null when the route is unavailable (outside calculator-app, as in
 * Storybook, or the dashboard unreachable) so callers can render an honest note.
 */
export async function fetchCalibrationTargets(
  variables: string[],
  geography: string,
  uk?: { geographies: string[] }
): Promise<{ releaseId: string | null; rows: CalibrationTargetRow[] } | null> {
  if (variables.length === 0) {
    return { releaseId: null, rows: [] };
  }
  try {
    const response = await fetch('/api/calibration-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The US body is the route's original shape; the UK names its country and areas.
      body: JSON.stringify(
        uk
          ? { variables, geography, country: 'uk', geographies: uk.geographies }
          : { variables, geography }
      ),
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
 * Fetches every target in `geography`, whatever it measures, worst fit
 * first. Null when the route is unavailable.
 */
export async function fetchGeographyCalibrationTargets(
  geography: string,
  countryId: CalibrationCountry = 'us'
): Promise<{ releaseId: string | null; rows: CalibrationTargetRow[] } | null> {
  try {
    const response = await fetch('/api/calibration-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        countryId === 'us'
          ? { variables: [], geography, all: true }
          : { variables: [], geography, all: true, country: countryId }
      ),
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

/** A target within this share of its official value counts as a close fit. */
export const CLOSE_FIT_ERROR = 0.1;

/** How many of a geography's worst-fit targets its summary lists. */
const GEOGRAPHY_WORST_LIMIT = 5;

/** How well the data fits one geography overall, whatever a reform changes. */
export interface GeographyCalibrationFit {
  releaseId: string | null;
  geography: string;
  targetCount: number;
  /** The share of targets within CLOSE_FIT_ERROR of the official value, as a fraction. */
  closeFitShare: number;
  /** |relativeError| weighted by |target|, as a fraction; 0 with no targets. */
  meanAbsRelativeError: number;
  /** The worst-fit targets, worst first. */
  worst: CalibrationTargetRow[];
}

/** Summarizes a geography's targets: count, close-fit share, weighted error, worst rows. */
export function summarizeGeographyFit(
  geography: string,
  releaseId: string | null,
  rows: CalibrationTargetRow[],
  worstLimit: number = GEOGRAPHY_WORST_LIMIT
): GeographyCalibrationFit {
  const fitted = rows
    .filter((row) => row.geography === geography && typeof row.relativeError === 'number')
    .sort((a, b) => Math.abs(b.relativeError!) - Math.abs(a.relativeError!));
  return {
    releaseId,
    geography,
    targetCount: fitted.length,
    closeFitShare:
      fitted.length === 0
        ? 0
        : fitted.filter((row) => Math.abs(row.relativeError!) <= CLOSE_FIT_ERROR).length /
          fitted.length,
    meanAbsRelativeError: fitted.length === 0 ? 0 : weightedMeanAbsError(fitted),
    worst: fitted.slice(0, worstLimit),
  };
}

/** A geography's overall data fit, or null when the route is unavailable. */
export async function calibrationFitForGeography(
  geography: string,
  countryId: CalibrationCountry = 'us'
): Promise<GeographyCalibrationFit | null> {
  const fetched = await fetchGeographyCalibrationTargets(geography, countryId);
  return fetched === null
    ? null
    : summarizeGeographyFit(geography, fetched.releaseId, fetched.rows);
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

/**
 * The calibration matches for a UK reform. The UK has no traced
 * dependency map and its targets list no model variables, so both sides
 * join through the committed programme table (ukCalibrationPrograms):
 * the programmes the reform's paths change, and the targets that
 * measure each programme, in the report's geography and the wider ones
 * that contain it (ukCalibrationGeographies). Each programme is one
 * group, its targets ordered from the report's own area outward, worst
 * fit first within an area. Every match is a programme the reform
 * changes, so there are no related targets. Null when the dashboard is
 * unavailable.
 */
export async function ukCalibrationMatchesForPaths(
  paths: string[],
  geography: string
): Promise<CalibrationMatches | null> {
  const programs = ukProgramsForPaths(paths);
  const geographies = ukCalibrationGeographies(geography);
  const base = {
    geography,
    modelVersion: '',
    reachedCount: programs.length,
    countryId: 'uk' as const,
    geographies,
  };
  if (programs.length === 0) {
    return { ...base, releaseId: null, matches: [] };
  }
  const fetched = await fetchCalibrationTargets(
    programs.map((entry) => entry.program),
    geography,
    { geographies }
  );
  if (fetched === null) {
    return null;
  }
  const reached = programs.map((entry) => ({ variable: entry.program, depth: 0, via: entry.via }));
  const rank = (row: CalibrationTargetRow) => {
    const index = geographies.indexOf(row.geography);
    return index === -1 ? geographies.length : index;
  };
  const matches = summarizeMatches(reached, fetched.rows).map((match) => ({
    ...match,
    targets: [...match.targets].sort(
      (a, b) => rank(a) - rank(b) || Math.abs(b.relativeError!) - Math.abs(a.relativeError!)
    ),
  }));
  return { ...base, releaseId: fetched.releaseId, matches, related: [] };
}
