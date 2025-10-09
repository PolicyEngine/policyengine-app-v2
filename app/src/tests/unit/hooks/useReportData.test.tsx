import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useReportData } from '@/hooks/useReportData';
import { useReportOutput } from '@/hooks/useReportOutput';
import { useUserReportById } from '@/hooks/useUserReports';
import {
  BASE_REPORT_ID,
  mockEconomyMetadata,
  mockEconomyOutput,
  mockHouseholdData,
  mockHouseholdMetadata,
  mockHouseholdMetadataUK,
  mockNormalizedReport,
  mockReportOutputError,
  mockReportOutputHousehold,
  mockReportOutputPending,
  mockReportOutputSuccess,
  mockUserReport,
  USER_REPORT_ID,
} from '@/tests/fixtures/hooks/useReportDataMocks';

// Mock the dependent hooks
vi.mock('@/hooks/useReportOutput', () => ({
  useReportOutput: vi.fn(),
}));

vi.mock('@/hooks/useUserReports', () => ({
  useUserReportById: vi.fn(),
}));

describe('useReportData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Default successful mocks
    // useUserReportById now returns userReport as part of its structure
    (useUserReportById as any).mockReturnValue({
      ...mockNormalizedReport,
      userReport: mockUserReport,
      isLoading: false,
      error: null,
    });
    (useReportOutput as any).mockReturnValue(mockReportOutputSuccess);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  test('given valid user report ID when fetching then returns complete data', async () => {
    // Given
    queryClient.setQueryData(['calculation-meta', BASE_REPORT_ID], mockEconomyMetadata);

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.status).toBe('complete');
      expect(result.current.output).toEqual(mockEconomyOutput);
      expect(result.current.outputType).toBe('economy');
      expect(result.current.error).toBeNull();
      // normalizedReport now contains the full structure returned by useUserReportById
      expect(result.current.normalizedReport.report).toEqual(mockNormalizedReport.report);
      expect(result.current.normalizedReport.userReport).toEqual(mockUserReport);
      expect(result.current.userReport).toEqual(mockUserReport);
    });
  });

  test('given user report loading when fetching then returns loading state', async () => {
    // Given - useUserReportById now returns loading state directly
    (useUserReportById as any).mockReturnValue({
      userReport: null,
      report: null,
      simulations: [],
      policies: [],
      households: [],
      userSimulations: [],
      userPolicies: [],
      userHouseholds: [],
      isLoading: true,
      error: null,
    });

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    expect(result.current.status).toBe('pending');
    expect(result.current.output).toBeNull();
    expect(result.current.message).toBe('Loading report...');
    expect(result.current.normalizedReport.report).toBeUndefined();
  });

  test('given user report not found when fetching then returns error state', async () => {
    // Given
    const notFoundError = new Error('UserReport not found');
    (useUserReportById as any).mockReturnValue({
      userReport: null,
      report: null,
      simulations: [],
      policies: [],
      households: [],
      userSimulations: [],
      userPolicies: [],
      userHouseholds: [],
      isLoading: false,
      error: notFoundError,
    });

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    expect(result.current.status).toBe('error');
    expect(result.current.output).toBeNull();
    expect(result.current.error).toEqual(notFoundError);
    expect(result.current.normalizedReport.report).toBeUndefined();
  });

  test('given user report without base report when fetching then returns error state', async () => {
    // Given - UserReport exists but base report wasn't fetched
    (useUserReportById as any).mockReturnValue({
      userReport: mockUserReport,
      report: null,  // No base report
      simulations: [],
      policies: [],
      households: [],
      userSimulations: [],
      userPolicies: [],
      userHouseholds: [],
      isLoading: false,
      error: null,
    });

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    expect(result.current.status).toBe('error');
    expect(result.current.output).toBeNull();
    expect(result.current.error?.message).toBe('Report not found');
  });

  test('given pending report output when fetching then returns pending with progress', async () => {
    // Given
    (useReportOutput as any).mockReturnValue(mockReportOutputPending);

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.status).toBe('pending');
      expect(result.current.progress).toBe(75);
      expect(result.current.message).toBe('Calculating...');
      expect(result.current.queuePosition).toBe(2);
      expect(result.current.estimatedTimeRemaining).toBe(120);
    });
  });

  test('given error in report output when fetching then returns error state', async () => {
    // Given
    (useReportOutput as any).mockReturnValue(mockReportOutputError);

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.status).toBe('error');
      expect(result.current.error).toEqual(mockReportOutputError.error);
      expect(result.current.output).toBeNull();
    });
  });

  test('given household output type when fetching then wraps data in Household structure', async () => {
    // Given
    (useReportOutput as any).mockReturnValue(mockReportOutputHousehold);
    queryClient.setQueryData(['calculation-meta', BASE_REPORT_ID], mockHouseholdMetadata);

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.status).toBe('complete');
      expect(result.current.outputType).toBe('household');
      expect(result.current.output).toEqual({
        id: BASE_REPORT_ID,
        countryId: 'us',
        householdData: mockHouseholdData,
      });
    });
  });

  test('given household output type with UK country when fetching then uses correct countryId', async () => {
    // Given
    (useReportOutput as any).mockReturnValue(mockReportOutputHousehold);
    queryClient.setQueryData(['calculation-meta', BASE_REPORT_ID], mockHouseholdMetadataUK);

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.output).toEqual({
        id: BASE_REPORT_ID,
        countryId: 'uk',
        householdData: mockHouseholdData,
      });
    });
  });

  test('given economy output when fetching then does not wrap data', async () => {
    // Given
    queryClient.setQueryData(['calculation-meta', BASE_REPORT_ID], mockEconomyMetadata);

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.status).toBe('complete');
      expect(result.current.outputType).toBe('economy');
      expect(result.current.output).toEqual(mockEconomyOutput);
    });
  });

  test('given complete report without progress when fetching then progress fields are undefined', async () => {
    // Given
    queryClient.setQueryData(['calculation-meta', BASE_REPORT_ID], mockEconomyMetadata);

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.status).toBe('complete');
      expect(result.current.progress).toBeUndefined();
      expect(result.current.queuePosition).toBeUndefined();
      expect(result.current.estimatedTimeRemaining).toBeUndefined();
      // Message should also be undefined for complete status
      expect(result.current.message).toBeUndefined();
    });
  });

  test('given valid user report ID then calls hooks with correct parameters', async () => {
    // Given
    queryClient.setQueryData(['calculation-meta', BASE_REPORT_ID], mockEconomyMetadata);

    // When
    renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    await waitFor(() => {
      // useUserReportById now takes only userReportId
      expect(useUserReportById).toHaveBeenCalledWith(USER_REPORT_ID);
      // useReportOutput now takes enabled parameter
      expect(useReportOutput).toHaveBeenCalledWith({ reportId: BASE_REPORT_ID, enabled: true });
    });
  });

  test('given no metadata cached when fetching then outputType is undefined', async () => {
    // Given - no metadata set in queryClient

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.status).toBe('complete');
      expect(result.current.outputType).toBeUndefined();
      expect(result.current.output).toEqual(mockEconomyOutput);
    });
  });

  test('given household output without metadata when wrapping then defaults to us', async () => {
    // Given
    (useReportOutput as any).mockReturnValue(mockReportOutputHousehold);
    queryClient.setQueryData(['calculation-meta', BASE_REPORT_ID], {
      type: 'household',
      // No countryId specified
    });

    // When
    const { result } = renderHook(() => useReportData(USER_REPORT_ID), { wrapper });

    // Then
    await waitFor(() => {
      expect(result.current.output).toEqual({
        id: BASE_REPORT_ID,
        countryId: 'us', // Should default to 'us'
        householdData: mockHouseholdData,
      });
    });
  });
});
