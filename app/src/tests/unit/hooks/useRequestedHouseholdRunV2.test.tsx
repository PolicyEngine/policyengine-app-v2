import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useRequestedHouseholdRun } from '@/hooks/useFlagshipHousehold';
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
  US_SINGLE_PARENT,
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

/** The run the v2 routes answer with, as the hook passes it on. */
const V2_RUN = {
  householdId: 'stored-household',
  baseline: BASELINE_RESULT,
  reform: REFORM_RESULT,
  netIncome: { baseline: 1, reform: 2, change: 1 },
  components: [],
  programs: [],
  provenance: { baseline: { policyengineBundle: null }, reform: { policyengineBundle: null } },
};

function wrapper({ children }: { children: ReactNode }) {
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
      <QueryClientProvider client={testQueryClient()}>{children}</QueryClientProvider>
    </Provider>
  );
}

describe('useRequestedHouseholdRun with v3 on the v2 routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunV2Household.mockResolvedValue(V2_RUN);
  });

  test('given a requested household then it runs on the v2 routes, current law as no policy and the reform by its v2 policy', async () => {
    // Given
    const { result } = renderHook(
      () =>
        useRequestedHouseholdRun({
          year: V2_CODEC_YEAR,
          baselinePolicyId: String(TEST_CURRENT_LAW_ID),
          reformPolicyId: V2_REFORM_POLICY_ID,
        }),
      { wrapper }
    );

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
    const { result } = renderHook(
      () =>
        useRequestedHouseholdRun({
          year: V2_CODEC_YEAR,
          baselinePolicyId: String(TEST_CURRENT_LAW_ID),
          reformPolicyId: REFORM_POLICY_ID,
        }),
      { wrapper }
    );

    // When
    act(() => result.current.request(US_SINGLE_PARENT));

    // Then
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.run.error?.message).toBe(
      `Policy ${REFORM_POLICY_ID} is a v1 policy, which the v2 household calculations cannot use.`
    );
    expect(mockRunV2Household).not.toHaveBeenCalled();
  });
});
