import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import { reportKeys } from '@/libs/queryKeys';
import {
  createTestQueryClient,
  mockCompleteEconomyStatus,
  mockCompleteHouseholdStatus,
  TEST_COUNTRIES,
  TEST_V2_REPORT_IDS,
  TEST_YEARS,
} from '@/tests/fixtures/libs/calculations/resultPersisterMocks';
import type { CalcStatus } from '@/types/calculation';

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

  describe('v2 economy analysis result', () => {
    it('given economy result then invalidates report cache using report_id', async () => {
      const status = mockCompleteEconomyStatus();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: reportKeys.byId(TEST_V2_REPORT_IDS.ECONOMY),
      });
    });

    it('given economy result then resolves without error', async () => {
      const status = mockCompleteEconomyStatus();

      await expect(
        persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT)
      ).resolves.toBeUndefined();
    });
  });

  describe('v2 household analysis result', () => {
    it('given household result then invalidates report cache using report_id', async () => {
      const status = mockCompleteHouseholdStatus();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: reportKeys.byId(TEST_V2_REPORT_IDS.HOUSEHOLD),
      });
    });

    it('given household result then resolves without error', async () => {
      const status = mockCompleteHouseholdStatus();

      await expect(
        persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT)
      ).resolves.toBeUndefined();
    });
  });

  describe('result without report_id', () => {
    it('given result without report_id then does not invalidate any cache', async () => {
      const status: CalcStatus = {
        status: 'complete',
        result: { some: 'data' } as any,
        metadata: {
          calcId: 'test-calc',
          targetType: 'report',
          calcType: 'societyWide',
          startedAt: Date.now(),
        },
      };
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      await persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT);

      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('given missing result then throws error', async () => {
      const status: CalcStatus = {
        status: 'complete',
        metadata: {
          calcId: 'test-calc',
          targetType: 'report',
          calcType: 'societyWide',
          startedAt: Date.now(),
        },
      };

      await expect(
        persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT)
      ).rejects.toThrow('Cannot persist: result is missing from CalcStatus');
    });

    it('given undefined result then throws error', async () => {
      const status: CalcStatus = {
        status: 'complete',
        result: undefined,
        metadata: {
          calcId: 'test-calc',
          targetType: 'report',
          calcType: 'societyWide',
          startedAt: Date.now(),
        },
      };

      await expect(
        persister.persist(status, TEST_COUNTRIES.US, TEST_YEARS.DEFAULT)
      ).rejects.toThrow('Cannot persist: result is missing from CalcStatus');
    });
  });
});
