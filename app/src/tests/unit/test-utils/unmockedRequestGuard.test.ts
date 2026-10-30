import {
  failOnUnmockedRequests,
  takeUnmockedRequests,
  unmockedFetch,
  UnmockedRequestError,
} from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  MOCKED_ECONOMY_BODY,
  UNMOCKED_ECONOMY_URL,
} from '@/tests/fixtures/test-utils/unmockedRequestGuardMocks';

describe('unmockedRequestGuard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given a test has not mocked fetch then fetch is the guard', () => {
    expect(globalThis.fetch).toBe(unmockedFetch);
  });

  test('given an unmocked fetch then it is refused at once, naming its method and URL', async () => {
    // When
    const refusedRequest = fetch(UNMOCKED_ECONOMY_URL);

    // Then
    await expect(refusedRequest).rejects.toThrow(UnmockedRequestError);
    await expect(refusedRequest).rejects.toThrow(`GET ${UNMOCKED_ECONOMY_URL}`);
    // Taken here, so that the check after this test passes.
    expect(takeUnmockedRequests()).toEqual([`GET ${UNMOCKED_ECONOMY_URL}`]);
  });

  test('given the code under test swallows a refused request then the check after the test still fails, naming it', async () => {
    // Given
    await fetch(new Request(UNMOCKED_ECONOMY_URL, { method: 'POST' })).catch(() => undefined);

    // Then
    expect(() => failOnUnmockedRequests()).toThrow(`POST ${UNMOCKED_ECONOMY_URL}`);
    // The check forgets what it reported, so the next test starts clean.
    expect(takeUnmockedRequests()).toEqual([]);
  });

  test('given an unmocked XMLHttpRequest then sending it throws, naming its method and URL', () => {
    // Given
    const request = new XMLHttpRequest();
    request.open('PUT', UNMOCKED_ECONOMY_URL);

    // Then
    expect(() => request.send()).toThrow(`PUT ${UNMOCKED_ECONOMY_URL}`);
    expect(takeUnmockedRequests()).toEqual([`PUT ${UNMOCKED_ECONOMY_URL}`]);
  });

  test('given a test mocks fetch then its mock answers, and unstubbing it brings the guard back', async () => {
    // Given
    const mockFetch = vi.fn().mockResolvedValue(Response.json(MOCKED_ECONOMY_BODY));
    vi.stubGlobal('fetch', mockFetch);

    // When
    const response = await fetch(UNMOCKED_ECONOMY_URL);
    vi.unstubAllGlobals();

    // Then
    expect(await response.json()).toEqual(MOCKED_ECONOMY_BODY);
    expect(takeUnmockedRequests()).toEqual([]);
    expect(globalThis.fetch).toBe(unmockedFetch);
  });
});
