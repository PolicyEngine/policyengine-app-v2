/**
 * Congressional District Data Context
 *
 * Gives a report's congressional district views their labels, state code,
 * policies, year and district scope.
 */

import { createContext, useContext, useMemo } from 'react';
import { buildDistrictLabelLookup } from '@/adapters/congressional-district/congressionalDistrictDataAdapter';
import { useRegions } from '@/hooks/useRegions';
import type {
  CongressionalDistrictDataContextValue,
  CongressionalDistrictDataProviderProps,
} from './types';
import { congressionalDistrictScope, extractStateCode, isStateLevelRegion } from './utils';

const CongressionalDistrictDataContext =
  createContext<CongressionalDistrictDataContextValue | null>(null);

/**
 * Provider for a report's congressional district views: the district labels
 * from the region metadata, the state code of a state report, the report's
 * policies and year, and which districts it has (`scope`). The districts
 * themselves come from useCongressionalDistrictImpacts: a state report's
 * own result, or each state's own run for a nationwide report.
 */
export function CongressionalDistrictDataProvider({
  children,
  reformPolicyId,
  baselinePolicyId,
  year,
  region,
}: CongressionalDistrictDataProviderProps) {
  const { data: regions = [] } = useRegions('us');

  // District ID (e.g. "AL-01") to label, from canonical region records
  const labelLookup = useMemo(() => buildDistrictLabelLookup(regions), [regions]);

  // A state report's state (e.g. 'ca'); null for a nationwide report
  const stateCode = useMemo(
    () => (isStateLevelRegion(region) ? extractStateCode(region) : null),
    [region]
  );

  const scope = useMemo(() => congressionalDistrictScope(region), [region]);

  const contextValue = useMemo<CongressionalDistrictDataContextValue>(
    () => ({ reformPolicyId, baselinePolicyId, year, labelLookup, stateCode, scope }),
    [reformPolicyId, baselinePolicyId, year, labelLookup, stateCode, scope]
  );

  return (
    <CongressionalDistrictDataContext.Provider value={contextValue}>
      {children}
    </CongressionalDistrictDataContext.Provider>
  );
}

/**
 * Hook to access congressional district data context.
 * Must be used within a CongressionalDistrictDataProvider.
 *
 * @throws Error if used outside of CongressionalDistrictDataProvider
 */
export function useCongressionalDistrictData(): CongressionalDistrictDataContextValue {
  const context = useContext(CongressionalDistrictDataContext);
  if (!context) {
    throw new Error(
      'useCongressionalDistrictData must be used within a CongressionalDistrictDataProvider'
    );
  }
  return context;
}
