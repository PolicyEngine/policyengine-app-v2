import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import {
  EMPTY_CONSTITUENCY_DATA,
  MOCK_CONSTITUENCY_DATA,
} from '@/tests/fixtures/adapters/constituency/constituencyMocks';
import { createMockEconomicImpactResponse } from '@/tests/fixtures/v2MockFactory';
import type { MetadataState } from '@/types/metadata';
import { DEFAULT_LOADING_STATES } from '../../reducers/metadataReducerMocks';

/**
 * Mock UK economic impact response with constituency data.
 * Uses v2 EconomicImpactResponse with ConstituencyData[].
 */
export const MOCK_UK_REPORT_OUTPUT: EconomicImpactResponse = createMockEconomicImpactResponse({
  constituency_impact: MOCK_CONSTITUENCY_DATA,
});

/**
 * Mock UK economic impact response with no constituency data (empty array)
 */
export const MOCK_UK_REPORT_OUTPUT_NO_CONSTITUENCY: EconomicImpactResponse =
  createMockEconomicImpactResponse({
    constituency_impact: EMPTY_CONSTITUENCY_DATA,
  });

/**
 * Mock metadata state (only API-driven data)
 */
export const MOCK_METADATA: MetadataState = {
  currentCountry: 'uk',
  ...DEFAULT_LOADING_STATES,
  loaded: true,
  progress: 100,
  variables: {},
  parameters: {},
  datasets: [],
  version: '1.0.0',
};
