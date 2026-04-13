/**
 * Test fixtures for useSaveSharedReport tests
 */

import { vi } from 'vitest';
import { ReportIngredientsInput } from '@/hooks/utils/useFetchReportIngredients';
import type { CanonicalHouseholdInputEnvelope } from '@/models/household/canonicalTypes';
import { Policy } from '@/types/ingredients/Policy';

// ============================================================================
// Constants
// ============================================================================

export const TEST_IDS = {
  USER_REPORT: 'sur-save-123',
  BASE_REPORT: '308',
  SIMULATION: 'sim-1',
  POLICY: 'policy-1',
  CURRENT_LAW_POLICY: '1', // Should be skipped
  HOUSEHOLD: 'hh-1',
  GEOGRAPHY: 'us',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const CURRENT_LAW_ID = '1';

// ============================================================================
// ReportIngredientsInput Fixtures
// ============================================================================

export const MOCK_SAVE_SHARE_DATA: ReportIngredientsInput = {
  userReport: {
    id: TEST_IDS.USER_REPORT,
    reportId: TEST_IDS.BASE_REPORT,
    countryId: TEST_COUNTRIES.US,
    label: 'My Shared Report',
  },
  userSimulations: [
    { simulationId: TEST_IDS.SIMULATION, countryId: TEST_COUNTRIES.US, label: 'Baseline' },
  ],
  userPolicies: [{ policyId: TEST_IDS.POLICY, countryId: TEST_COUNTRIES.US, label: 'My Policy' }],
  userHouseholds: [],
  userGeographies: [
    {
      type: 'geography',
      geographyId: TEST_IDS.GEOGRAPHY,
      countryId: TEST_COUNTRIES.US,
      scope: 'national',
      label: 'United States',
    },
  ],
};

export const MOCK_SHARE_DATA_WITH_CURRENT_LAW: ReportIngredientsInput = {
  ...MOCK_SAVE_SHARE_DATA,
  userPolicies: [
    { policyId: TEST_IDS.CURRENT_LAW_POLICY, countryId: TEST_COUNTRIES.US, label: 'Current Law' },
    { policyId: TEST_IDS.POLICY, countryId: TEST_COUNTRIES.US, label: 'My Policy' },
  ],
};

export const MOCK_SHARE_DATA_WITH_HOUSEHOLD: ReportIngredientsInput = {
  ...MOCK_SAVE_SHARE_DATA,
  userHouseholds: [
    {
      type: 'household',
      householdId: TEST_IDS.HOUSEHOLD,
      countryId: TEST_COUNTRIES.UK,
      label: 'My Household',
    },
  ],
  userGeographies: [],
};

export const MOCK_SHARE_DATA_WITHOUT_LABEL: ReportIngredientsInput = {
  userReport: {
    id: 'sur-no-label',
    reportId: TEST_IDS.BASE_REPORT,
    countryId: TEST_COUNTRIES.US,
  },
  userSimulations: [],
  userPolicies: [],
  userHouseholds: [],
  userGeographies: [],
};

// ============================================================================
// Mock User Report (returned after save)
// ============================================================================

export const MOCK_SAVED_USER_REPORT = {
  id: TEST_IDS.USER_REPORT,
  userId: 'anonymous',
  reportId: TEST_IDS.BASE_REPORT,
  countryId: TEST_COUNTRIES.US,
  label: 'My Shared Report',
};

export const MOCK_SAVED_USER_POLICY = {
  id: 'sup-policy-save-1',
  userId: 'anonymous',
  policyId: TEST_IDS.POLICY,
  countryId: TEST_COUNTRIES.US,
  label: 'My Policy',
  createdAt: '2026-04-08T12:00:00Z',
  isCreated: true,
};

export const MOCK_SAVED_USER_HOUSEHOLD = {
  id: 'suh-household-save-1',
  userId: 'anonymous',
  householdId: TEST_IDS.HOUSEHOLD,
  countryId: TEST_COUNTRIES.UK,
  label: 'My Household',
  createdAt: '2026-04-08T12:00:00Z',
  isCreated: true,
  type: 'household' as const,
};

export const MOCK_EXISTING_USER_REPORT = {
  ...MOCK_SAVED_USER_REPORT,
  label: 'Already Saved Report',
};

export const MOCK_POLICIES: Policy[] = [
  {
    id: TEST_IDS.POLICY,
    countryId: TEST_COUNTRIES.US,
    label: 'My Policy',
    parameters: [
      {
        name: 'gov.irs.credits.ctc.amount',
        values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2000 }],
      },
    ],
  },
];

export const MOCK_HOUSEHOLDS: CanonicalHouseholdInputEnvelope[] = [
  {
    id: TEST_IDS.HOUSEHOLD,
    countryId: TEST_COUNTRIES.UK,
    householdData: {
      people: {
        you: {
          age: { '2026': 40 },
          employment_income: { '2026': 30000 },
        },
      },
      households: {
        household1: {
          members: ['you'],
        },
      },
      benunits: {
        benunit1: {
          members: ['you'],
        },
      },
    },
  },
];

// ============================================================================
// Mock Hooks Factory
// ============================================================================

export const createMockMutation = (resolvedValue: any = {}) => ({
  mutateAsync: vi.fn().mockResolvedValue(resolvedValue),
  isPending: false,
});

export const createMockReportStore = (existingReport: any = null) => ({
  findByUserReportId: vi.fn().mockResolvedValue(existingReport),
  createWithId: vi.fn().mockResolvedValue(MOCK_SAVED_USER_REPORT),
});

export const createMockFailingMutation = (error: Error) => ({
  mutateAsync: vi.fn().mockRejectedValue(error),
  isPending: false,
});

// ============================================================================
// Error Constants
// ============================================================================

export const TEST_ERRORS = {
  SAVE_FAILED: new Error('Failed to save association'),
  REPORT_SAVE_FAILED: new Error('Failed to save report'),
} as const;
