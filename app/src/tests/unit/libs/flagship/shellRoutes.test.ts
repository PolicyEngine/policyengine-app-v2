import { describe, expect, test } from 'vitest';
import { isFlagshipPagePath } from '@/libs/flagship/shellRoutes';

describe('isFlagshipPagePath', () => {
  test.each([
    '/us/build',
    '/uk/build/',
    '/us/reforms',
    '/us/reforms?filter=yours',
    '/us/ask',
    '/us/report/abc123',
    '/us/report/bill/hr-1',
  ])('given the v3 page %s then it is a flagship page', (path) => {
    expect(isFlagshipPagePath(path)).toBe(true);
  });

  test.each([
    '/us',
    '/us/report-output/abc123',
    '/us/report-output/abc123/overview',
    '/us/reports',
    '/us/reports/create',
    '/us/simulations',
    '/us/policies',
    '/us/households',
    '/us/report',
    '/us/buildings',
  ])('given the legacy or other page %s then it is not a flagship page', (path) => {
    expect(isFlagshipPagePath(path)).toBe(false);
  });
});
