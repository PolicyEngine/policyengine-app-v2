import { beforeEach, describe, expect, test } from 'vitest';
import { detectV1Reports, hasV1Reports } from '@/libs/migration/detect';

const LS_KEY = 'user-report-associations';
const TEST_USER_ID = 'user-abc-123';
const OTHER_USER_ID = 'user-xyz-789';

function makeV1Report(overrides: Record<string, any> = {}) {
  return {
    id: 'ur-v1-001',
    userId: TEST_USER_ID,
    reportId: '42',
    countryId: 'us',
    label: 'My v1 report',
    ...overrides,
  };
}

function makeV2Report(overrides: Record<string, any> = {}) {
  return {
    id: 'ur-v2-001',
    userId: TEST_USER_ID,
    reportId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    countryId: 'us',
    label: 'My v2 report',
    outputType: 'household',
    simulationIds: ['sim-uuid-1', 'sim-uuid-2'],
    ...overrides,
  };
}

describe('detect', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('detectV1Reports', () => {
    test('given empty localStorage then returns empty array', () => {
      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toEqual([]);
    });

    test('given only v2 reports then returns empty array', () => {
      localStorage.setItem(LS_KEY, JSON.stringify([makeV2Report()]));

      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toEqual([]);
    });

    test('given v1 report missing outputType then detects it', () => {
      const v1 = makeV1Report({ outputType: undefined, simulationIds: ['sim-1'] });
      localStorage.setItem(LS_KEY, JSON.stringify([v1]));

      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        userReportId: 'ur-v1-001',
        reportId: '42',
        label: 'My v1 report',
        countryId: 'us',
      });
    });

    test('given v1 report missing simulationIds then detects it', () => {
      const v1 = makeV1Report({ outputType: 'household', simulationIds: undefined });
      localStorage.setItem(LS_KEY, JSON.stringify([v1]));

      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toHaveLength(1);
    });

    test('given v1 report with empty simulationIds then detects it', () => {
      const v1 = makeV1Report({ outputType: 'household', simulationIds: [] });
      localStorage.setItem(LS_KEY, JSON.stringify([v1]));

      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toHaveLength(1);
    });

    test('given v1 report missing both fields then detects it', () => {
      const v1 = makeV1Report();
      localStorage.setItem(LS_KEY, JSON.stringify([v1]));

      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toHaveLength(1);
    });

    test('given mixed v1 and v2 reports then returns only v1', () => {
      const reports = [makeV1Report(), makeV2Report()];
      localStorage.setItem(LS_KEY, JSON.stringify(reports));

      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].reportId).toBe('42');
    });

    test('given reports for different users then filters by userId', () => {
      const reports = [
        makeV1Report({ userId: TEST_USER_ID }),
        makeV1Report({ id: 'ur-v1-002', userId: OTHER_USER_ID, reportId: '99' }),
      ];
      localStorage.setItem(LS_KEY, JSON.stringify(reports));

      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].userReportId).toBe('ur-v1-001');
    });

    test('given corrupt JSON in localStorage then returns empty array', () => {
      localStorage.setItem(LS_KEY, 'not-valid-json{{{');

      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toEqual([]);
    });

    test('given non-array in localStorage then returns empty array', () => {
      localStorage.setItem(LS_KEY, JSON.stringify({ foo: 'bar' }));

      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toEqual([]);
    });

    test('given multiple v1 reports then returns all with correct shape', () => {
      const reports = [
        makeV1Report({ id: 'ur-v1-001', reportId: '10', label: 'First' }),
        makeV1Report({ id: 'ur-v1-002', reportId: '20', label: 'Second', countryId: 'uk' }),
      ];
      localStorage.setItem(LS_KEY, JSON.stringify(reports));

      const result = detectV1Reports(TEST_USER_ID);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        userReportId: 'ur-v1-001',
        reportId: '10',
        label: 'First',
        countryId: 'us',
      });
      expect(result[1]).toEqual({
        userReportId: 'ur-v1-002',
        reportId: '20',
        label: 'Second',
        countryId: 'uk',
      });
    });
  });

  describe('hasV1Reports', () => {
    test('given no v1 reports then returns false', () => {
      expect(hasV1Reports(TEST_USER_ID)).toBe(false);
    });

    test('given v1 reports then returns true', () => {
      localStorage.setItem(LS_KEY, JSON.stringify([makeV1Report()]));

      expect(hasV1Reports(TEST_USER_ID)).toBe(true);
    });
  });
});
