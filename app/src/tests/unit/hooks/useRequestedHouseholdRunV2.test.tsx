import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useRequestedHouseholdRun } from '@/hooks/useFlagshipHousehold';
import type { V2HouseholdRunOptions } from '@/libs/flagship/v2HouseholdRun';
import { v2StoredHouseholdKeys } from '@/libs/queryKeys';
import metadataReducer from '@/reducers/metadataReducer';
import { TEST_CURRENT_LAW_ID } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import { V2_REFORM_POLICY_ID } from '@/tests/fixtures/api/v2HouseholdCalculationMocks';
import { testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import {
  BASELINE_RESULT,
  REFORM_POLICY_ID,
  REFORM_RESULT,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';
import {
  STORED_V2_HOUSEHOLD_ID,
  storedV2Household,
  US_SINGLE_PARENT,
  US_SINGLE_PARENT_V2_BODY,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const mockRunV2Household = vi.fn();
const mockRunV1Household = vi.fn();
vi.mock('@/libs/flagship/v2HouseholdRun', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v2HouseholdRun')>()),
  runV2FlagshipHousehold: (...args: unknown[]) => mockRunV2Household(...args),
}));
vi.mock('@/libs/flagship/householdRun', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/householdRun')>()),
  runFlagshipHouseholdPayload: (...args: unknown[]) => mockRunV1Household(...args),
}));

const STORED_SINGLE_PARENT = storedV2Household('us', US_SINGLE_PARENT_V2_BODY.household_data);

/** The run the v2 routes answer with, as the hook passes it on. */
const V2_RUN = {
  householdId: STORED_V2_HOUSEHOLD_ID,
  baseline: BASELINE_RESULT,
  reform: REFORM_RESULT,
  netIncome: { baseline: 1, reform: 2, change: 1 },
  components: [],
  programs: [],
  provenance: { baseline: { policyengineBundle: null }, reform: { policyengineBundle: null } },
};

/** The v2 run stores the household, says so, then answers. */
async function storeThenAnswer(_args: unknown, options: V2HouseholdRunOptions) {
  options.onStored?.(STORED_SINGLE_PARENT);
  return V2_RUN;
}

function wrapperWith(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const store = configureStore({
      reducer: { metadata: metadataReducer },
      preloadedState: {
        metadata: {
          ...metadataReducer(undefined, { type: 'test/init' }),
          currentLawId: TEST_CURRENT_LAW_ID,
        },
      },
    });
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    );
  };
}

/** The hook for current law against a reform, on a fresh query client. */
function renderRunHook(
  reformPolicyId: string,
  onCreated?: Parameters<typeof useRequestedHouseholdRun>[0]['onCreated']
) {
  const queryClient = testQueryClient();
  const rendered = renderHook(
    () =>
      useRequestedHouseholdRun({
        year: V2_CODEC_YEAR,
        baselinePolicyId: String(TEST_CURRENT_LAW_ID),
        reformPolicyId,
        onCreated,
      }),
    { wrapper: wrapperWith(queryClient) }
  );
  return { ...rendered, queryClient };
}

describe('useRequestedHouseholdRun with v3 on the v2 routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunV2Household.mockImplementation(storeThenAnswer);
  });

  test('given a requested household then it runs on the v2 routes, current law as no policy and the reform by its v2 policy', async () => {
    // Given
    const { result } = renderRunHook(V2_REFORM_POLICY_ID);

    // When
    act(() => result.current.request(US_SINGLE_PARENT));

    // Then
    await waitFor(() => expect(result.current.result).toEqual(V2_RUN));
    expect(mockRunV2Household).toHaveBeenCalledWith(
      {
        year: V2_CODEC_YEAR,
        household: US_SINGLE_PARENT,
        baselinePolicyId: null,
        reformPolicyId: V2_REFORM_POLICY_ID,
      },
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(mockRunV1Household).not.toHaveBeenCalled();
  });

  test('given a reform known only by its v1 policy number then the run fails, saying why', async () => {
    // Given
    const { result } = renderRunHook(REFORM_POLICY_ID);

    // When
    act(() => result.current.request(US_SINGLE_PARENT));

    // Then
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.run.error?.message).toBe(
      `Policy ${REFORM_POLICY_ID} is a v1 policy, which the v2 household calculations cannot use.`
    );
    expect(mockRunV2Household).not.toHaveBeenCalled();
  });

  test('given the household stored then the caller hears its stored ID and the household sent', async () => {
    // Given
    const onCreated = vi.fn();
    const { result } = renderRunHook(V2_REFORM_POLICY_ID, onCreated);

    // When
    act(() => result.current.request(US_SINGLE_PARENT));

    // Then
    await waitFor(() => expect(result.current.result).toEqual(V2_RUN));
    expect(onCreated).toHaveBeenCalledWith(
      STORED_V2_HOUSEHOLD_ID,
      US_SINGLE_PARENT.toV1CreationPayload()
    );
  });

  test('given the household stored then it is in the query cache under its stored-household key', async () => {
    // Given
    const { result, queryClient } = renderRunHook(V2_REFORM_POLICY_ID);

    // When
    act(() => result.current.request(US_SINGLE_PARENT));

    // Then
    await waitFor(() => expect(result.current.result).toEqual(V2_RUN));
    expect(
      queryClient.getQueryData(v2StoredHouseholdKeys.byId('us', STORED_V2_HOUSEHOLD_ID))
    ).toEqual(STORED_SINGLE_PARENT);
  });
});
