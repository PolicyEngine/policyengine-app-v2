import { ROUTE_ERROR_HEADER as FORWARDING_ROUTE_ERROR_HEADER } from '@policyengine/public-api-forwarding';
import { describe, expect, test } from 'vitest';
import { ROUTE_ERROR_HEADER } from '@/libs/publicApiRoute/sameOriginRoute';

describe('ROUTE_ERROR_HEADER', () => {
  test("given the forwarding package's header for errors a route writes then the browser reads the same name", () => {
    // Then
    expect(ROUTE_ERROR_HEADER).toBe(FORWARDING_ROUTE_ERROR_HEADER);
  });
});
