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

// These are checked by the package's type check (tsc --noEmit), not at run
// time: each method takes the caller's result type. The methods are only
// named, never called, so no request is made.
describe("result types", () => {
  const client = createPolicyEngineApiClient({
    fetch: async () => new Response("{}"),
  });

  test("given a result type then each method resolves with it", () => {
    expectTypeOf(
      client.calculateHousehold<CalculatedHousehold>,
    ).returns.resolves.toEqualTypeOf<CalculatedHousehold>();
    expectTypeOf(
      client.getMetadata<CountryMetadata>,
    ).returns.resolves.toEqualTypeOf<CountryMetadata>();
    expectTypeOf(
      client.compareEconomy<EconomyImpact>,
    ).returns.resolves.toEqualTypeOf<EconomyImpact>();
    expectTypeOf(
      client.getEconomyComparison<EconomyImpact>,
    ).returns.resolves.toEqualTypeOf<DashboardApiAnswer<EconomyImpact>>();
  });

  test("given no result type then each method resolves with unknown", () => {
    expectTypeOf(
      client.calculateHousehold,
    ).returns.resolves.toEqualTypeOf<unknown>();
    expectTypeOf(client.getMetadata).returns.resolves.toEqualTypeOf<unknown>();
  });
});
