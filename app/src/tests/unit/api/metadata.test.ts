import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchMetadata } from '@/api/metadata';
import { BASE_URL } from '@/constants';
import {
  getExpectedFetchError,
  mock404Response,
  mock500Response,
  mockCountryId,
  mockCustomResponse,
  mockCustomSuccessResponse,
  mockInvalidCountryId,
  mockInvalidJSONResponse,
  mockJSONParseError,
  mockMetadataResponse,
  mockMetadataResponseWithRegions,
  mockMetadataSuccessResponse,
  mockNetworkError,
  mockSuccessResponse,
  mockUSCountryId,
  TEST_PARAMETER_KEY,
  TEST_PARAMETER_VALUE,
} from '@/tests/fixtures/api/metadataMocks';
import {
  CURRENT_UK_METADATA_REGIONS,
  UK_METADATA_REGION_SPELLINGS,
} from '@/tests/fixtures/models/regionMocks';

describe('fetchMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test('given valid countryId then returns metadata successfully', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockSuccessResponse);

    const result = await fetchMetadata(mockCountryId);

    expect(mockFetch).toHaveBeenCalledWith(`${BASE_URL}/${mockCountryId}/metadata`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    expect(result).toEqual(mockMetadataResponse);
  });

  test('given non-ok response then throws error with country ID', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mock404Response);

    await expect(fetchMetadata(mockInvalidCountryId)).rejects.toThrow(
      getExpectedFetchError(mockInvalidCountryId)
    );
  });

  test('given fetch throws network error then propagates error', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockRejectedValueOnce(mockNetworkError);

    await expect(fetchMetadata(mockCountryId)).rejects.toThrow(mockNetworkError.message);
  });

  test('given countryId then constructs correct API URL', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockSuccessResponse);

    await fetchMetadata(mockUSCountryId);

    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${mockUSCountryId}/metadata`,
      expect.any(Object)
    );
  });

  test('given request then includes correct headers', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockSuccessResponse);

    await fetchMetadata(mockCountryId);

    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  });

  test('given server returns 500 then throws error', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mock500Response);

    await expect(fetchMetadata(mockCountryId)).rejects.toThrow(
      getExpectedFetchError(mockCountryId)
    );
  });

  test('given invalid JSON response then throws parsing error', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockInvalidJSONResponse);

    await expect(fetchMetadata(mockCountryId)).rejects.toThrow(mockJSONParseError.message);
  });

  test('given successful response then parses JSON correctly', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockCustomSuccessResponse);

    const result = await fetchMetadata(mockCountryId);

    expect(result).toEqual(mockCustomResponse);
    expect(result.result.parameters[TEST_PARAMETER_KEY]?.values?.['2024-01-01']).toBe(
      TEST_PARAMETER_VALUE
    );
  });
});

describe('fetchMetadata Northern Ireland region', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test.each(UK_METADATA_REGION_SPELLINGS)(
    'given metadata listing Northern Ireland as %s then it lists country/northern_ireland',
    async (_spelling, metadataRegions) => {
      // Given
      vi.mocked(global.fetch).mockResolvedValueOnce(
        mockMetadataSuccessResponse(mockMetadataResponseWithRegions(metadataRegions))
      );

      // When
      const result = await fetchMetadata(mockCountryId);

      // Then
      expect(result.result.economy_options.region).toEqual(CURRENT_UK_METADATA_REGIONS);
    }
  );
});
