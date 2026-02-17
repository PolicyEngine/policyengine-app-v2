import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useSaveSharedReport } from '@/hooks/useSaveSharedReport';
import {
  createMockMutation,
  createMockReportStore,
  CURRENT_LAW_ID,
  MOCK_EXISTING_USER_REPORT,
  MOCK_SAVE_SHARE_DATA,
  MOCK_SAVED_USER_REPORT,
  MOCK_SHARE_DATA_WITH_CURRENT_LAW,
  MOCK_SHARE_DATA_WITH_HOUSEHOLD,
  MOCK_SHARE_DATA_WITHOUT_LABEL,
  TEST_COUNTRY_US,
  TEST_ERRORS,
  TEST_IDS,
} from '@/tests/fixtures/hooks/useSaveSharedReportMocks';

// Mock hooks
const mockCreateSimulation = createMockMutation();
const mockCreatePolicy = createMockMutation();
const mockCreateHousehold = createMockMutation();
const mockCreateReport = createMockMutation();
const mockReportStore = createMockReportStore();

vi.mock('@/hooks/useUserSimulationAssociations', () => ({
  useCreateSimulationAssociation: () => mockCreateSimulation,
}));

vi.mock('@/hooks/useUserPolicy', () => ({
  useCreatePolicyAssociation: () => mockCreatePolicy,
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useCreateHouseholdAssociation: () => mockCreateHousehold,
}));

vi.mock('@/hooks/useUserReportAssociations', () => ({
  useCreateReportAssociation: () => mockCreateReport,
  useUserReportStore: () => mockReportStore,
}));

// Mock static metadata hooks instead of Redux
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => TEST_COUNTRY_US),
}));

vi.mock('@/hooks/useStaticMetadata', () => ({
  useCurrentLawId: vi.fn(() => CURRENT_LAW_ID),
}));

describe('useSaveSharedReport', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // Reset mock implementations
    mockCreateSimulation.mutateAsync.mockResolvedValue({});
    mockCreatePolicy.mutateAsync.mockResolvedValue({});
    mockCreateHousehold.mutateAsync.mockResolvedValue({});
    mockCreateReport.mutateAsync.mockResolvedValue(MOCK_SAVED_USER_REPORT);
    mockReportStore.findByUserReportId.mockResolvedValue(null);
  });

  test('given valid shareData then saves all associations and returns userReport', async () => {
    // Given
    const wrapper = createWrapper();

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
    // Note: Geographies are no longer saved as user associations (constructed from simulation data)
    expect(mockCreateReport.mutateAsync).toHaveBeenCalled();
  });

  test('given existing report then returns already_saved without creating duplicates', async () => {
    // Given
    mockReportStore.findByUserReportId.mockResolvedValue(MOCK_EXISTING_USER_REPORT);
    const wrapper = createWrapper();

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
    const wrapper = createWrapper();

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
    const wrapper = createWrapper();

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
    // Note: Geographies are no longer saved as user associations
  });

  test('given shareData without label then generates default label', async () => {
    // Given
    const wrapper = createWrapper();

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
    const wrapper = createWrapper();

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
    const wrapper = createWrapper();

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

    const wrapper = createWrapper();

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
    const wrapper = createWrapper();

    // When
    const { result } = renderHook(() => useSaveSharedReport(), { wrapper });

    act(() => {
      result.current.setSaveResult('success');
    });

    // Then
    expect(result.current.saveResult).toBe('success');
  });
});
