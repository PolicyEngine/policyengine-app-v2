import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProgressTracker } from '@/libs/calculations/ProgressTracker';
import { STRATEGY_TEST_CONSTANTS } from '@/tests/fixtures/libs/calculations/strategyFixtures';
import { mockHouseholdResult } from '@/tests/fixtures/types/calculationFixtures';

describe('ProgressTracker', () => {
  let tracker: ProgressTracker;

  beforeEach(() => {
    tracker = new ProgressTracker();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('given new calculation then registers successfully', () => {
      // Given
      const calcId = 'test-calc-1';
      const promise = Promise.resolve(mockHouseholdResult());

      // When
      tracker.register(calcId, promise);

      // Then
      expect(tracker.isActive(calcId)).toBe(true);
    });

    it('given custom estimated duration then uses it for progress calculation', () => {
      // Given
      const calcId = 'test-calc-2';
      const promise = Promise.resolve(mockHouseholdResult());

      // When
      tracker.register(calcId, promise, STRATEGY_TEST_CONSTANTS.CUSTOM_ESTIMATED_DURATION_MS);

      // Then
      expect(tracker.isActive(calcId)).toBe(true);
    });
  });

  describe('getProgress', () => {
    it('given non-existent calculation then returns null', () => {
      // Given
      const calcId = 'non-existent';

      // When
      const progress = tracker.getProgress(calcId);

      // Then
      expect(progress).toBeNull();
    });

    it('given active calculation then returns progress info', () => {
      // Given
      const calcId = 'test-calc-3';
      const promise = new Promise<any>(() => {}); // Never resolves
      tracker.register(calcId, promise as any);

      // When
      const progress = tracker.getProgress(calcId);

      // Then
      expect(progress).not.toBeNull();
      expect(progress?.progress).toBeGreaterThanOrEqual(0);
      expect(progress?.progress).toBeLessThanOrEqual(
        STRATEGY_TEST_CONSTANTS.MAX_SYNTHETIC_PROGRESS
      );
      expect(progress?.message).toBeDefined();
      expect(progress?.estimatedTimeRemaining).toBeGreaterThanOrEqual(0);
    });

    it('given completed calculation then returns 100% progress', async () => {
      // Given
      const calcId = 'test-calc-4';
      const result = mockHouseholdResult();
      const promise = Promise.resolve(result);
      tracker.register(calcId, promise);

      // Wait for completion
      await promise;
      await new Promise((resolve) => setTimeout(resolve, 10));

      // When
      const progress = tracker.getProgress(calcId);

      // Then
      expect(progress?.progress).toBe(STRATEGY_TEST_CONSTANTS.COMPLETE_PROGRESS);
      expect(progress?.message).toBe('Complete!');
      expect(progress?.estimatedTimeRemaining).toBe(0);
    });

    it('given failed calculation then returns null', async () => {
      // Given
      const calcId = 'test-calc-5';
      const error = new Error('Test error');
      const promise = Promise.reject(error);
      tracker.register(calcId, promise);

      // Wait for failure
      await promise.catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 10));

      // When
      const progress = tracker.getProgress(calcId);

      // Then
      expect(progress).toBeNull();
    });
  });

  describe('complete', () => {
    it('given active calculation then marks as completed', () => {
      // Given
      const calcId = 'test-calc-6';
      const promise = new Promise<any>(() => {});
      const result = mockHouseholdResult();
      tracker.register(calcId, promise as any);

      // When
      tracker.complete(calcId, result);

      // Then
      const progress = tracker.getProgress(calcId);
      expect(progress?.progress).toBe(STRATEGY_TEST_CONSTANTS.COMPLETE_PROGRESS);
    });
  });

  describe('fail', () => {
    it('given active calculation then marks as failed', () => {
      // Given
      const calcId = 'test-calc-7';
      const promise = new Promise<any>(() => {});
      const error = new Error('Test error');
      tracker.register(calcId, promise as any);

      // When
      tracker.fail(calcId, error);

      // Then
      const progress = tracker.getProgress(calcId);
      expect(progress).toBeNull();
    });
  });

  describe('isActive', () => {
    it('given registered calculation then returns true', () => {
      // Given
      const calcId = 'test-calc-8';
      const promise = new Promise<any>(() => {});
      tracker.register(calcId, promise as any);

      // When
      const isActive = tracker.isActive(calcId);

      // Then
      expect(isActive).toBe(true);
    });

    it('given non-existent calculation then returns false', () => {
      // Given
      const calcId = 'non-existent';

      // When
      const isActive = tracker.isActive(calcId);

      // Then
      expect(isActive).toBe(false);
    });

    it('given completed calculation then returns false', async () => {
      // Given
      const calcId = 'test-calc-9';
      const promise = Promise.resolve(mockHouseholdResult());
      tracker.register(calcId, promise);

      // Wait for completion
      await promise;
      await new Promise((resolve) => setTimeout(resolve, 10));

      // When
      const isActive = tracker.isActive(calcId);

      // Then
      expect(isActive).toBe(false);
    });
  });

  describe('progress messages', () => {
    it('given early progress then shows initialization message', () => {
      // Given
      const calcId = 'test-calc-10';
      const promise = new Promise<any>(() => {});
      tracker.register(calcId, promise as any, STRATEGY_TEST_CONSTANTS.LONG_ESTIMATED_DURATION_MS);

      // When
      const progress = tracker.getProgress(calcId);

      // Then
      expect(progress?.message).toContain('Initializing');
    });
  });
});
