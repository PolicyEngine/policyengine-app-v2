import type { ReportOutputSocietyWideByConstituency } from '@/types/metadata/ReportOutputSocietyWideByConstituency';
import type { ReportOutputSocietyWideByLocalAuthority } from '@/types/metadata/ReportOutputSocietyWideByLocalAuthority';

/**
 * One area's row in the society-wide API's list shape for UK geographies:
 * `constituency_impact` and `local_authority_impact` arrive as arrays of
 * these, one per area, rather than as `{ by_constituency: { name: {...} } }`.
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
}

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
    byName[name] = {
      x: row.x,
      y: row.y,
      average_household_income_change: row.average_household_income_change,
      relative_household_income_change: row.relative_household_income_change,
    };
  }
  return byName;
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
