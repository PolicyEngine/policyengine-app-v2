import type { ReportOutputSocietyWideByConstituency } from './ReportOutputSocietyWideByConstituency';
import type { ReportOutputSocietyWideByLocalAuthority } from './ReportOutputSocietyWideByLocalAuthority';

/**
 * A UK report's constituency and local authority impacts, calculated by a
 * separate run (`breakdown=local_areas`) on the local-area dataset. National
 * UK results from .py 6.10.0 on leave these impacts out.
 *
 * Disclosure control leaves out the areas it withholds, so either level can
 * hold fewer areas than exist, or none. Keyed by area name, as
 * `normalizeSocietyWideOutput` returns the API's lists.
 *
 * From PolicyEngine/policyengine-sim-api#968 on, the result also lists each
 * level's withheld areas: the ONS codes of the areas the run estimated but
 * disclosure control did not publish, sorted. An empty list means none
 * were withheld; null or absent means the result does not say, as in one
 * computed before that change. An area missing from a level that is not
 * on its list has no data, for example one with no households in the
 * local-area dataset.
 */
export interface LocalAreaBreakdown {
  kind: 'local_areas';
  model_version?: string | null;
  policyengine_version?: string | null;
  dataset?: string | null;
  data_version?: string | null;
  constituency_impact: { by_constituency: ReportOutputSocietyWideByConstituency };
  local_authority_impact: { by_local_authority: ReportOutputSocietyWideByLocalAuthority };
  constituency_withheld_codes?: string[] | null;
  local_authority_withheld_codes?: string[] | null;
}
