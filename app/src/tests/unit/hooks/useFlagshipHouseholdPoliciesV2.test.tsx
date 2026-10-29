import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { FOREVER } from '@/constants';
import { useFlagshipHouseholdPolicies } from '@/hooks/useFlagshipHousehold';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { catalogParametersResult } from '@/tests/fixtures/api/publicApi/catalogParametersMocks';
import { TEST_TAX_BENEFIT_MODEL_ID } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import {
  jsonResponse,
  requestsTo,
  stubPublicApiFetch,
} from '@/tests/fixtures/api/publicApi/publicApiFetchStub';
import { STANDARD_DEDUCTION_SINGLE } from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { CURRENT_LAW_POLICY_METADATA } from '@/tests/fixtures/api/publicApi/v2ReportPolicyMocks';
import { V2_REFORM_POLICY_ID } from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import { seedV2ModelCatalog, v3Wrapper } from '@/tests/fixtures/hooks/v3MetadataWrapper';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));
// Current law, read as stored by its number, as the report page reads it.
vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  fetchPolicyById: async () => CURRENT_LAW_POLICY_METADATA,
}));

const PARAMETERS_PATH = '/v2/model-catalog/parameters';
const REFORM_POLICY_PATH = `/v2/policies/${V2_REFORM_POLICY_ID}`;

/** A household report's reform as `/v2/policies` stores it: a larger single standard deduction. */
const V2_REFORM_POLICY_ITEM = {
  id: V2_REFORM_POLICY_ID,
  country_id: 'us',
  tax_benefit_model_id: TEST_TAX_BENEFIT_MODEL_ID,
  created_at: '2026-10-29T09:00:00Z',
  updated_at: '2026-10-29T09:00:00Z',
  parameter_values: [
    {
      id: 'c1d2e3f4-0000-4000-8000-000000000001',
      parameter_id: 'c1d2e3f4-0000-4000-8000-000000000002',
      parameter_name: STANDARD_DEDUCTION_SINGLE,
      value: 20000,
      start_date: '2026-01-01T00:00:00Z',
      end_date: null,
    },
  ],
};

const okItem = (item: unknown) => jsonResponse({ status: 'ok', message: null, result: { item } });
const answerParameters = (url: URL) =>
  jsonResponse({
    status: 'ok',
    message: null,
    result: catalogParametersResult(url.searchParams.getAll('name')),
  });

const POLICY_IDS = [CURRENT_LAW_POLICY_METADATA.id, V2_REFORM_POLICY_ID];

describe('useFlagshipHouseholdPolicies with v3 on the v2 routes, for v2 policies', () => {
  afterEach(() => {
    store.dispatch(clearMetadata());
    vi.unstubAllGlobals();
  });

  test('given current law and a v2 reform policy then the reform is read from /v2/policies and both are listed', async () => {
    // Given
    const fetchStub = stubPublicApiFetch({
      [PARAMETERS_PATH]: answerParameters,
      [REFORM_POLICY_PATH]: () => okItem(V2_REFORM_POLICY_ITEM),
    });
    await seedV2ModelCatalog();

    // When
    const { result } = renderHook(
      () => useFlagshipHouseholdPolicies({ countryId: 'us', policyIds: POLICY_IDS, enabled: true }),
      { wrapper: v3Wrapper() }
    );

    // Then
    await waitFor(() => expect(result.current.policies).toHaveLength(2));
    expect(result.current.error).toBeNull();
    expect(result.current.policies.find((policy) => policy.id === V2_REFORM_POLICY_ID)).toEqual({
      id: V2_REFORM_POLICY_ID,
      countryId: 'us',
      label: null,
      isCreated: true,
      parameters: [
        {
          name: STANDARD_DEDUCTION_SINGLE,
          values: [{ startDate: '2026-01-01', endDate: FOREVER, value: 20000 }],
        },
      ],
    });
    expect(requestsTo(fetchStub, REFORM_POLICY_PATH)).toHaveLength(1);
  });

  test('given a v2 policy that cannot be read then it reports an error, and retry reads it again', async () => {
    // Given
    let attempts = 0;
    stubPublicApiFetch({
      [PARAMETERS_PATH]: answerParameters,
      [REFORM_POLICY_PATH]: () => {
        attempts += 1;
        return attempts === 1
          ? jsonResponse({ status: 'error', message: 'Unavailable' }, 503)
          : okItem(V2_REFORM_POLICY_ITEM);
      },
    });
    await seedV2ModelCatalog();
    const { result } = renderHook(
      () => useFlagshipHouseholdPolicies({ countryId: 'us', policyIds: POLICY_IDS, enabled: true }),
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
