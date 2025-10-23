import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMockQuery,
  createMockQueryClient,
  TEST_QUERY_KEYS,
  TEST_SIMULATION_IDS,
} from '@/tests/fixtures/utils/cacheMonitorMocks';
import { cacheMonitor } from '@/utils/cacheMonitor';

describe('cacheMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCacheState', () => {
    it('given no query client then returns empty object', () => {
      // When
      const result = cacheMonitor.getCacheState();

      // Then
      expect(result).toEqual({});
    });

    it('given initialized then returns cache state', () => {
      // Given
      const mockClient = createMockQueryClient();
      const mockQuery = createMockQuery(TEST_QUERY_KEYS.SIMULATION, { data: { test: 'data' } });
      (mockClient.getQueryCache().getAll as any) = vi.fn(() => [mockQuery]);

      cacheMonitor.init(mockClient);

      // When
      const result = cacheMonitor.getCacheState();

      // Then
      expect(result).toHaveProperty('simulation:sim-123');
      expect(result['simulation:sim-123']).toMatchObject({
        hasData: true,
        isFetching: false,
      });
    });
  });

  describe('getStats', () => {
    it('given queries then returns statistics', () => {
      // Given
      const mockClient = createMockQueryClient();
      const queries = [
        createMockQuery(TEST_QUERY_KEYS.SIMULATION, { data: {}, fetchStatus: 'fetching' }),
        createMockQuery(TEST_QUERY_KEYS.REPORT, { data: {} }),
        createMockQuery(TEST_QUERY_KEYS.CALCULATION),
      ];
      (mockClient.getQueryCache().getAll as any) = vi.fn(() => queries);

      cacheMonitor.init(mockClient);

      // When
      const result = cacheMonitor.getStats();

      // Then
      expect(result).toMatchObject({
        total: 3,
        fetching: 1,
        withData: 2,
      });
    });
  });

  describe('monitorSimulations', () => {
    it('given no query client then does nothing', () => {
      // When/Then - should not throw
      expect(() => {
        cacheMonitor.monitorSimulations(TEST_SIMULATION_IDS);
      }).not.toThrow();
    });

    it('given simulations then logs matching queries', () => {
      // Given
      const mockClient = createMockQueryClient();
      const queries = [
        createMockQuery(['simulations', 'simulation_id', 'sim-1'], { data: {} }),
        createMockQuery(['simulations', 'simulation_id', 'sim-2'], { data: {} }),
        createMockQuery(['reports', 'report_id', 'report-1']),
      ];
      (mockClient.getQueryCache().getAll as any) = vi.fn(() => queries);

      cacheMonitor.init(mockClient);

      // When/Then - should not throw and should log
      expect(() => {
        cacheMonitor.monitorSimulations(['sim-1', 'sim-2']);
      }).not.toThrow();
    });
  });

  describe('logInvalidation', () => {
    it('given query key then logs invalidation', () => {
      // Given
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // When
      cacheMonitor.logInvalidation(TEST_QUERY_KEYS.SIMULATION);

      // Then
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('logCacheState', () => {
    it('given label then includes label in log', () => {
      // Given
      const mockClient = createMockQueryClient();
      cacheMonitor.init(mockClient);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // When
      cacheMonitor.logCacheState('Test Label');

      // Then
      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      expect(logCall[0]).toContain('[Test Label]');

      consoleSpy.mockRestore();
    });
  });

  describe('logNavigation', () => {
    it('given from and to then logs navigation', () => {
      // Given
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // When
      cacheMonitor.logNavigation('/reports', '/reports/123');

      // Then
      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0];
      expect(logCall[0]).toContain('NAVIGATION');

      consoleSpy.mockRestore();
    });
  });
});
