// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

// calculator-app/vercel.json, read as Vercel reads it.
const calculatorVercelConfig = JSON.parse(
  readFileSync(new URL('../../../../../calculator-app/vercel.json', import.meta.url), 'utf8')
);

/** The Vercel function glob that covers the Public API route's files. */
const PUBLIC_API_ROUTE_FUNCTIONS = 'src/app/api/policyengine/**/*';

/** The Public API route's module, relative to calculator-app. */
const PUBLIC_API_ROUTE_MODULE = 'src/app/api/policyengine/[...path]/route.ts';

describe('calculator-app/vercel.json', () => {
  test("given a browser that goes away then Vercel cancels the Public API route's request, so the route stops waiting for the Public API", () => {
    // Then
    expect(calculatorVercelConfig.functions?.[PUBLIC_API_ROUTE_FUNCTIONS]).toEqual({
      supportsCancellation: true,
    });
  });

  test("given the Public API route's module then the cancellation glob's directory holds it", () => {
    // Given
    const globDirectory = PUBLIC_API_ROUTE_FUNCTIONS.replace('/**/*', '/');

    // Then
    // Vercel doesn't check that a functions glob matches a file, so a moved
    // route would silently lose request cancellation.
    expect(PUBLIC_API_ROUTE_MODULE.startsWith(globDirectory)).toBe(true);
    expect(
      existsSync(
        new URL(`../../../../../calculator-app/${PUBLIC_API_ROUTE_MODULE}`, import.meta.url)
      )
    ).toBe(true);
  });
});
