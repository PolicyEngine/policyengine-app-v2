import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearMetadataCache,
  getCachedModelVersion,
  getCachedParameterChildren,
  getCachedParameters,
  getCachedVariables,
  setCachedModelVersion,
  setCachedParameterChildren,
  setCachedParameters,
  setCachedVariables,
} from '@/libs/metadataCache';
import {
  CACHE_TTL_MS,
  MOCK_CHILDREN_RESPONSE,
  MOCK_PARAMETER_A,
  MOCK_PARAMETER_B,
  MOCK_PARAMETERS_RECORD,
  MOCK_PARENT_PATH,
  MOCK_VARIABLES_RECORD,
  STORAGE_KEYS,
  TEST_COUNTRIES,
  TEST_VERSIONS,
  TIMESTAMPS,
} from '@/tests/fixtures/libs/metadataCacheMocks';

describe('metadataCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(Date, 'now').mockReturnValue(TIMESTAMPS.NOW);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Model version
  // -----------------------------------------------------------------------
  describe('getCachedModelVersion', () => {
    it('given no cached version then returns null', () => {
      const result = getCachedModelVersion(TEST_COUNTRIES.US);
      expect(result).toBeNull();
    });

    it('given fresh cached version then returns it', () => {
      // Given
      setCachedModelVersion(TEST_COUNTRIES.US, TEST_VERSIONS.US_VERSION_ID, TEST_VERSIONS.US_VERSION);

      // When
      const result = getCachedModelVersion(TEST_COUNTRIES.US);

      // Then
      expect(result).not.toBeNull();
      expect(result!.versionId).toBe(TEST_VERSIONS.US_VERSION_ID);
      expect(result!.version).toBe(TEST_VERSIONS.US_VERSION);
    });

    it('given stale cached version then returns null', () => {
      // Given - write with stale timestamp
      localStorage.setItem(
        STORAGE_KEYS.MODEL_VERSION(TEST_COUNTRIES.US),
        JSON.stringify({
          versionId: TEST_VERSIONS.US_VERSION_ID,
          version: TEST_VERSIONS.US_VERSION,
          fetchedAt: TIMESTAMPS.STALE,
        }),
      );

      // When
      const result = getCachedModelVersion(TEST_COUNTRIES.US);

      // Then
      expect(result).toBeNull();
    });

    it('given corrupt JSON then returns null', () => {
      // Given
      localStorage.setItem(STORAGE_KEYS.MODEL_VERSION(TEST_COUNTRIES.US), '{invalid json');

      // When
      const result = getCachedModelVersion(TEST_COUNTRIES.US);

      // Then
      expect(result).toBeNull();
    });

    it('given different country then returns null', () => {
      // Given
      setCachedModelVersion(TEST_COUNTRIES.US, TEST_VERSIONS.US_VERSION_ID, TEST_VERSIONS.US_VERSION);

      // When
      const result = getCachedModelVersion(TEST_COUNTRIES.UK);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('setCachedModelVersion', () => {
    it('given version data then writes to localStorage with timestamp', () => {
      // When
      setCachedModelVersion(TEST_COUNTRIES.US, TEST_VERSIONS.US_VERSION_ID, TEST_VERSIONS.US_VERSION);

      // Then
      const raw = localStorage.getItem(STORAGE_KEYS.MODEL_VERSION(TEST_COUNTRIES.US));
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.versionId).toBe(TEST_VERSIONS.US_VERSION_ID);
      expect(parsed.version).toBe(TEST_VERSIONS.US_VERSION);
      expect(parsed.fetchedAt).toBe(TIMESTAMPS.NOW);
    });
  });

  // -----------------------------------------------------------------------
  // Parameter children
  // -----------------------------------------------------------------------
  describe('getCachedParameterChildren', () => {
    it('given no cache then returns null', () => {
      const result = getCachedParameterChildren(TEST_COUNTRIES.US, MOCK_PARENT_PATH);
      expect(result).toBeNull();
    });

    it('given fresh cached children then returns them', () => {
      // Given
      setCachedParameterChildren(TEST_COUNTRIES.US, MOCK_PARENT_PATH, MOCK_CHILDREN_RESPONSE);

      // When
      const result = getCachedParameterChildren(TEST_COUNTRIES.US, MOCK_PARENT_PATH);

      // Then
      expect(result).toEqual(MOCK_CHILDREN_RESPONSE);
    });

    it('given stale cached children then returns null', () => {
      // Given
      localStorage.setItem(
        STORAGE_KEYS.PARAM_CHILDREN(TEST_COUNTRIES.US),
        JSON.stringify({
          [MOCK_PARENT_PATH]: {
            data: MOCK_CHILDREN_RESPONSE,
            fetchedAt: TIMESTAMPS.STALE,
          },
        }),
      );

      // When
      const result = getCachedParameterChildren(TEST_COUNTRIES.US, MOCK_PARENT_PATH);

      // Then
      expect(result).toBeNull();
    });

    it('given different parent path then returns null', () => {
      // Given
      setCachedParameterChildren(TEST_COUNTRIES.US, MOCK_PARENT_PATH, MOCK_CHILDREN_RESPONSE);

      // When
      const result = getCachedParameterChildren(TEST_COUNTRIES.US, 'gov.hmrc');

      // Then
      expect(result).toBeNull();
    });
  });

  describe('setCachedParameterChildren', () => {
    it('given new path then adds to existing cache', () => {
      // Given
      setCachedParameterChildren(TEST_COUNTRIES.US, 'gov', MOCK_CHILDREN_RESPONSE);

      // When
      const secondResponse = { ...MOCK_CHILDREN_RESPONSE, parent_path: 'gov.irs' };
      setCachedParameterChildren(TEST_COUNTRIES.US, 'gov.irs', secondResponse);

      // Then — both paths present
      expect(getCachedParameterChildren(TEST_COUNTRIES.US, 'gov')).toEqual(MOCK_CHILDREN_RESPONSE);
      expect(getCachedParameterChildren(TEST_COUNTRIES.US, 'gov.irs')).toEqual(secondResponse);
    });
  });

  // -----------------------------------------------------------------------
  // Parameters by name
  // -----------------------------------------------------------------------
  describe('getCachedParameters', () => {
    it('given no cache then returns null', () => {
      const result = getCachedParameters(TEST_COUNTRIES.US, ['gov.irs.credits.eitc.max']);
      expect(result).toBeNull();
    });

    it('given all requested names cached then returns them', () => {
      // Given
      setCachedParameters(TEST_COUNTRIES.US, MOCK_PARAMETERS_RECORD);

      // When
      const result = getCachedParameters(TEST_COUNTRIES.US, [
        'gov.irs.credits.eitc.max',
        'gov.irs.credits.ctc.amount',
      ]);

      // Then
      expect(result).toEqual(MOCK_PARAMETERS_RECORD);
    });

    it('given one missing name then returns null (cache miss)', () => {
      // Given
      setCachedParameters(TEST_COUNTRIES.US, {
        'gov.irs.credits.eitc.max': MOCK_PARAMETER_A,
      });

      // When — request includes a name not in cache
      const result = getCachedParameters(TEST_COUNTRIES.US, [
        'gov.irs.credits.eitc.max',
        'gov.irs.credits.ctc.amount',
      ]);

      // Then
      expect(result).toBeNull();
    });

    it('given stale cache then returns null', () => {
      // Given
      localStorage.setItem(
        STORAGE_KEYS.PARAMS(TEST_COUNTRIES.US),
        JSON.stringify({
          data: MOCK_PARAMETERS_RECORD,
          fetchedAt: TIMESTAMPS.STALE,
        }),
      );

      // When
      const result = getCachedParameters(TEST_COUNTRIES.US, ['gov.irs.credits.eitc.max']);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('setCachedParameters', () => {
    it('given existing cache then merges new parameters', () => {
      // Given
      setCachedParameters(TEST_COUNTRIES.US, {
        'gov.irs.credits.eitc.max': MOCK_PARAMETER_A,
      });

      // When
      setCachedParameters(TEST_COUNTRIES.US, {
        'gov.irs.credits.ctc.amount': MOCK_PARAMETER_B,
      });

      // Then — both present
      const result = getCachedParameters(TEST_COUNTRIES.US, [
        'gov.irs.credits.eitc.max',
        'gov.irs.credits.ctc.amount',
      ]);
      expect(result).toEqual(MOCK_PARAMETERS_RECORD);
    });
  });

  // -----------------------------------------------------------------------
  // Variables
  // -----------------------------------------------------------------------
  describe('getCachedVariables', () => {
    it('given no cache then returns null', () => {
      const result = getCachedVariables(TEST_COUNTRIES.US);
      expect(result).toBeNull();
    });

    it('given fresh cached variables then returns them', () => {
      // Given
      setCachedVariables(TEST_COUNTRIES.US, MOCK_VARIABLES_RECORD);

      // When
      const result = getCachedVariables(TEST_COUNTRIES.US);

      // Then
      expect(result).toEqual(MOCK_VARIABLES_RECORD);
    });

    it('given stale cached variables then returns null', () => {
      // Given
      localStorage.setItem(
        STORAGE_KEYS.VARIABLES(TEST_COUNTRIES.US),
        JSON.stringify({
          data: MOCK_VARIABLES_RECORD,
          fetchedAt: TIMESTAMPS.STALE,
        }),
      );

      // When
      const result = getCachedVariables(TEST_COUNTRIES.US);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('setCachedVariables', () => {
    it('given variables then writes to localStorage with timestamp', () => {
      // When
      setCachedVariables(TEST_COUNTRIES.US, MOCK_VARIABLES_RECORD);

      // Then
      const raw = localStorage.getItem(STORAGE_KEYS.VARIABLES(TEST_COUNTRIES.US));
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.data).toEqual(MOCK_VARIABLES_RECORD);
      expect(parsed.fetchedAt).toBe(TIMESTAMPS.NOW);
    });
  });

  // -----------------------------------------------------------------------
  // Cache invalidation
  // -----------------------------------------------------------------------
  describe('clearMetadataCache', () => {
    it('given cached data for country then removes all keys', () => {
      // Given
      setCachedModelVersion(TEST_COUNTRIES.US, TEST_VERSIONS.US_VERSION_ID, TEST_VERSIONS.US_VERSION);
      setCachedParameterChildren(TEST_COUNTRIES.US, MOCK_PARENT_PATH, MOCK_CHILDREN_RESPONSE);
      setCachedParameters(TEST_COUNTRIES.US, MOCK_PARAMETERS_RECORD);
      setCachedVariables(TEST_COUNTRIES.US, MOCK_VARIABLES_RECORD);

      // When
      clearMetadataCache(TEST_COUNTRIES.US);

      // Then
      expect(getCachedModelVersion(TEST_COUNTRIES.US)).toBeNull();
      expect(getCachedParameterChildren(TEST_COUNTRIES.US, MOCK_PARENT_PATH)).toBeNull();
      expect(getCachedParameters(TEST_COUNTRIES.US, ['gov.irs.credits.eitc.max'])).toBeNull();
      expect(getCachedVariables(TEST_COUNTRIES.US)).toBeNull();
    });

    it('given data for another country then does not clear it', () => {
      // Given
      setCachedModelVersion(TEST_COUNTRIES.US, TEST_VERSIONS.US_VERSION_ID, TEST_VERSIONS.US_VERSION);
      setCachedModelVersion(TEST_COUNTRIES.UK, TEST_VERSIONS.UK_VERSION_ID, TEST_VERSIONS.UK_VERSION);

      // When
      clearMetadataCache(TEST_COUNTRIES.US);

      // Then — UK data untouched
      expect(getCachedModelVersion(TEST_COUNTRIES.UK)).not.toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // TTL boundary
  // -----------------------------------------------------------------------
  describe('TTL boundary', () => {
    it('given cache exactly at TTL boundary then treats as stale', () => {
      // Given
      localStorage.setItem(
        STORAGE_KEYS.MODEL_VERSION(TEST_COUNTRIES.US),
        JSON.stringify({
          versionId: TEST_VERSIONS.US_VERSION_ID,
          version: TEST_VERSIONS.US_VERSION,
          fetchedAt: TIMESTAMPS.NOW - CACHE_TTL_MS, // exactly at boundary
        }),
      );

      // When
      const result = getCachedModelVersion(TEST_COUNTRIES.US);

      // Then — boundary is stale (> not >=)
      expect(result).not.toBeNull();
    });

    it('given cache one ms past TTL then returns null', () => {
      // Given
      localStorage.setItem(
        STORAGE_KEYS.MODEL_VERSION(TEST_COUNTRIES.US),
        JSON.stringify({
          versionId: TEST_VERSIONS.US_VERSION_ID,
          version: TEST_VERSIONS.US_VERSION,
          fetchedAt: TIMESTAMPS.NOW - CACHE_TTL_MS - 1,
        }),
      );

      // When
      const result = getCachedModelVersion(TEST_COUNTRIES.US);

      // Then
      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Error resilience
  // -----------------------------------------------------------------------
  describe('error resilience', () => {
    it('given localStorage.setItem throws then does not propagate', () => {
      // Given
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // When / Then — no throw
      expect(() =>
        setCachedModelVersion(TEST_COUNTRIES.US, TEST_VERSIONS.US_VERSION_ID, TEST_VERSIONS.US_VERSION),
      ).not.toThrow();
    });

    it('given localStorage.getItem throws then returns null', () => {
      // Given
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      // When
      const result = getCachedModelVersion(TEST_COUNTRIES.US);

      // Then
      expect(result).toBeNull();
    });

    it('given localStorage.removeItem throws then clearMetadataCache does not propagate', () => {
      // Given
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });

      // When / Then — no throw
      expect(() => clearMetadataCache(TEST_COUNTRIES.US)).not.toThrow();
    });
  });
});
