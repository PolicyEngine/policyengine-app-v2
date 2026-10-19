/**
 * Calibration target rows as the calibration-targets route serves them:
 * the dashboard's per-target diagnostics, normalized, and the selections
 * the route answers with. Shared by the route (server) and the
 * validation layer (client), so this module imports nothing.
 */

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

/** One dashboard target as a row, or null when it has no name. */
export function normalizeCalibrationTarget(raw: any): CalibrationTargetRow | null {
  if (typeof raw?.name !== 'string') {
    return null;
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

/**
 * The targets in `geography` that measure any of `variables`, worst fit
 * first, at most `perVariable` per variable so a dense SOI family
 * (hundreds of AGI-band rows) cannot crowd out the rest while the worst
 * rows always survive the cut.
 */
export function targetsForVariables(
  rows: CalibrationTargetRow[],
  variables: string[],
  geography: string,
  perVariable: number
): CalibrationTargetRow[] {
  const wanted = new Set(variables);
  const matched = rows
    .filter(
      (row) =>
        row.geography === geography &&
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

/** Every target in `geography` with a fit, whatever it measures, worst fit first. */
export function targetsForGeography(
  rows: CalibrationTargetRow[],
  geography: string
): CalibrationTargetRow[] {
  return rows
    .filter((row) => row.geography === geography && typeof row.relativeError === 'number')
    .sort(byWorstFit);
}
