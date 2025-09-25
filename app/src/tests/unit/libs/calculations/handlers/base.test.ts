import { describe, test, expect } from 'vitest';
import { CalculationHandler } from '@/libs/calculations/handlers/base';
import { CalculationMeta } from '@/api/reportCalculations';
import { CalculationStatusResponse } from '@/libs/calculations/status';
import {
  createMockQueryClient,
  TEST_REPORT_ID,
  HOUSEHOLD_CALCULATION_META,
} from '@/tests/fixtures/libs/calculations/handlerMocks';

// Create a concrete implementation for testing
class TestCalculationHandler extends CalculationHandler {
  async fetch(meta: CalculationMeta): Promise<CalculationStatusResponse> {
    return { status: 'ok', result: { test: true } };
  }

  getStatus(reportId: string): CalculationStatusResponse | null {
    return null;
  }

  async startCalculation(reportId: string, meta: CalculationMeta): Promise<void> {
    // No-op for testing
  }
}

describe('CalculationHandler (base)', () => {
  test('given handler instance then stores query client', () => {
    // Given
    const queryClient = createMockQueryClient();

    // When
    const handler = new TestCalculationHandler(queryClient);

    // Then
    expect(handler).toBeDefined();
    expect((handler as any).queryClient).toBe(queryClient);
  });

  test('given report id then returns correct cache key', () => {
    // Given
    const queryClient = createMockQueryClient();
    const handler = new TestCalculationHandler(queryClient);

    // When
    const cacheKey = handler.getCacheKey(TEST_REPORT_ID);

    // Then
    expect(cacheKey).toEqual(['calculation', TEST_REPORT_ID]);
    expect(cacheKey).toHaveLength(2);
    // The array is typed as readonly but not actually frozen in JS runtime
  });

  test('given different report ids then returns different cache keys', () => {
    // Given
    const queryClient = createMockQueryClient();
    const handler = new TestCalculationHandler(queryClient);
    const reportId1 = 'report-001';
    const reportId2 = 'report-002';

    // When
    const key1 = handler.getCacheKey(reportId1);
    const key2 = handler.getCacheKey(reportId2);

    // Then
    expect(key1).toEqual(['calculation', reportId1]);
    expect(key2).toEqual(['calculation', reportId2]);
    expect(key1).not.toBe(key2); // Different array instances
  });

  test('given abstract methods then must be implemented by subclass', async () => {
    // Given
    const queryClient = createMockQueryClient();
    const handler = new TestCalculationHandler(queryClient);

    // Then - verify all abstract methods are implemented
    expect(handler.fetch).toBeDefined();
    expect(handler.getStatus).toBeDefined();
    expect(handler.startCalculation).toBeDefined();

    // When - call the methods to ensure they work
    const fetchResult = await handler.fetch(HOUSEHOLD_CALCULATION_META);
    const statusResult = handler.getStatus(TEST_REPORT_ID);
    await handler.startCalculation(TEST_REPORT_ID, HOUSEHOLD_CALCULATION_META);

    // Then
    expect(fetchResult).toEqual({ status: 'ok', result: { test: true } });
    expect(statusResult).toBeNull();
  });
});