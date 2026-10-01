import { Household } from '@/models/Household';
import { createMockStateWithData } from '@/tests/fixtures/reducers/metadataReducerMocks';
import type {
  ResolvedSPMSelection,
  SPMComparisonProvenance,
  SPMMetadata,
  SPMProvenance,
  SPMSelection,
} from '@/types/spm';

export const SPM_TEST_YEAR = '2026';
export const NATIONAL_SPM: SPMSelection = { geography_kind: 'national' };
export const COUNTY_SPM: SPMSelection = { geography_kind: 'county' };
export const CANONICAL_SPM_METADATA: SPMMetadata = { available: true };
export const RESOLVED_CANONICAL_METADATA = createMockStateWithData({ spm: CANONICAL_SPM_METADATA });
export const RESOLVED_LEGACY_METADATA = createMockStateWithData();
export const SPM_RECEIPT: SPMProvenance = {
  schema_version: 'canonical-spm-provenance-v2',
  forecast_id: 'test-canonical-forecast',
  forecast_sha256: 'a'.repeat(64),
  scenario: 'test-baseline',
  geography_kind: 'national',
  geography_id: null,
  county_vintage: '2020',
  as_of: '2026-08-01',
  years: ['2026'],
  runtime_versions: {
    policyengine: '9.1.0',
    'policyengine-core': '7.1.0',
    'policyengine-us': '8.1.0',
    'spm-calculator': '6.1.0',
  },
};
export const RESOLVED_NATIONAL_SPM: ResolvedSPMSelection = {
  geography_kind: 'national',
  geography_id: null,
  forecast_content_sha256: SPM_RECEIPT.forecast_sha256,
  scenario: SPM_RECEIPT.scenario,
  county_vintage: '2020',
  as_of: SPM_RECEIPT.as_of,
};
export const SPM_COMPARISON_RECEIPT: SPMComparisonProvenance = {
  schema_version: 'canonical-spm-comparison-v2',
  baseline: { receipt: SPM_RECEIPT, execution_count: 20 },
  reform: { receipt: SPM_RECEIPT, execution_count: 20 },
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
