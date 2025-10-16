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
      queryFn: vi.fn(),
      refetchInterval: 1000,
      staleTime: Infinity,
      meta: { calcMetadata: metadata },
    })),
    forSimulation: vi.fn((simulationId, metadata, params) => ({
      queryKey: ['calculations', 'simulation', simulationId],
      queryFn: vi.fn(),
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
      it('given report config then prefetches report query', async () => {
        // Given
        const config = mockReportCalcStartConfig();

        // When
        await orchestrator.startCalculation(config);

        // Then
        expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['calculations', 'report', ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID],
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
            calcType: 'economy', // geography maps to economy
            policyIds: {
              baseline: ORCHESTRATION_TEST_CONSTANTS.TEST_POLICY_ID_1,
              reform: ORCHESTRATION_TEST_CONSTANTS.TEST_POLICY_ID_2,
            },
          })
        );
      });
    });

    describe('simulation calculations', () => {
      it('given simulation config then prefetches simulation query', async () => {
        // Given
        const config = mockSimulationCalcStartConfig();

        // When
        await orchestrator.startCalculation(config);

        // Then
        expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            queryKey: ['calculations', 'simulation', ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID],
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
            calcType: 'economy', // geography maps to economy
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
  });
});
