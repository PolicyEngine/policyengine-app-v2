import { useMemo } from 'react';
import { districtsOf } from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { CongressionalDistrictScope } from '@/contexts/congressional-district/utils';
import { useCongressionalDistrictData } from '@/contexts/CongressionalDistrictDataContext';
import { useStateDistrictRuns, type StateDistrictRuns } from '@/hooks/useStateDistrictRuns';
import type { USCongressionalDistrictBreakdownItem } from '@/types/metadata/ReportOutputSocietyWideByCongressionalDistrict';

export interface CongressionalDistrictImpacts {
  /** The report's districts: every state's, one state's, or none. */
  scope: CongressionalDistrictScope | null;
  /**
   * The districts to map, with normalised IDs: a state report's own, or,
   * for a nationwide report, the states' runs so far; null while there are
   * none.
   */
  districts: USCongressionalDistrictBreakdownItem[] | null;
  /** A nationwide report's state runs, for the compute panel; null otherwise. */
  runs: StateDistrictRuns | null;
  /** States whose districts are still to come, which the map does not call missing. */
  pendingStates: string[];
  /** States whose districts failed, which the map marks. */
  failedStates: string[];
}

const NO_STATES: string[] = [];

/**
 * What a congressional district view shows, shared by the v3 Districts tab
 * and the v2 overview card and district pages. A state report maps its own
 * result's districts, with no lookup. A nationwide report maps each
 * state's own run (useStateDistrictRuns), and ignores any districts stored
 * on the nationwide result, so a district reads the same as in its state's
 * report. Any other scope has none. Reads the report's scope, policies
 * and year from the CongressionalDistrictDataProvider around it.
 */
export function useCongressionalDistrictImpacts(
  output: SocietyWideReportOutput | null | undefined
): CongressionalDistrictImpacts {
  const { scope, reformPolicyId, baselinePolicyId, year } = useCongressionalDistrictData();
  const nationwide = scope === 'nationwide';
  // Only a nationwide report looks its states up; any other sends nothing.
  const runs = useStateDistrictRuns(nationwide ? { reformPolicyId, baselinePolicyId, year } : {});
  const ownDistricts = useMemo(
    () => (scope === 'state' ? districtsOf(output) : null),
    [scope, output]
  );

  if (nationwide) {
    return {
      scope,
      districts: runs.completedCount > 0 ? runs.districts : null,
      runs,
      pendingStates: runs.pendingStates,
      failedStates: runs.failedStates,
    };
  }
  return {
    scope,
    districts: ownDistricts,
    runs: null,
    pendingStates: NO_STATES,
    failedStates: NO_STATES,
  };
}
