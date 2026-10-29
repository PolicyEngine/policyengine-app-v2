import type { ReactNode } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useRequestedHouseholdRun } from '@/hooks/useFlagshipHousehold';
import metadataReducer from '@/reducers/metadataReducer';
import { testQueryClient } from '@/tests/fixtures/hooks/v3MetadataWrapper';
import {
  BASELINE_POLICY_ID,
  REFORM_POLICY_ID,
} from '@/tests/fixtures/libs/flagship/householdRunMocks';
import {
  US_SINGLE_PARENT,
  V2_CODEC_YEAR,
} from '@/tests/fixtures/models/household/v2DocumentCodecMocks';

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

function wrapper({ children }: { children: ReactNode }) {
  const store = configureStore({ reducer: { metadata: metadataReducer } });
  return (
    <Provider store={store}>
      <QueryClientProvider client={testQueryClient()}>{children}</QueryClientProvider>
    </Provider>
  );
}

describe('useRequestedHouseholdRun before v3 moves to the v2 routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunV1Household.mockResolvedValue({ householdId: '54321' });
  });

  test('given a requested household then it runs on the v1 household routes, as today', async () => {
    // Given
    const { result } = renderHook(
      () =>
        useRequestedHouseholdRun({
          year: V2_CODEC_YEAR,
          baselinePolicyId: BASELINE_POLICY_ID,
          reformPolicyId: REFORM_POLICY_ID,
        }),
      { wrapper }
    );

    // When
    act(() => result.current.request(US_SINGLE_PARENT));

    // Then
    await waitFor(() => expect(result.current.result).toEqual({ householdId: '54321' }));
    expect(mockRunV1Household).toHaveBeenCalledWith({
      year: V2_CODEC_YEAR,
      payload: US_SINGLE_PARENT.toV1CreationPayload(),
      baselinePolicyId: BASELINE_POLICY_ID,
      reformPolicyId: REFORM_POLICY_ID,
    });
    expect(mockRunV2Household).not.toHaveBeenCalled();
  });
});
