import { describe, it, expect } from 'vitest';
import { getDisplayStatus, STATUS_DISPLAY_MAP } from '@/utils/statusMapping';
import {
  TEST_API_STATUSES,
  EXPECTED_DISPLAY_STATUSES,
} from '@/tests/fixtures/utils/statusMappingMocks';

describe('statusMapping', () => {
  describe('getDisplayStatus', () => {
    it('given pending status then returns Computing', () => {
      // When
      const result = getDisplayStatus(TEST_API_STATUSES.PENDING);

      // Then
      expect(result).toBe(EXPECTED_DISPLAY_STATUSES.COMPUTING);
    });

    it('given complete status then returns Complete', () => {
      // When
      const result = getDisplayStatus(TEST_API_STATUSES.COMPLETE);

      // Then
      expect(result).toBe(EXPECTED_DISPLAY_STATUSES.COMPLETE);
    });

    it('given error status then returns Error', () => {
      // When
      const result = getDisplayStatus(TEST_API_STATUSES.ERROR);

      // Then
      expect(result).toBe(EXPECTED_DISPLAY_STATUSES.ERROR);
    });
  });

  describe('STATUS_DISPLAY_MAP', () => {
    it('given map exported then contains all mappings', () => {
      // Then
      expect(STATUS_DISPLAY_MAP).toEqual({
        pending: EXPECTED_DISPLAY_STATUSES.COMPUTING,
        complete: EXPECTED_DISPLAY_STATUSES.COMPLETE,
        error: EXPECTED_DISPLAY_STATUSES.ERROR,
      });
    });
  });
});
