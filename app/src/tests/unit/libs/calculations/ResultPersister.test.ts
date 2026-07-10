import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markReportCompleted, markReportError } from '@/api/report';
import { markSimulationError, updateSimulationOutput } from '@/api/simulation';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import { reportKeys, simulationKeys } from '@/libs/queryKeys';
import {
  createTestQueryClient,
  mockCompleteSocietyWideStatus,
  TEST_CALC_IDS,
  TEST_COUNTRIES,
  TEST_YEARS,
} from '@/tests/fixtures/libs/calculations/resultPersisterMocks';
import {
  mockHouseholdResult,
  mockSocietyWideResult,
} from '@/tests/fixtures/types/calculationFixtures';
import { mockExecutionReceipt } from '@/tests/fixtures/types/executionReceiptFixtures';
import type { CalcStatus } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

// Mock API functions
vi.mock('@/api/report');
vi.mock('@/api/simulation');

describe('ResultPersister', () => {
  let persister: ResultPersister;
  let queryClient: ReturnType<typeof createTestQueryClient>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    persister = new ResultPersister(queryClient);
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('persist to report', () => {
    it('given complete report status then persists to report', async () => {
      // Given
      const status = mockCompleteSocietyWideStatus();
      (markReportCompleted as any).mockResolvedValue(undefined);

      // When
      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then
      expect(markReportCompleted).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_CALC_IDS.REPORT_123,
        expect.objectContaining({
          id: TEST_CALC_IDS.REPORT_123,
          status: 'complete',
          output: status.result,
        })
      );
    });

    it('given report persistence then invalidates report cache', async () => {
      // Given
      const result = mockSocietyWideResult();
      const status: CalcStatus = {
        status: 'complete',
        result,
        metadata: {
          calcId: TEST_CALC_IDS.REPORT_123,
          targetType: 'report',
          calcType: 'societyWide',
          startedAt: Date.now(),
        },
      };
      (markReportCompleted as any).mockResolvedValue(undefined);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // When
      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: reportKeys.byId(TEST_CALC_IDS.REPORT_123),
      });
    });

    it('given persistence fails then retries once', async () => {
      // Given
      const result = mockSocietyWideResult();
      const status: CalcStatus = {
        status: 'complete',
        result,
        metadata: {
          calcId: TEST_CALC_IDS.REPORT_123,
          targetType: 'report',
          calcType: 'societyWide',
          startedAt: Date.now(),
        },
      };
      (markReportCompleted as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      // When
      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then
      expect(markReportCompleted).toHaveBeenCalledTimes(2);
    });

    it('given retry fails then throws error', async () => {
      // Given
      const result = mockSocietyWideResult();
      const status: CalcStatus = {
        status: 'complete',
        result,
        metadata: {
          calcId: TEST_CALC_IDS.REPORT_123,
          targetType: 'report',
          calcType: 'societyWide',
          startedAt: Date.now(),
        },
      };
      (markReportCompleted as any).mockRejectedValue(new Error('Network error'));

      // When/Then
      await expect(
        persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT)
      ).rejects.toThrow('Failed to persist report after retry');
      expect(markReportCompleted).toHaveBeenCalledTimes(2);
    });
  });

  describe('persist to simulation', () => {
    it('given execution provenance then persists the receipt with the household result', async () => {
      // Given
      const result = {
        result: mockHouseholdResult(),
        execution_receipt: mockExecutionReceipt(),
      };
      const status: CalcStatus = {
        status: 'complete',
        result,
        metadata: {
          calcId: 'sim-456',
          targetType: 'simulation',
          calcType: 'household',
          startedAt: Date.now(),
        },
      };
      (updateSimulationOutput as any).mockResolvedValue(undefined);

      // When
      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then
      expect(updateSimulationOutput).toHaveBeenCalledWith(TEST_COUNTRIES.US, 'sim-456', result);
    });

    it('given complete simulation status then persists to simulation', async () => {
      // Given
      const result = mockHouseholdResult();
      const status: CalcStatus = {
        status: 'complete',
        result,
        metadata: {
          calcId: 'sim-456',
          targetType: 'simulation',
          calcType: 'household',
          startedAt: Date.now(),
        },
      };
      (updateSimulationOutput as any).mockResolvedValue(undefined);

      // When
      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then
      expect(updateSimulationOutput).toHaveBeenCalledWith(TEST_COUNTRIES.US, 'sim-456', result);
    });

    it('given simulation persistence then invalidates simulation cache', async () => {
      // Given
      const result = mockHouseholdResult();
      const status: CalcStatus = {
        status: 'complete',
        result,
        metadata: {
          calcId: 'sim-456',
          targetType: 'simulation',
          calcType: 'household',
          startedAt: Date.now(),
        },
      };
      (updateSimulationOutput as any).mockResolvedValue(undefined);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // When
      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: simulationKeys.byId('sim-456'),
      });
    });

    it('given another simulation has no persisted output then keeps the report pending', async () => {
      // Given
      const result = mockHouseholdResult();
      const status: CalcStatus = {
        status: 'complete',
        result,
        metadata: {
          calcId: TEST_CALC_IDS.SIM_1,
          targetType: 'simulation',
          calcType: 'household',
          reportId: TEST_CALC_IDS.REPORT_123,
          startedAt: Date.now(),
        },
      };

      const report: Report = {
        id: TEST_CALC_IDS.REPORT_123,
        countryId: TEST_COUNTRIES.US,
        year: '2024',
        apiVersion: '1.0',
        simulationIds: [TEST_CALC_IDS.SIM_1, TEST_CALC_IDS.SIM_2],
        status: 'pending',
      };

      queryClient.setQueryData(reportKeys.byId(TEST_CALC_IDS.REPORT_123), report);
      queryClient.setQueryData(simulationKeys.byId(TEST_CALC_IDS.SIM_2), {
        id: TEST_CALC_IDS.SIM_2,
        label: null,
        isCreated: true,
        status: 'pending',
        output: null,
      });

      (updateSimulationOutput as any).mockResolvedValue(undefined);

      // When
      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then - Should not mark report complete yet since sim-2 is still pending
      expect(markReportCompleted).not.toHaveBeenCalled();
    });

    it('given another simulation has stale output but is pending then keeps the report pending', async () => {
      // Given
      const result = mockHouseholdResult();
      const status: CalcStatus = {
        status: 'complete',
        result,
        metadata: {
          calcId: TEST_CALC_IDS.SIM_1,
          targetType: 'simulation',
          calcType: 'household',
          reportId: TEST_CALC_IDS.REPORT_123,
          startedAt: Date.now(),
        },
      };
      const report: Report = {
        id: TEST_CALC_IDS.REPORT_123,
        countryId: TEST_COUNTRIES.US,
        year: TEST_YEARS.DEFAULT,
        apiVersion: null,
        simulationIds: [TEST_CALC_IDS.SIM_1, TEST_CALC_IDS.SIM_2],
        status: 'pending',
      };
      queryClient.setQueryData(reportKeys.byId(TEST_CALC_IDS.REPORT_123), report);
      queryClient.setQueryData(simulationKeys.byId(TEST_CALC_IDS.SIM_2), {
        id: TEST_CALC_IDS.SIM_2,
        label: null,
        isCreated: true,
        status: 'pending',
        output: mockHouseholdResult(),
      });
      (updateSimulationOutput as any).mockResolvedValue(undefined);

      // When
      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then
      expect(markReportCompleted).not.toHaveBeenCalled();
    });

    it('given an earlier simulation is already persisted then marks report complete', async () => {
      // Given
      const result1 = mockHouseholdResult();
      const result2 = {
        result: mockHouseholdResult(),
        execution_receipt: mockExecutionReceipt(),
      };
      const status: CalcStatus = {
        status: 'complete',
        result: result2,
        metadata: {
          calcId: TEST_CALC_IDS.SIM_2,
          targetType: 'simulation',
          calcType: 'household',
          reportId: TEST_CALC_IDS.REPORT_123,
          startedAt: Date.now(),
        },
      };

      const report: Report = {
        id: TEST_CALC_IDS.REPORT_123,
        countryId: TEST_COUNTRIES.US,
        year: '2024',
        apiVersion: '1.0',
        simulationIds: [TEST_CALC_IDS.SIM_1, TEST_CALC_IDS.SIM_2],
        status: 'pending',
      };

      queryClient.setQueryData(reportKeys.byId(TEST_CALC_IDS.REPORT_123), report);
      queryClient.setQueryData(simulationKeys.byId(TEST_CALC_IDS.SIM_1), {
        id: TEST_CALC_IDS.SIM_1,
        label: null,
        isCreated: true,
        status: 'complete',
        output: result1,
      });

      (updateSimulationOutput as any).mockResolvedValue(undefined);
      (markReportCompleted as any).mockResolvedValue(undefined);

      // When
      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then - Should mark report complete with aggregated outputs
      expect(markReportCompleted).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_CALC_IDS.REPORT_123,
        expect.objectContaining({
          id: TEST_CALC_IDS.REPORT_123,
          status: 'complete',
          output: {
            [TEST_CALC_IDS.SIM_1]: result1,
            [TEST_CALC_IDS.SIM_2]: result2.result,
          },
        })
      );
    });
  });

  describe('finalize household report on load', () => {
    it('test__given_all_simulation_outputs_are_durable__then_pending_report_is_finalized_once', async () => {
      // Given
      const baselineResult = mockHouseholdResult();
      const reformResult = {
        result: mockHouseholdResult(),
        execution_receipt: mockExecutionReceipt(),
      };
      const report: Report = {
        id: TEST_CALC_IDS.REPORT_123,
        countryId: TEST_COUNTRIES.US,
        year: TEST_YEARS.DEFAULT,
        apiVersion: null,
        simulationIds: [TEST_CALC_IDS.SIM_2, TEST_CALC_IDS.SIM_1],
        status: 'pending',
      };
      const simulations: Simulation[] = [
        {
          id: TEST_CALC_IDS.SIM_1,
          label: null,
          isCreated: true,
          status: 'complete',
          output: baselineResult,
        },
        {
          id: TEST_CALC_IDS.SIM_2,
          label: null,
          isCreated: true,
          status: 'complete',
          output: reformResult,
        },
      ];
      (markReportCompleted as any).mockResolvedValue(undefined);

      // When
      const firstFinalization = await persister.finalizeHouseholdReport(report, simulations);
      const secondFinalization = await persister.finalizeHouseholdReport(report, simulations);

      // Then
      expect(firstFinalization).toBe(true);
      expect(secondFinalization).toBe(false);
      expect(markReportCompleted).toHaveBeenCalledOnce();
      expect(markReportCompleted).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_CALC_IDS.REPORT_123,
        expect.objectContaining({
          status: 'complete',
          output: {
            [TEST_CALC_IDS.SIM_1]: baselineResult,
            [TEST_CALC_IDS.SIM_2]: reformResult.result,
          },
        })
      );
      expect(updateSimulationOutput).not.toHaveBeenCalled();
    });

    it('test__given_stale_output_on_pending_simulation__then_report_stays_pending', async () => {
      // Given
      const report: Report = {
        id: TEST_CALC_IDS.REPORT_123,
        countryId: TEST_COUNTRIES.US,
        year: TEST_YEARS.DEFAULT,
        apiVersion: null,
        simulationIds: [TEST_CALC_IDS.SIM_1, TEST_CALC_IDS.SIM_2],
        status: 'pending',
      };
      const simulations: Simulation[] = [
        {
          id: TEST_CALC_IDS.SIM_1,
          label: null,
          isCreated: true,
          status: 'complete',
          output: mockHouseholdResult(),
        },
        {
          id: TEST_CALC_IDS.SIM_2,
          label: null,
          isCreated: true,
          status: 'pending',
          output: mockHouseholdResult(),
        },
      ];

      // When
      const finalized = await persister.finalizeHouseholdReport(report, simulations);

      // Then
      expect(finalized).toBe(false);
      expect(markReportCompleted).not.toHaveBeenCalled();
    });

    it('test__given_first_finalization_write_fails__then_report_write_is_retried', async () => {
      // Given
      const report: Report = {
        id: TEST_CALC_IDS.REPORT_123,
        countryId: TEST_COUNTRIES.US,
        year: TEST_YEARS.DEFAULT,
        apiVersion: null,
        simulationIds: [TEST_CALC_IDS.SIM_1],
        status: 'pending',
      };
      const simulations: Simulation[] = [
        {
          id: TEST_CALC_IDS.SIM_1,
          label: null,
          isCreated: true,
          status: 'complete',
          output: mockHouseholdResult(),
        },
      ];
      (markReportCompleted as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);

      // When
      const finalized = await persister.finalizeHouseholdReport(report, simulations);

      // Then
      expect(finalized).toBe(true);
      expect(markReportCompleted).toHaveBeenCalledTimes(2);
    });

    it('test__given_inline_and_reload_finalization_race__then_report_is_written_once', async () => {
      // Given
      const baselineResult = mockHouseholdResult();
      const reformResult = mockHouseholdResult();
      const report: Report = {
        id: TEST_CALC_IDS.REPORT_123,
        countryId: TEST_COUNTRIES.US,
        year: TEST_YEARS.DEFAULT,
        apiVersion: null,
        simulationIds: [TEST_CALC_IDS.SIM_1, TEST_CALC_IDS.SIM_2],
        status: 'pending',
      };
      const status: CalcStatus = {
        status: 'complete',
        result: reformResult,
        metadata: {
          calcId: TEST_CALC_IDS.SIM_2,
          targetType: 'simulation',
          calcType: 'household',
          reportId: TEST_CALC_IDS.REPORT_123,
          startedAt: Date.now(),
        },
      };
      const simulations: Simulation[] = [
        {
          id: TEST_CALC_IDS.SIM_1,
          label: null,
          isCreated: true,
          status: 'complete',
          output: baselineResult,
        },
        {
          id: TEST_CALC_IDS.SIM_2,
          label: null,
          isCreated: true,
          status: 'complete',
          output: reformResult,
        },
      ];
      queryClient.setQueryData(reportKeys.byId(TEST_CALC_IDS.REPORT_123), report);
      queryClient.setQueryData(simulationKeys.byId(TEST_CALC_IDS.SIM_1), simulations[0]);
      (updateSimulationOutput as any).mockResolvedValue(undefined);
      let resolveReportWrite!: () => void;
      (markReportCompleted as any).mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveReportWrite = resolve;
          })
      );

      // When
      const inlinePersistence = persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);
      await vi.waitFor(() => expect(markReportCompleted).toHaveBeenCalledOnce());
      const reloadFinalization = persister.finalizeHouseholdReport(report, simulations);

      // Then
      expect(markReportCompleted).toHaveBeenCalledOnce();
      resolveReportWrite();
      await Promise.all([inlinePersistence, reloadFinalization]);
      expect(markReportCompleted).toHaveBeenCalledOnce();
    });
  });

  describe('error handling', () => {
    it('given a household error then persists it to the simulation and parent report', async () => {
      // Given
      const report: Report = {
        id: TEST_CALC_IDS.REPORT_123,
        countryId: TEST_COUNTRIES.US,
        year: TEST_YEARS.DEFAULT,
        apiVersion: null,
        simulationIds: [TEST_CALC_IDS.SIM_1],
        status: 'pending',
      };
      const status: CalcStatus = {
        status: 'error',
        error: {
          code: 'HOUSEHOLD_CALC_FAILED',
          message: 'Calculation failed',
          retryable: true,
        },
        metadata: {
          calcId: TEST_CALC_IDS.SIM_1,
          targetType: 'simulation',
          calcType: 'household',
          reportId: TEST_CALC_IDS.REPORT_123,
          startedAt: Date.now(),
        },
      };
      queryClient.setQueryData(reportKeys.byId(TEST_CALC_IDS.REPORT_123), report);
      (markSimulationError as any).mockResolvedValue(undefined);
      (markReportError as any).mockResolvedValue(undefined);

      // When
      await persister.persistError(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then
      expect(markSimulationError).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_CALC_IDS.SIM_1,
        'Calculation failed'
      );
      expect(markReportError).toHaveBeenCalledWith(
        TEST_COUNTRIES.US,
        TEST_CALC_IDS.REPORT_123,
        expect.objectContaining({ status: 'error' }),
        'Calculation failed'
      );
    });

    it('given missing result then throws error', async () => {
      // Given
      const status: CalcStatus = {
        status: 'complete',
        metadata: {
          calcId: TEST_CALC_IDS.REPORT_123,
          targetType: 'report',
          calcType: 'societyWide',
          startedAt: Date.now(),
        },
      };

      // When/Then
      await expect(
        persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT)
      ).rejects.toThrow('Cannot persist: result is missing from CalcStatus');
    });

    it('given undefined result then throws error', async () => {
      // Given
      const status: CalcStatus = {
        status: 'complete',
        result: undefined,
        metadata: {
          calcId: TEST_CALC_IDS.REPORT_123,
          targetType: 'report',
          calcType: 'societyWide',
          startedAt: Date.now(),
        },
      };

      // When/Then
      await expect(
        persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT)
      ).rejects.toThrow('Cannot persist: result is missing from CalcStatus');
    });
  });
});
