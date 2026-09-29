import { describe, expect, test } from 'vitest';
import {
  isWorkspaceTransition,
  workspaceRoute,
} from '../../../../../calculator-app/src/app/[countryId]/(workspace)/workspaceRoutes';

describe('workspace navigation boundary', () => {
  test.each(['build', 'reforms'])(
    'given the %s workspace screen then it can switch locally with query parameters',
    (screen) => {
      expect(isWorkspaceTransition('/us/build', `/us/${screen}?filter=yours`)).toBe(true);
    }
  );

  test('given the paused Ask page then it is not a workspace screen', () => {
    expect(workspaceRoute('/us/ask')).toBeNull();
    expect(isWorkspaceTransition('/us/build', '/us/ask')).toBe(false);
  });

  test.each([
    ['/us/build', '/uk/build'],
    ['/us/build', '/us/report/bill'],
    ['/us/build', '/us/report/bill/us-hr904/extra'],
    ['/us/build', '/us/reforms/123'],
    ['/us/build', 'https://example.com/us/build'],
    ['/us/build', '//example.com/us/build'],
    ['/us/build', '/us/policies'],
  ])('given navigation from %s to %s then the normal router handles it', (from, to) => {
    expect(isWorkspaceTransition(from, to)).toBe(false);
  });

  test.each([
    ['/us/reforms', '/us/report/bill/us-hr904'],
    ['/us/report/bill/us-hr904', '/us/reforms'],
    ['/us/report/bill/us-hr904', '/us/report/3741'],
    ['/us/report/3741', '/us/build'],
  ])('given navigation from %s to %s then it switches locally', (from, to) => {
    expect(isWorkspaceTransition(from, to)).toBe(true);
  });

  test('given a bill report URL then extracts the bill identifier', () => {
    expect(workspaceRoute('/us/report/bill/us-hr904?tab=overview')).toEqual({
      country: 'us',
      screen: 'bill',
      id: 'us-hr904',
    });
    expect(workspaceRoute('/us/report/3741')).toEqual({
      country: 'us',
      screen: 'report',
      id: '3741',
    });
  });

  test('given a trailing slash and hash then identifies the matching screen', () => {
    expect(workspaceRoute('/uk/build/#parameters')).toEqual({ country: 'uk', screen: 'build' });
  });
});
