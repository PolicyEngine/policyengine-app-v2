import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HouseholdSimCalculator } from '@/libs/calculations/household/HouseholdSimCalculator';
import { calculationKeys } from '@/libs/queryKeys';
import {
  createMockQueryClient,
  mockExecuteParams,
  mockHouseholdInput,
  mockHouseholdResult,
  TEST_REPORT_IDS,
  TEST_SIM_IDS,
} from '@/tests/fixtures/libs/calculations/householdSimCalculatorMocks';

// Mock the v2 API modules
vi.mock('@/api/v2/householdCalculation', () => ({
  calculateHouseholdV2Alpha: vi.fn(),
}));

vi.mock('@/api/v2/households', () => ({
  fetchHouseholdByIdV2: vi.fn(),
}));

describe('HouseholdSimCalculator', () => {
  let mockQueryClient: ReturnType<typeof createMockQueryClient>;
  let calculator: HouseholdSimCalculator;
  let mockFetchHousehold: any;
  let mockCalculateHousehold: any;

  beforeEach(async () => {
    mockQueryClient = createMockQueryClient();
    calculator = new HouseholdSimCalculator(
      mockQueryClient as unknown as QueryClient,
      TEST_SIM_IDS.SIMULATION_1,
      TEST_REPORT_IDS.REPORT_1
    );

    // Get mock functions from modules
    const householdsModule = await import('@/api/v2/households');
    const householdCalcModule = await import('@/api/v2/householdCalculation');

    mockFetchHousehold = householdsModule.fetchHouseholdByIdV2;
    mockCalculateHousehold = householdCalcModule.calculateHouseholdV2Alpha;

    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('given valid parameters then creates calculator instance', () => {
      // Given/When
      const calc = new HouseholdSimCalculator(
        mockQueryClient as unknown as QueryClient,
        TEST_SIM_IDS.SIMULATION_1,
        TEST_REPORT_IDS.REPORT_1
      );

      // Then
      expect(calc).toBeDefined();
    });
  });

  describe('execute', () => {
    it('given valid params then sets initial pending status in cache', async () => {
      // Given
      const params = mockExecuteParams();
      mockFetchHousehold.mockResolvedValue(mockHouseholdInput());
      mockCalculateHousehold.mockResolvedValue(mockHouseholdResult());

      // When
      await calculator.execute(params);

      // Then
      const firstSetDataCall = mockQueryClient.setQueryData.mock.calls[0];
      const [queryKey, status] = firstSetDataCall;

      expect(queryKey).toEqual(calculationKeys.bySimulationId(TEST_SIM_IDS.SIMULATION_1));
      expect(status.status).toBe('pending');
      expect(status.message).toBe('Starting calculation...');
      expect(status.metadata.calcId).toBe(TEST_SIM_IDS.SIMULATION_1);
      expect(status.metadata.reportId).toBe(TEST_REPORT_IDS.REPORT_1);
      expect(status.metadata.calcType).toBe('household');
      expect(status.metadata.targetType).toBe('simulation');
    });

    it('given valid params then fetches household by populationId', async () => {
      // Given
      const params = mockExecuteParams();
      mockFetchHousehold.mockResolvedValue(mockHouseholdInput());
      mockCalculateHousehold.mockResolvedValue(mockHouseholdResult());

      // When
      await calculator.execute(params);

      // Then
      expect(mockFetchHousehold).toHaveBeenCalledWith(params.populationId);
    });

    it('given fetched household then calculates with policyId', async () => {
      // Given
      const params = mockExecuteParams();
      const household = mockHouseholdInput();
      mockFetchHousehold.mockResolvedValue(household);
      mockCalculateHousehold.mockResolvedValue(mockHouseholdResult());

      // When
      await calculator.execute(params);

      // Then
      expect(mockCalculateHousehold).toHaveBeenCalledWith(household, params.policyId);
    });

    it('given successful calculation then sets complete status in cache', async () => {
      // Given
      const params = mockExecuteParams();
      const result = mockHouseholdResult();
      mockFetchHousehold.mockResolvedValue(mockHouseholdInput());
      mockCalculateHousehold.mockResolvedValue(result);

      // When
      await calculator.execute(params);

      // Then
      const lastSetDataCall = mockQueryClient.setQueryData.mock.calls[1];
      const [queryKey, status] = lastSetDataCall;

      expect(queryKey).toEqual(calculationKeys.bySimulationId(TEST_SIM_IDS.SIMULATION_1));
      expect(status.status).toBe('complete');
      expect(status.result).toEqual(result);
      expect(status.message).toBe('Complete');
      expect(status.metadata.reportId).toBe(TEST_REPORT_IDS.REPORT_1);
    });

    it('given successful calculation then returns result', async () => {
      // Given
      const params = mockExecuteParams();
      const expectedResult = mockHouseholdResult();
      mockFetchHousehold.mockResolvedValue(mockHouseholdInput());
      mockCalculateHousehold.mockResolvedValue(expectedResult);

      // When
      const result = await calculator.execute(params);

      // Then
      expect(result).toEqual(expectedResult);
    });

    it('given household fetch error then sets error status in cache', async () => {
      // Given
      const params = mockExecuteParams();
      mockFetchHousehold.mockRejectedValue(new Error('Household not found'));

      // When/Then
      await expect(calculator.execute(params)).rejects.toThrow('Household not found');

      const lastSetDataCall = mockQueryClient.setQueryData.mock.calls[1];
      const [, status] = lastSetDataCall;

      expect(status.status).toBe('error');
      expect(status.error.code).toBe('HOUSEHOLD_CALC_FAILED');
      expect(status.error.message).toBe('Household not found');
      expect(status.error.retryable).toBe(true);
    });

    it('given calculation error then sets error status in cache', async () => {
      // Given
      const params = mockExecuteParams();
      mockFetchHousehold.mockResolvedValue(mockHouseholdInput());
      mockCalculateHousehold.mockRejectedValue(new Error('Calculation timeout'));

      // When/Then
      await expect(calculator.execute(params)).rejects.toThrow('Calculation timeout');

      const lastSetDataCall = mockQueryClient.setQueryData.mock.calls[1];
      const [, status] = lastSetDataCall;

      expect(status.status).toBe('error');
      expect(status.error.code).toBe('HOUSEHOLD_CALC_FAILED');
      expect(status.error.message).toBe('Calculation timeout');
    });

    it('given non-Error rejection then wraps in generic message', async () => {
      // Given
      const params = mockExecuteParams();
      mockFetchHousehold.mockResolvedValue(mockHouseholdInput());
      mockCalculateHousehold.mockRejectedValue('String error');

      // When/Then
      await expect(calculator.execute(params)).rejects.toBe('String error');

      const lastSetDataCall = mockQueryClient.setQueryData.mock.calls[1];
      const [, status] = lastSetDataCall;

      expect(status.error.message).toBe('Unknown error');
    });

    it('given error then preserves startedAt from initial status', async () => {
      // Given
      const params = mockExecuteParams();
      mockFetchHousehold.mockRejectedValue(new Error('Failed'));

      // When
      await expect(calculator.execute(params)).rejects.toThrow();

      // Then
      const initialStatus = mockQueryClient.setQueryData.mock.calls[0][1];
      const errorStatus = mockQueryClient.setQueryData.mock.calls[1][1];

      expect(errorStatus.metadata.startedAt).toBe(initialStatus.metadata.startedAt);
    });

    it('given successful calculation then preserves startedAt from initial status', async () => {
      // Given
      const params = mockExecuteParams();
      mockFetchHousehold.mockResolvedValue(mockHouseholdInput());
      mockCalculateHousehold.mockResolvedValue(mockHouseholdResult());

      // When
      await calculator.execute(params);

      // Then
      const initialStatus = mockQueryClient.setQueryData.mock.calls[0][1];
      const completeStatus = mockQueryClient.setQueryData.mock.calls[1][1];

      expect(completeStatus.metadata.startedAt).toBe(initialStatus.metadata.startedAt);
    });
  });
});
