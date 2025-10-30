import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserReportAdapter } from '@/adapters/UserReportAdapter';
import { ApiReportStore, LocalStorageReportStore } from '@/api/reportAssociation';
import {
  mockErrorFetchResponse,
  mockMultiCountryApiResponses,
  mockMultiCountryReportList,
  mockReport,
  mockReportApiResponse,
  mockReportInput,
  mockSuccessFetchResponse,
  mockUserReport,
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_REPORT_IDS,
  TEST_USER_ID,
  TEST_USER_IDS,
  TEST_USER_REPORT_IDS,
} from '@/tests/fixtures/api/reportAssociationMocks';

// Mock the adapter
vi.mock('@/adapters/UserReportAdapter');

// Mock fetch
global.fetch = vi.fn();

describe('ApiReportStore', () => {
  let store: ApiReportStore;

  beforeEach(() => {
    store = new ApiReportStore();
    vi.clearAllMocks();
    (UserReportAdapter.toCreationPayload as any).mockReturnValue(mockReportApiResponse());
    (UserReportAdapter.fromApiResponse as any).mockReturnValue(mockReport());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    it('given valid report then creates report association', async () => {
      (global.fetch as any).mockResolvedValue(mockSuccessFetchResponse(mockReportApiResponse()));

      const result = await store.create(mockReportInput());

      expect(fetch).toHaveBeenCalledWith(
        '/api/user-report-associations',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockReportApiResponse()),
        })
      );
      expect(result).toEqual(mockReport());
    });

    it('given API error then throws error', async () => {
      (global.fetch as any).mockResolvedValue(mockErrorFetchResponse(500));

      await expect(store.create(mockReportInput())).rejects.toThrow(
        'Failed to create report association'
      );
    });
  });

  describe('findByUser', () => {
    it('given valid user ID then fetches user report associations', async () => {
      (global.fetch as any).mockResolvedValue(mockSuccessFetchResponse([mockReportApiResponse()]));

      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      expect(fetch).toHaveBeenCalledWith(
        `/api/user-report-associations/user/${TEST_USER_IDS.USER_123}`,
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual([mockReport()]);
    });

    it('given API error then throws error', async () => {
      (global.fetch as any).mockResolvedValue(mockErrorFetchResponse(500));

      await expect(store.findByUser(TEST_USER_IDS.USER_123)).rejects.toThrow(
        'Failed to fetch user associations'
      );
    });

    test('given countryId filter then returns only matching reports', async () => {
      // Given
      (UserReportAdapter.fromApiResponse as any).mockImplementation((data: any) => {
        return mockMultiCountryReportList.find((r) => r.reportId === data.reportId);
      });
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMultiCountryApiResponses),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findByUser(TEST_USER_ID, TEST_COUNTRIES.US);

      // Then
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.countryId === TEST_COUNTRIES.US)).toBe(true);
      expect(result.map((r) => r.label)).toEqual(['US Report 1', 'US Report 2']);
    });

    test('given countryId filter for UK then returns only UK reports', async () => {
      // Given
      (UserReportAdapter.fromApiResponse as any).mockImplementation((data: any) => {
        return mockMultiCountryReportList.find((r) => r.reportId === data.reportId);
      });
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMultiCountryApiResponses),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findByUser(TEST_USER_ID, TEST_COUNTRIES.UK);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].countryId).toBe(TEST_COUNTRIES.UK);
      expect(result[0].label).toBe('UK Report 1');
    });

    test('given no countryId filter then returns all reports', async () => {
      // Given
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(store.findByUser(TEST_USER_IDS.USER_123)).rejects.toThrow(
        'Failed to fetch user associations'
      );
    });

    test('given countryId filter then returns only matching reports', async () => {
      // Given
      (UserReportAdapter.fromApiResponse as any).mockImplementation((data: any) => {
        return mockMultiCountryReportList.find((r) => r.reportId === data.reportId);
      });
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMultiCountryApiResponses),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findByUser(TEST_USER_ID, TEST_COUNTRIES.US);

      // Then
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.countryId === TEST_COUNTRIES.US)).toBe(true);
      expect(result.map((r) => r.label)).toEqual(['US Report 1', 'US Report 2']);
    });

    test('given countryId filter for UK then returns only UK reports', async () => {
      // Given
      (UserReportAdapter.fromApiResponse as any).mockImplementation((data: any) => {
        return mockMultiCountryReportList.find((r) => r.reportId === data.reportId);
      });
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMultiCountryApiResponses),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findByUser(TEST_USER_ID, TEST_COUNTRIES.UK);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].countryId).toBe(TEST_COUNTRIES.UK);
      expect(result[0].label).toBe('UK Report 1');
    });

    test('given no countryId filter then returns all reports', async () => {
      // Given
      (UserReportAdapter.fromApiResponse as any).mockImplementation((data: any) => {
        return mockMultiCountryReportList.find((r) => r.reportId === data.reportId);
      });
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMultiCountryApiResponses),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findByUser(TEST_USER_ID);

      // Then
      expect(result).toHaveLength(4);
      expect(result.map((r) => r.countryId)).toEqual([
        TEST_COUNTRIES.US,
        TEST_COUNTRIES.US,
        TEST_COUNTRIES.UK,
        TEST_COUNTRIES.CA,
      ]);
    });
  });

  describe('findById', () => {
    test('given valid user and report IDs then returns report', async () => {
      // Given
      // Mock the adapter to properly convert each API response
      (UserReportAdapter.fromApiResponse as any).mockImplementation((apiResponse: any) => ({
        ...mockUserReport,
        countryId: apiResponse.countryId || apiResponse.country_id,
        reportId: apiResponse.reportId || apiResponse.report_id,
      }));
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockMultiCountryApiResponses),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findByUser(TEST_USER_ID);

      // Then
      expect(result).toHaveLength(4);
      expect(result.map((r) => r.countryId)).toEqual([
        TEST_COUNTRIES.US,
        TEST_COUNTRIES.US,
        TEST_COUNTRIES.UK,
        TEST_COUNTRIES.CA,
      ]);
    });
  });

  describe('findById', () => {
    it('given valid IDs then fetches specific association', async () => {
      (global.fetch as any).mockResolvedValue(mockSuccessFetchResponse(mockReportApiResponse()));

      const result = await store.findById(TEST_USER_IDS.USER_123, TEST_REPORT_IDS.REPORT_456);

      expect(fetch).toHaveBeenCalledWith(
        `/api/user-report-associations/${TEST_USER_IDS.USER_123}/${TEST_REPORT_IDS.REPORT_456}`,
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockReport());
    });

    it('given 404 response then returns null', async () => {
      (global.fetch as any).mockResolvedValue(mockErrorFetchResponse(404));

      const result = await store.findById(TEST_USER_IDS.USER_123, 'nonexistent');

      expect(result).toBeNull();
    });

    it('given other error then throws error', async () => {
      (global.fetch as any).mockResolvedValue(mockErrorFetchResponse(500));

      await expect(
        store.findById(TEST_USER_IDS.USER_123, TEST_REPORT_IDS.REPORT_456)
      ).rejects.toThrow('Failed to fetch association');
    });
  });

  describe('findByUserReportId', () => {
    it('given valid user report ID then fetches report', async () => {
      (global.fetch as any).mockResolvedValue(mockSuccessFetchResponse(mockReportApiResponse()));

      const result = await store.findByUserReportId(TEST_USER_REPORT_IDS.SUR_ABC123);

      expect(fetch).toHaveBeenCalledWith(
        `/api/user-report-associations/${TEST_USER_REPORT_IDS.SUR_ABC123}`,
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result).toEqual(mockReport());
    });

    it('given 404 response then returns null', async () => {
      (global.fetch as any).mockResolvedValue(mockErrorFetchResponse(404));

      const result = await store.findByUserReportId('nonexistent');

      expect(result).toBeNull();
    });

    it('given other error then throws error', async () => {
      (global.fetch as any).mockResolvedValue(mockErrorFetchResponse(500));

      await expect(store.findByUserReportId(TEST_USER_REPORT_IDS.SUR_ABC123)).rejects.toThrow(
        'Failed to fetch user report'
      );
    });
  });
});

describe('LocalStorageReportStore', () => {
  let store: LocalStorageReportStore;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};
    global.localStorage = {
      getItem: vi.fn((key) => mockLocalStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: vi.fn(),
    };

    store = new LocalStorageReportStore();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('given new report then stores in localStorage', async () => {
      const input = mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 });
      const result = await store.create(input);

      expect(result).toMatchObject({
        userId: TEST_USER_IDS.USER_123,
        reportId: TEST_REPORT_IDS.REPORT_456,
        label: TEST_LABELS.TEST_REPORT_1,
      });
      expect(result.id).toMatch(/^sur-/);
      expect(result.createdAt).toBeDefined();
      expect(result.isCreated).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('given report then generates unique ID', async () => {
      const input1 = mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 });
      const input2 = mockReportInput({
        reportId: TEST_REPORT_IDS.REPORT_789,
        label: TEST_LABELS.TEST_REPORT_2,
      });
      const result1 = await store.create(input1);
      const result2 = await store.create(input2);

      expect(result1.id).toMatch(/^sur-/);
      expect(result2.id).toMatch(/^sur-/);
      expect(result1.id).not.toBe(result2.id);
    });

    it('given duplicate report then creates new association with unique ID', async () => {
      // Given
      const input = mockReportInput();
      const first = await store.create(input);

      // When
      const second = await store.create(input);

      // Then
      expect(second).toMatchObject({
        userId: first.userId,
        reportId: first.reportId,
        countryId: first.countryId,
      });
      expect(second.id).toBeDefined();
      expect(second.id).not.toBe(first.id);
      expect(second.id).toMatch(/^sur-/);
    });
  });

  describe('findByUser', () => {
    it('given user with reports then returns all user reports', async () => {
      await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));
      await store.create(
        mockReportInput({
          reportId: TEST_REPORT_IDS.REPORT_789,
          label: TEST_LABELS.TEST_REPORT_2,
        })
      );

      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      expect(result).toHaveLength(2);
      expect(result[0].reportId).toBe(TEST_REPORT_IDS.REPORT_456);
      expect(result[1].reportId).toBe(TEST_REPORT_IDS.REPORT_789);
    });

    it('given user with no reports then returns empty array', async () => {
      const result = await store.findByUser('nonexistent-user');

      expect(result).toEqual([]);
    });

    test('given countryId filter then returns only matching reports', async () => {
      // Given
      mockLocalStorage['user-report-associations'] = JSON.stringify(mockMultiCountryReportList);

      // When
      const result = await store.findByUser(TEST_USER_ID, TEST_COUNTRIES.US);

      // Then
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.countryId === TEST_COUNTRIES.US)).toBe(true);
      expect(result.map((r) => r.label)).toEqual(['US Report 1', 'US Report 2']);
    });

    test('given countryId filter for UK then returns only UK reports', async () => {
      // Given
      mockLocalStorage['user-report-associations'] = JSON.stringify(mockMultiCountryReportList);

      // When
      const result = await store.findByUser(TEST_USER_ID, TEST_COUNTRIES.UK);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].countryId).toBe(TEST_COUNTRIES.UK);
      expect(result[0].label).toBe('UK Report 1');
    });

    test('given no countryId filter then returns all user reports', async () => {
      // Given
      const otherUserReport = { ...mockMultiCountryReportList[0], userId: 'other-user' };
      mockLocalStorage['user-report-associations'] = JSON.stringify([
        ...mockMultiCountryReportList,
        otherUserReport,
      ]);

      // When
      const result = await store.findByUser(TEST_USER_ID);

      // Then
      expect(result).toHaveLength(4);
      expect(result.every((r) => r.userId === TEST_USER_ID)).toBe(true);
    });

    test('given countryId filter then returns only matching reports', async () => {
      // Given
      mockLocalStorage['user-report-associations'] = JSON.stringify(mockMultiCountryReportList);

      // When
      const result = await store.findByUser(TEST_USER_ID, TEST_COUNTRIES.US);

      // Then
      expect(result).toHaveLength(2);
      expect(result.every((r) => r.countryId === TEST_COUNTRIES.US)).toBe(true);
      expect(result.map((r) => r.label)).toEqual(['US Report 1', 'US Report 2']);
    });

    test('given countryId filter for UK then returns only UK reports', async () => {
      // Given
      mockLocalStorage['user-report-associations'] = JSON.stringify(mockMultiCountryReportList);

      // When
      const result = await store.findByUser(TEST_USER_ID, TEST_COUNTRIES.UK);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].countryId).toBe(TEST_COUNTRIES.UK);
      expect(result[0].label).toBe('UK Report 1');
    });

    test('given no countryId filter then returns all user reports', async () => {
      // Given
      const otherUserReport = { ...mockMultiCountryReportList[0], userId: 'other-user' };
      mockLocalStorage['user-report-associations'] = JSON.stringify([
        ...mockMultiCountryReportList,
        otherUserReport,
      ]);

      // When
      const result = await store.findByUser(TEST_USER_ID);

      // Then
      expect(result).toHaveLength(4);
      expect(result.every((r) => r.userId === TEST_USER_ID)).toBe(true);
    });
  });

  describe('findById', () => {
    it('given existing report then returns it', async () => {
      await store.create(mockReportInput());

      const result = await store.findById(TEST_USER_IDS.USER_123, TEST_REPORT_IDS.REPORT_456);

      expect(result).toMatchObject({
        userId: TEST_USER_IDS.USER_123,
        reportId: TEST_REPORT_IDS.REPORT_456,
      });
    });

    it('given nonexistent report then returns null', async () => {
      const result = await store.findById(TEST_USER_IDS.USER_123, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserReportId', () => {
    it('given existing user report ID then returns report', async () => {
      const created = await store.create(mockReportInput());

      const result = await store.findByUserReportId(created.id);

      expect(result).toMatchObject({
        userId: TEST_USER_IDS.USER_123,
        reportId: TEST_REPORT_IDS.REPORT_456,
      });
      expect(result?.id).toBe(created.id);
    });

    it('given nonexistent user report ID then returns null', async () => {
      const result = await store.findByUserReportId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('error handling', () => {
    it('given localStorage error on get then returns empty array', async () => {
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      expect(result).toEqual([]);
    });
  });
});
