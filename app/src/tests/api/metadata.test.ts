import { describe, test, expect, vi, beforeEach } from 'vitest';
import { fetchMetadata } from '@/api/metadata';
import { BASE_URL } from '@/constants';
import {
  mockMetadataResponse,
  mockCountryId,
  mockInvalidCountryId,
  mockUSCountryId,
  mockEmptyCountryId,
  mockCustomResponse,
  TEST_PARAMETER_KEY,
  TEST_PARAMETER_VALUE,
  mockNetworkError,
  mockJSONParseError,
  mockSuccessResponse,
  mock404Response,
  mock500Response,
  mockInvalidJSONResponse,
  mockCustomSuccessResponse,
  getExpectedFetchError,
} from '@/tests/fixtures/api/metadataMocks';

describe('fetchMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test('given valid countryId then returns metadata successfully', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce(mockSuccessResponse);

    const result = await fetchMetadata(mockCountryId);

    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/${mockCountryId}/metadata`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
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

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
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
    expect(result.result.parameters[TEST_PARAMETER_KEY]).toBe(TEST_PARAMETER_VALUE);
  });
});