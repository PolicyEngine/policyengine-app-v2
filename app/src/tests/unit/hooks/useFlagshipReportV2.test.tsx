import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useFlagshipReport } from '@/hooks/useFlagshipReport';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import {
  STANDARD_DEDUCTION_JOINT,
  STANDARD_DEDUCTION_SINGLE,
} from '@/tests/fixtures/api/publicApi/searchFileMocks';
import {
  CURRENT_LAW_POLICY_METADATA,
  REFORM_POLICY_METADATA,
  SAVED_BASELINE_POLICY_METADATA,
} from '@/tests/fixtures/api/publicApi/v2ReportPolicyMocks';
import {
  BASELINE_SIMULATION_ID,
  EXISTING_REPORT_ID,
  EXISTING_REPORT_METADATA,
  nationwideSimulationMetadata,
  REFORM_SIMULATION_ID,
} from '@/tests/fixtures/hooks/useFlagshipReportMocks';
import { seedV2ModelCatalog, v3Wrapper } from '@/tests/fixtures/hooks/v3MetadataWrapper';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const POLICIES = new Map(
  [REFORM_POLICY_METADATA, SAVED_BASELINE_POLICY_METADATA, CURRENT_LAW_POLICY_METADATA].map(
    (policy) => [policy.id, policy]
  )
);
const baselinePolicyId = vi.hoisted(() => ({ value: '2' }));

vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  fetchReportById: async () => EXISTING_REPORT_METADATA,
}));
vi.mock('@/api/simulation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/simulation')>()),
  fetchSimulationById: async (_country: string, simulationId: string) =>
    simulationId === BASELINE_SIMULATION_ID
      ? nationwideSimulationMetadata(BASELINE_SIMULATION_ID, baselinePolicyId.value)
      : nationwideSimulationMetadata(REFORM_SIMULATION_ID, REFORM_POLICY_METADATA.id),
}));
vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  fetchPolicyById: async (_country: string, policyId: string) => POLICIES.get(policyId),
}));

const PARAMETERS_PATH = '/v2/model-catalog/parameters';

describe('useFlagshipReport with v3 on the v2 routes', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;

  beforeEach(async () => {
    fetchStub = stubPublicApiFetch({
      [PARAMETERS_PATH]: (url) =>
        jsonResponse({
          status: 'ok',
          message: null,
          result: catalogParametersResult(url.searchParams.getAll('name')),
        }),
    });
    await seedV2ModelCatalog();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
    baselinePolicyId.value = '2';
  });

  test('given a report opened fresh then its policies load the parameters they name, then parse', async () => {
    // When
    const { result } = renderHook(() => useFlagshipReport(EXISTING_REPORT_ID), {
      wrapper: v3Wrapper(),
    });

    // Then
    await waitFor(() => expect(result.current.policies).toHaveLength(2));
    expect(result.current.failedPolicyIds).toEqual([]);
    const reform = result.current.policies.find(
      (policy) => policy.id === REFORM_POLICY_METADATA.id
    );
    expect(reform?.parameters).toEqual([
      {
        name: STANDARD_DEDUCTION_SINGLE,
        values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 20000 }],
      },
    ]);
    expect(
      requestsTo(fetchStub, PARAMETERS_PATH).flatMap((url) => url.searchParams.getAll('name'))
    ).toEqual([STANDARD_DEDUCTION_SINGLE]);
  });

  test('given a report compared with a saved reform then both policies load and parse', async () => {
    // Given
    baselinePolicyId.value = SAVED_BASELINE_POLICY_METADATA.id;

    // When
    const { result } = renderHook(() => useFlagshipReport(EXISTING_REPORT_ID), {
      wrapper: v3Wrapper(),
    });

    // Then
    await waitFor(() => expect(result.current.policies).toHaveLength(2));
    expect(result.current.failedPolicyIds).toEqual([]);
    const names = requestsTo(fetchStub, PARAMETERS_PATH).flatMap((url) =>
      url.searchParams.getAll('name')
    );
    expect(names.sort()).toEqual([STANDARD_DEDUCTION_JOINT, STANDARD_DEDUCTION_SINGLE].sort());
    const baseline = result.current.policies.find(
      (policy) => policy.id === SAVED_BASELINE_POLICY_METADATA.id
    );
    expect(baseline?.parameters?.[0].name).toBe(STANDARD_DEDUCTION_JOINT);
  });
});
