import { describe, expect, test } from 'vitest';
import { fetchSharedReport } from '@/api/sharedReport';
import { isV2ApiError } from '@/api/v2UserClient';
import {
  ASSOCIATION_IDS,
  createTestPublicClient,
  errorResponse,
  fetchCall,
  itemResponse,
  sharedReportItem,
} from '@/tests/fixtures/api/v2UserMocks';

describe('fetchSharedReport', () => {
  test('given a report link then it reads the saved report with no credential', async () => {
    // Given
    const { fetchMock, client } = createTestPublicClient();
    fetchMock.mockResolvedValue(itemResponse(sharedReportItem()));

    // When
    const item = await fetchSharedReport('us', ASSOCIATION_IDS.REPORT, client);

    // Then
    expect(item?.name).toBe('CTC to $3,600');
    const call = fetchCall(fetchMock);
    expect(call.method).toBe('GET');
    expect(call.path).toBe(`/v2/shared-reports/${ASSOCIATION_IDS.REPORT}`);
    expect(call.query).toEqual({ country_id: 'us' });
    expect(call.headers).toEqual({ Accept: 'application/json' });
  });

  test('given no saved report has the ID then it answers null', async () => {
    // Given
    const { fetchMock, client } = createTestPublicClient();
    fetchMock.mockResolvedValue(errorResponse(404, 'not found'));

    // When / Then
    await expect(fetchSharedReport('uk', ASSOCIATION_IDS.REPORT, client)).resolves.toBeNull();
  });

  test('given the API is unavailable then the read fails', async () => {
    // Given
    const { fetchMock, client } = createTestPublicClient();
    fetchMock.mockResolvedValue(errorResponse(503, 'V2 user persistence is unavailable'));

    // When
    const failure = await fetchSharedReport('us', ASSOCIATION_IDS.REPORT, client).catch(
      (error: unknown) => error
    );

    // Then
    expect(isV2ApiError(failure, 503)).toBe(true);
  });

  test('given a country without saved reports then it answers null without asking', async () => {
    // Given
    const { fetchMock, client } = createTestPublicClient();

    // When / Then
    await expect(fetchSharedReport('ca', ASSOCIATION_IDS.REPORT, client)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
