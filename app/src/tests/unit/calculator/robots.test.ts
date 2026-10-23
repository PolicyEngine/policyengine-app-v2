import { describe, expect, test } from 'vitest';
import robots from '../../../../../calculator-app/src/app/robots';

describe('calculator robots.txt', () => {
  test('given any crawler then the whole calculator may be crawled', () => {
    expect(robots().rules).toEqual({ userAgent: '*', allow: '/' });
  });

  test('given the sitemap directive then it names the website sitemap on its canonical host', () => {
    expect(robots().sitemap).toBe('https://www.policyengine.org/sitemap.xml');
  });
});
