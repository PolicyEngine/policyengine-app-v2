import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CalcOrchestrator } from '@/libs/calculations/CalcOrchestrator';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import { calculationQueries } from '@/libs/queries/calculationQueries';
import {
  createMockManager,
  createTestQueryClient,
  mockCompleteHouseholdStatus,
  mockErrorSocietyWideStatus,
  mockHouseholdCalcConfig,
  mockHouseholdCalcConfigWithReport,
  mockHouseholdQueryOptions,
  mockPendingSocietyWideStatus,
  mockPendingSocietyWideStatusWithMessage,
  mockSocietyWideCalcConfig,
  mockSocietyWideQueryOptions,
  TEST_CALC_IDS,
  TEST_COUNTRIES,
  TEST_POPULATION_IDS,
  TEST_YEARS,
} from '@/tests/fixtures/libs/calculations/orchestratorMocks';
import type { CalcStatus } from '@/types/calculation';

// Mock dependencies
vi.mock('@/libs/queries/calculationQueries');
vi.mock('@/libs/calculations/ResultPersister');

describe('CalcOrchestrator', () => {
  let orchestrator: CalcOrchestrator;
  let queryClient: ReturnType<typeof createTestQueryClient>;
  let mockResultPersister: ResultPersister;
  let mockManager: ReturnType<typeof createMockManager>;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    mockResultPersister = new ResultPersister(queryClient);
    mockManager = createMockManager();
    orchestrator = new CalcOrchestrator(queryClient, mockResultPersister, mockManager as any);
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('household calculations', () => {
    it('given household calculation then returns complete immediately', async () => {
      // Given
      const config = mockHouseholdCalcConfig();
      const completeStatus = mockCompleteHouseholdStatus();
      const mockQueryFn = vi.fn().mockResolvedValue(completeStatus);

      (calculationQueries.forSimulation as any).mockReturnValue(
        mockHouseholdQueryOptions(TEST_CALC_IDS.SIM_1, mockQueryFn)
      );
      (mockResultPersister.persist as any).mockResolvedValue(undefined);

      // When
      await orchestrator.startCalculation(config);

      // Then
      expect(mockQueryFn).toHaveBeenCalledTimes(1);
      expect(mockResultPersister.persist).toHaveBeenCalledWith(
        completeStatus,
        TEST_COUNTRIES.US,
        TEST_YEARS.DEFAULT
      );
      expect(mockManager.cleanup).toHaveBeenCalledWith(TEST_CALC_IDS.SIM_1, 'simulation');
    });

    it('given household calculation then sets computing status before API call', async () => {
      // Given
      const config = mockHouseholdCalcConfig();
      const completeStatus = mockCompleteHouseholdStatus();
      const mockQueryFn = vi.fn().mockResolvedValue(completeStatus);

      (calculationQueries.forSimulation as any).mockReturnValue(
        mockHouseholdQueryOptions(TEST_CALC_IDS.SIM_1, mockQueryFn)
      );
      (mockResultPersister.persist as any).mockResolvedValue(undefined);

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // When
      await orchestrator.startCalculation(config);

      // Then - Should have set computing status BEFORE complete status
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['calculation', TEST_CALC_IDS.SIM_1],
        expect.objectContaining({
          status: 'pending',
          progress: 0,
          message: 'Initializing calculation...',
        })
      );
    });

    it('given household calculation then does not start polling', async () => {
      // Given
      const config = mockHouseholdCalcConfig();
      const completeStatus = mockCompleteHouseholdStatus();
      const mockQueryFn = vi.fn().mockResolvedValue(completeStatus);

      (calculationQueries.forSimulation as any).mockReturnValue(
        mockHouseholdQueryOptions(TEST_CALC_IDS.SIM_1, mockQueryFn)
      );
      (mockResultPersister.persist as any).mockResolvedValue(undefined);

      // When
      await orchestrator.startCalculation(config);

      // Then - Should cleanup immediately, not start polling
      expect(mockManager.cleanup).toHaveBeenCalledWith(TEST_CALC_IDS.SIM_1, 'simulation');
    });
  });

  describe('society-wide calculations', () => {
    it('given societyWide calculation then sets initial status in cache', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      const computingStatus = mockPendingSocietyWideStatusWithMessage();
      const mockQueryFn = vi.fn().mockResolvedValue(computingStatus);

      (calculationQueries.forReport as any).mockReturnValue(
        mockSocietyWideQueryOptions(TEST_CALC_IDS.REPORT_1, mockQueryFn)
      );

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // When
      await orchestrator.startCalculation(config);

      // Then
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['calculation', TEST_CALC_IDS.REPORT_1],
        computingStatus
      );
    });

    it('given societyWide calculation then does not set computing status before call', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      const computingStatus = mockPendingSocietyWideStatus();
      const mockQueryFn = vi.fn().mockResolvedValue(computingStatus);

      (calculationQueries.forReport as any).mockReturnValue(
        mockSocietyWideQueryOptions(TEST_CALC_IDS.REPORT_1, mockQueryFn)
      );

      const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

      // When
      await orchestrator.startCalculation(config);

      // Then - Should only call setQueryData ONCE with the API result
      expect(setQueryDataSpy).toHaveBeenCalledTimes(1);
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['calculation', TEST_CALC_IDS.REPORT_1],
        computingStatus
      );
    });
  });

  describe('metadata building', () => {
    it('given household simulation then builds household metadata', async () => {
      // Given
      const config = mockHouseholdCalcConfigWithReport();
      const completeStatus = mockCompleteHouseholdStatus();
      const mockQueryFn = vi.fn().mockResolvedValue(completeStatus);

      (calculationQueries.forSimulation as any).mockImplementation(
        (calcId: string, metadata: any, _params: any) => {
          // Verify metadata passed to query
          expect(metadata).toMatchObject({
            calcId: TEST_CALC_IDS.SIM_1,
            calcType: 'household',
            targetType: 'simulation',
            reportId: TEST_CALC_IDS.REPORT_123,
          });
          return mockHouseholdQueryOptions(calcId, mockQueryFn);
        }
      );

      (mockResultPersister.persist as any).mockResolvedValue(undefined);

      // When
      await orchestrator.startCalculation(config);

      // Then
      expect(calculationQueries.forSimulation).toHaveBeenCalled();
    });

    it('given geography simulation then builds societyWide metadata', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      const computingStatus = mockPendingSocietyWideStatus();
      const mockQueryFn = vi.fn().mockResolvedValue(computingStatus);

      (calculationQueries.forReport as any).mockImplementation(
        (calcId: string, metadata: any, _params: any) => {
          // Verify metadata passed to query
          expect(metadata).toMatchObject({
            calcId: TEST_CALC_IDS.REPORT_1,
            calcType: 'societyWide',
            targetType: 'report',
          });
          return mockSocietyWideQueryOptions(calcId, mockQueryFn);
        }
      );

      // When
      await orchestrator.startCalculation(config);

      // Then
      expect(calculationQueries.forReport).toHaveBeenCalled();
    });
  });

  describe('params building', () => {
    it('given household calculation then builds household params', async () => {
      // Given
      const config = mockHouseholdCalcConfig();
      const completeStatus = mockCompleteHouseholdStatus();
      const mockQueryFn = vi.fn().mockResolvedValue(completeStatus);

      (calculationQueries.forSimulation as any).mockImplementation(
        (calcId: string, _metadata: any, params: any) => {
          // Verify params passed to query
          expect(params).toMatchObject({
            countryId: TEST_COUNTRIES.US,
            calcType: 'household',
            policyIds: {
              baseline: 'policy-1',
            },
            populationId: TEST_POPULATION_IDS.HOUSEHOLD_1,
            calcId: TEST_CALC_IDS.SIM_1,
          });
          return mockHouseholdQueryOptions(calcId, mockQueryFn);
        }
      );

      (mockResultPersister.persist as any).mockResolvedValue(undefined);

      // When
      await orchestrator.startCalculation(config);

      // Then
      expect(calculationQueries.forSimulation).toHaveBeenCalled();
    });

    it('given societyWide calculation then builds geography params', async () => {
      // Given
      const config = mockSocietyWideCalcConfig();
      const computingStatus = mockPendingSocietyWideStatus();
      const mockQueryFn = vi.fn().mockResolvedValue(computingStatus);

      (calculationQueries.forReport as any).mockImplementation(
        (calcId: string, _metadata: any, params: any) => {
          // Verify params passed to query
          expect(params).toMatchObject({
            countryId: TEST_COUNTRIES.US,
            calcType: 'societyWide',
            policyIds: {
              baseline: 'policy-1',
              reform: 'policy-2',
            },
            populationId: TEST_POPULATION_IDS.US,
            region: TEST_POPULATION_IDS.US,
            calcId: TEST_CALC_IDS.REPORT_1,
          });
          return mockSocietyWideQueryOptions(calcId, mockQueryFn);
        }
      );

      // When
      await orchestrator.startCalculation(config);

      // Then
      expect(calculationQueries.forReport).toHaveBeenCalled();
    });
  });

  describe('duration estimate', () => {
    const startAndReadParams = async (config: ReturnType<typeof mockSocietyWideCalcConfig>) => {
      const mockQueryFn = vi.fn().mockResolvedValue(mockPendingSocietyWideStatus());
      (calculationQueries.forReport as any).mockImplementation((calcId: string) =>
        mockSocietyWideQueryOptions(calcId, mockQueryFn)
      );
      await orchestrator.startCalculation(config);
      return (calculationQueries.forReport as any).mock.calls[0][2];
    };

    it('given the default then the params leave the region estimate out', async () => {
      // When
      const params = await startAndReadParams(mockSocietyWideCalcConfig());

      // Then - the params stay exactly as before region estimates
      expect(params).not.toHaveProperty('estimateByRegion');
    });

    it('given estimateByRegion then the params pass it to the strategy', async () => {
      // When
      const params = await startAndReadParams(
        mockSocietyWideCalcConfig({ estimateByRegion: true })
      );

      // Then
      expect(params.estimateByRegion).toBe(true);
    });
  });

  describe('failed society-wide run', () => {
    /** Starts a run whose first answer is `first`, and every later one a failure. */
    const startRun = async (
      config: ReturnType<typeof mockSocietyWideCalcConfig>,
      first: CalcStatus
    ) => {
      const mockQueryFn = vi
        .fn()
        .mockResolvedValueOnce(first)
        .mockResolvedValue(mockErrorSocietyWideStatus());
      (calculationQueries.forReport as any).mockReturnValue(
        mockSocietyWideQueryOptions(TEST_CALC_IDS.REPORT_1, mockQueryFn)
      );
      await orchestrator.startCalculation(config);
      return mockQueryFn;
    };

    const failsAtOnce = mockErrorSocietyWideStatus();
    const failsLater = mockPendingSocietyWideStatus();

    beforeEach(() => {
      (mockResultPersister.persistReportError as any).mockResolvedValue(undefined);
      vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('given the default and a run that fails later then the failure is not written', async () => {
      // When
      const mockQueryFn = await startRun(mockSocietyWideCalcConfig(), failsLater);
      await vi.waitFor(() => expect(mockQueryFn).toHaveBeenCalledTimes(2));
      await vi.waitFor(() =>
        expect(mockManager.cleanup).toHaveBeenCalledWith(TEST_CALC_IDS.REPORT_1, 'report')
      );

      // Then - the report record stays as it was before failures were recorded
      expect(mockResultPersister.persistReportError).not.toHaveBeenCalled();
      expect(mockResultPersister.persist).not.toHaveBeenCalled();
    });

    it('given the default and a run that fails at once then the failure is not written', async () => {
      // When
      await startRun(mockSocietyWideCalcConfig(), failsAtOnce);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Then
      expect(mockResultPersister.persistReportError).not.toHaveBeenCalled();
      expect(mockResultPersister.persist).not.toHaveBeenCalled();
    });

    it('given recordReportErrors and a run that fails later then the failure is written', async () => {
      // When
      await startRun(mockSocietyWideCalcConfig({ recordReportErrors: true }), failsLater);

      // Then
      await vi.waitFor(() =>
        expect(mockResultPersister.persistReportError).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'error' }),
          TEST_COUNTRIES.US,
          TEST_YEARS.DEFAULT
        )
      );
    });

    it('given recordReportErrors and a run that fails at once then the failure is written', async () => {
      // When
      await startRun(mockSocietyWideCalcConfig({ recordReportErrors: true }), failsAtOnce);

      // Then
      expect(mockResultPersister.persistReportError).toHaveBeenCalledWith(
        failsAtOnce,
        TEST_COUNTRIES.US,
        TEST_YEARS.DEFAULT
      );
    });

    it('given recordReportErrors and a run that fails at once then it is cleaned up', async () => {
      // When
      await startRun(mockSocietyWideCalcConfig({ recordReportErrors: true }), failsAtOnce);

      // Then
      expect(mockManager.cleanup).toHaveBeenCalledWith(TEST_CALC_IDS.REPORT_1, 'report');
    });

    it('given recordReportErrors and the write fails then the run is still cleaned up', async () => {
      // Given
      (mockResultPersister.persistReportError as any).mockRejectedValue(new Error('500'));

      // When
      await startRun(mockSocietyWideCalcConfig({ recordReportErrors: true }), failsLater);

      // Then
      await vi.waitFor(() =>
        expect(mockManager.cleanup).toHaveBeenCalledWith(TEST_CALC_IDS.REPORT_1, 'report')
      );
    });
  });

  describe('cleanup', () => {
    it('given no active polling then cleanup does nothing', () => {
      // When
      orchestrator.cleanup();

      // Then - Should not throw
      expect(true).toBe(true);
    });
  });

  describe('manager integration', () => {
    it('given no manager then does not call cleanup', async () => {
      // Given - Create orchestrator without manager
      const orchestratorWithoutManager = new CalcOrchestrator(queryClient, mockResultPersister);
      const config = mockHouseholdCalcConfig();
      const completeStatus = mockCompleteHouseholdStatus();
      const mockQueryFn = vi.fn().mockResolvedValue(completeStatus);

      (calculationQueries.forSimulation as any).mockReturnValue(
        mockHouseholdQueryOptions(TEST_CALC_IDS.SIM_1, mockQueryFn)
      );
      (mockResultPersister.persist as any).mockResolvedValue(undefined);

      // When
      await orchestratorWithoutManager.startCalculation(config);

      // Then - Should not throw, should not call manager.cleanup
      expect(mockManager.cleanup).not.toHaveBeenCalled();
    });
  });
});
