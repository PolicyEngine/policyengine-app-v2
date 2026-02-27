import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import {
  EMPTY_LOCAL_AUTHORITY_DATA,
  MOCK_LOCAL_AUTHORITY_DATA,
} from '@/tests/fixtures/adapters/local-authority/localAuthorityMocks';
import { createMockEconomicImpactResponse } from '@/tests/fixtures/v2MockFactory';

/**
 * Mock UK economic impact response with local authority data.
 * Uses v2 EconomicImpactResponse with LocalAuthorityData[].
 */
export const MOCK_UK_REPORT_OUTPUT_WITH_LA: EconomicImpactResponse =
  createMockEconomicImpactResponse({
    local_authority_impact: MOCK_LOCAL_AUTHORITY_DATA,
  });

/**
 * Mock UK economic impact response with no local authority data (empty array)
 */
export const MOCK_UK_REPORT_OUTPUT_NO_LA_DATA: EconomicImpactResponse =
  createMockEconomicImpactResponse({
    local_authority_impact: EMPTY_LOCAL_AUTHORITY_DATA,
  });

/**
 * Mock UK economic impact response without local_authority_impact field at all
 * (for testing the type guard — cast to EconomicImpactResponse to match component props,
 * simulating a response where the field is absent at runtime)
 */
export const MOCK_UK_REPORT_OUTPUT_NO_LA_FIELD: EconomicImpactResponse = (() => {
  const response = createMockEconomicImpactResponse({
    local_authority_impact: MOCK_LOCAL_AUTHORITY_DATA,
  });
  const { local_authority_impact: _, ...rest } = response;
  return rest as EconomicImpactResponse;
})();
