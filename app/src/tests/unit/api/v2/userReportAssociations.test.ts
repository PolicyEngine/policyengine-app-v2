import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createUserReportAssociationV2,
  deleteUserReportAssociationV2,
  fetchUserReportAssociationByIdV2,
  fetchUserReportAssociationsV2,
  fromV2Response,
  toV2CreateRequest,
  updateUserReportAssociationV2,
} from '@/api/v2/userReportAssociations';
import {
  createMockUserReportAssociationV2Response,
  mockFetch404,
  mockFetchSuccess,
  TEST_COUNTRY_ID,
  TEST_IDS,
  TEST_TIMESTAMP,
} from '@/tests/fixtures/api/v2/shared';

vi.stubGlobal('fetch', vi.fn());

describe('userReportAssociations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // toV2CreateRequest
  // ==========================================================================

  describe('toV2CreateRequest', () => {
    test('given camelCase app input then it maps to snake_case API request', () => {
      // Given
      const input = {
        userId: TEST_IDS.USER_ID,
        reportId: TEST_IDS.REPORT_ID,
        countryId: TEST_COUNTRY_ID as 'us',
        label: 'My report',
      };

      // When
      const request = toV2CreateRequest(input);

      // Then
      expect(request).toEqual({
        user_id: TEST_IDS.USER_ID,
        report_id: TEST_IDS.REPORT_ID,
        country_id: TEST_COUNTRY_ID,
        label: 'My report',
      });
    });

    test('given undefined label then it maps to null', () => {
      // Given
      const input = {
        userId: TEST_IDS.USER_ID,
        reportId: TEST_IDS.REPORT_ID,
        countryId: TEST_COUNTRY_ID as 'us',
      };

      // When
      const request = toV2CreateRequest(input);

      // Then
      expect(request.label).toBeNull();
    });
  });

  // ==========================================================================
  // fromV2Response
  // ==========================================================================

  describe('fromV2Response', () => {
    test('given snake_case API response then it maps to camelCase app format', () => {
      // Given
      const response = createMockUserReportAssociationV2Response();

      // When
      const association = fromV2Response(response);

      // Then
      expect(association.id).toBe(TEST_IDS.ASSOCIATION_ID);
      expect(association.userId).toBe(TEST_IDS.USER_ID);
      expect(association.reportId).toBe(TEST_IDS.REPORT_ID);
      expect(association.countryId).toBe(TEST_COUNTRY_ID);
      expect(association.label).toBe('My report');
      expect(association.createdAt).toBe(TEST_TIMESTAMP);
      expect(association.updatedAt).toBe(TEST_TIMESTAMP);
    });

    test('given response then isCreated is set to true', () => {
      // Given
      const response = createMockUserReportAssociationV2Response();

      // When
      const association = fromV2Response(response);

      // Then
      expect(association.isCreated).toBe(true);
    });

    test('given null label then it maps to undefined', () => {
      // Given
      const response = { ...createMockUserReportAssociationV2Response(), label: null };

      // When
      const association = fromV2Response(response);

      // Then
      expect(association.label).toBeUndefined();
    });
  });

  // ==========================================================================
  // createUserReportAssociationV2
  // ==========================================================================

  describe('createUserReportAssociationV2', () => {
    test('given a successful POST then it returns the converted association', async () => {
      // Given
      const mockResponse = createMockUserReportAssociationV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await createUserReportAssociationV2({
        userId: TEST_IDS.USER_ID,
        reportId: TEST_IDS.REPORT_ID,
        countryId: TEST_COUNTRY_ID as 'us',
        label: 'My report',
      });

      // Then
      expect(result.id).toBe(TEST_IDS.ASSOCIATION_ID);
      expect(result.isCreated).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/user-reports/'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // ==========================================================================
  // fetchUserReportAssociationsV2
  // ==========================================================================

  describe('fetchUserReportAssociationsV2', () => {
    test('given userId then it fetches with user_id query param', async () => {
      // Given
      const mockResponse = [createMockUserReportAssociationV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserReportAssociationsV2(TEST_IDS.USER_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(TEST_IDS.USER_ID);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`user_id=${TEST_IDS.USER_ID}`),
        expect.any(Object)
      );
    });

    test('given userId and countryId then it fetches with both query params', async () => {
      // Given
      const mockResponse = [createMockUserReportAssociationV2Response()];
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserReportAssociationsV2(TEST_IDS.USER_ID, TEST_COUNTRY_ID);

      // Then
      expect(result).toHaveLength(1);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`country_id=${TEST_COUNTRY_ID}`),
        expect.any(Object)
      );
    });
  });

  // ==========================================================================
  // fetchUserReportAssociationByIdV2
  // ==========================================================================

  describe('fetchUserReportAssociationByIdV2', () => {
    test('given a successful GET then it returns the association', async () => {
      // Given
      const mockResponse = createMockUserReportAssociationV2Response();
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await fetchUserReportAssociationByIdV2(TEST_IDS.ASSOCIATION_ID);

      // Then
      expect(result).not.toBeNull();
      expect(result!.id).toBe(TEST_IDS.ASSOCIATION_ID);
    });

    test('given a 404 response then it returns null', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When
      const result = await fetchUserReportAssociationByIdV2(TEST_IDS.ASSOCIATION_ID);

      // Then
      expect(result).toBeNull();
    });
  });

  // ==========================================================================
  // updateUserReportAssociationV2
  // ==========================================================================

  describe('updateUserReportAssociationV2', () => {
    test('given a successful PATCH then it returns the updated association with user_id query param', async () => {
      // Given
      const mockResponse = {
        ...createMockUserReportAssociationV2Response(),
        label: 'Updated report',
      };
      vi.stubGlobal('fetch', mockFetchSuccess(mockResponse));

      // When
      const result = await updateUserReportAssociationV2(
        TEST_IDS.ASSOCIATION_ID,
        TEST_IDS.USER_ID,
        { label: 'Updated report' }
      );

      // Then
      expect(result.label).toBe('Updated report');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`user_id=${TEST_IDS.USER_ID}`),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  // ==========================================================================
  // deleteUserReportAssociationV2
  // ==========================================================================

  describe('deleteUserReportAssociationV2', () => {
    test('given a successful DELETE then it resolves without error', async () => {
      // Given
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

      // When / Then
      await expect(
        deleteUserReportAssociationV2(TEST_IDS.ASSOCIATION_ID, TEST_IDS.USER_ID)
      ).resolves.toBeUndefined();
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(`user_id=${TEST_IDS.USER_ID}`),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    test('given a 404 response then it does not throw', async () => {
      // Given
      vi.stubGlobal('fetch', mockFetch404());

      // When / Then
      await expect(
        deleteUserReportAssociationV2(TEST_IDS.ASSOCIATION_ID, TEST_IDS.USER_ID)
      ).resolves.toBeUndefined();
    });
  });
});
