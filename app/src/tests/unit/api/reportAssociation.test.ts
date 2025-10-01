import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UserReportAdapter } from '@/adapters/UserReportAdapter';
import { ApiReportStore, SessionStorageReportStore } from '@/api/reportAssociation';
import {
  mockApiResponse,
  mockApiResponseList,
  mockCreationPayload,
  mockUserReport,
  mockUserReportList,
  TEST_REPORT_ID,
  TEST_USER_ID,
} from '@/tests/fixtures/api/reportAssociationMocks';

global.fetch = vi.fn();

vi.mock('@/adapters/UserReportAdapter', () => ({
  UserReportAdapter: {
    toCreationPayload: vi.fn(),
    fromApiResponse: vi.fn(),
  },
}));

describe('ApiReportStore', () => {
  let store: ApiReportStore;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new ApiReportStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    test('given valid report association then creates successfully', async () => {
      // Given
      (UserReportAdapter.toCreationPayload as any).mockReturnValue(mockCreationPayload);
      (UserReportAdapter.fromApiResponse as any).mockReturnValue(mockUserReport);
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.create(mockUserReport);

      // Then
      expect(UserReportAdapter.toCreationPayload).toHaveBeenCalledWith(mockUserReport);
      expect(global.fetch).toHaveBeenCalledWith('/api/user-report-associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockCreationPayload),
      });
      expect(UserReportAdapter.fromApiResponse).toHaveBeenCalledWith(mockApiResponse);
      expect(result).toEqual(mockUserReport);
    });

    test('given API returns error then throws error', async () => {
      // Given
      (UserReportAdapter.toCreationPayload as any).mockReturnValue(mockCreationPayload);
      const mockResponse = {
        ok: false,
        status: 400,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(store.create(mockUserReport)).rejects.toThrow(
        'Failed to create report association'
      );
    });

    test('given network error then propagates error', async () => {
      // Given
      (UserReportAdapter.toCreationPayload as any).mockReturnValue(mockCreationPayload);
      const networkError = new Error('Network failure');
      (global.fetch as any).mockRejectedValue(networkError);

      // When/Then
      await expect(store.create(mockUserReport)).rejects.toThrow('Network failure');
    });
  });

  describe('findByUser', () => {
    test('given valid user ID then returns list of reports', async () => {
      // Given
      (UserReportAdapter.fromApiResponse as any).mockImplementation((data: any) => {
        const index = mockApiResponseList.indexOf(data);
        return mockUserReportList[index];
      });
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockApiResponseList),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findByUser(TEST_USER_ID);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/user-report-associations/user/${TEST_USER_ID}`
      );
      expect(UserReportAdapter.fromApiResponse).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUserReportList);
    });

    test('given user with no reports then returns empty array', async () => {
      // Given
      const userId = 'user-with-no-reports';
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue([]),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findByUser(userId);

      // Then
      expect(result).toEqual([]);
      expect(UserReportAdapter.fromApiResponse).not.toHaveBeenCalled();
    });

    test('given API returns error then throws error', async () => {
      // Given
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(store.findByUser(TEST_USER_ID)).rejects.toThrow(
        'Failed to fetch user associations'
      );
    });
  });

  describe('findById', () => {
    test('given valid user and report IDs then returns report', async () => {
      // Given
      (UserReportAdapter.fromApiResponse as any).mockReturnValue(mockUserReport);
      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(mockApiResponse),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findById(TEST_USER_ID, TEST_REPORT_ID);

      // Then
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/user-report-associations/${TEST_USER_ID}/${TEST_REPORT_ID}`
      );
      expect(UserReportAdapter.fromApiResponse).toHaveBeenCalledWith(mockApiResponse);
      expect(result).toEqual(mockUserReport);
    });

    test('given non-existent association then returns null', async () => {
      // Given
      const mockResponse = {
        ok: false,
        status: 404,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When
      const result = await store.findById(TEST_USER_ID, 'non-existent');

      // Then
      expect(result).toBeNull();
      expect(UserReportAdapter.fromApiResponse).not.toHaveBeenCalled();
    });

    test('given server error then throws error', async () => {
      // Given
      const mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      // When/Then
      await expect(store.findById(TEST_USER_ID, TEST_REPORT_ID)).rejects.toThrow(
        'Failed to fetch association'
      );
    });
  });
});

describe('SessionStorageReportStore', () => {
  let store: SessionStorageReportStore;
  let mockSessionStorage: { [key: string]: string };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage = {};

    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn((key) => mockSessionStorage[key] || null),
        setItem: vi.fn((key, value) => {
          mockSessionStorage[key] = value;
        }),
        removeItem: vi.fn((key) => {
          delete mockSessionStorage[key];
        }),
        clear: vi.fn(() => {
          mockSessionStorage = {};
        }),
      },
      writable: true,
    });

    store = new SessionStorageReportStore();
  });

  describe('create', () => {
    test('given new report association then stores in session storage', async () => {
      // Given
      const report = { ...mockUserReport };
      delete (report as any).createdAt; // Test that createdAt is generated

      // When
      const result = await store.create(report);

      // Then
      const { id, ...reportWithoutId } = report;
      expect(result).toMatchObject({
        ...reportWithoutId,
        isCreated: true,
      });
      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^sur-/); // Should have the sur- prefix
      expect(result.createdAt).toBeDefined();
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'user-report-associations',
        expect.any(String)
      );
    });

    test('given duplicate association then throws error', async () => {
      // Given
      mockSessionStorage['user-report-associations'] = JSON.stringify([mockUserReport]);

      // When/Then
      await expect(store.create(mockUserReport)).rejects.toThrow('Association already exists');
    });

    test('given existing reports then appends new report', async () => {
      // Given
      const existingReport = mockUserReportList[0];
      mockSessionStorage['user-report-associations'] = JSON.stringify([existingReport]);
      const newReport = {
        ...mockUserReport,
        reportId: 'new-report',
        id: 'new-report',
      };

      // When
      await store.create(newReport);

      // Then
      const stored = JSON.parse(mockSessionStorage['user-report-associations']);
      expect(stored).toHaveLength(2);
      expect(stored[1].reportId).toBe('new-report');
    });
  });

  describe('findByUser', () => {
    test('given user with reports then returns filtered list', async () => {
      // Given
      const otherUserReport = {
        ...mockUserReport,
        userId: 'other-user',
        reportId: 'other-report',
      };
      mockSessionStorage['user-report-associations'] = JSON.stringify([
        ...mockUserReportList,
        otherUserReport,
      ]);

      // When
      const result = await store.findByUser(TEST_USER_ID);

      // Then
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockUserReportList);
    });

    test('given user with no reports then returns empty array', async () => {
      // Given
      mockSessionStorage['user-report-associations'] = JSON.stringify(mockUserReportList);

      // When
      const result = await store.findByUser('user-with-no-reports');

      // Then
      expect(result).toEqual([]);
    });

    test('given empty storage then returns empty array', async () => {
      // When
      const result = await store.findByUser('any-user');

      // Then
      expect(result).toEqual([]);
    });

    test('given corrupted storage data then returns empty array', async () => {
      // Given
      mockSessionStorage['user-report-associations'] = 'invalid-json';

      // When
      const result = await store.findByUser(TEST_USER_ID);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    test('given existing association then returns report', async () => {
      // Given
      mockSessionStorage['user-report-associations'] = JSON.stringify(mockUserReportList);

      // When
      const result = await store.findById(TEST_USER_ID, 'report-1');

      // Then
      expect(result).toEqual(mockUserReportList[0]);
    });

    test('given non-existent association then returns null', async () => {
      // Given
      mockSessionStorage['user-report-associations'] = JSON.stringify(mockUserReportList);

      // When
      const result = await store.findById(TEST_USER_ID, 'non-existent');

      // Then
      expect(result).toBeNull();
    });

    test('given wrong user ID then returns null', async () => {
      // Given
      mockSessionStorage['user-report-associations'] = JSON.stringify(mockUserReportList);

      // When
      const result = await store.findById('wrong-user', 'report-1');

      // Then
      expect(result).toBeNull();
    });
  });
});
