import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createEconomyAnalysis } from '@/api/v2/economyAnalysis';
import { createHouseholdAnalysis } from '@/api/v2/householdAnalysis';
import { useCreateReport } from '@/hooks/useCreateReport';
import {
  createMockQueryClient,
  ERROR_MESSAGES,
  mockEconomyImpactResponse,
  mockHousehold,
  mockHouseholdImpactBaselineOnlyResponse,
  mockHouseholdImpactResponse,
  mockHouseholdSimulation,
  mockNationalGeography,
  mockSocietyWideSimulation,
  mockSubnationalGeography,
  setupConsoleMocks,
  TEST_COUNTRY_ID,
  TEST_LABEL,
  TEST_V2_BASELINE_SIM_ID,
  TEST_V2_REFORM_SIM_ID,
  TEST_V2_REPORT_ID,
  TEST_YEAR,
} from '@/tests/fixtures/hooks/reportHooksMocks';

// Mock v2 analysis endpoints
vi.mock('@/api/v2/householdAnalysis', () => ({
  createHouseholdAnalysis: vi.fn(),
}));

vi.mock('@/api/v2/economyAnalysis', () => ({
  createEconomyAnalysis: vi.fn(),
}));

// Mock dataset lookup
vi.mock('@/api/societyWideCalculation', () => ({
  getDatasetIdForRegion: vi.fn(() => Promise.resolve('00000000-0000-4000-a000-000000000001')),
}));

// Mock report association store
const mockReportStoreCreate = vi.fn();
vi.mock('@/api/reportAssociation', () => ({
  LocalStorageReportStore: vi.fn().mockImplementation(() => ({
    create: mockReportStoreCreate,
  })),
}));

// Mock simulation association store
const mockSimulationStoreCreate = vi.fn();
vi.mock('@/api/simulationAssociation', () => ({
  LocalStorageSimulationStore: vi.fn().mockImplementation(() => ({
    create: mockSimulationStoreCreate,
  })),
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
  simulationAssociationKeys: {
    all: ['simulation-associations'],
  },
}));

// Mock useUserId
const TEST_USER_ID = 'test-user-uuid-123';
vi.mock('@/hooks/useUserId', () => ({
  useUserId: () => TEST_USER_ID,
}));

// Mock CalcOrchestratorContext
const mockStartCalculation = vi.fn().mockResolvedValue(undefined);
vi.mock('@/contexts/CalcOrchestratorContext', () => ({
  useCalcOrchestratorManager: vi.fn(() => ({
    startCalculation: mockStartCalculation,
  })),
}));

const mockCreateHouseholdAnalysis = createHouseholdAnalysis as ReturnType<typeof vi.fn>;
const mockCreateEconomyAnalysis = createEconomyAnalysis as ReturnType<typeof vi.fn>;

describe('useCreateReport', () => {
  let queryClient: ReturnType<typeof createMockQueryClient>;
  let consoleMocks: ReturnType<typeof setupConsoleMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = createMockQueryClient();
    consoleMocks = setupConsoleMocks();

    // Default: report store returns a UserReport with the generated reportId
    mockReportStoreCreate.mockImplementation((input: any) => ({
      id: 'user-report-1',
      ...input,
      createdAt: '2025-01-01T00:00:00Z',
    }));

    // Default: simulation store succeeds
    mockSimulationStoreCreate.mockResolvedValue({});
  });

  afterEach(() => {
    consoleMocks.restore();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  // ==========================================================================
  // Household report creation
  // ==========================================================================

  describe('household report creation', () => {
    test('given household simulation then calls household analysis per simulation', async () => {
      // Given
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdImpactResponse);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: {
          simulation1: mockHouseholdSimulation,
        },
        populations: {
          household1: mockHousehold,
        },
      });

      // Then
      expect(mockCreateHouseholdAnalysis).toHaveBeenCalledWith({
        household_id: 'household-123',
        policy_id: 'policy-1',
      });
    });

    test('given two household simulations then calls analysis for each', async () => {
      // Given
      const reformSim = { ...mockHouseholdSimulation, id: 'sim-reform', policyId: 'policy-reform' };
      mockCreateHouseholdAnalysis
        .mockResolvedValueOnce(mockHouseholdImpactResponse)
        .mockResolvedValueOnce({
          ...mockHouseholdImpactResponse,
          reform_simulation: { id: 'v2-sim-reform-2', status: 'pending', error_message: null },
        });

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: {
          simulation1: mockHouseholdSimulation,
          simulation2: reformSim,
        },
        populations: {
          household1: mockHousehold,
        },
      });

      // Then
      expect(mockCreateHouseholdAnalysis).toHaveBeenCalledTimes(2);
      expect(mockCreateHouseholdAnalysis).toHaveBeenNthCalledWith(1, {
        household_id: 'household-123',
        policy_id: 'policy-1',
      });
      expect(mockCreateHouseholdAnalysis).toHaveBeenNthCalledWith(2, {
        household_id: 'household-123',
        policy_id: 'policy-reform',
      });
    });

    test('given household simulation with no policyId then sends null policy_id', async () => {
      // Given
      const baselineSim = { ...mockHouseholdSimulation, policyId: undefined };
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdImpactBaselineOnlyResponse);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: { simulation1: baselineSim },
        populations: { household1: mockHousehold },
      });

      // Then
      expect(mockCreateHouseholdAnalysis).toHaveBeenCalledWith({
        household_id: 'household-123',
        policy_id: null,
      });
    });

    test('given household report then creates UserReport with household outputType', async () => {
      // Given
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdImpactResponse);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: { simulation1: mockHouseholdSimulation },
        populations: { household1: mockHousehold },
      });

      // Then
      expect(mockReportStoreCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          countryId: TEST_COUNTRY_ID,
          outputType: 'household',
          simulationIds: [TEST_V2_REFORM_SIM_ID],
          year: TEST_YEAR,
          label: TEST_LABEL,
          isCreated: true,
        })
      );
      // reportId should be a UUID (not the v2 report_id, since household uses local container)
      const callArg = mockReportStoreCreate.mock.calls[0][0];
      expect(callArg.reportId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    test('given household report then creates simulation associations for v2 sim IDs', async () => {
      // Given
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdImpactResponse);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: { simulation1: mockHouseholdSimulation },
        populations: { household1: mockHousehold },
      });

      // Then — should create association for the reform sim ID (extracted as primary)
      expect(mockSimulationStoreCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: TEST_USER_ID,
          simulationId: TEST_V2_REFORM_SIM_ID,
          countryId: TEST_COUNTRY_ID,
          isCreated: true,
        })
      );
    });

    test('given household report then returns v2 simulations in result', async () => {
      // Given
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdImpactResponse);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      const response = await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: { simulation1: mockHouseholdSimulation },
        populations: { household1: mockHousehold },
      });

      // Then — simulations in result should have v2 IDs
      expect(response.simulations.simulation1.id).toBe(TEST_V2_REFORM_SIM_ID);
      expect(response.simulations.simulation1.populationType).toBe('household');
      expect(response.report.outputType).toBe('household');
      expect(response.report.apiVersion).toBe('v2');
    });
  });

  // ==========================================================================
  // Economy report creation
  // ==========================================================================

  describe('economy report creation', () => {
    test('given economy simulation then calls economy analysis endpoint', async () => {
      // Given
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyImpactResponse);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: {
          simulation1: mockSocietyWideSimulation,
          simulation2: { ...mockSocietyWideSimulation, policyId: 'policy-reform' },
        },
        populations: {
          geography1: mockNationalGeography,
        },
      });

      // Then
      expect(mockCreateEconomyAnalysis).toHaveBeenCalledWith({
        tax_benefit_model_name: 'policyengine_us',
        region: 'us',
        policy_id: 'policy-reform',
        dataset_id: '00000000-0000-4000-a000-000000000001',
      });
    });

    test('given economy report then uses v2 report_id directly', async () => {
      // Given
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyImpactResponse);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: {
          simulation1: mockSocietyWideSimulation,
          simulation2: { ...mockSocietyWideSimulation, policyId: 'policy-reform' },
        },
        populations: {
          geography1: mockNationalGeography,
        },
      });

      // Then — reportId should be the v2 report_id, not a local UUID
      expect(mockReportStoreCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reportId: TEST_V2_REPORT_ID,
          outputType: 'economy',
          simulationIds: [TEST_V2_BASELINE_SIM_ID, TEST_V2_REFORM_SIM_ID],
        })
      );
    });

    test('given subnational geography then passes region code to economy analysis', async () => {
      // Given
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyImpactResponse);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: {
          simulation1: mockSocietyWideSimulation,
          simulation2: { ...mockSocietyWideSimulation, policyId: 'policy-reform' },
        },
        populations: {
          geography1: mockSubnationalGeography,
        },
      });

      // Then
      expect(mockCreateEconomyAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'california',
        })
      );
    });

    test('given economy report then returns original simulations in result', async () => {
      // Given
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyImpactResponse);
      const simulation2 = { ...mockSocietyWideSimulation, policyId: 'policy-reform' };

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      const response = await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: {
          simulation1: mockSocietyWideSimulation,
          simulation2,
        },
        populations: {
          geography1: mockNationalGeography,
        },
      });

      // Then — economy path passes through original simulations
      expect(response.simulations.simulation1).toEqual(mockSocietyWideSimulation);
      expect(response.simulations.simulation2).toEqual(simulation2);
      expect(response.report.outputType).toBe('economy');
    });
  });

  // ==========================================================================
  // CalcOrchestrator triggering (onSuccess)
  // ==========================================================================

  describe('calculation triggering', () => {
    test('given household report then starts per-simulation calculations', async () => {
      // Given
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdImpactResponse);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: { simulation1: mockHouseholdSimulation },
        populations: { household1: mockHousehold },
      });

      // Then — onSuccess starts a CalcOrchestrator for the v2 simulation
      await waitFor(() => {
        expect(mockStartCalculation).toHaveBeenCalledWith(
          expect.objectContaining({
            calcId: TEST_V2_REFORM_SIM_ID,
            targetType: 'simulation',
            countryId: TEST_COUNTRY_ID,
            year: TEST_YEAR,
          })
        );
      });
    });

    test('given economy report then starts single report-level calculation', async () => {
      // Given
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyImpactResponse);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: {
          simulation1: mockSocietyWideSimulation,
          simulation2: { ...mockSocietyWideSimulation, policyId: 'policy-reform' },
        },
        populations: { geography1: mockNationalGeography },
      });

      // Then
      await waitFor(() => {
        expect(mockStartCalculation).toHaveBeenCalledWith(
          expect.objectContaining({
            calcId: TEST_V2_REPORT_ID,
            targetType: 'report',
            countryId: TEST_COUNTRY_ID,
          })
        );
      });
    });

    test('given calculation start fails then report creation still succeeds', async () => {
      // Given
      mockCreateEconomyAnalysis.mockResolvedValue(mockEconomyImpactResponse);
      mockStartCalculation.mockRejectedValueOnce(new Error('Calculation start failed'));

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      const response = await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: {
          simulation1: mockSocietyWideSimulation,
          simulation2: { ...mockSocietyWideSimulation, policyId: 'policy-reform' },
        },
        populations: { geography1: mockNationalGeography },
      });

      // Then — report was created successfully despite calc failure
      await waitFor(() => {
        expect(consoleMocks.errorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Post-creation tasks failed'),
          expect.any(Error)
        );
      });
      expect(response.report).toBeDefined();
      expect(response.userReport).toBeDefined();
    });
  });

  // ==========================================================================
  // Error handling
  // ==========================================================================

  describe('error handling', () => {
    test('given household analysis API error then throws', async () => {
      // Given
      mockCreateHouseholdAnalysis.mockRejectedValue(
        new Error(ERROR_MESSAGES.HOUSEHOLD_ANALYSIS_FAILED)
      );

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      // Then
      await expect(
        result.current.createReport({
          countryId: TEST_COUNTRY_ID,
          year: TEST_YEAR,
          simulations: { simulation1: mockHouseholdSimulation },
          populations: { household1: mockHousehold },
        })
      ).rejects.toThrow(ERROR_MESSAGES.HOUSEHOLD_ANALYSIS_FAILED);
    });

    test('given economy analysis API error then throws', async () => {
      // Given
      mockCreateEconomyAnalysis.mockRejectedValue(
        new Error(ERROR_MESSAGES.ECONOMY_ANALYSIS_FAILED)
      );

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      // Then
      await expect(
        result.current.createReport({
          countryId: TEST_COUNTRY_ID,
          year: TEST_YEAR,
          simulations: {
            simulation1: mockSocietyWideSimulation,
            simulation2: { ...mockSocietyWideSimulation, policyId: 'policy-reform' },
          },
          populations: { geography1: mockNationalGeography },
        })
      ).rejects.toThrow(ERROR_MESSAGES.ECONOMY_ANALYSIS_FAILED);
    });

    test('given simulation association creation fails then continues without throwing', async () => {
      // Given
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdImpactResponse);
      mockSimulationStoreCreate.mockRejectedValue(new Error('Association creation failed'));

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      const response = await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: { simulation1: mockHouseholdSimulation },
        populations: { household1: mockHousehold },
      });

      // Then — report still created, warning logged
      expect(response.report).toBeDefined();
      expect(consoleMocks.warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create simulation association'),
        expect.any(Error)
      );
    });
  });

  // ==========================================================================
  // Mutation state
  // ==========================================================================

  describe('mutation state', () => {
    test('given pending mutation then isPending is true', async () => {
      // Given
      let resolveFn: any;
      const pendingPromise = new Promise((resolve) => {
        resolveFn = resolve;
      });
      mockCreateHouseholdAnalysis.mockReturnValue(pendingPromise);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      const createPromise = result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: { simulation1: mockHouseholdSimulation },
        populations: { household1: mockHousehold },
      });

      // Then
      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      // Resolve to clean up
      resolveFn(mockHouseholdImpactResponse);
      await createPromise;

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
      });
    });

    test('given mutation error then error is accessible', async () => {
      // Given
      const error = new Error(ERROR_MESSAGES.API_ERROR);
      mockCreateHouseholdAnalysis.mockRejectedValue(error);

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      try {
        await result.current.createReport({
          countryId: TEST_COUNTRY_ID,
          year: TEST_YEAR,
          simulations: { simulation1: mockHouseholdSimulation },
          populations: { household1: mockHousehold },
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

  // ==========================================================================
  // Query invalidation
  // ==========================================================================

  describe('query invalidation', () => {
    test('given successful creation then invalidates report and association queries', async () => {
      // Given
      mockCreateHouseholdAnalysis.mockResolvedValue(mockHouseholdImpactResponse);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // When
      const { result } = renderHook(() => useCreateReport(TEST_LABEL), { wrapper });

      await result.current.createReport({
        countryId: TEST_COUNTRY_ID,
        year: TEST_YEAR,
        simulations: { simulation1: mockHouseholdSimulation },
        populations: { household1: mockHousehold },
      });

      // Then
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reports'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['report-associations'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['simulation-associations'] });
      });
    });
  });
});
