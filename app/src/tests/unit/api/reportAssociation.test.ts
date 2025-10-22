import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiReportStore, LocalStorageReportStore } from '@/api/reportAssociation';
import { UserReportAdapter } from '@/adapters/UserReportAdapter';
import {
  TEST_USER_IDS,
  TEST_REPORT_IDS,
  TEST_USER_REPORT_IDS,
  TEST_LABELS,
  mockReportInput,
  mockReport,
  mockReportApiResponse,
  mockSuccessFetchResponse,
  mockErrorFetchResponse,
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
      (global.fetch as any).mockResolvedValue(
        mockSuccessFetchResponse(mockReportApiResponse())
      );

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
      (global.fetch as any).mockResolvedValue(
        mockSuccessFetchResponse([mockReportApiResponse()])
      );

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
  });

  describe('findById', () => {
    it('given valid IDs then fetches specific association', async () => {
      (global.fetch as any).mockResolvedValue(
        mockSuccessFetchResponse(mockReportApiResponse())
      );

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

      await expect(store.findById(TEST_USER_IDS.USER_123, TEST_REPORT_IDS.REPORT_456)).rejects.toThrow(
        'Failed to fetch association'
      );
    });
  });

  describe('findByUserReportId', () => {
    it('given valid user report ID then fetches report', async () => {
      (global.fetch as any).mockResolvedValue(
        mockSuccessFetchResponse(mockReportApiResponse())
      );

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
        countryId: 'us',
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
        countryId: 'uk',
      });
      const result1 = await store.create(input1);
      const result2 = await store.create(input2);

      expect(result1.id).toMatch(/^sur-/);
      expect(result2.id).toMatch(/^sur-/);
      expect(result1.id).not.toBe(result2.id);
    });

    it('given duplicate report then throws error', async () => {
      const input = mockReportInput();
      await store.create(input);

      await expect(store.create(input)).rejects.toThrow(
        'Association already exists'
      );
    });
  });

  describe('findByUser', () => {
    it('given user with reports then returns all user reports', async () => {
      await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));
      await store.create(mockReportInput({
        reportId: TEST_REPORT_IDS.REPORT_789,
        label: TEST_LABELS.TEST_REPORT_2,
      }));

      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      expect(result).toHaveLength(2);
      expect(result[0].reportId).toBe(TEST_REPORT_IDS.REPORT_456);
      expect(result[1].reportId).toBe(TEST_REPORT_IDS.REPORT_789);
    });

    it('given user with no reports then returns empty array', async () => {
      const result = await store.findByUser('nonexistent-user');

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('given existing report then returns it', async () => {
      await store.create(mockReportInput());

      const result = await store.findById(TEST_USER_IDS.USER_123, TEST_REPORT_IDS.REPORT_456);

      expect(result).toMatchObject({
        userId: TEST_USER_IDS.USER_123,
        reportId: TEST_REPORT_IDS.REPORT_456,
        countryId: 'us',
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
