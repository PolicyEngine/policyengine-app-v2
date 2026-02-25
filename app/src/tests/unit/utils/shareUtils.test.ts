import { describe, expect, test } from 'vitest';
import type { UserReport } from '@/types/ingredients/UserReport';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';
import {
  buildSharePath,
  createShareData,
  decodeShareData,
  encodeShareData,
  extractShareDataFromUrl,
  getShareDataUserReportId,
  isValidShareData,
} from '@/utils/shareUtils';

const TEST_USER_ID = 'user-123';
const TEST_REPORT_ID = 'report-456';
const TEST_SIM_ID = 'sim-789';
const TEST_POLICY_ID = 'policy-abc';
const TEST_HOUSEHOLD_ID = 'hh-def';

const mockShareData = {
  userReport: {
    id: 'sur-001',
    reportId: TEST_REPORT_ID,
    countryId: 'us' as const,
    label: 'Test Report',
    isCreated: true,
  },
  userSimulations: [
    { simulationId: TEST_SIM_ID, countryId: 'us' as const, label: 'Sim 1', isCreated: true },
  ],
  userPolicies: [
    { policyId: TEST_POLICY_ID, countryId: 'us' as const, label: 'Policy 1', isCreated: true },
  ],
  userHouseholds: [
    {
      type: 'household' as const,
      householdId: TEST_HOUSEHOLD_ID,
      countryId: 'us' as const,
      label: 'HH 1',
      isCreated: true,
    },
  ],
};

describe('encodeShareData / decodeShareData', () => {
  test('given valid data then encode and decode roundtrips correctly', () => {
    const encoded = encodeShareData(mockShareData as any);
    const decoded = decodeShareData(encoded);
    expect(decoded).toEqual(mockShareData);
  });

  test('given encoded string then is URL-safe (no +, /, or =)', () => {
    const encoded = encodeShareData(mockShareData as any);
    expect(encoded).not.toMatch(/[+/=]/);
  });

  test('given invalid base64 then decodeShareData returns null', () => {
    const result = decodeShareData('!!!invalid!!!');
    expect(result).toBeNull();
  });

  test('given valid base64 but invalid JSON then returns null', () => {
    // btoa('not-json') = 'bm90LWpzb24='
    const urlSafe = btoa('not-json').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const result = decodeShareData(urlSafe);
    expect(result).toBeNull();
  });

  test('given valid JSON but invalid share data then returns null', () => {
    const json = JSON.stringify({ wrong: 'structure' });
    const urlSafe = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const result = decodeShareData(urlSafe);
    expect(result).toBeNull();
  });
});

describe('isValidShareData', () => {
  test('given valid share data then returns true', () => {
    expect(isValidShareData(mockShareData)).toBe(true);
  });

  test('given null then returns false', () => {
    expect(isValidShareData(null)).toBe(false);
  });

  test('given non-object then returns false', () => {
    expect(isValidShareData('string')).toBe(false);
  });

  test('given missing userReport then returns false', () => {
    const { userReport, ...rest } = mockShareData;
    expect(isValidShareData(rest)).toBe(false);
  });

  test('given userReport without reportId then returns false', () => {
    const data = { ...mockShareData, userReport: { countryId: 'us' } };
    expect(isValidShareData(data)).toBe(false);
  });

  test('given invalid countryId then returns false', () => {
    const data = {
      ...mockShareData,
      userReport: { ...mockShareData.userReport, countryId: 'invalid' },
    };
    expect(isValidShareData(data)).toBe(false);
  });

  test('given numeric reportId then returns true', () => {
    const data = {
      ...mockShareData,
      userReport: { ...mockShareData.userReport, reportId: 123 },
    };
    expect(isValidShareData(data)).toBe(true);
  });

  test('given invalid userSimulations then returns false', () => {
    const data = { ...mockShareData, userSimulations: 'not-array' };
    expect(isValidShareData(data)).toBe(false);
  });

  test('given simulation missing required fields then returns false', () => {
    const data = {
      ...mockShareData,
      userSimulations: [{ label: 'no simulationId or countryId' }],
    };
    expect(isValidShareData(data)).toBe(false);
  });
});

describe('buildSharePath', () => {
  test('given share data then builds correct path', () => {
    const path = buildSharePath(mockShareData as any);
    expect(path).toMatch(/^\/us\/report-output\/sur-001\?share=/);
  });

  test('given share data without id then uses reportId', () => {
    const noId = {
      ...mockShareData,
      userReport: { ...mockShareData.userReport, id: undefined },
    };
    const path = buildSharePath(noId as any);
    expect(path).toMatch(/^\/us\/report-output\/report-456\?share=/);
  });
});

describe('extractShareDataFromUrl', () => {
  test('given URL with share param then extracts data', () => {
    const encoded = encodeShareData(mockShareData as any);
    const params = new URLSearchParams({ share: encoded });
    const result = extractShareDataFromUrl(params);
    expect(result).toEqual(mockShareData);
  });

  test('given URL without share param then returns null', () => {
    const params = new URLSearchParams({});
    const result = extractShareDataFromUrl(params);
    expect(result).toBeNull();
  });
});

describe('createShareData', () => {
  test('given user associations then strips userId and timestamps', () => {
    const userReport: UserReport = {
      id: 'sur-001',
      userId: TEST_USER_ID,
      reportId: TEST_REPORT_ID,
      countryId: 'us',
      label: 'Test',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-02',
      isCreated: true,
    };
    const userSimulations: UserSimulation[] = [
      {
        id: 'usa-001',
        userId: TEST_USER_ID,
        simulationId: TEST_SIM_ID,
        countryId: 'us',
        label: 'Sim',
        createdAt: '2025-01-01',
        isCreated: true,
      },
    ];

    const result = createShareData(userReport, userSimulations, [], []);
    expect(result).not.toBeNull();
    expect((result as any).userReport.userId).toBeUndefined();
    expect((result as any).userReport.createdAt).toBeUndefined();
    expect((result as any).userSimulations[0].userId).toBeUndefined();
  });

  test('given userReport without id then returns null', () => {
    const noId = {
      userId: TEST_USER_ID,
      reportId: '',
      countryId: 'us' as const,
      isCreated: true,
    } as UserReport;
    const result = createShareData(noId, [], [], []);
    expect(result).toBeNull();
  });

  test('given userReport without reportId then returns null', () => {
    const noReportId = {
      id: 'sur-001',
      userId: TEST_USER_ID,
      reportId: '',
      countryId: 'us' as const,
      isCreated: true,
    } as UserReport;
    const result = createShareData(noReportId, [], [], []);
    expect(result).toBeNull();
  });
});

describe('getShareDataUserReportId', () => {
  test('given shareData with id then returns id', () => {
    const result = getShareDataUserReportId(mockShareData as any);
    expect(result).toBe('sur-001');
  });

  test('given shareData without id then returns reportId', () => {
    const noId = {
      ...mockShareData,
      userReport: { ...mockShareData.userReport, id: undefined },
    };
    const result = getShareDataUserReportId(noId as any);
    expect(result).toBe(TEST_REPORT_ID);
  });
});
