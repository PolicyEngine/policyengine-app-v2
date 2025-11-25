import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { markReportCompleted } from '@/api/report';
import { updateSimulationOutput } from '@/api/simulation';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import { calculationKeys, reportKeys, simulationKeys } from '@/libs/queryKeys';
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
import type { CalcStatus } from '@/types/calculation';
import type { Report } from '@/types/ingredients/Report';

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

    it('given simulation with reportId then checks if all simulations complete', async () => {
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
      queryClient.setQueryData(calculationKeys.bySimulationId(TEST_CALC_IDS.SIM_1), {
        status: 'complete',
        result: mockHouseholdResult(),
        metadata: status.metadata,
      });
      queryClient.setQueryData(calculationKeys.bySimulationId(TEST_CALC_IDS.SIM_2), {
        status: 'pending',
        metadata: {
          calcId: TEST_CALC_IDS.SIM_2,
          targetType: 'simulation',
          calcType: 'household',
          startedAt: Date.now(),
        },
      });

      (updateSimulationOutput as any).mockResolvedValue(undefined);

      // When
      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      // Then - Should not mark report complete yet since sim-2 is still pending
      expect(markReportCompleted).not.toHaveBeenCalled();
    });

    it('given all simulations complete then marks report complete', async () => {
      // Given
      const result1 = mockHouseholdResult();
      const result2 = mockHouseholdResult();
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
      queryClient.setQueryData(calculationKeys.bySimulationId(TEST_CALC_IDS.SIM_1), {
        status: 'complete',
        result: result1,
        metadata: {
          calcId: TEST_CALC_IDS.SIM_1,
          targetType: 'simulation',
          calcType: 'household',
          startedAt: Date.now(),
        },
      });
      queryClient.setQueryData(calculationKeys.bySimulationId(TEST_CALC_IDS.SIM_2), {
        status: 'complete',
        result: result2,
        metadata: status.metadata,
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
          output: [result1, result2],
        })
      );
    });
  });

  describe('error handling', () => {
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
