import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createReportAndAssociateWithUser } from '@/api/report';
import { useCreateReport } from '@/hooks/useCreateReport';
import { mockReport } from '@/tests/fixtures/adapters/reportMocks';
// Removed - old calculation manager mocks no longer needed
import {
  createMockQueryClient,
  ERROR_MESSAGES,
  mockHousehold,
  mockHouseholdSimulation,
  mockNationalGeography,
  mockReportCreationPayload,
  mockSocietyWideSimulation,
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
    byId: (id: string) => ['report', id],
  },
  reportAssociationKeys: {
    all: ['report-associations'],
  },
}));

// Mock CalcOrchestrator
const mockStartCalculation = vi.fn().mockResolvedValue(undefined);
const mockCleanup = vi.fn();
vi.mock('@/libs/calculations/CalcOrchestrator', () => ({
  CalcOrchestrator: vi.fn().mockImplementation(() => ({
    startCalculation: mockStartCalculation,
    cleanup: mockCleanup,
  })),
}));

// Mock ResultPersister
vi.mock('@/libs/calculations/ResultPersister', () => ({
  ResultPersister: vi.fn().mockImplementation(() => ({
    persist: vi.fn().mockResolvedValue(undefined),
  })),
}));

// Mock CalcOrchestratorContext
const mockOrchestrator = {
  startCalculation: mockStartCalculation,
  cleanup: mockCleanup,
};
vi.mock('@/contexts/CalcOrchestratorContext', () => ({
  useCalcOrchestratorManager: vi.fn(() => mockOrchestrator),
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
      report: mockReport,
      userReport: mockUserReportAssociation,
      metadata: {
        baseReportId: TEST_REPORT_ID_STRING,
        userReportId: TEST_USER_REPORT_ID,
        countryId: TEST_COUNTRY_ID,
      },
    });

    // Reset orchestrator mocks
    mockStartCalculation.mockReset().mockResolvedValue(undefined);
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

    test('given successful creation then caches report data', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
      });

      // Then
      await waitFor(() => {
        const cachedReport = queryClient.getQueryData(['report', TEST_REPORT_ID_STRING]);
        expect(cachedReport).toBeDefined();
        expect(cachedReport).toEqual(mockReport);
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

  describe('calculation triggering with orchestrator', () => {
    test('given household simulation when creating report then starts calculation via orchestrator', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockHouseholdSimulation,
          simulation2: { ...mockHouseholdSimulation, policyId: 'policy-2', id: 'sim-2' },
        },
        populations: {
          household1: mockHousehold,
        },
      });

      // Then - Should start TWO calculations (one per simulation)
      await waitFor(() => {
        expect(mockStartCalculation).toHaveBeenCalledTimes(2);

        // First call: simulation1
        expect(mockStartCalculation).toHaveBeenNthCalledWith(
          1,
          expect.objectContaining({
            calcId: mockHouseholdSimulation.id, // Uses simulation's own ID
            targetType: 'simulation',
            countryId: TEST_COUNTRY_ID,
            simulations: {
              simulation1: mockHouseholdSimulation,
              simulation2: null, // Each calculation is independent
            },
            populations: {
              household1: mockHousehold,
              household2: null,
              geography1: null,
              geography2: null,
            },
          })
        );

        // Second call: simulation2
        expect(mockStartCalculation).toHaveBeenNthCalledWith(
          2,
          expect.objectContaining({
            calcId: 'sim-2', // Uses simulation2's ID
            targetType: 'simulation',
            countryId: TEST_COUNTRY_ID,
            simulations: {
              simulation1: expect.objectContaining({ policyId: 'policy-2' }),
              simulation2: null, // Each calculation is independent
            },
            populations: {
              household1: mockHousehold,
              household2: null,
              geography1: null,
              geography2: null,
            },
          })
        );
      });
    });

    test('given economy simulation with national scope then starts calculation via orchestrator', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockSocietyWideSimulation,
          simulation2: { ...mockSocietyWideSimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: mockNationalGeography,
        },
      });

      // Then
      await waitFor(() => {
        expect(mockStartCalculation).toHaveBeenCalledWith(
          expect.objectContaining({
            calcId: TEST_REPORT_ID_STRING,
            targetType: 'report',
            countryId: TEST_COUNTRY_ID,
            simulations: {
              simulation1: mockSocietyWideSimulation,
              simulation2: expect.objectContaining({ policyId: 'policy-3' }),
            },
            populations: {
              household1: null,
              household2: null,
              geography1: mockNationalGeography,
              geography2: null,
            },
          })
        );
      });
    });

    test('given economy simulation with subnational scope then starts calculation via orchestrator', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockSocietyWideSimulation,
          simulation2: { ...mockSocietyWideSimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: mockSubnationalGeography,
        },
      });

      // Then
      await waitFor(() => {
        expect(mockStartCalculation).toHaveBeenCalledWith(
          expect.objectContaining({
            calcId: TEST_REPORT_ID_STRING,
            targetType: 'report',
            countryId: TEST_COUNTRY_ID,
            simulations: {
              simulation1: mockSocietyWideSimulation,
              simulation2: expect.objectContaining({ policyId: 'policy-3' }),
            },
            populations: {
              household1: null,
              household2: null,
              geography1: mockSubnationalGeography,
              geography2: null,
            },
          })
        );
      });
    });

    test('given no simulation1 data then still creates report but does not start calculations', async () => {
      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        // No simulations provided
      });

      // Then
      await waitFor(() => {
        // Should still create report via combined function
        expect(createReportAndAssociateWithUser).toHaveBeenCalled();

        // Should not start calculation
        expect(mockStartCalculation).not.toHaveBeenCalled();
      });
    });

    test('given calculation start fails then still creates report successfully', async () => {
      // Given - make startCalculation reject to simulate failure
      mockStartCalculation.mockRejectedValueOnce(new Error('Calculation start failed'));

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      const response = await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        payload: mockReportCreationPayload,
        simulations: {
          simulation1: mockSocietyWideSimulation,
          simulation2: { ...mockSocietyWideSimulation, policyId: 'policy-3' },
        },
        populations: {
          geography1: mockNationalGeography,
        },
      });

      // Then
      await waitFor(() => {
        // Should log error but still return result with report and userReport
        expect(consoleMocks.errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Post-creation tasks failed:'),
          expect.any(Error)
        );
      });
      expect(response.report).toEqual(mockReport);
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
        report: mockReport,
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
