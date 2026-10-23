// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { GET } from '../../../../../calculator-app/src/app/api/geolocate/route';

const GEOLOCATE_URL = 'https://app.policyengine.org/api/geolocate';
const COUNTRY_HEADER = 'x-vercel-ip-country';
const UNCACHEABLE = 'private, no-store';

const HTTP_STATUS = {
  OK: 200,
  NO_CONTENT: 204,
} as const;

/** A request as Vercel delivers it, with the given IP country header, if any. */
function geolocateRequest(countryHeaderValue?: string): Request {
  const headers = new Headers();
  if (countryHeaderValue !== undefined) {
    headers.set(COUNTRY_HEADER, countryHeaderValue);
  }
  return new Request(GEOLOCATE_URL, { headers });
}

describe('calculator GET /api/geolocate', () => {
  test('given the IP country header then responds 200 with the code as plain text', async () => {
    // When
    const response = GET(geolocateRequest('GB'));

    // Then
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(await response.text()).toBe('GB');
    expect(response.headers.get('content-type')).toMatch(/^text\/plain/);
  });

  test('given the IP country header then the response may not be stored in a shared cache', () => {
    // When
    const response = GET(geolocateRequest('US'));

    // Then
    expect(response.headers.get('cache-control')).toBe(UNCACHEABLE);
  });

  test('given a lower-case header with surrounding spaces then responds with the upper-case code', async () => {
    // When
    const response = GET(geolocateRequest(' ca '));

    // Then
    expect(response.status).toBe(HTTP_STATUS.OK);
    expect(await response.text()).toBe('CA');
  });

  test('given no IP country header then responds 204 with an empty body', async () => {
    // When
    const response = GET(geolocateRequest());

    // Then
    expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
    expect(await response.text()).toBe('');
    expect(response.headers.get('cache-control')).toBe(UNCACHEABLE);
  });

  test.each(['', 'USA', 'U', 'T1', 'U$', 'GB,US'])(
    'given the invalid header value %j then responds 204 with an empty body',
    async (invalidHeaderValue) => {
      // When
      const response = GET(geolocateRequest(invalidHeaderValue));

      // Then
      expect(response.status).toBe(HTTP_STATUS.NO_CONTENT);
      expect(await response.text()).toBe('');
      expect(response.headers.get('cache-control')).toBe(UNCACHEABLE);
    }
  );
});
