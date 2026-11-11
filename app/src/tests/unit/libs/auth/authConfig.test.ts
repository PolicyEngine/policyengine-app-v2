import { afterEach, describe, expect, test, vi } from 'vitest';
import { getAuth0Config, isCallbackPath, safeReturnTo } from '@/libs/auth/authConfig';
import { stubAuthEnv, TEST_AUTH0_CONFIG } from '@/tests/fixtures/libs/auth/authMocks';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getAuth0Config', () => {
  test('given the flag and all settings then it returns the Auth0 config', () => {
    stubAuthEnv(true);
    expect(getAuth0Config()).toEqual(TEST_AUTH0_CONFIG);
  });

  test('given the flag off then it returns null', () => {
    stubAuthEnv(false);
    expect(getAuth0Config()).toBeNull();
  });

  test('given a missing setting then it returns null', () => {
    stubAuthEnv(true, { domain: TEST_AUTH0_CONFIG.domain, clientId: TEST_AUTH0_CONFIG.clientId });
    expect(getAuth0Config()).toBeNull();
  });
});

describe('safeReturnTo', () => {
  test('given an in-app path then it is kept', () => {
    expect(safeReturnTo('/us/reforms?filter=yours', '/us')).toBe('/us/reforms?filter=yours');
  });

  test.each([
    ['https://evil.example/'],
    ['//evil.example/'],
    ['/\\evil.example'],
    ['/us/callback?code=x'],
    [undefined],
  ])('given %s then it falls back', (returnTo) => {
    expect(safeReturnTo(returnTo, '/us')).toBe('/us');
  });
});

describe('isCallbackPath', () => {
  test('given the country callback then it matches', () => {
    expect(isCallbackPath('/uk/callback')).toBe(true);
    expect(isCallbackPath('/uk/reports')).toBe(false);
  });
});
