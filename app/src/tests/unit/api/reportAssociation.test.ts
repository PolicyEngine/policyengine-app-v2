import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiReportStore, LocalStorageReportStore } from '@/api/reportAssociation';
import {
  createUserReportAssociationV2,
  deleteUserReportAssociationV2,
  fetchUserReportAssociationByIdV2,
  fetchUserReportAssociationsV2,
  updateUserReportAssociationV2,
} from '@/api/v2/userReportAssociations';
import {
  mockMultiCountryReportList,
  mockReport,
  mockReportInput,
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_REPORT_IDS,
  TEST_USER_ID,
  TEST_USER_IDS,
  TEST_USER_REPORT_IDS,
} from '@/tests/fixtures/api/reportAssociationMocks';

// Mock the v2 API module
vi.mock('@/api/v2/userReportAssociations', () => ({
  createUserReportAssociationV2: vi.fn(),
  fetchUserReportAssociationsV2: vi.fn(),
  fetchUserReportAssociationByIdV2: vi.fn(),
  updateUserReportAssociationV2: vi.fn(),
  deleteUserReportAssociationV2: vi.fn(),
}));

describe('ApiReportStore', () => {
  let store: ApiReportStore;

  beforeEach(() => {
    store = new ApiReportStore();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('given valid report then delegates to v2 module', async () => {
      const input = mockReportInput();
      const expected = mockReport();
      (createUserReportAssociationV2 as any).mockResolvedValue(expected);

      const result = await store.create(input);

      expect(createUserReportAssociationV2).toHaveBeenCalledWith(input);
      expect(result).toEqual(expected);
    });

    it('given v2 module throws then propagates error', async () => {
      (createUserReportAssociationV2 as any).mockRejectedValue(
        new Error('Failed to create report association: 500')
      );

      await expect(store.create(mockReportInput())).rejects.toThrow('500');
    });
  });

  describe('createWithId', () => {
    it('given report with id then delegates to v2 create', async () => {
      const input = { ...mockReportInput(), id: 'pre-set-id' };
      const expected = mockReport({ id: 'pre-set-id' });
      (createUserReportAssociationV2 as any).mockResolvedValue(expected);

      const result = await store.createWithId(input);

      expect(createUserReportAssociationV2).toHaveBeenCalledWith(input);
      expect(result).toEqual(expected);
    });
  });

  describe('findByUser', () => {
    it('given valid user ID then delegates to v2 module', async () => {
      const expected = [mockReport()];
      (fetchUserReportAssociationsV2 as any).mockResolvedValue(expected);

      const result = await store.findByUser(TEST_USER_IDS.USER_123);

      expect(fetchUserReportAssociationsV2).toHaveBeenCalledWith(TEST_USER_IDS.USER_123, undefined);
      expect(result).toEqual(expected);
    });

    it('given countryId then passes it to v2 module', async () => {
      (fetchUserReportAssociationsV2 as any).mockResolvedValue([]);

      await store.findByUser(TEST_USER_IDS.USER_123, 'us');

      expect(fetchUserReportAssociationsV2).toHaveBeenCalledWith(TEST_USER_IDS.USER_123, 'us');
    });
  });

  describe('findById', () => {
    it('given existing association then returns it from list', async () => {
      const report = mockReport({ reportId: TEST_REPORT_IDS.REPORT_456 });
      (fetchUserReportAssociationsV2 as any).mockResolvedValue([report]);

      const result = await store.findById(TEST_USER_IDS.USER_123, TEST_REPORT_IDS.REPORT_456);

      expect(fetchUserReportAssociationsV2).toHaveBeenCalledWith(TEST_USER_IDS.USER_123);
      expect(result).toEqual(report);
    });

    it('given no matching report then returns null', async () => {
      (fetchUserReportAssociationsV2 as any).mockResolvedValue([]);

      const result = await store.findById(TEST_USER_IDS.USER_123, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByUserReportId', () => {
    it('given valid user report ID then delegates to v2 module', async () => {
      const expected = mockReport();
      (fetchUserReportAssociationByIdV2 as any).mockResolvedValue(expected);

      const result = await store.findByUserReportId(TEST_USER_REPORT_IDS.SUR_ABC123);

      expect(fetchUserReportAssociationByIdV2).toHaveBeenCalledWith(
        TEST_USER_REPORT_IDS.SUR_ABC123
      );
      expect(result).toEqual(expected);
    });

    it('given nonexistent ID then returns null', async () => {
      (fetchUserReportAssociationByIdV2 as any).mockResolvedValue(null);

      const result = await store.findByUserReportId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('given valid params then delegates to v2 module', async () => {
      const expected = mockReport({ label: 'Updated' });
      (updateUserReportAssociationV2 as any).mockResolvedValue(expected);

      const result = await store.update('sur-abc123', TEST_USER_IDS.USER_123, {
        label: 'Updated',
      });

      expect(updateUserReportAssociationV2).toHaveBeenCalledWith(
        'sur-abc123',
        TEST_USER_IDS.USER_123,
        { label: 'Updated', last_run_at: null }
      );
      expect(result).toEqual(expected);
    });
  });

  describe('delete', () => {
    it('given valid params then delegates to v2 module', async () => {
      (deleteUserReportAssociationV2 as any).mockResolvedValue(undefined);

      await store.delete('sur-abc123', TEST_USER_IDS.USER_123);

      expect(deleteUserReportAssociationV2).toHaveBeenCalledWith(
        'sur-abc123',
        TEST_USER_IDS.USER_123
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
      const result1 = await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));
      const result2 = await store.create(
        mockReportInput({
          reportId: TEST_REPORT_IDS.REPORT_789,
          label: TEST_LABELS.TEST_REPORT_2,
        })
      );

      expect(result1.id).toMatch(/^sur-/);
      expect(result2.id).toMatch(/^sur-/);
      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('createWithId', () => {
    it('given report with id then stores with that id', async () => {
      const input = { ...mockReportInput(), id: 'custom-id' };
      const result = await store.createWithId(input);

      expect(result.id).toBe('custom-id');
    });

    it('given duplicate id then throws error', async () => {
      const input = { ...mockReportInput(), id: 'custom-id' };
      await store.createWithId(input);

      await expect(store.createWithId(input)).rejects.toThrow(
        'Association with id custom-id already exists'
      );
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

    it('given countryId filter then returns only matching reports', async () => {
      mockLocalStorage['user-report-associations'] = JSON.stringify(mockMultiCountryReportList);

      const result = await store.findByUser(TEST_USER_ID, TEST_COUNTRIES.US);

      expect(result).toHaveLength(2);
      expect(result.every((r) => r.countryId === TEST_COUNTRIES.US)).toBe(true);
    });

    it('given countryId filter for UK then returns only UK reports', async () => {
      mockLocalStorage['user-report-associations'] = JSON.stringify(mockMultiCountryReportList);

      const result = await store.findByUser(TEST_USER_ID, TEST_COUNTRIES.UK);

      expect(result).toHaveLength(1);
      expect(result[0].countryId).toBe(TEST_COUNTRIES.UK);
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

  describe('update', () => {
    it('given existing report then update succeeds', async () => {
      const created = await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));

      const result = await store.update(created.id, TEST_USER_IDS.USER_123, {
        label: 'Updated Label',
      });

      expect(result.label).toBe('Updated Label');
      expect(result.id).toBe(created.id);
      expect(result.updatedAt).toBeDefined();
    });

    it('given nonexistent report then update throws error', async () => {
      await expect(
        store.update('sur-nonexistent', TEST_USER_IDS.USER_123, { label: 'Updated Label' })
      ).rejects.toThrow('UserReport with id sur-nonexistent not found');
    });

    it('given existing report then update persists to localStorage', async () => {
      const created = await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));

      await store.update(created.id, TEST_USER_IDS.USER_123, { label: 'Updated Label' });

      const persisted = await store.findById(created.userId, created.reportId);
      expect(persisted?.label).toBe('Updated Label');
    });

    it('given multiple reports then updates correct one by ID', async () => {
      const created1 = await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));
      const created2 = await store.create(
        mockReportInput({
          reportId: TEST_REPORT_IDS.REPORT_789,
          label: TEST_LABELS.TEST_REPORT_2,
        })
      );

      await store.update(created1.id, TEST_USER_IDS.USER_123, { label: 'Updated Label' });

      const updated = await store.findById(created1.userId, created1.reportId);
      const unchanged = await store.findById(created2.userId, created2.reportId);
      expect(updated?.label).toBe('Updated Label');
      expect(unchanged?.label).toBe(TEST_LABELS.TEST_REPORT_2);
    });
  });

  describe('delete', () => {
    it('given existing report then deletes it', async () => {
      const created = await store.create(mockReportInput());

      await store.delete(created.id, TEST_USER_IDS.USER_123);

      const result = await store.findByUser(TEST_USER_IDS.USER_123);
      expect(result).toHaveLength(0);
    });

    it('given nonexistent report then throws error', async () => {
      await expect(store.delete('sur-nonexistent', TEST_USER_IDS.USER_123)).rejects.toThrow(
        'Association with id sur-nonexistent not found'
      );
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
