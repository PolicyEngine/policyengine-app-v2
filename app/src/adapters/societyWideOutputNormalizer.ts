import type { ReportOutputSocietyWideByConstituency } from '@/types/metadata/ReportOutputSocietyWideByConstituency';
import type { ReportOutputSocietyWideByLocalAuthority } from '@/types/metadata/ReportOutputSocietyWideByLocalAuthority';
import type { UKAreaDisclosureTier, UKAreaImpact } from '@/types/metadata/UKAreaImpact';

/**
 * One area's row in the society-wide API's list shape for UK geographies:
 * `constituency_impact` and `local_authority_impact` arrive as arrays of
 * these, one per area, rather than as `{ by_constituency: { name: {...} } }`.
 * Rows from a local-area breakdown also carry disclosure control's tier and
 * each change's 90% interval.
 */
interface UKAreaImpactRow {
  constituency_code?: string;
  constituency_name?: string;
  local_authority_code?: string;
  local_authority_name?: string;
  x: number;
  y: number;
  average_household_income_change: number;
  relative_household_income_change: number;
  population?: number;
  disclosure_tier?: UKAreaDisclosureTier;
  average_household_income_change_lower?: number;
  average_household_income_change_upper?: number;
  relative_household_income_change_lower?: number;
  relative_household_income_change_upper?: number;
}

/** The interval fields a row may carry, copied when they are numbers. */
const INTERVAL_FIELDS = [
  'average_household_income_change_lower',
  'average_household_income_change_upper',
  'relative_household_income_change_lower',
  'relative_household_income_change_upper',
] as const;

const DISCLOSURE_TIERS: ReadonlySet<string> = new Set<UKAreaDisclosureTier>([
  'reported',
  'approximate',
]);

type AreaImpactsByName =
  | ReportOutputSocietyWideByConstituency
  | ReportOutputSocietyWideByLocalAuthority;

/** The list shape's rows keyed by area name, as the app's types and maps expect. */
function keyAreaRowsByName(
  rows: UKAreaImpactRow[],
  nameField: 'constituency_name' | 'local_authority_name',
  codeField: 'constituency_code' | 'local_authority_code'
): AreaImpactsByName {
  const byName: AreaImpactsByName = {};
  for (const row of rows) {
    const name = row?.[nameField] ?? row?.[codeField];
    if (!name) {
      continue;
    }
    const code = row?.[codeField];
    const area: UKAreaImpact = {
      x: row.x,
      y: row.y,
      average_household_income_change: row.average_household_income_change,
      relative_household_income_change: row.relative_household_income_change,
      ...(code && { code }),
    };
    if (row.disclosure_tier && DISCLOSURE_TIERS.has(row.disclosure_tier)) {
      area.disclosure_tier = row.disclosure_tier;
    }
    for (const field of INTERVAL_FIELDS) {
      const bound = row[field];
      if (typeof bound === 'number' && Number.isFinite(bound)) {
        area[field] = bound;
      }
    }
    byName[name] = area;
  }
  return byName;
}

type UKAreaImpactsRecord = {
  constituency_impact?: { by_constituency?: unknown } | null;
  local_authority_impact?: { by_local_authority?: unknown } | null;
};

function isAreaMap(areas: unknown): boolean {
  return !!areas && typeof areas === 'object';
}

/** Whether a result holds a constituency map (absent or null from .py 6.10.0 on). */
export function hasConstituencyImpacts(output: unknown): boolean {
  return (
    !!output &&
    typeof output === 'object' &&
    isAreaMap((output as UKAreaImpactsRecord).constituency_impact?.by_constituency)
  );
}

/** Whether a result holds a local authority map (absent or null from .py 6.10.0 on). */
export function hasLocalAuthorityImpacts(output: unknown): boolean {
  return (
    !!output &&
    typeof output === 'object' &&
    isAreaMap((output as UKAreaImpactsRecord).local_authority_impact?.by_local_authority)
  );
}

/**
 * Whether a result holds UK local-area impacts: a constituency or local
 * authority map. National UK results from .py 6.10.0 on leave both out
 * (absent or null), so their local areas come from a separate breakdown
 * run. Older saved results hold them, and show them as they are.
 */
export function hasUKLocalAreaImpacts(output: unknown): boolean {
  return hasConstituencyImpacts(output) || hasLocalAuthorityImpacts(output);
}

/**
 * A society-wide result with its UK geography impacts in the shape the app
 * reads: `constituency_impact.by_constituency` and
 * `local_authority_impact.by_local_authority`, keyed by area name. The API
 * now returns each as a list of areas; older results (and the app's types)
 * use the keyed shape. Either shape is accepted, and anything else is
 * returned as it came, so the call is safe on any report output.
 */
export function normalizeSocietyWideOutput<T>(output: T): T {
  if (!output || typeof output !== 'object') {
    return output;
  }
  const record = output as Record<string, unknown>;
  const constituencies = record.constituency_impact;
  const localAuthorities = record.local_authority_impact;
  if (!Array.isArray(constituencies) && !Array.isArray(localAuthorities)) {
    return output;
  }
  return {
    ...record,
    ...(Array.isArray(constituencies) && {
      constituency_impact: {
        by_constituency: keyAreaRowsByName(
          constituencies as UKAreaImpactRow[],
          'constituency_name',
          'constituency_code'
        ),
      },
    }),
    ...(Array.isArray(localAuthorities) && {
      local_authority_impact: {
        by_local_authority: keyAreaRowsByName(
          localAuthorities as UKAreaImpactRow[],
          'local_authority_name',
          'local_authority_code'
        ),
      },
    }),
  } as T;
}
