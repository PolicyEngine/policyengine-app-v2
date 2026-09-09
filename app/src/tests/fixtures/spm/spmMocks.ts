import { Household } from '@/models/Household';
import { createMockStateWithData } from '@/tests/fixtures/reducers/metadataReducerMocks';
import type { SPMMetadata, SPMProvenance, SPMSelection } from '@/types/spm';

export const SPM_TEST_YEAR = '2026';
export const NATIONAL_SPM: SPMSelection = { geography_kind: 'national' };
export const COUNTY_SPM: SPMSelection = { geography_kind: 'county' };
export const CANONICAL_SPM_METADATA: SPMMetadata = { available: true };
export const RESOLVED_CANONICAL_METADATA = createMockStateWithData({ spm: CANONICAL_SPM_METADATA });
export const RESOLVED_LEGACY_METADATA = createMockStateWithData();
export const SPM_RECEIPT: SPMProvenance = {
  forecast_id: 'test-canonical-forecast',
  forecast_sha256: 'a'.repeat(64),
  scenario: 'test-baseline',
  geography_kind: 'national',
  runtime_versions: { 'policyengine-us': 'test-version' },
  years: { '2026': { source: 'forecast' } },
  geographies: [{ geography_kind: 'national' }],
  composition_method: 'test-classified-adults',
  storage_method: 'test-artifact',
};
export function stateOnlyHousehold() {
  return Household.starter('us', SPM_TEST_YEAR).setGroupVariableAtYear(
    'households',
    'your household',
    'state_name',
    SPM_TEST_YEAR,
    'CA'
  );
}
