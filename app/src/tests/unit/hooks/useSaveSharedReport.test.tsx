import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useSaveSharedReport } from '@/hooks/useSaveSharedReport';
import {
  shadowCreateHouseholdAndAssociation,
  shadowCreateUserHouseholdAssociation,
} from '@/libs/migration/householdShadow';
import { getV2Id } from '@/libs/migration/idMapping';
import { sendMigrationLog } from '@/libs/migration/migrationLogTransport';
import {
  shadowCreatePolicyAndAssociation,
  shadowCreateUserPolicyAssociation,
} from '@/libs/migration/policyShadow';
import {
  createMockMutation,
  createMockReportStore,
  CURRENT_LAW_ID,
  MOCK_EXISTING_USER_REPORT,
  MOCK_HOUSEHOLDS,
  MOCK_POLICIES,
  MOCK_SAVE_SHARE_DATA,
  MOCK_SAVED_USER_HOUSEHOLD,
  MOCK_SAVED_USER_POLICY,
  MOCK_SAVED_USER_REPORT,
  MOCK_SHARE_DATA_WITH_CURRENT_LAW,
  MOCK_SHARE_DATA_WITH_HOUSEHOLD,
  MOCK_SHARE_DATA_WITHOUT_LABEL,
  MOCK_SHARED_V1_HOUSEHOLD_MODEL,
  TEST_ERRORS,
  TEST_IDS,
} from '@/tests/fixtures/hooks/useSaveSharedReportMocks';

// Mock hooks
const mockCreateSimulation = createMockMutation();
const mockCreatePolicy = createMockMutation();
const mockCreateHousehold = createMockMutation();
const mockCreateGeography = createMockMutation();
const mockCreateReport = createMockMutation();
const mockReportStore = createMockReportStore();

vi.mock('@/hooks/useUserSimulationAssociations', () => ({
  useCreateSimulationAssociation: () => mockCreateSimulation,
}));

vi.mock('@/hooks/useUserPolicy', () => ({
  useCreatePolicyAssociation: () => mockCreatePolicy,
}));

vi.mock('@/libs/migration/idMapping', () => ({
  getV2Id: vi.fn(),
}));

vi.mock('@/libs/migration/householdShadow', () => ({
  shadowCreateHouseholdAndAssociation: vi.fn(),
  shadowCreateUserHouseholdAssociation: vi.fn(),
}));

vi.mock('@/libs/migration/policyShadow', () => ({
  shadowCreatePolicyAndAssociation: vi.fn(),
  shadowCreateUserPolicyAssociation: vi.fn(),
}));

vi.mock('@/libs/migration/migrationLogTransport', () => ({
  sendMigrationLog: vi.fn(),
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useCreateHouseholdAssociation: () => mockCreateHousehold,
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useCreateGeographicAssociation: () => mockCreateGeography,
}));

vi.mock('@/hooks/useUserReportAssociations', () => ({
  useCreateReportAssociation: () => mockCreateReport,
  useUserReportStore: () => mockReportStore,
}));

describe('useSaveSharedReport', () => {
  let queryClient: QueryClient;

  const createMockStore = (currentLawId: string = CURRENT_LAW_ID) => {
    const metadataReducer = () => ({
      currentCountry: 'us',
      currentLawId,
      economyOptions: { region: [], time_period: [], datasets: [] },
    });

    return configureStore({
      reducer: { metadata: metadataReducer },
    });
  };

  const createWrapper = (store: ReturnType<typeof createMockStore>) => {
    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_VERCEL_ENV', 'preview');
    vi.spyOn(console, 'info').mockImplementation(() => {});
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Reset mock implementations
    mockCreateSimulation.mutateAsync.mockResolvedValue({});
    mockCreatePolicy.mutateAsync.mockResolvedValue(MOCK_SAVED_USER_POLICY);
    mockCreateHousehold.mutateAsync.mockResolvedValue(MOCK_SAVED_USER_HOUSEHOLD);
    mockCreateGeography.mutateAsync.mockResolvedValue({});
    mockCreateReport.mutateAsync.mockResolvedValue(MOCK_SAVED_USER_REPORT);
    mockReportStore.findByUserReportId.mockResolvedValue(null);
    vi.mocked(getV2Id).mockReturnValue(null);
  });

  test('given valid shareData then saves all associations and returns userReport', async () => {
    // Given
    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    let savedReport;
    await act(async () => {
      savedReport = await result.current.saveSharedReport(MOCK_SAVE_SHARE_DATA);
    });

    // Then
    expect(savedReport).toEqual(MOCK_SAVED_USER_REPORT);
    expect(mockCreateSimulation.mutateAsync).toHaveBeenCalledWith({
      userId: 'anonymous',
      simulationId: TEST_IDS.SIMULATION,
      countryId: 'us',
      label: 'Baseline',
    });
    expect(mockCreatePolicy.mutateAsync).toHaveBeenCalledWith({
      userId: 'anonymous',
      policyId: TEST_IDS.POLICY,
      countryId: 'us',
      label: 'My Policy',
    });
    expect(mockCreateGeography.mutateAsync).toHaveBeenCalledWith({
      userId: 'anonymous',
      geographyId: 'us',
      countryId: 'us',
      scope: 'national',
      label: 'United States',
    });
    expect(mockCreateReport.mutateAsync).toHaveBeenCalled();
  });

  test('given saved shared policy without v2 mapping then shadow creates v2 policy and association', async () => {
    // Given
    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SAVE_SHARE_DATA, MOCK_POLICIES);
    });

    // Then
    expect(shadowCreatePolicyAndAssociation).toHaveBeenCalledWith({
      countryId: 'us',
      label: 'My Policy',
      v1PolicyId: TEST_IDS.POLICY,
      v1PolicyPayload: {
        data: {
          'gov.irs.credits.ctc.amount': {
            '2026-01-01.2100-12-31': 2000,
          },
        },
      },
      v1Association: MOCK_SAVED_USER_POLICY,
    });
    expect(shadowCreateUserPolicyAssociation).not.toHaveBeenCalled();
  });

  test('given saved shared policy without details then emits skipped remote log', async () => {
    const store = createMockStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SAVE_SHARE_DATA);
    });

    expect(sendMigrationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'event',
        prefix: 'PolicyMigration',
        operation: 'CREATE',
        status: 'SKIPPED',
      })
    );
  });

  test('given saved shared policy with existing v2 mapping then shadows only the association', async () => {
    // Given
    vi.mocked(getV2Id).mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SAVE_SHARE_DATA, MOCK_POLICIES);
    });

    // Then
    expect(shadowCreateUserPolicyAssociation).toHaveBeenCalledWith(
      MOCK_SAVED_USER_POLICY,
      '550e8400-e29b-41d4-a716-446655440000'
    );
    expect(shadowCreatePolicyAndAssociation).not.toHaveBeenCalled();
  });

  test('given existing report then returns already_saved without creating duplicates', async () => {
    // Given
    mockReportStore.findByUserReportId.mockResolvedValue(MOCK_EXISTING_USER_REPORT);
    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    let savedReport;
    await act(async () => {
      savedReport = await result.current.saveSharedReport(MOCK_SAVE_SHARE_DATA);
    });

    // Then
    expect(savedReport).toEqual(MOCK_EXISTING_USER_REPORT);
    expect(mockCreateSimulation.mutateAsync).not.toHaveBeenCalled();
    expect(mockCreateReport.mutateAsync).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(result.current.saveResult).toBe('already_saved');
    });
  });

  test('given shareData with current law policy then skips current law', async () => {
    // Given
    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SHARE_DATA_WITH_CURRENT_LAW);
    });

    // Then - should only create one policy (skip current law)
    expect(mockCreatePolicy.mutateAsync).toHaveBeenCalledTimes(1);
    expect(mockCreatePolicy.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ policyId: TEST_IDS.POLICY })
    );
    expect(mockCreatePolicy.mutateAsync).not.toHaveBeenCalledWith(
      expect.objectContaining({ policyId: TEST_IDS.CURRENT_LAW_POLICY })
    );
  });

  test('given shareData with household then saves household associations', async () => {
    // Given
    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SHARE_DATA_WITH_HOUSEHOLD);
    });

    // Then
    expect(mockCreateHousehold.mutateAsync).toHaveBeenCalledWith({
      userId: 'anonymous',
      householdId: TEST_IDS.HOUSEHOLD,
      countryId: 'uk',
      label: 'My Household',
    });
    expect(mockCreateGeography.mutateAsync).not.toHaveBeenCalled();
  });

  test('given saved shared household without v2 mapping then shadow creates v2 household and association', async () => {
    const store = createMockStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SHARE_DATA_WITH_HOUSEHOLD, [], MOCK_HOUSEHOLDS);
    });

    expect(shadowCreateHouseholdAndAssociation).toHaveBeenCalledTimes(1);
    const [callArgs] = vi.mocked(shadowCreateHouseholdAndAssociation).mock.calls[0];
    expect(callArgs.v1HouseholdId).toBe(TEST_IDS.HOUSEHOLD);
    expect(callArgs.v1Association).toEqual(MOCK_SAVED_USER_HOUSEHOLD);
    expect(callArgs.v1Household.householdData).toEqual(MOCK_HOUSEHOLDS[0].householdData);
    expect(shadowCreateUserHouseholdAssociation).not.toHaveBeenCalled();
  });

  test('given fetched v1 household model without v2 mapping then shadow creates from the runtime model shape', async () => {
    const store = createMockStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(
        MOCK_SHARE_DATA_WITH_HOUSEHOLD,
        [],
        [MOCK_SHARED_V1_HOUSEHOLD_MODEL]
      );
    });

    expect(shadowCreateHouseholdAndAssociation).toHaveBeenCalledTimes(1);
    const [callArgs] = vi.mocked(shadowCreateHouseholdAndAssociation).mock.calls[0];
    expect(callArgs.v1HouseholdId).toBe(TEST_IDS.HOUSEHOLD);
    expect(callArgs.v1Association).toEqual(MOCK_SAVED_USER_HOUSEHOLD);
    expect(callArgs.v1Household.id).toBe(TEST_IDS.HOUSEHOLD);
    expect(callArgs.v1Household.countryId).toBe('uk');
    expect(callArgs.v1Household.label).toBe('My Household');
    expect(callArgs.v1Household.householdData).toEqual(
      MOCK_SHARED_V1_HOUSEHOLD_MODEL.householdData
    );
  });

  test('given saved shared household without details then emits skipped remote log', async () => {
    const store = createMockStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SHARE_DATA_WITH_HOUSEHOLD);
    });

    expect(sendMigrationLog).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'event',
        prefix: 'HouseholdMigration',
        operation: 'CREATE',
        status: 'SKIPPED',
      })
    );
  });

  test('given saved shared household with existing v2 mapping then shadows only the association', async () => {
    vi.mocked(getV2Id).mockImplementation(((entityType: string) =>
      entityType === 'Household' ? '550e8400-e29b-41d4-a716-446655440123' : null) as any);

    const store = createMockStore();
    const wrapper = createWrapper(store);

    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SHARE_DATA_WITH_HOUSEHOLD, [], MOCK_HOUSEHOLDS);
    });

    expect(shadowCreateUserHouseholdAssociation).toHaveBeenCalledWith(
      MOCK_SAVED_USER_HOUSEHOLD,
      '550e8400-e29b-41d4-a716-446655440123'
    );
    expect(shadowCreateHouseholdAndAssociation).not.toHaveBeenCalled();
  });

  test('given shareData without label then generates default label', async () => {
    // Given
    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SHARE_DATA_WITHOUT_LABEL);
    });

    // Then
    expect(mockCreateReport.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        label: expect.stringContaining('Saved Report'),
      })
    );
  });

  test('given ingredient save failure then returns partial result', async () => {
    // Given
    mockCreateSimulation.mutateAsync.mockRejectedValue(TEST_ERRORS.SAVE_FAILED);
    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SAVE_SHARE_DATA);
    });

    // Then - report should still be saved, but result is partial
    expect(mockCreateReport.mutateAsync).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.saveResult).toBe('partial');
    });
  });

  test('given success then sets saveResult to success', async () => {
    // Given
    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    await act(async () => {
      await result.current.saveSharedReport(MOCK_SAVE_SHARE_DATA);
    });

    // Then
    await waitFor(() => {
      expect(result.current.saveResult).toBe('success');
    });
  });

  test('given race condition then handles second concurrent save', async () => {
    // Given - first findByUserReportId returns null, createReportAssociation fails,
    // but then findByUserReportId finds existing report
    mockReportStore.findByUserReportId
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(MOCK_EXISTING_USER_REPORT);
    mockCreateReport.mutateAsync.mockRejectedValue(new Error('Duplicate key'));

    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    let savedReport;
    await act(async () => {
      savedReport = await result.current.saveSharedReport(MOCK_SAVE_SHARE_DATA);
    });

    // Then - should return the existing report
    expect(savedReport).toEqual(MOCK_EXISTING_USER_REPORT);
    await waitFor(() => {
      expect(result.current.saveResult).toBe('already_saved');
    });
  });

  test('given setSaveResult then allows manual result override', async () => {
    // Given
    const store = createMockStore();
    const wrapper = createWrapper(store);

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    act(() => {
      result.current.setSaveResult('success');
    });

    // Then
    expect(result.current.saveResult).toBe('success');
  });
});
