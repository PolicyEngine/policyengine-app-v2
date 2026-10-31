import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useFlagshipHouseholdPolicies } from '@/hooks/useFlagshipHousehold';
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

function answerParameters(url: URL) {
  return jsonResponse({
    status: 'ok',
    message: null,
    result: catalogParametersResult(url.searchParams.getAll('name')),
  });
}

/** The parameters request fails the first time, then answers. */
function stubParametersFailingOnce() {
  let attempts = 0;
  return stubPublicApiFetch({
    [PARAMETERS_PATH]: (url) => {
      attempts += 1;
      return attempts === 1
        ? jsonResponse({ status: 'error', message: 'Unavailable' }, 503)
        : answerParameters(url);
    },
  });
}

describe('useFlagshipReport with v3 on the v2 routes', () => {
  let fetchStub: ReturnType<typeof stubPublicApiFetch>;

  beforeEach(async () => {
    fetchStub = stubPublicApiFetch({ [PARAMETERS_PATH]: answerParameters });
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

  test('given the parameters a policy names fail to load then it is failed, not loading, and retry parses it', async () => {
    // Given
    fetchStub = stubParametersFailingOnce();
    const { result } = renderHook(() => useFlagshipReport(EXISTING_REPORT_ID), {
      wrapper: v3Wrapper(),
    });
    await waitFor(() =>
      expect(result.current.failedPolicyIds).toEqual([REFORM_POLICY_METADATA.id])
    );
    expect(result.current.isLoading).toBe(false);
    // Current law names no parameter, so it parses regardless.
    expect(result.current.policies.map((policy) => policy.id)).toEqual([
      CURRENT_LAW_POLICY_METADATA.id,
    ]);

    // When
    await act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.policies).toHaveLength(2));
    expect(result.current.failedPolicyIds).toEqual([]);
    expect(requestsTo(fetchStub, PARAMETERS_PATH)).toHaveLength(2);
  });

  test('given the policies are in then another render keeps the same policies', async () => {
    // Given
    const { result, rerender } = renderHook(() => useFlagshipReport(EXISTING_REPORT_ID), {
      wrapper: v3Wrapper(),
    });
    await waitFor(() => expect(result.current.policies).toHaveLength(2));
    const policies = result.current.policies;

    // When
    rerender();

    // Then
    expect(result.current.policies).toBe(policies);
  });
});

describe('useFlagshipHouseholdPolicies with v3 on the v2 routes', () => {
  const policyIds = [CURRENT_LAW_POLICY_METADATA.id, REFORM_POLICY_METADATA.id];

  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given the parameters a policy names fail to load then it reports an error, and retry loads it', async () => {
    // Given
    stubParametersFailingOnce();
    await seedV2ModelCatalog();
    const { result } = renderHook(
      () => useFlagshipHouseholdPolicies({ countryId: 'us', policyIds, enabled: true }),
      { wrapper: v3Wrapper() }
    );
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.isLoading).toBe(false);

    // When
    await act(() => result.current.retry());

    // Then
    await waitFor(() => expect(result.current.policies).toHaveLength(2));
    expect(result.current.error).toBeNull();
  });
});
