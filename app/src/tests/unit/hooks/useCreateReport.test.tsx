import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createReport } from '@/api/report';
import { useCreateReport } from '@/hooks/useCreateReport';
import { useCreateReportAssociation } from '@/hooks/useUserReportAssociations';
import {
  CONSOLE_MESSAGES,
  createMockCreateAssociation,
  createMockQueryClient,
  ERROR_MESSAGES,
  mockReportCreationPayload,
  mockReportMetadata,
  setupConsoleMocks,
  TEST_COUNTRY_ID,
  TEST_LABEL,
  TEST_REPORT_ID_STRING,
  TEST_USER_ID,
} from '@/tests/fixtures/hooks/reportHooksMocks';

// Mock the API
vi.mock('@/api/report', () => ({
  createReport: vi.fn(),
}));

// Mock the association hook
vi.mock('@/hooks/useUserReportAssociations', () => ({
  useCreateReportAssociation: vi.fn(),
}));

// Mock query keys
vi.mock('@/libs/queryKeys', () => ({
  reportKeys: {
    all: ['reports'],
  },
}));

describe('useCreateReport', () => {
  let queryClient: ReturnType<typeof createMockQueryClient>;
  let mockCreateAssociation: ReturnType<typeof createMockCreateAssociation>;
  let consoleMocks: ReturnType<typeof setupConsoleMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    consoleMocks = setupConsoleMocks();

    // Set up mock for createAssociation
    mockCreateAssociation = createMockCreateAssociation();
    (useCreateReportAssociation as any).mockReturnValue(mockCreateAssociation);

    // Set default mock for createReport
    (createReport as any).mockResolvedValue(mockReportMetadata);
  });

  afterEach(() => {
    consoleMocks.restore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('successful report creation', () => {
    test('given valid data when creating report then creates report and association', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        expect(createReport).toHaveBeenCalledWith(TEST_COUNTRY_ID, mockReportCreationPayload);
        expect(mockCreateAssociation.mutateAsync).toHaveBeenCalledWith({
          userId: TEST_USER_ID,
          reportId: TEST_REPORT_ID_STRING,
          label: TEST_LABEL,
          isCreated: true,
        });
      });

      expect(consoleMocks.logSpy).toHaveBeenCalledWith(CONSOLE_MESSAGES.LABEL_LOG, TEST_LABEL);
    });

    test('given no label when creating report then creates with undefined label', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        expect(mockCreateAssociation.mutateAsync).toHaveBeenCalledWith({
          userId: TEST_USER_ID,
          reportId: TEST_REPORT_ID_STRING,
          label: undefined,
          isCreated: true,
        });
      });
    });

    test('given successful creation then invalidates report queries', async () => {
      // Given
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reports'] });
      });
    });
  });

  describe('error handling', () => {
    test('given API error when creating report then throws error', async () => {
      // Given
      const error = new Error(ERROR_MESSAGES.CREATE_REPORT_FAILED);
      (createReport as any).mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      // Then
      await expect(
        result.current.createReport({
          countryId: TEST_COUNTRY_ID,
          payload: mockReportCreationPayload,
        })
      ).rejects.toThrow(ERROR_MESSAGES.CREATE_REPORT_FAILED);

      expect(mockCreateAssociation.mutateAsync).not.toHaveBeenCalled();
    });

    test('given association creation fails then logs error but report creation succeeds', async () => {
      // Given
      const associationError = new Error(ERROR_MESSAGES.CREATE_ASSOCIATION_FAILED);
      mockCreateAssociation.mutateAsync.mockRejectedValue(associationError);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      const response = await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        expect(consoleMocks.errorSpy).toHaveBeenCalledWith(
          ERROR_MESSAGES.ASSOCIATION_LOG,
          associationError
        );
      });

      // Report creation should still return the metadata
      expect(response).toEqual(mockReportMetadata);
    });
  });

  describe('mutation state', () => {
    test('given pending mutation then isPending is true', async () => {
      // Given
      let resolveFn: any;
      const pendingPromise = new Promise((resolve) => {
        resolveFn = resolve;
      });
      (createReport as any).mockReturnValue(pendingPromise);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      // Start the mutation but don't await it yet
      const createPromise = result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then - check pending state after starting mutation
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Resolve to clean up
      resolveFn(mockReportMetadata);
      await createPromise;

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    test('given mutation error then error is accessible', async () => {
      // Given
      const error = new Error(ERROR_MESSAGES.API_ERROR);
      (createReport as any).mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      try {
        await result.current.createReport({
          countryId: TEST_COUNTRY_ID,
          payload: mockReportCreationPayload,
        });
      } catch {
        // Expected to throw
      }

      // Then
      await waitFor(() => {
        expect(result.current.error).toEqual(error);
      });
    });
  });
});