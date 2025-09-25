import { describe, expect, test } from 'vitest';
import { CalculationStatus, CalculationStatusResponse } from '@/libs/calculations/status';
import {
  COMPUTING_STATUS_RESPONSE,
  COMPUTING_WITH_QUEUE_RESPONSE,
  ERROR_STATUS_RESPONSE,
  OK_STATUS_RESPONSE,
} from '@/tests/fixtures/libs/calculations/calculationMocks';

describe('CalculationStatusResponse', () => {
  test('given computing status with progress then has all household fields', () => {
    // Given
    const response = COMPUTING_STATUS_RESPONSE;

    // Then
    expect(response.status).toBe('computing');
    expect(response.progress).toBe(50);
    expect(response.message).toBe('Running policy simulation...');
    expect(response.estimatedTimeRemaining).toBe(12500);
    expect(response.queuePosition).toBeUndefined();
    expect(response.averageTime).toBeUndefined();
    expect(response.result).toBeUndefined();
    expect(response.error).toBeUndefined();
  });

  test('given computing status with queue then has all economy fields', () => {
    // Given
    const response = COMPUTING_WITH_QUEUE_RESPONSE;

    // Then
    expect(response.status).toBe('computing');
    expect(response.queuePosition).toBe(3);
    expect(response.averageTime).toBe(30000);
    expect(response.progress).toBeUndefined();
    expect(response.message).toBeUndefined();
    expect(response.estimatedTimeRemaining).toBeUndefined();
    expect(response.result).toBeUndefined();
    expect(response.error).toBeUndefined();
  });

  test('given ok status then has result field', () => {
    // Given
    const response = OK_STATUS_RESPONSE;

    // Then
    expect(response.status).toBe('ok');
    expect(response.result).toBeDefined();
    expect(response.result.budget.budgetary_impact).toBe(-1000000000);
    expect(response.result.poverty.poverty_rate_change).toBe(-0.02);
    expect(response.progress).toBeUndefined();
    expect(response.message).toBeUndefined();
    expect(response.queuePosition).toBeUndefined();
    expect(response.error).toBeUndefined();
  });

  test('given error status then has error field', () => {
    // Given
    const response = ERROR_STATUS_RESPONSE;

    // Then
    expect(response.status).toBe('error');
    expect(response.error).toBe('Calculation failed: Invalid policy parameters');
    expect(response.result).toBeUndefined();
    expect(response.progress).toBeUndefined();
    expect(response.message).toBeUndefined();
    expect(response.queuePosition).toBeUndefined();
  });

  test('given minimal response then only has required status field', () => {
    // Given
    const response: CalculationStatusResponse = {
      status: 'ok',
    };

    // Then
    expect(response.status).toBe('ok');
    expect(response.result).toBeUndefined();
    expect(response.progress).toBeUndefined();
    expect(response.message).toBeUndefined();
    expect(response.queuePosition).toBeUndefined();
    expect(response.averageTime).toBeUndefined();
    expect(response.estimatedTimeRemaining).toBeUndefined();
    expect(response.error).toBeUndefined();
  });

  test('given status type then accepts valid enum values', () => {
    // Given
    const validStatuses: CalculationStatus[] = ['computing', 'ok', 'error'];

    // Then
    validStatuses.forEach((status) => {
      const response: CalculationStatusResponse = { status };
      expect(response.status).toBe(status);
    });
  });

  test('given complete household calculation response then has expected structure', () => {
    // Given
    const response: CalculationStatusResponse = {
      status: 'ok',
      result: {
        householdId: 'household-123',
        netIncome: 50000,
        taxBurden: 12000,
        benefits: 2000,
      },
    };

    // Then
    expect(response.status).toBe('ok');
    expect(response.result).toBeDefined();
    expect(response.result.householdId).toBe('household-123');
    expect(response.result.netIncome).toBe(50000);
  });

  test('given complete economy calculation response then has expected structure', () => {
    // Given
    const response: CalculationStatusResponse = {
      status: 'ok',
      result: {
        budget: {
          budgetary_impact: 5000000000,
          deficit_impact: -2000000000,
        },
        poverty: {
          poverty_rate_change: 0.01,
          deep_poverty_rate_change: 0.005,
        },
        inequality: {
          gini_index_change: -0.02,
        },
      },
    };

    // Then
    expect(response.status).toBe('ok');
    expect(response.result).toBeDefined();
    expect(response.result.budget.budgetary_impact).toBe(5000000000);
    expect(response.result.poverty.poverty_rate_change).toBe(0.01);
    expect(response.result.inequality.gini_index_change).toBe(-0.02);
  });
});
