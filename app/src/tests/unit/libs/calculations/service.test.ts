import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as economyApi from '@/api/economy';
import * as householdApi from '@/api/householdCalculation';
import { CalculationMeta } from '@/api/reportCalculations';
import { CalculationService } from '@/libs/calculations/service';
import { ECONOMY_OK_RESPONSE } from '@/tests/fixtures/libs/calculations/handlerMocks';
import {
  COMPUTING_STATUS,
  ECONOMY_BUILD_PARAMS,
  ECONOMY_META,
  HOUSEHOLD_BUILD_PARAMS,
  HOUSEHOLD_META,
  mockHouseholdResult as MOCK_HOUSEHOLD_RESULT,
  OK_STATUS_ECONOMY,
  TEST_REPORT_ID,
} from '@/tests/fixtures/libs/calculations/serviceMocks';

// Mock the API modules
vi.mock('@/api/householdCalculation');
vi.mock('@/api/economy');

describe('CalculationService', () => {
  let service: CalculationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CalculationService();
  });

  describe('buildMetadata', () => {
    test('given household simulation then builds household metadata', () => {
      // When
      const result = service.buildMetadata(HOUSEHOLD_BUILD_PARAMS);

      // Then
      expect(result).toEqual(HOUSEHOLD_META);
    });

    test('given geography simulation then builds economy metadata', () => {
      // When
      const result = service.buildMetadata(ECONOMY_BUILD_PARAMS);

      // Then
      expect(result).toEqual(ECONOMY_META);
    });

    test('given null simulation1 then throws error', () => {
      // Given
      const params = {
        ...HOUSEHOLD_BUILD_PARAMS,
        simulation1: null,
      };

      // When/Then
      expect(() => service.buildMetadata(params)).toThrow('Primary simulation is required');
    });

    test('given household type without household data then throws error', () => {
      // Given
      const params = {
        ...HOUSEHOLD_BUILD_PARAMS,
        household: null,
      };

      // When/Then
      expect(() => service.buildMetadata(params)).toThrow(
        'Household ID required for household calculation'
      );
    });

    test('given economy type without geography data then throws error', () => {
      // Given
      const params = {
        ...ECONOMY_BUILD_PARAMS,
        geography: null,
      };

      // When/Then
      expect(() => service.buildMetadata(params)).toThrow(
        'Geography required for economy calculation'
      );
    });

    test('given subnational geography then includes region in metadata', () => {
      // Given
      const params = {
        ...ECONOMY_BUILD_PARAMS,
        geography: {
          ...ECONOMY_BUILD_PARAMS.geography!,
          scope: 'subnational' as const,
          geographyId: 'ca',
        },
      };

      // When
      const result = service.buildMetadata(params);

      // Then
      expect(result.region).toBe('ca');
    });
  });

  describe('getQueryOptions', () => {
    test('given household metadata then returns household query options', () => {
      // When
      const options = service.getQueryOptions(TEST_REPORT_ID, HOUSEHOLD_META);

      // Then
      expect(options).toEqual({
        queryKey: ['calculation', TEST_REPORT_ID],
        queryFn: expect.any(Function),
        refetchInterval: false,
        staleTime: Infinity,
      });
    });

    test('given economy metadata then returns economy query options with polling', () => {
      // When
      const options = service.getQueryOptions(TEST_REPORT_ID, ECONOMY_META);

      // Then
      expect(options).toEqual({
        queryKey: ['calculation', TEST_REPORT_ID],
        queryFn: expect.any(Function),
        refetchInterval: expect.any(Function),
        staleTime: 10 * 60 * 1000,
      });
    });

    test('given economy query with computing status then refetchInterval returns 1000ms', () => {
      // Given
      const options = service.getQueryOptions(TEST_REPORT_ID, ECONOMY_META);
      const mockQuery = {
        state: {
          data: COMPUTING_STATUS,
        },
      };

      // When
      const interval = (options.refetchInterval as any)(mockQuery);

      // Then
      expect(interval).toBe(1000);
    });

    test('given economy query with ok status then refetchInterval returns false', () => {
      // Given
      const options = service.getQueryOptions(TEST_REPORT_ID, ECONOMY_META);
      const mockQuery = {
        state: {
          data: OK_STATUS_ECONOMY,
        },
      };

      // When
      const interval = (options.refetchInterval as any)(mockQuery);

      // Then
      expect(interval).toBe(false);
    });
  });

  describe('executeCalculation', () => {
    test('given household calculation request then executes calculations for each simulation', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockResolvedValue(
        MOCK_HOUSEHOLD_RESULT.householdData
      );
      const onSimulationComplete = vi.fn();
      const onComplete = vi.fn();

      // When
      const result = await service.executeCalculation(TEST_REPORT_ID, HOUSEHOLD_META, {
        onSimulationComplete,
        onComplete,
      });

      // Then - loops through simulationIds and calls callbacks
      expect(result.status).toBe('ok');
      expect(result.result).toBeNull(); // Report output is null for household
      expect(onSimulationComplete).toHaveBeenCalledWith(
        'sim-1',
        MOCK_HOUSEHOLD_RESULT.householdData,
        'policy-baseline'
      );
      expect(onComplete).toHaveBeenCalledWith(TEST_REPORT_ID, 'ok', null);
    });

    test('given economy calculation request then executes economy handler', async () => {
      // Given
      vi.mocked(economyApi.fetchEconomyCalculation).mockResolvedValue(ECONOMY_OK_RESPONSE);

      // When
      const result = await service.executeCalculation(TEST_REPORT_ID, ECONOMY_META);

      // Then
      expect(result.status).toBe('ok');
      expect(result.result).toBe(ECONOMY_OK_RESPONSE.result);
    });

    test('given household calculation with multiple simulations then executes each separately', async () => {
      // Given - metadata with 2 simulations
      const multiSimMeta: CalculationMeta = {
        ...HOUSEHOLD_META,
        policyIds: {
          baseline: 'policy-1',
          reform: 'policy-2',
        },
        simulationIds: ['sim-1', 'sim-2'],
      };
      vi.mocked(householdApi.fetchHouseholdCalculation).mockResolvedValue(
        MOCK_HOUSEHOLD_RESULT.householdData
      );
      const onSimulationComplete = vi.fn();

      // When
      await service.executeCalculation(TEST_REPORT_ID, multiSimMeta, {
        onSimulationComplete,
      });

      // Then - should call onSimulationComplete for each simulation
      expect(onSimulationComplete).toHaveBeenCalledTimes(2);
      expect(onSimulationComplete).toHaveBeenNthCalledWith(
        1,
        'sim-1',
        MOCK_HOUSEHOLD_RESULT.householdData,
        'policy-1'
      );
      expect(onSimulationComplete).toHaveBeenNthCalledWith(
        2,
        'sim-2',
        MOCK_HOUSEHOLD_RESULT.householdData,
        'policy-2'
      );
    });
  });

  describe('getHandler', () => {
    test('given household type then returns household handler', () => {
      // When
      const handler = service.getHandler('household');

      // Then
      expect(handler).toBeDefined();
      expect(handler.execute).toBeDefined();
    });

    test('given economy type then returns economy handler', () => {
      // When
      const handler = service.getHandler('economy');

      // Then
      expect(handler).toBeDefined();
      expect(handler.execute).toBeDefined();
    });
  });

  describe('getStatus', () => {
    test('given household calculation then returns null (calculations use unique sim keys)', async () => {
      // Given
      vi.mocked(householdApi.fetchHouseholdCalculation).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Start calculation
      service.executeCalculation(TEST_REPORT_ID, HOUSEHOLD_META);

      // Allow promise to register
      await Promise.resolve();

      // When - getStatus with reportId returns null because handler uses unique keys
      const status = service.getStatus(TEST_REPORT_ID, 'household');

      // Then - Service doesn't track by reportId for household anymore
      expect(status).toBeNull();
    });

    test('given economy calculation then returns null', () => {
      // When
      const status = service.getStatus(TEST_REPORT_ID, 'economy');

      // Then
      expect(status).toBeNull();
    });

    test('given non-existent household calculation then returns null', () => {
      // When
      const status = service.getStatus('non-existent', 'household');

      // Then
      expect(status).toBeNull();
    });
  });
});
