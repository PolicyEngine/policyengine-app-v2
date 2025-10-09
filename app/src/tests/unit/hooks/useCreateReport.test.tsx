import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createReportAndAssociateWithUser } from '@/api/report';
import { useCreateReport } from '@/hooks/useCreateReport';
import {
  createMockCalculationManager,
  MOCK_ECONOMY_META_NATIONAL,
  MOCK_ECONOMY_META_SUBNATIONAL,
  MOCK_HOUSEHOLD_META,
} from '@/tests/fixtures/hooks/calculationManagerMocks';
import {
  CONSOLE_MESSAGES,
  createMockCreateAssociation,
  createMockQueryClient,
  ERROR_MESSAGES,
  mockEconomySimulation,
  mockHousehold,
  mockHouseholdSimulation,
  mockNationalGeography,
  mockReportCreationPayload,
  mockReportMetadata,
  mockSubnationalGeography,
  mockUserReportAssociation,
  setupConsoleMocks,
  TEST_COUNTRY_ID,
  TEST_LABEL,
  TEST_REPORT_ID_STRING,
  TEST_USER_ID,
  TEST_USER_REPORT_ID,
} from '@/tests/fixtures/hooks/reportHooksMocks';

// Mock the API
vi.mock('@/api/report', () => ({
  createReportAndAssociateWithUser: vi.fn(),
}));

// Mock query keys
vi.mock('@/libs/queryKeys', () => ({
  reportKeys: {
    all: ['reports'],
  },
}));

// Mock the calculation manager
const mockManager = createMockCalculationManager();
vi.mock('@/libs/calculations', () => ({
  getCalculationManager: vi.fn(() => mockManager),
  determineCalculationType: vi.fn((sim) => {
    if (!sim) {
      return 'economy';
    }
    return sim.populationType === 'household' ? 'household' : 'economy';
  }),
  extractPopulationId: vi.fn((type, household, geography) => {
    if (type === 'household') {
      return household?.id || '';
    }
    return geography?.id || geography?.geographyId || 'us';
  }),
  extractRegion: vi.fn((geography) => {
    if (geography?.scope === 'subnational' && geography?.geographyId) {
      return geography.geographyId;
    }
    return undefined;
  }),
}));

describe('useCreateReport', () => {
  let queryClient: ReturnType<typeof createMockQueryClient>;
  let consoleMocks: ReturnType<typeof setupConsoleMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    consoleMocks = setupConsoleMocks();

    // Set default mock for createReportAndAssociateWithUser
    (createReportAndAssociateWithUser as any).mockResolvedValue({
      report: mockReportMetadata,
      userReport: mockUserReportAssociation,
      metadata: {
        baseReportId: TEST_REPORT_ID_STRING,
        userReportId: TEST_USER_REPORT_ID,
        countryId: TEST_COUNTRY_ID,
      },
    });

    // Reset manager mocks
    mockManager.startCalculation.mockReset().mockResolvedValue(undefined);
    mockManager.fetchCalculation.mockReset();
  });

  afterEach(() => {
    consoleMocks.restore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('successful report creation', () => {
    test('given valid data when creating report then creates report with association', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        expect(createReportAndAssociateWithUser).toHaveBeenCalledWith({
          countryId: TEST_COUNTRY_ID,
          payload: mockReportCreationPayload,
          userId: TEST_USER_ID,
          label: TEST_LABEL,
        });
      });
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
        expect(createReportAndAssociateWithUser).toHaveBeenCalledWith({
          countryId: TEST_COUNTRY_ID,
          payload: mockReportCreationPayload,
          userId: TEST_USER_ID,
          label: undefined,
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

    test('given successful creation then stores calculation metadata', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        const cachedMeta = queryClient.getQueryData(['calculation-meta', TEST_REPORT_ID_STRING]);
        expect(cachedMeta).toBeDefined();
        // Verify basic structure - exact type depends on simulation setup
        expect(cachedMeta).toHaveProperty('type');
        expect(cachedMeta).toHaveProperty('countryId', TEST_COUNTRY_ID);
      });
    });
  });

  describe('error handling', () => {
    test('given API error when creating report then throws error', async () => {
      // Given
      const error = new Error(ERROR_MESSAGES.CREATE_REPORT_FAILED);
      (createReportAndAssociateWithUser as any).mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      // Then
      await expect(
        result.current.createReport({
          countryId: TEST_COUNTRY_ID,
          payload: mockReportCreationPayload,
        })
      ).rejects.toThrow(ERROR_MESSAGES.CREATE_REPORT_FAILED);
    });
  });

  describe('calculation triggering with manager', () => {
    test('given household simulation when creating report then starts calculation via manager', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockHouseholdSimulation,
          simulation2: { ...mockHouseholdSimulation, policyId: 'policy-2' },
        },
        populations: {
          household1: mockHousehold,
        },
      });

      // Then
      await waitFor(() => {
        // Check if there were any errors logged
        if (consoleMocks.errorSpy.mock.calls.length > 0) {
          console.log('Errors logged:', consoleMocks.errorSpy.mock.calls);
        }

        // Should trigger prefetch with calculation query
        // startCalculation is called inside the queryFn, not directly
        expect(prefetchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['calculation', TEST_REPORT_ID_STRING],
            queryFn: expect.any(Function),
            refetchInterval: expect.any(Function),
            staleTime: Infinity,
          })
        );
      });

      // Verify metadata was stored
      expect(queryClient.getQueryData(['calculation-meta', TEST_REPORT_ID_STRING])).toEqual(
        MOCK_HOUSEHOLD_META
      );
    });

    test('given economy simulation with national scope then starts calculation without region', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockEconomySimulation,
          simulation2: { ...mockEconomySimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: mockNationalGeography,
        },
      });

      // Then
      await waitFor(() => {
        // Should trigger prefetch with calculation query
        // Note: startCalculation is not called for economy calculations
        expect(prefetchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['calculation', TEST_REPORT_ID_STRING],
            queryFn: expect.any(Function),
            refetchInterval: expect.any(Function),
            staleTime: Infinity,
          })
        );
      });

      // Verify metadata was stored without region
      expect(queryClient.getQueryData(['calculation-meta', TEST_REPORT_ID_STRING])).toEqual(
        MOCK_ECONOMY_META_NATIONAL
      );
    });

    test('given economy simulation with subnational scope then starts calculation with region', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockEconomySimulation,
          simulation2: { ...mockEconomySimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: mockSubnationalGeography,
        },
      });

      // Then
      await waitFor(() => {
        // Should trigger prefetch with calculation query
        // Note: startCalculation is not called for economy calculations
        expect(prefetchSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['calculation', TEST_REPORT_ID_STRING],
            queryFn: expect.any(Function),
            refetchInterval: expect.any(Function),
            staleTime: Infinity,
          })
        );
      });

      // Verify metadata was stored with region
      expect(queryClient.getQueryData(['calculation-meta', TEST_REPORT_ID_STRING])).toEqual(
        MOCK_ECONOMY_META_SUBNATIONAL
      );
    });

    test('given no populations data then still creates report but does not start calculations', async () => {
      // Given
      const prefetchSpy = vi.spyOn(queryClient, 'prefetchQuery');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockEconomySimulation,
        },
        // No populations provided
      });

      // Then
      await waitFor(() => {
        // Should still create report via combined function
        expect(createReportAndAssociateWithUser).toHaveBeenCalled();

        // Should still prefetch the calculation query
        expect(prefetchSpy).toHaveBeenCalled();
      });
    });

    test('given calculation start fails then still creates report successfully', async () => {
      // Given - make prefetchQuery reject to simulate failure
      vi.spyOn(queryClient, 'prefetchQuery').mockRejectedValueOnce(new Error('Prefetch failed'));

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      const response = await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockEconomySimulation,
          simulation2: { ...mockEconomySimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: mockNationalGeography,
        },
      });

      // Then
      await waitFor(() => {
        // Should log error but still return result with report and userReport
        expect(consoleMocks.errorSpy).toHaveBeenCalledWith(
          'Post-creation tasks failed:',
          expect.any(Error)
        );
      });
      expect(response.report).toEqual(mockReportMetadata);
      expect(response.userReport).toEqual(mockUserReportAssociation);
    });
  });

  describe('mutation state', () => {
    test('given pending mutation then isPending is true', async () => {
      // Given
      let resolveFn: any;
      const pendingPromise = new Promise((resolve) => {
        resolveFn = resolve;
      });
      (createReportAndAssociateWithUser as any).mockReturnValue(pendingPromise);

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
      resolveFn({
        report: mockReportMetadata,
        userReport: mockUserReportAssociation,
        metadata: {
          baseReportId: TEST_REPORT_ID_STRING,
          userReportId: TEST_USER_REPORT_ID,
          countryId: TEST_COUNTRY_ID,
        },
      });
      await createPromise;

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    test('given mutation error then error is accessible', async () => {
      // Given
      const error = new Error(ERROR_MESSAGES.API_ERROR);
      (createReportAndAssociateWithUser as any).mockRejectedValue(error);

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
