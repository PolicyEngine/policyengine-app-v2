import { describe, expect, test } from 'vitest';
import {
  ALREADY_LEGACY_URL_CASES,
  LEGACY_V1_REDIRECT_CASES,
  NON_LEGACY_URL_CASES,
} from '@/tests/fixtures/middleware/legacyRedirectMocks';
import middleware, { getLegacyAppRedirectUrl } from '../../../../../middleware';

describe('legacy redirect middleware', () => {
  describe('getLegacyAppRedirectUrl', () => {
    test.each(LEGACY_V1_REDIRECT_CASES)(
      'given $description when checking the inbound URL then returns the legacy redirect URL',
      ({ inboundUrl, expectedRedirectUrl }) => {
        // When
        const result = getLegacyAppRedirectUrl(inboundUrl);

        // Then
        expect(result).toBe(expectedRedirectUrl);
      }
    );

    test.each(NON_LEGACY_URL_CASES)(
      'given $description when checking the inbound URL then returns null',
      ({ inboundUrl }) => {
        // When
        const result = getLegacyAppRedirectUrl(inboundUrl);

        // Then
        expect(result).toBeNull();
      }
    );

    test.each(ALREADY_LEGACY_URL_CASES)(
      'given $description when checking the inbound URL then returns null',
      ({ inboundUrl }) => {
        // When
        const result = getLegacyAppRedirectUrl(inboundUrl);

        // Then
        expect(result).toBeNull();
      }
    );
  });

  describe('middleware', () => {
    test('given a strict v1 report URL when middleware handles the request then it redirects to the legacy host', async () => {
      // Given
      const request = new Request(LEGACY_V1_REDIRECT_CASES[0].inboundUrl, {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeInstanceOf(Response);
      expect(response?.status).toBe(308);
      expect(response?.headers.get('location')).toBe(
        LEGACY_V1_REDIRECT_CASES[0].expectedRedirectUrl
      );
    });

    test('given a v2 report URL when middleware handles the request then it does not redirect', async () => {
      // Given
      const request = new Request(NON_LEGACY_URL_CASES[0].inboundUrl, {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeUndefined();
    });
  });
});
