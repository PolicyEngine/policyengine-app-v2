/**
 * Shared test fixtures for v2 API module tests.
 *
 * All mock data, response factories, and fetch helpers live here.
 * Individual test files import what they need.
 */
import { vi } from 'vitest';

// ============================================================================
// Constants
// ============================================================================

export const TEST_V2_BASE_URL = 'https://v2.api.policyengine.org';

export const TEST_IDS = {
  MODEL_ID: '550e8400-e29b-41d4-a716-446655440000',
  MODEL_VERSION_ID: '660e8400-e29b-41d4-a716-446655440001',
  HOUSEHOLD_ID: '770e8400-e29b-41d4-a716-446655440002',
  POLICY_ID: '880e8400-e29b-41d4-a716-446655440003',
  SIMULATION_ID: '990e8400-e29b-41d4-a716-446655440004',
  REPORT_ID: 'aa0e8400-e29b-41d4-a716-446655440005',
  USER_ID: 'user-test-123',
  DATASET_ID: 'bb0e8400-e29b-41d4-a716-446655440006',
  PARAMETER_ID: 'cc0e8400-e29b-41d4-a716-446655440007',
  ASSOCIATION_ID: 'dd0e8400-e29b-41d4-a716-446655440008',
  JOB_ID: 'ee0e8400-e29b-41d4-a716-446655440009',
} as const;

export const TEST_TIMESTAMP = '2026-01-15T12:00:00Z';
export const TEST_COUNTRY_ID = 'us';

// ============================================================================
// Fetch mock helpers
// ============================================================================

export function mockFetchSuccess(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  });
}

export function mockFetchError(status: number, message: string) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: vi.fn().mockResolvedValue({ error: message }),
    text: vi.fn().mockResolvedValue(message),
  });
}

export function mockFetch404() {
  return vi.fn().mockResolvedValue({
    ok: false,
    status: 404,
    json: vi.fn().mockResolvedValue({ error: 'Not found' }),
    text: vi.fn().mockResolvedValue('Not found'),
  });
}

export function mockFetchSequence(
  responses: Array<{ ok: boolean; status: number; data: unknown }>
) {
  const fn = vi.fn();
  responses.forEach((resp) => {
    fn.mockResolvedValueOnce({
      ok: resp.ok,
      status: resp.status,
      json: vi.fn().mockResolvedValue(resp.data),
      text: vi.fn().mockResolvedValue(JSON.stringify(resp.data)),
    });
  });
  return fn;
}

// ============================================================================
// Mock response factories — Tax Benefit Models
// ============================================================================

export function createMockTaxBenefitModel(overrides?: Partial<{ id: string; name: string }>) {
  return {
    id: overrides?.id ?? TEST_IDS.MODEL_ID,
    name: overrides?.name ?? 'policyengine-us',
    description: 'US tax-benefit model',
    created_at: TEST_TIMESTAMP,
  };
}

export function createMockModelVersion(
  overrides?: Partial<{ id: string; model_id: string; version: string }>
) {
  return {
    id: overrides?.id ?? TEST_IDS.MODEL_VERSION_ID,
    model_id: overrides?.model_id ?? TEST_IDS.MODEL_ID,
    version: overrides?.version ?? '1.0.0',
  };
}

// ============================================================================
// Mock response factories — Households
// ============================================================================

export function createMockHouseholdV2Response(overrides?: Partial<{ id: string }>) {
  return {
    id: overrides?.id ?? TEST_IDS.HOUSEHOLD_ID,
    country_id: TEST_COUNTRY_ID,
    year: 2026,
    label: 'Test household',
    people: [{ age: 30, employment_income: 50000 }],
    tax_unit: { members: ['person1'] },
    family: null,
    spm_unit: null,
    marital_unit: null,
    household: null,
    benunit: null,
    created_at: TEST_TIMESTAMP,
    updated_at: TEST_TIMESTAMP,
  };
}

export function createMockV2HouseholdShape() {
  return {
    country_id: TEST_COUNTRY_ID as 'us',
    year: 2026,
    label: 'Test household',
    people: [{ age: 30, employment_income: 50000 }],
    tax_unit: { members: ['person1'] },
    family: null,
    spm_unit: null,
    marital_unit: null,
    household: null,
    benunit: null,
  };
}

// ============================================================================
// Mock response factories — Household Calculation
// ============================================================================

export function createMockHouseholdJobResponse() {
  return {
    job_id: TEST_IDS.JOB_ID,
    status: 'PENDING' as const,
  };
}

export function createMockHouseholdJobStatusResponse(
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' = 'COMPLETED'
) {
  return {
    job_id: TEST_IDS.JOB_ID,
    status,
    result:
      status === 'COMPLETED'
        ? {
            person: [{ net_income: 45000 }],
            household: [{ total_tax: 5000 }],
          }
        : null,
    error_message: status === 'FAILED' ? 'Calculation error' : null,
  };
}

// ============================================================================
// Mock response factories — Simulations
// ============================================================================

export function createMockHouseholdSimulationResponse(
  overrides?: Partial<{ status: string; policy_id: string | null }>
) {
  return {
    id: TEST_IDS.SIMULATION_ID,
    status: overrides?.status ?? 'completed',
    household_id: TEST_IDS.HOUSEHOLD_ID,
    policy_id: overrides?.policy_id !== undefined ? overrides.policy_id : TEST_IDS.POLICY_ID,
    household_result: { net_income: 45000 },
    error_message: null,
  };
}

export function createMockEconomySimulationResponse(
  overrides?: Partial<{ status: string; policy_id: string | null }>
) {
  return {
    id: TEST_IDS.SIMULATION_ID,
    status: overrides?.status ?? 'completed',
    dataset_id: TEST_IDS.DATASET_ID,
    policy_id: overrides?.policy_id !== undefined ? overrides.policy_id : TEST_IDS.POLICY_ID,
    output_dataset_id: null,
    filter_field: null,
    filter_value: null,
    region: {
      code: 'state/ca',
      name: 'California',
      dataset_id: TEST_IDS.DATASET_ID,
      filter_field: null,
      filter_value: null,
    },
    error_message: null,
  };
}

// ============================================================================
// Mock response factories — Economy Analysis
// ============================================================================

export function createMockEconomicImpactResponse(overrides?: Partial<{ status: string }>) {
  return {
    report_id: TEST_IDS.REPORT_ID,
    status: overrides?.status ?? 'completed',
    baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
    reform_simulation: { id: 'sim-reform', status: 'completed', error_message: null },
    region: null,
    error_message: null,
    decile_impacts: null,
    program_statistics: null,
    poverty: null,
    inequality: null,
    budget_summary: null,
    intra_decile: null,
    detailed_budget: null,
    congressional_district_impact: null,
    constituency_impact: null,
    local_authority_impact: null,
    wealth_decile: null,
    intra_wealth_decile: null,
  };
}

// ============================================================================
// Mock response factories — Household Analysis
// ============================================================================

export function createMockHouseholdImpactResponse(overrides?: Partial<{ status: string }>) {
  return {
    report_id: TEST_IDS.REPORT_ID,
    report_type: 'household',
    status: overrides?.status ?? 'completed',
    baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
    reform_simulation: { id: 'sim-reform', status: 'completed', error_message: null },
    baseline_result: { net_income: 50000 },
    reform_result: { net_income: 52000 },
    impact: { net_income: 2000 },
    error_message: null,
  };
}

// ============================================================================
// Mock response factories — User Associations (all 4 follow same shape)
// ============================================================================

export function createMockUserPolicyAssociationV2Response() {
  return {
    id: TEST_IDS.ASSOCIATION_ID,
    user_id: TEST_IDS.USER_ID,
    policy_id: TEST_IDS.POLICY_ID,
    country_id: TEST_COUNTRY_ID,
    label: 'My reform',
    created_at: TEST_TIMESTAMP,
    updated_at: TEST_TIMESTAMP,
  };
}

export function createMockUserHouseholdAssociationV2Response() {
  return {
    id: TEST_IDS.ASSOCIATION_ID,
    user_id: TEST_IDS.USER_ID,
    household_id: TEST_IDS.HOUSEHOLD_ID,
    country_id: TEST_COUNTRY_ID,
    label: 'My household',
    created_at: TEST_TIMESTAMP,
    updated_at: TEST_TIMESTAMP,
  };
}

export function createMockUserSimulationAssociationV2Response() {
  return {
    id: TEST_IDS.ASSOCIATION_ID,
    user_id: TEST_IDS.USER_ID,
    simulation_id: TEST_IDS.SIMULATION_ID,
    country_id: TEST_COUNTRY_ID,
    label: 'My simulation',
    created_at: TEST_TIMESTAMP,
    updated_at: TEST_TIMESTAMP,
  };
}

export function createMockUserReportAssociationV2Response() {
  return {
    id: TEST_IDS.ASSOCIATION_ID,
    user_id: TEST_IDS.USER_ID,
    report_id: TEST_IDS.REPORT_ID,
    country_id: TEST_COUNTRY_ID,
    label: 'My report',
    created_at: TEST_TIMESTAMP,
    updated_at: TEST_TIMESTAMP,
    last_run_at: null,
  };
}

// ============================================================================
// Mock response factories — Regions, Parameters, etc.
// ============================================================================

export function createMockRegionResponse() {
  return {
    id: 'region-1',
    code: 'state/ca',
    label: 'California',
    region_type: 'state',
    requires_filter: false,
    filter_field: null,
    filter_value: null,
    parent_code: 'us',
    state_code: 'CA',
    state_name: 'California',
    tax_benefit_model_id: TEST_IDS.MODEL_ID,
    created_at: TEST_TIMESTAMP,
    updated_at: TEST_TIMESTAMP,
  };
}

export function createMockParameterChildNode() {
  return {
    path: 'gov.irs',
    label: 'IRS',
    type: 'node' as const,
    child_count: 5,
    parameter: null,
  };
}

export function createMockAnalysisOption() {
  return {
    name: 'decile_impacts',
    label: 'Decile impacts',
    description: 'Compute income changes by decile',
    response_fields: ['decile_impacts'],
  };
}

export function createMockReportFullResponse() {
  return {
    report: {
      id: TEST_IDS.REPORT_ID,
      label: 'Test report',
      description: null,
      report_type: 'economy',
      status: 'completed',
      error_message: null,
      baseline_simulation_id: 'sim-baseline',
      reform_simulation_id: 'sim-reform',
      created_at: TEST_TIMESTAMP,
    },
    baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
    reform_simulation: { id: 'sim-reform', status: 'completed', error_message: null },
    baseline_policy: null,
    reform_policy: null,
    household: null,
    region: null,
    economic_impact: null,
    household_impact: null,
  };
}
