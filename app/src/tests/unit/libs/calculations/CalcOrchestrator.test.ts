import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CalcOrchestrator } from '@/libs/calculations/CalcOrchestrator';
import {
  createMockQueryClient,
  createMockResultPersister,
  mockReportCalcStartConfig,
  mockSimulationCalcStartConfig,
  ORCHESTRATION_TEST_CONSTANTS,
} from '@/tests/fixtures/libs/calculations/orchestrationFixtures';

// Mock QueryObserver to avoid needing a real QueryClient
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    QueryObserver: vi.fn().mockImplementation(() => ({
      subscribe: vi.fn().mockReturnValue(() => {}), // Returns unsubscribe function
    })),
  };
});

// Mock the calculationQueries
vi.mock('@/libs/queries/calculationQueries', () => ({
  calculationQueries: {
    forReport: vi.fn((reportId, metadata, params) => ({
      queryKey: ['calculations', 'report', reportId],
      queryFn: vi.fn().mockResolvedValue({
        status: 'pending',
        metadata,
        progress: 0,
      }),
      refetchInterval: 1000,
      staleTime: Infinity,
      meta: { calcMetadata: metadata },
    })),
    forSimulation: vi.fn((simulationId, metadata, params) => ({
      queryKey: ['calculations', 'simulation', simulationId],
      queryFn: vi.fn().mockResolvedValue({
        status: 'pending',
        metadata,
        progress: 0,
      }),
      refetchInterval: 500,
      staleTime: Infinity,
      meta: { calcMetadata: metadata },
    })),
  },
}));

describe('CalcOrchestrator', () => {
  let orchestrator: CalcOrchestrator;
  let mockQueryClient: any;
  let mockResultPersister: any;

  beforeEach(() => {
    mockQueryClient = createMockQueryClient();
    mockResultPersister = createMockResultPersister();
    orchestrator = new CalcOrchestrator(mockQueryClient, mockResultPersister);

    vi.clearAllMocks();
  });

  describe('startCalculation', () => {
    describe('report calculations', () => {
      it('given report config then executes queryFn and sets data in cache', async () => {
        // Given
        const config = mockReportCalcStartConfig({
          simulations: {
            simulation1: {
              ...mockReportCalcStartConfig().simulations.simulation1,
              populationType: 'geography',
            },
            simulation2: mockReportCalcStartConfig().simulations.simulation2,
          },
        });

        // When
        await orchestrator.startCalculation(config);

        // Then - Should set initial status in cache
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
          ['calculations', 'report', ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID],
          expect.objectContaining({
            status: 'pending',
            metadata: expect.objectContaining({
              calcType: 'societyWide',
              targetType: 'report',
            }),
          })
        );
      });

      it('given household report then builds household metadata', async () => {
        // Given
        const { calculationQueries } = await import('@/libs/queries/calculationQueries');
        const config = mockReportCalcStartConfig({
          simulations: {
            simulation1: {
              ...mockReportCalcStartConfig().simulations.simulation1,
              populationType: 'household',
            },
            simulation2: null,
          },
        });

        // When
        await orchestrator.startCalculation(config);

        // Then
        expect(calculationQueries.forReport).toHaveBeenCalledWith(
          ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
          expect.objectContaining({
            calcType: 'household',
            targetType: 'report',
          }),
          expect.any(Object)
        );
      });

      it('given economy report then builds economy params', async () => {
        // Given
        const { calculationQueries } = await import('@/libs/queries/calculationQueries');
        const config = mockReportCalcStartConfig({
          simulations: {
            simulation1: {
              ...mockReportCalcStartConfig().simulations.simulation1,
              populationType: 'geography',
              policyId: ORCHESTRATION_TEST_CONSTANTS.TEST_POLICY_ID_1,
            },
            simulation2: {
              ...mockReportCalcStartConfig().simulations.simulation1,
              id: 'sim-2',
              policyId: ORCHESTRATION_TEST_CONSTANTS.TEST_POLICY_ID_2,
            },
          },
        });

        // When
        await orchestrator.startCalculation(config);

        // Then
        expect(calculationQueries.forReport).toHaveBeenCalledWith(
          ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
          expect.any(Object),
          expect.objectContaining({
            countryId: ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID,
            calcType: 'societyWide', // geography maps to economy
            policyIds: {
              baseline: ORCHESTRATION_TEST_CONSTANTS.TEST_POLICY_ID_1,
              reform: ORCHESTRATION_TEST_CONSTANTS.TEST_POLICY_ID_2,
            },
          })
        );
      });
    });

    describe('simulation calculations', () => {
      it('given simulation config then executes queryFn and sets data in cache', async () => {
        // Given
        const config = mockSimulationCalcStartConfig();

        // When
        await orchestrator.startCalculation(config);

        // Then - Should set initial status in cache
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(
          ['calculations', 'simulation', ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID],
          expect.objectContaining({
            status: 'pending',
          })
        );
      });

      it('given geography simulation then builds economy metadata', async () => {
        // Given
        const { calculationQueries } = await import('@/libs/queries/calculationQueries');
        const config = mockSimulationCalcStartConfig();

        // When
        await orchestrator.startCalculation(config);

        // Then
        expect(calculationQueries.forSimulation).toHaveBeenCalledWith(
          ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
          expect.objectContaining({
            calcType: 'societyWide', // geography maps to economy
            targetType: 'simulation',
          }),
          expect.any(Object)
        );
      });

      it('given geography simulation then includes region in params', async () => {
        // Given
        const { calculationQueries } = await import('@/libs/queries/calculationQueries');
        const config = mockSimulationCalcStartConfig();

        // When
        await orchestrator.startCalculation(config);

        // Then
        expect(calculationQueries.forSimulation).toHaveBeenCalledWith(
          ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
          expect.any(Object),
          expect.objectContaining({
            region: ORCHESTRATION_TEST_CONSTANTS.TEST_GEOGRAPHY_ID,
          })
        );
      });
    });

    describe('metadata building', () => {
      it('given config then includes timestamp', async () => {
        // Given
        const { calculationQueries } = await import('@/libs/queries/calculationQueries');
        const config = mockReportCalcStartConfig();
        const beforeTime = Date.now();

        // When
        await orchestrator.startCalculation(config);

        // Then
        const afterTime = Date.now();
        expect(calculationQueries.forReport).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            startedAt: expect.any(Number),
          }),
          expect.any(Object)
        );

        const callArgs = (calculationQueries.forReport as any).mock.calls[0];
        const metadata = callArgs[1];
        expect(metadata.startedAt).toBeGreaterThanOrEqual(beforeTime);
        expect(metadata.startedAt).toBeLessThanOrEqual(afterTime);
      });
    });

    describe('params building - Phase 1', () => {
      it('given report config then includes calcId in params', async () => {
        // Given
        const { calculationQueries } = await import('@/libs/queries/calculationQueries');
        const config = mockReportCalcStartConfig();

        // When
        await orchestrator.startCalculation(config);

        // Then
        expect(calculationQueries.forReport).toHaveBeenCalledWith(
          ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
          expect.any(Object),
          expect.objectContaining({
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
          })
        );
      });

      it('given simulation config then includes calcId in params', async () => {
        // Given
        const { calculationQueries } = await import('@/libs/queries/calculationQueries');
        const config = mockSimulationCalcStartConfig();

        // When
        await orchestrator.startCalculation(config);

        // Then
        expect(calculationQueries.forSimulation).toHaveBeenCalledWith(
          ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
          expect.any(Object),
          expect.objectContaining({
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
          })
        );
      });

      it('given household config then params includes calcId and household populationId', async () => {
        // Given
        const { calculationQueries } = await import('@/libs/queries/calculationQueries');
        const config = mockReportCalcStartConfig({
          simulations: {
            simulation1: {
              ...mockReportCalcStartConfig().simulations.simulation1,
              populationType: 'household',
            },
            simulation2: null,
          },
        });

        // When
        await orchestrator.startCalculation(config);

        // Then
        expect(calculationQueries.forReport).toHaveBeenCalledWith(
          ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
          expect.any(Object),
          expect.objectContaining({
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
            calcType: 'household',
            populationId: ORCHESTRATION_TEST_CONSTANTS.TEST_HOUSEHOLD_ID,
          })
        );
      });

      it('given economy config then params includes calcId and region', async () => {
        // Given
        const { calculationQueries } = await import('@/libs/queries/calculationQueries');
        const config = mockSimulationCalcStartConfig();

        // When
        await orchestrator.startCalculation(config);

        // Then
        expect(calculationQueries.forSimulation).toHaveBeenCalledWith(
          ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
          expect.any(Object),
          expect.objectContaining({
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
            calcType: 'societyWide',
            region: ORCHESTRATION_TEST_CONSTANTS.TEST_GEOGRAPHY_ID,
          })
        );
      });
    });
  });

  describe('cleanup - Phase 5', () => {
    it('given active subscription then cleanup unsubscribes', async () => {
      // Given
      const { QueryObserver } = await import('@tanstack/react-query');
      const mockUnsubscribe = vi.fn();
      (QueryObserver as any).mockImplementation(() => ({
        subscribe: vi.fn().mockReturnValue(mockUnsubscribe),
      }));

      const config = mockReportCalcStartConfig();

      // When - start calculation (creates subscription)
      await orchestrator.startCalculation(config);

      // Then - cleanup should call unsubscribe
      orchestrator.cleanup();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('given no active subscription then cleanup does nothing', () => {
      // Given - fresh orchestrator with no calculation started

      // When/Then - should not throw
      expect(() => orchestrator.cleanup()).not.toThrow();
    });

    it('given already cleaned up then second cleanup is safe', async () => {
      // Given
      const { QueryObserver } = await import('@tanstack/react-query');
      const mockUnsubscribe = vi.fn();
      (QueryObserver as any).mockImplementation(() => ({
        subscribe: vi.fn().mockReturnValue(mockUnsubscribe),
      }));

      const config = mockReportCalcStartConfig();
      await orchestrator.startCalculation(config);

      // When - cleanup twice
      orchestrator.cleanup();
      orchestrator.cleanup();

      // Then - unsubscribe only called once
      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('given calculation completes then auto-cleans up subscription', async () => {
      // Given
      const { QueryObserver } = await import('@tanstack/react-query');
      const mockUnsubscribe = vi.fn();
      let subscribeCallback: any;

      (QueryObserver as any).mockImplementation(() => ({
        subscribe: vi.fn().mockImplementation((callback) => {
          subscribeCallback = callback;
          return mockUnsubscribe;
        }),
      }));

      const config = mockReportCalcStartConfig();
      await orchestrator.startCalculation(config);

      // When - simulate completion callback
      subscribeCallback({
        data: {
          status: 'complete',
          result: { budget: { budgetary_impact: 1000 } },
          metadata: {
            calcId: config.calcId,
            calcType: 'societyWide',
            targetType: 'report',
            startedAt: Date.now(),
          },
        },
      });

      // Wait for persistence to complete
      await vi.waitFor(() => {
        expect(mockUnsubscribe).toHaveBeenCalled();
      });

      // Then - external cleanup should be safe (no-op)
      expect(() => orchestrator.cleanup()).not.toThrow();
    });

    it('given calculation errors then auto-cleans up subscription', async () => {
      // Given
      const { QueryObserver } = await import('@tanstack/react-query');
      const mockUnsubscribe = vi.fn();
      let subscribeCallback: any;

      (QueryObserver as any).mockImplementation(() => ({
        subscribe: vi.fn().mockImplementation((callback) => {
          subscribeCallback = callback;
          return mockUnsubscribe;
        }),
      }));

      const config = mockReportCalcStartConfig();
      await orchestrator.startCalculation(config);

      // When - simulate error callback
      subscribeCallback({
        data: {
          status: 'error',
          error: new Error('Test error'),
          metadata: {
            calcId: config.calcId,
            calcType: 'societyWide',
            targetType: 'report',
            startedAt: Date.now(),
          },
        },
      });

      // Then - subscription should be cleaned up immediately
      expect(mockUnsubscribe).toHaveBeenCalled();

      // External cleanup should be safe (no-op)
      expect(() => orchestrator.cleanup()).not.toThrow();
    });
  });
});
