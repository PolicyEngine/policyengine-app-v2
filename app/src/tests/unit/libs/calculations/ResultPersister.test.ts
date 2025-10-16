import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import { mockCompleteCalcStatus } from '@/tests/fixtures/types/calculationFixtures';
import {
  createMockQueryClient,
  ORCHESTRATION_TEST_CONSTANTS,
} from '@/tests/fixtures/libs/calculations/orchestrationFixtures';

// Mock the API modules
vi.mock('@/api/report', () => ({
  markReportCompleted: vi.fn(),
}));

vi.mock('@/api/simulation', () => ({
  updateSimulationOutput: vi.fn(),
}));

// Mock query keys
vi.mock('@/libs/queryKeys', () => ({
  reportKeys: {
    byId: (id: string) => ['reports', 'report_id', id],
  },
  simulationKeys: {
    byId: (id: string) => ['simulations', 'simulation_id', id],
  },
}));

describe('ResultPersister', () => {
  let persister: ResultPersister;
  let mockQueryClient: any;
  let mockMarkReportCompleted: any;
  let mockUpdateSimulationOutput: any;

  beforeEach(async () => {
    mockQueryClient = createMockQueryClient();
    persister = new ResultPersister(mockQueryClient);

    const reportModule = await import('@/api/report');
    const simulationModule = await import('@/api/simulation');

    mockMarkReportCompleted = reportModule.markReportCompleted as any;
    mockUpdateSimulationOutput = simulationModule.updateSimulationOutput as any;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('persist', () => {
    describe('report target', () => {
      it('given complete status for report then calls markReportCompleted', async () => {
        // Given
        const status = mockCompleteCalcStatus({
          metadata: {
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
            calcType: 'economy',
            targetType: 'report',
            startedAt: Date.now(),
          },
        });
        mockMarkReportCompleted.mockResolvedValue({});

        // When
        await persister.persist(status, ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID);

        // Then
        expect(mockMarkReportCompleted).toHaveBeenCalledWith(
          ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID,
          ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
          expect.objectContaining({
            id: ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
            status: 'complete',
            output: status.result,
          })
        );
      });

      it('given report persist success then invalidates report cache', async () => {
        // Given
        const status = mockCompleteCalcStatus({
          metadata: {
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
            calcType: 'economy',
            targetType: 'report',
            startedAt: Date.now(),
          },
        });
        mockMarkReportCompleted.mockResolvedValue({});

        // When
        await persister.persist(status, ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID);

        // Then
        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['reports', 'report_id', ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID],
        });
      });

      it('given report persist fails then retries once', async () => {
        // Given
        const status = mockCompleteCalcStatus({
          metadata: {
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
            calcType: 'economy',
            targetType: 'report',
            startedAt: Date.now(),
          },
        });
        mockMarkReportCompleted
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({});

        // When
        await persister.persist(status, ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID);

        // Then
        expect(mockMarkReportCompleted).toHaveBeenCalledTimes(2);
      });

      it('given report persist fails twice then throws error', async () => {
        // Given
        const status = mockCompleteCalcStatus({
          metadata: {
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_REPORT_ID,
            calcType: 'economy',
            targetType: 'report',
            startedAt: Date.now(),
          },
        });
        mockMarkReportCompleted.mockRejectedValue(new Error('Network error'));

        // When/Then
        await expect(
          persister.persist(status, ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID)
        ).rejects.toThrow('Failed to persist report after retry');

        expect(mockMarkReportCompleted).toHaveBeenCalledTimes(2);
      });
    });

    describe('simulation target', () => {
      it('given complete status for simulation then calls updateSimulationOutput', async () => {
        // Given
        const status = mockCompleteCalcStatus({
          metadata: {
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
            calcType: 'household',
            targetType: 'simulation',
            startedAt: Date.now(),
          },
        });
        mockUpdateSimulationOutput.mockResolvedValue({});

        // When
        await persister.persist(status, ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID);

        // Then
        expect(mockUpdateSimulationOutput).toHaveBeenCalledWith(
          ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID,
          ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
          status.result
        );
      });

      it('given simulation persist success then invalidates simulation cache', async () => {
        // Given
        const status = mockCompleteCalcStatus({
          metadata: {
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
            calcType: 'household',
            targetType: 'simulation',
            startedAt: Date.now(),
          },
        });
        mockUpdateSimulationOutput.mockResolvedValue({});

        // When
        await persister.persist(status, ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID);

        // Then
        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['simulations', 'simulation_id', ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID],
        });
      });

      it('given simulation persist fails then retries once', async () => {
        // Given
        const status = mockCompleteCalcStatus({
          metadata: {
            calcId: ORCHESTRATION_TEST_CONSTANTS.TEST_SIMULATION_ID,
            calcType: 'household',
            targetType: 'simulation',
            startedAt: Date.now(),
          },
        });
        mockUpdateSimulationOutput
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({});

        // When
        await persister.persist(status, ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID);

        // Then
        expect(mockUpdateSimulationOutput).toHaveBeenCalledTimes(2);
      });
    });

    describe('error handling', () => {
      it('given status without result then throws error', async () => {
        // Given
        const status = mockCompleteCalcStatus({
          result: undefined,
        });

        // When/Then
        await expect(
          persister.persist(status, ORCHESTRATION_TEST_CONSTANTS.TEST_COUNTRY_ID)
        ).rejects.toThrow('Cannot persist: result is missing from CalcStatus');
      });
    });
  });
});
