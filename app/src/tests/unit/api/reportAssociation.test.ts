import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageReportStore } from '@/api/reportAssociation';
import {
  mockMultiCountryReportList,
  mockReportInput,
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_REPORT_IDS,
  TEST_USER_ID,
  TEST_USER_IDS,
} from '@/tests/fixtures/api/reportAssociationMocks';

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

  describe('update', () => {
    it('given existing report then update succeeds and returns updated report', async () => {
      // Given
      const created = await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.label).toBe('Updated Label');
      expect(result.id).toBe(created.id);
      expect(result.reportId).toBe(created.reportId);
      expect(result.updatedAt).toBeDefined();
    });

    it('given nonexistent report then update throws error', async () => {
      // Given - no report created

      // When & Then
      await expect(store.update('sur-nonexistent', { label: 'Updated Label' })).rejects.toThrow(
        'UserReport with id sur-nonexistent not found'
      );
    });

    it('given existing report then updatedAt timestamp is set', async () => {
      // Given
      const created = await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));
      const beforeUpdate = new Date().toISOString();

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.updatedAt).toBeDefined();
      expect(result.updatedAt! >= beforeUpdate).toBe(true);
    });

    it('given existing report then update persists to localStorage', async () => {
      // Given
      const created = await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));

      // When
      await store.update(created.id!, { label: 'Updated Label' });

      // Then
      const persisted = await store.findById(created.userId, created.reportId);
      expect(persisted?.label).toBe('Updated Label');
    });

    it('given multiple reports then updates correct one by ID', async () => {
      // Given
      const created1 = await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));
      const created2 = await store.create(
        mockReportInput({
          reportId: TEST_REPORT_IDS.REPORT_789,
          label: TEST_LABELS.TEST_REPORT_2,
        })
      );

      // When
      await store.update(created1.id!, { label: 'Updated Label' });

      // Then
      const updated = await store.findById(created1.userId, created1.reportId);
      const unchanged = await store.findById(created2.userId, created2.reportId);
      expect(updated?.label).toBe('Updated Label');
      expect(unchanged?.label).toBe(TEST_LABELS.TEST_REPORT_2);
    });

    it('given update with partial data then only specified fields are updated', async () => {
      // Given
      const created = await store.create(mockReportInput({ label: TEST_LABELS.TEST_REPORT_1 }));

      // When
      const result = await store.update(created.id!, { label: 'Updated Label' });

      // Then
      expect(result.label).toBe('Updated Label');
      expect(result.countryId).toBe(created.countryId); // unchanged
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
