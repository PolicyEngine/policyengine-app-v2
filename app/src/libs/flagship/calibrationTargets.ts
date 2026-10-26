/**
 * Calibration target rows as the calibration-targets route serves them:
 * the dashboard's per-target diagnostics, normalized, and the selections
 * the route answers with. Shared by the route (server) and the
 * validation layer (client), so this module imports only the
 * import-free UK programme table.
 */
import { ukProgramsForTarget } from './ukCalibrationPrograms';

/** The countries whose calibration dashboard the app reads. */
export type CalibrationCountry = 'us' | 'uk';

export function isCalibrationCountry(value: unknown): value is CalibrationCountry {
  return value === 'us' || value === 'uk';
}

/** The whole-country geography a country's targets name: "US", "United Kingdom". */
export function nationalGeography(country: CalibrationCountry): string {
  return country === 'uk' ? 'United Kingdom' : 'US';
}

export interface CalibrationTargetRow {
  name: string;
  source: string;
  sourceLabel: string | null;
  /** The dashboard's label for the measured quantity, e.g. "refundable ctc". */
  variable: string;
  /** The model variables the target joins to, as the dashboard lists them. */
  policyengineVariables: string[];
  measure: string | null;
  /** The dashboard's id for the measured quantity, e.g. "ctc_amount". */
  sourceMeasureId?: string | null;
  /** The target's slice of the source table, e.g. "18k to 19k · no qualifying children · All". */
  breakdown?: string | null;
  /** US: national or state. UK: country (the UK, GB, a nation) or region (an English region). */
  level: 'national' | 'state' | 'country' | 'region';
  /** US: "US" for national targets, else the state code. UK: the area's name, e.g. "Wales". */
  geography: string;
  period: number | string | null;
  target: number | null;
  estimate: number | null;
  /** (estimate − target) ÷ target, as a fraction. */
  relativeError: number | null;
  targetRole: string | null;
  sourceUrl: string | null;
  /** The dashboard's own name for the target; set for UK targets, which carry no measure id. */
  targetLabel?: string | null;
  /** UK only: the dashboard's name for the target's table, e.g. "Survey of Personal Incomes". */
  variableLabel?: string | null;
  /** The currency of a money target; unset means USD. */
  currency?: 'GBP';
}

/** One dashboard target as a row, or null when it has no name. */
export function normalizeCalibrationTarget(
  raw: any,
  country: CalibrationCountry = 'us'
): CalibrationTargetRow | null {
  if (typeof raw?.name !== 'string') {
    return null;
  }
  if (country === 'uk') {
    return normalizeUkCalibrationTarget(raw);
  }
  const level = raw.level === 'national' ? 'national' : 'state';
  const listed: string[] = Array.isArray(raw.policyengine_variables)
    ? raw.policyengine_variables.filter((v: unknown): v is string => typeof v === 'string')
    : [];
  const targetRole = typeof raw.target_role === 'string' ? raw.target_role : null;
  return {
    name: raw.name,
    source: String(raw.source ?? ''),
    sourceLabel: typeof raw.source_label === 'string' ? raw.source_label : null,
    variable: String(raw.variable ?? ''),
    policyengineVariables: listed,
    measure: typeof raw.measure === 'string' ? raw.measure : null,
    // What the target counts and which slice of its table, for a readable name.
    sourceMeasureId: typeof raw.source_measure_id === 'string' ? raw.source_measure_id : null,
    breakdown: typeof raw.breakdown === 'string' ? raw.breakdown : null,
    level,
    geography: level === 'national' ? 'US' : String(raw.state ?? raw.geography ?? ''),
    period: raw.period ?? null,
    target: typeof raw.target === 'number' ? raw.target : null,
    estimate: typeof raw.final_estimate === 'number' ? raw.final_estimate : null,
    relativeError: typeof raw.relative_error === 'number' ? raw.relative_error : null,
    targetRole,
    sourceUrl: typeof raw.source_url === 'string' ? raw.source_url : null,
  };
}

function byWorstFit(a: CalibrationTargetRow, b: CalibrationTargetRow): number {
  return Math.abs(b.relativeError!) - Math.abs(a.relativeError!);
}

function inGeography(geography: string | string[]): (row: CalibrationTargetRow) => boolean {
  if (typeof geography === 'string') {
    return (row) => row.geography === geography;
  }
  const wanted = new Set(geography);
  return (row) => wanted.has(row.geography);
}

/**
 * The targets in `geography` (or any of several) that measure any of `variables`, worst fit
 * first, at most `perVariable` per variable so a dense SOI family
 * (hundreds of AGI-band rows) cannot crowd out the rest while the worst
 * rows always survive the cut.
 */
export function targetsForVariables(
  rows: CalibrationTargetRow[],
  variables: string[],
  geography: string | string[],
  perVariable: number
): CalibrationTargetRow[] {
  const wanted = new Set(variables);
  const covers = inGeography(geography);
  const matched = rows
    .filter(
      (row) =>
        covers(row) &&
        typeof row.relativeError === 'number' &&
        row.policyengineVariables.some((v) => wanted.has(v))
    )
    .sort(byWorstFit);
  const counts = new Map<string, number>();
  return matched.filter((row) => {
    const key = row.policyengineVariables.find((v) => wanted.has(v))!;
    const count = counts.get(key) ?? 0;
    if (count >= perVariable) {
      return false;
    }
    counts.set(key, count + 1);
    return true;
  });
}

/** Every target in `geography` (or any of several) with a fit, whatever it measures, worst fit first. */
export function targetsForGeography(
  rows: CalibrationTargetRow[],
  geography: string | string[]
): CalibrationTargetRow[] {
  const covers = inGeography(geography);
  return rows
    .filter((row) => covers(row) && typeof row.relativeError === 'number')
    .sort(byWorstFit);
}

/** A dashboard label without its bracketed source citation, when it reads as a name. */
function readableTargetLabel(label: unknown): string | null {
  if (typeof label !== 'string') {
    return null;
  }
  const trimmed = label.replace(/\s*\[[^\]]*\]\s*$/, '').trim();
  return trimmed && trimmed.length <= 100 ? trimmed : null;
}

/**
 * A UK dashboard target as a row. The UK targets list no model
 * variables, so the join key is the programme the target measures, from
 * the committed programme table (ukCalibrationPrograms). Every UK target
 * without a measure is a sterling amount (SPI and ITL amounts, CGT gains
 * and liabilities, OBR spending and receipts, State Pension paid), so it
 * reads as a GBP total; "count" targets count people, taxpayers,
 * households or benefit units.
 */
function normalizeUkCalibrationTarget(raw: any): CalibrationTargetRow {
  const listed: string[] = Array.isArray(raw.policyengine_variables)
    ? raw.policyengine_variables.filter((v: unknown): v is string => typeof v === 'string')
    : [];
  const measure = typeof raw.measure === 'string' ? raw.measure : 'total';
  return {
    name: raw.name,
    source: String(raw.source ?? ''),
    sourceLabel: typeof raw.source_label === 'string' ? raw.source_label : null,
    variable: String(raw.variable ?? ''),
    policyengineVariables: listed.length > 0 ? listed : ukProgramsForTarget(raw.name),
    measure,
    sourceMeasureId: typeof raw.source_measure_id === 'string' ? raw.source_measure_id : null,
    breakdown: typeof raw.breakdown === 'string' ? raw.breakdown : null,
    level: raw.level === 'region' ? 'region' : 'country',
    geography: String(raw.geography ?? ''),
    period: raw.period ?? null,
    target: typeof raw.target === 'number' ? raw.target : null,
    estimate: typeof raw.final_estimate === 'number' ? raw.final_estimate : null,
    relativeError: typeof raw.relative_error === 'number' ? raw.relative_error : null,
    targetRole: typeof raw.target_role === 'string' ? raw.target_role : null,
    sourceUrl: typeof raw.source_url === 'string' ? raw.source_url : null,
    targetLabel: readableTargetLabel(raw.target_label),
    variableLabel: typeof raw.variable_label === 'string' ? raw.variable_label : null,
    currency: measure === 'total' ? 'GBP' : undefined,
  };
}
