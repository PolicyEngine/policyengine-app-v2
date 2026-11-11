import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, test } from 'vitest';

describe('Vercel project topology', () => {
  const repoRoot = path.resolve(__dirname, '../../../../..');

  test.each(['website/vercel.json', 'calculator-app/vercel.json'])(
    'given the active Next.js projects then %s exists',
    (relativePath) => {
      expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(true);
    }
  );

  test.each([
    'vercel.json',
    'calculator/vercel.json',
    'app/vercel.json',
    'middleware.ts',
    'app/api',
    'app/calculator.html',
    // calculator-app/public links to app/public; calculator-app serves its
    // own robots.txt from src/app/robots.ts and has no sitemap.
    'app/public/robots.txt',
    'app/public/sitemap.xml',
  ])('given the retired Vite projects then %s does not exist', (relativePath) => {
    expect(fs.existsSync(path.join(repoRoot, relativePath))).toBe(false);
  });
});
