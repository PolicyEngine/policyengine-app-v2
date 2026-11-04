/**
 * Mock data and fixtures for CongressionalDistrictDataContext tests
 */

import type { CongressionalDistrictDataContextValue } from '@/contexts/congressional-district/types';

// ============================================================================
// Test Constants
// ============================================================================

export const TEST_STRIPPED_STATE_CODES = {
  ALABAMA: 'al',
  CALIFORNIA: 'ca',
  DC: 'dc',
  NEW_YORK: 'ny',
  TEXAS: 'tx',
} as const;

export const TEST_REGION_FORMATS = {
  STATE_CA: 'state/ca',
  STATE_DC: 'state/dc',
  STATE_UPPERCASE: 'STATE/CA',
  LEGACY_CA: 'ca',
  NATIONAL: 'us',
  NATIONAL_UPPERCASE: 'US',
  CONGRESSIONAL_DISTRICT: 'congressional_district/CA-01',
  PLACE: 'place/CA-44000',
} as const;

export const TEST_POLICY_IDS = {
  REFORM: 'reform-policy-123',
  BASELINE: 'baseline-policy-456',
} as const;

export const TEST_YEAR = '2024';

// ============================================================================
// Mock Context Values
// ============================================================================

/**
 * Create a mock context value for testing
 */
export function createMockContextValue(
  overrides: Partial<CongressionalDistrictDataContextValue> = {}
): CongressionalDistrictDataContextValue {
  return {
    reformPolicyId: TEST_POLICY_IDS.REFORM,
    baselinePolicyId: TEST_POLICY_IDS.BASELINE,
    year: TEST_YEAR,
    labelLookup: new Map(),
    stateCode: null,
    scope: 'nationwide',
    ...overrides,
  };
}

// ============================================================================
// All State Codes (for national reports)
// ============================================================================

export const ALL_US_STATE_CODES = [
  'state/al',
  'state/ak',
  'state/az',
  'state/ar',
  'state/ca',
  'state/co',
  'state/ct',
  'state/de',
  'state/dc',
  'state/fl',
  'state/ga',
  'state/hi',
  'state/id',
  'state/il',
  'state/in',
  'state/ia',
  'state/ks',
  'state/ky',
  'state/la',
  'state/me',
  'state/md',
  'state/ma',
  'state/mi',
  'state/mn',
  'state/ms',
  'state/mo',
  'state/mt',
  'state/ne',
  'state/nv',
  'state/nh',
  'state/nj',
  'state/nm',
  'state/ny',
  'state/nc',
  'state/nd',
  'state/oh',
  'state/ok',
  'state/or',
  'state/pa',
  'state/ri',
  'state/sc',
  'state/sd',
  'state/tn',
  'state/tx',
  'state/ut',
  'state/vt',
  'state/va',
  'state/wa',
  'state/wv',
  'state/wi',
  'state/wy',
];
