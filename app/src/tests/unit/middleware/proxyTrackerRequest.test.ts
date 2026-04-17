import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  proxyTrackerRequest,
  TRACKER_MODAL_ORIGIN,
  TRACKER_PREFIX,
} from '../../../../../middleware';

describe('proxyTrackerRequest', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('given a request outside the tracker prefix then returns null without fetching', async () => {
    // Given
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    // When
    const result = await proxyTrackerRequest('/us/some-other-path');

    // Then
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('given a well-formed tracker path then forwards to Modal upstream', async () => {
    // Given
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('<html>ok</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    // When
    const result = await proxyTrackerRequest(`${TRACKER_PREFIX}/overview`);

    // Then
    expect(result).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl.startsWith(TRACKER_MODAL_ORIGIN)).toBe(true);
    expect(calledUrl).toContain('/overview');
  });

  test('given a path-traversal attempt then rejects the request', async () => {
    // Given
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    // When
    const result = await proxyTrackerRequest(
      `${TRACKER_PREFIX}/../admin`
    );

    // Then
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('given an absolute-URL smuggle attempt then rejects the request', async () => {
    // Given
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    // When
    // If the proxy naively concatenated strings, `//evil.example.com` would
    // become a protocol-relative URL pointing at evil.example.com.
    const result = await proxyTrackerRequest(
      `${TRACKER_PREFIX}//evil.example.com/leak`
    );

    // Then
    expect(result).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test('given upstream returns JavaScript then rewrites Content-Type to text/html', async () => {
    // Given
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('alert(1)', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    // When
    const result = await proxyTrackerRequest(`${TRACKER_PREFIX}/x`);

    // Then
    expect(result).not.toBeNull();
    expect(result?.headers.get('Content-Type')).toBe('text/html');
  });

  test('given upstream sets Set-Cookie then response does not forward it', async () => {
    // Given
    const upstreamHeaders = new Headers();
    upstreamHeaders.set('Content-Type', 'text/html');
    upstreamHeaders.append('Set-Cookie', 'evil=1; Path=/');
    upstreamHeaders.set('Clear-Site-Data', '"cookies","storage"');
    upstreamHeaders.set('Link', '</attack>; rel=preload');

    const fetchMock = vi.fn().mockResolvedValue(
      new Response('<html></html>', {
        status: 200,
        headers: upstreamHeaders,
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    // When
    const result = await proxyTrackerRequest(`${TRACKER_PREFIX}/x`);

    // Then
    expect(result).not.toBeNull();
    expect(result?.headers.get('Set-Cookie')).toBeNull();
    expect(result?.headers.get('Clear-Site-Data')).toBeNull();
    expect(result?.headers.get('Link')).toBeNull();
  });

  test('given upstream returns a non-200 status then returns null', async () => {
    // Given
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 500 }))
    );

    // When
    const result = await proxyTrackerRequest(`${TRACKER_PREFIX}/x`);

    // Then
    expect(result).toBeNull();
  });

  test('given upstream throws then returns null', async () => {
    // Given
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network'))
    );

    // When
    const result = await proxyTrackerRequest(`${TRACKER_PREFIX}/x`);

    // Then
    expect(result).toBeNull();
  });
});
