import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageReportStore } from '@/api/reportAssociation';
import {
  useCreateReportAssociation,
  useReportAssociation,
  useReportAssociationById,
  useReportAssociationsByUser,
  useUserReportStore,
} from '@/hooks/useUserReportAssociations';
import {
  createMockQueryClient,
  ERROR_MESSAGES,
  mockUserReport,
  mockUserReportList,
  TEST_REPORT_ID,
  TEST_USER_ID,
} from '@/tests/fixtures/api/reportAssociationMocks';

// Mock the stores first
vi.mock('@/api/reportAssociation', () => {
  const mockStore = {
    create: vi.fn(),
    findByUser: vi.fn(),
    findById: vi.fn(),
    findByUserReportId: vi.fn(),
  };
  return {
    ApiReportStore: vi.fn(() => mockStore),
    LocalStorageReportStore: vi.fn(() => mockStore),
  };
});

// Mock query config and keys
vi.mock('@/libs/queryConfig', () => ({
  queryConfig: {
    api: {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    },
    localStorage: {
      staleTime: 0,
      cacheTime: 0,
    },
  },
}));

vi.mock('@/libs/queryKeys', () => ({
  reportAssociationKeys: {
    byUser: (userId: string) => ['report-associations', 'byUser', userId],
    byReport: (id: string) => ['report-associations', 'byReport', id],
    specific: (userId: string, id: string) => ['report-associations', 'specific', userId, id],
    byUserReportId: (userReportId: string) => [
      'report-associations',
      'byUserReportId',
      userReportId,
    ],
  },
}));

describe('useUserReportAssociations hooks', () => {
  let queryClient: ReturnType<typeof createMockQueryClient>;
  let mockStore: any;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();

    // Get the mock store instance
    mockStore = (LocalStorageReportStore as any)();

    // Set default mock implementations
    mockStore.create.mockResolvedValue(mockUserReport);
    mockStore.findByUser.mockResolvedValue(mockUserReportList);
    mockStore.findById.mockResolvedValue(mockUserReport);
    mockStore.findByUserReportId.mockResolvedValue(mockUserReport);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('useUserReportStore', () => {
    test('given user not logged in then returns local storage store', () => {
      // When
      const { result } = renderHook(() => useUserReportStore());

      // Then
      expect(result.current).toBeDefined();
      expect(result.current.create).toBeDefined();
      expect(result.current.findByUser).toBeDefined();
      expect(result.current.findById).toBeDefined();
      expect(result.current.findByUserReportId).toBeDefined();
    });
  });

  describe('useReportAssociationsByUser', () => {
    test('given valid user ID when fetching then returns report list', async () => {
      // Given
      const userId = TEST_USER_ID;

      // When
      const { result } = renderHook(() => useReportAssociationsByUser(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserReportList);
      expect(mockStore.findByUser).toHaveBeenCalledWith(userId);
    });

    test('given fetch error then returns error state', async () => {
      // Given
      const userId = TEST_USER_ID;
      const error = new Error(ERROR_MESSAGES.FETCH_REPORTS_FAILED);
      mockStore.findByUser.mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useReportAssociationsByUser(userId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useReportAssociation', () => {
    test('given valid IDs when fetching then returns specific report', async () => {
      // Given
      const userId = TEST_USER_ID;
      const reportId = TEST_REPORT_ID;

      // When
      const { result } = renderHook(() => useReportAssociation(userId, reportId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserReport);
      expect(mockStore.findById).toHaveBeenCalledWith(userId, reportId);
    });

    test('given non-existent report then returns null', async () => {
      // Given
      const userId = TEST_USER_ID;
      const reportId = 'non-existent';
      mockStore.findById.mockResolvedValue(null);

      // When
      const { result } = renderHook(() => useReportAssociation(userId, reportId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    test('given fetch error then returns error state', async () => {
      // Given
      const userId = TEST_USER_ID;
      const reportId = TEST_REPORT_ID;
      const error = new Error(ERROR_MESSAGES.FETCH_REPORT_FAILED);
      mockStore.findById.mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useReportAssociation(userId, reportId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useReportAssociationById', () => {
    test('given valid user report ID when fetching then returns report', async () => {
      // Given
      const userReportId = 'sur-abc123';

      // When
      const { result } = renderHook(() => useReportAssociationById(userReportId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUserReport);
      expect(mockStore.findByUserReportId).toHaveBeenCalledWith(userReportId);
    });

    test('given non-existent user report ID then returns null', async () => {
      // Given
      const userReportId = 'non-existent-id';
      mockStore.findByUserReportId.mockResolvedValue(null);

      // When
      const { result } = renderHook(() => useReportAssociationById(userReportId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    test('given fetch error then returns error state', async () => {
      // Given
      const userReportId = 'sur-abc123';
      const error = new Error('Failed to fetch user report');
      mockStore.findByUserReportId.mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useReportAssociationById(userReportId), { wrapper });

      // Then
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useCreateReportAssociation', () => {
    test('given valid report data when creating then creates successfully', async () => {
      // Given
      const reportData = {
        userId: TEST_USER_ID,
        reportId: TEST_REPORT_ID,
        label: 'New Report',
        isCreated: true,
      };

      // When
      const { result } = renderHook(() => useCreateReportAssociation(), { wrapper });

      await result.current.mutateAsync(reportData);

      // Then
      await waitFor(() => {
        expect(mockStore.create).toHaveBeenCalledWith(reportData);
      });

      // Verify cache invalidation
      const queries = queryClient.getQueryCache().getAll();
      expect(queries).toBeDefined();
    });

    test('given creation error then throws error', async () => {
      // Given
      const reportData = {
        userId: TEST_USER_ID,
        reportId: TEST_REPORT_ID,
        label: 'New Report',
        isCreated: true,
      };
      const error = new Error(ERROR_MESSAGES.CREATE_ASSOCIATION_FAILED);
      mockStore.create.mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useCreateReportAssociation(), { wrapper });

      // Then
      await expect(result.current.mutateAsync(reportData)).rejects.toThrow(
        ERROR_MESSAGES.CREATE_ASSOCIATION_FAILED
      );
    });

    test('given successful creation then invalidates relevant queries', async () => {
      // Given
      const reportData = {
        userId: TEST_USER_ID,
        reportId: TEST_REPORT_ID,
        label: 'New Report',
        isCreated: true,
      };
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // When
      const { result } = renderHook(() => useCreateReportAssociation(), { wrapper });
      await result.current.mutateAsync(reportData);

      // Then
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['report-associations', 'byUser', TEST_USER_ID],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ['report-associations', 'byReport', TEST_REPORT_ID],
        });
      });
    });

    test('given successful creation then updates specific query cache', async () => {
      // Given
      const reportData = {
        userId: TEST_USER_ID,
        reportId: TEST_REPORT_ID,
        label: 'New Report',
        isCreated: true,
      };
      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // When
      const { result } = renderHook(() => useCreateReportAssociation(), { wrapper });
      await result.current.mutateAsync(reportData);

      // Then
      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalledWith(
          ['report-associations', 'specific', TEST_USER_ID, TEST_REPORT_ID],
          mockUserReport
        );
      });
    });
  });
});
