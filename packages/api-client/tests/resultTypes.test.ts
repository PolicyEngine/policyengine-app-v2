import { describe, expectTypeOf, test } from "vitest";

import { createPolicyEngineApiClient } from "../src/client";
import type { DashboardApiAnswer } from "../src/types";

interface CalculatedHousehold {
  readonly people: Record<string, Record<string, Record<string, number>>>;
}

interface CountryMetadata {
  readonly variables: Record<string, { readonly label: string }>;
}

interface EconomyImpact {
  readonly budget: { readonly budgetary_impact: number };
}

const COMPARISON_REQUEST = {
  country: "us",
  policy: 98765,
  baseline: 2,
  region: "us",
  year: 2026,
} as const;

// These are checked by the package's type check (tsc --noEmit), not at run
// time: each method takes the caller's result type.
describe("result types", () => {
  test("given a result type then each method resolves with it", () => {
    const client = createPolicyEngineApiClient({
      fetch: async () => new Response("{}"),
    });

    expectTypeOf(
      client.calculateHousehold<CalculatedHousehold>({
        country: "us",
        household: {},
      }),
    ).resolves.toEqualTypeOf<CalculatedHousehold>();
    expectTypeOf(
      client.getMetadata<CountryMetadata>("uk"),
    ).resolves.toEqualTypeOf<CountryMetadata>();
    expectTypeOf(
      client.compareEconomy<EconomyImpact>(COMPARISON_REQUEST),
    ).resolves.toEqualTypeOf<EconomyImpact>();
    expectTypeOf(
      client.getEconomyComparison<EconomyImpact>(COMPARISON_REQUEST),
    ).resolves.toEqualTypeOf<DashboardApiAnswer<EconomyImpact>>();
  });

  test("given no result type then each method resolves with unknown", () => {
    const client = createPolicyEngineApiClient({
      fetch: async () => new Response("{}"),
    });

    expectTypeOf(
      client.calculateHousehold({ country: "us", household: {} }),
    ).resolves.toEqualTypeOf<unknown>();
  });
});
