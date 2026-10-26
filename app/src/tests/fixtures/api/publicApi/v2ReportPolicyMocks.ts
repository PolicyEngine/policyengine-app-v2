import {
  STANDARD_DEDUCTION_JOINT,
  STANDARD_DEDUCTION_SINGLE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';
import type { PolicyMetadata } from '@/types/metadata/policyMetadata';

/** A report's reform policy as v1 stores it: a larger single standard deduction. */
export const REFORM_POLICY_METADATA: PolicyMetadata = {
  id: '98557',
  country_id: 'us',
  api_version: 'v1',
  policy_json: { [STANDARD_DEDUCTION_SINGLE]: { '2026-01-01.2100-12-31': 20000 } },
  policy_hash: 'reform-hash',
};

/** A saved reform the report is compared with: a larger joint standard deduction. */
export const SAVED_BASELINE_POLICY_METADATA: PolicyMetadata = {
  id: '77001',
  country_id: 'us',
  api_version: 'v1',
  policy_json: { [STANDARD_DEDUCTION_JOINT]: { '2026-01-01.2100-12-31': 40000 } },
  policy_hash: 'baseline-hash',
};

/** Current law, which names no parameter. */
export const CURRENT_LAW_POLICY_METADATA: PolicyMetadata = {
  id: '2',
  country_id: 'us',
  api_version: 'v1',
  policy_json: {},
  policy_hash: 'current-law-hash',
};
