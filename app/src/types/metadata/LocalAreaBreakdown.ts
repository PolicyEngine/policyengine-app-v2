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
 */
export interface LocalAreaBreakdown {
  kind: 'local_areas';
  model_version?: string | null;
  policyengine_version?: string | null;
  dataset?: string | null;
  data_version?: string | null;
  constituency_impact: { by_constituency: ReportOutputSocietyWideByConstituency };
  local_authority_impact: { by_local_authority: ReportOutputSocietyWideByLocalAuthority };
}
