import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, test } from 'vitest';

/**
 * These tests validate that vercel.json is configured correctly for SPA routing.
 *
 * The vercel.json file must have a rewrite rule that sends all requests to the
 * root index.html, allowing React Router to handle client-side routing.
 *
 * Without this configuration, direct URL access or page refreshes on sub-routes
 * (e.g., /us/research/some-article) will return 404 errors because Vercel
 * looks for a matching file instead of serving the SPA.
 */
describe('vercel.json configuration', () => {
  const vercelJsonPath = path.resolve(__dirname, '../../../../vercel.json');

  test('given vercel.json exists then file is present', () => {
    // When
    const exists = fs.existsSync(vercelJsonPath);

    // Then
    expect(exists).toBe(true);
  });

  test('given vercel.json then contains valid JSON', () => {
    // Given
    const content = fs.readFileSync(vercelJsonPath, 'utf-8');

    // When
    const parseJson = () => JSON.parse(content);

    // Then
    expect(parseJson).not.toThrow();
  });

  test('given vercel.json then has rewrites array', () => {
    // Given
    const content = fs.readFileSync(vercelJsonPath, 'utf-8');
    const config = JSON.parse(content);

    // Then
    expect(config).toHaveProperty('rewrites');
    expect(Array.isArray(config.rewrites)).toBe(true);
    expect(config.rewrites.length).toBeGreaterThan(0);
  });

  test('given vercel.json rewrites then has SPA fallback rule', () => {
    // Given
    const content = fs.readFileSync(vercelJsonPath, 'utf-8');
    const config = JSON.parse(content);

    // When - Find the catch-all SPA routing rule
    const spaRewrite = config.rewrites.find(
      (rule: { source: string; destination: string }) =>
        rule.source === '/(.*)' && rule.destination === '/'
    );

    // Then - Must have the SPA fallback rule
    expect(spaRewrite).toBeDefined();
    expect(spaRewrite.source).toBe('/(.*)');
    expect(spaRewrite.destination).toBe('/');
  });

  test('given vercel.json then does NOT have routes array (use rewrites for SPA)', () => {
    // Given
    const content = fs.readFileSync(vercelJsonPath, 'utf-8');
    const config = JSON.parse(content);

    // Then - routes array breaks SPA routing when combined with rewrites
    expect(config.routes).toBeUndefined();
  });

  test('given monorepo setup then root vercel.json exists for website project', () => {
    // Given - Monorepo uses root vercel.json for policyengine-app-v2 project (serves policyengine.org)
    // The policyengine-calculator project uses calculator/vercel.json (serves app.policyengine.org)
    const rootVercelJsonPath = path.resolve(__dirname, '../../../../../vercel.json');

    // When
    const exists = fs.existsSync(rootVercelJsonPath);

    // Then - Root config is required for monorepo website builds
    expect(exists).toBe(true);
  });
});
