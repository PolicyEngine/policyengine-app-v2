import { describe, expect, test, vi } from 'vitest';
import { createPublicApiClient } from '@/api/publicApi/client';
import { fetchParameterSearchFile } from '@/api/publicApi/searchFile';
import { TEST_POLICYENGINE_VERSION } from '@/tests/fixtures/api/publicApi/modelCatalogMocks';
import { searchFileResponse, US_SEARCH_FILE } from '@/tests/fixtures/api/publicApi/searchFileMocks';
import { errorResponse, TEST_API_BASE } from '@/tests/fixtures/api/v2UserMocks';

function clientReturning(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  const client = createPublicApiClient({
    baseUrl: TEST_API_BASE,
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
  return { client, fetchMock };
}

describe('fetchParameterSearchFile', () => {
  test('given a catalog version then it asks for that version, so the response can be cached', async () => {
    // Given
    const { client, fetchMock } = clientReturning(searchFileResponse());

    // When
    const file = await fetchParameterSearchFile('us', TEST_POLICYENGINE_VERSION, client);

    // Then
    const request = fetchMock.mock.calls[0][0] as Request;
    expect(request.url).toBe(
      `${TEST_API_BASE}/v2/parameters/search-file?country_id=us&policyengine_version=${TEST_POLICYENGINE_VERSION}`
    );
    expect(file).toEqual(US_SEARCH_FILE);
  });

  test('given a file in a format this app does not read then it refuses it', async () => {
    const { client } = clientReturning(searchFileResponse({ ...US_SEARCH_FILE, format: 2 }));

    await expect(fetchParameterSearchFile('us', TEST_POLICYENGINE_VERSION, client)).rejects.toThrow(
      'search file format 2'
    );
  });

  test('given a version without a search file then it rejects with the API status', async () => {
    const { client } = clientReturning(errorResponse(503, 'No search file for this version'));

    await expect(
      fetchParameterSearchFile('us', TEST_POLICYENGINE_VERSION, client)
    ).rejects.toMatchObject({ status: 503 });
  });
});
