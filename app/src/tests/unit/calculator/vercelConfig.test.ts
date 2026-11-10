// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

// calculator-app/vercel.json, read as Vercel reads it.
const calculatorVercelConfig = JSON.parse(
  readFileSync(new URL('../../../../../calculator-app/vercel.json', import.meta.url), 'utf8')
);

/** The Vercel function glob that covers the Public API route's files. */
const PUBLIC_API_ROUTE_FUNCTIONS = 'src/app/api/policyengine/**/*';

describe('calculator-app/vercel.json', () => {
  test("given a browser that goes away then Vercel cancels the Public API route's request, so the route stops waiting for the Public API", () => {
    // Then
    expect(calculatorVercelConfig.functions?.[PUBLIC_API_ROUTE_FUNCTIONS]).toEqual({
      supportsCancellation: true,
    });
  });
});
