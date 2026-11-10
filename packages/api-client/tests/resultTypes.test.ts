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
    // Calls inside functions that are never run, so the methods' default
    // type arguments apply, not their constraints.
    const calculateWithoutType = () =>
      client.calculateHousehold({ country: "us", household: {} });
    const metadataWithoutType = () => client.getMetadata("us");
    const comparisonWithoutType = () =>
      client.compareEconomy({
        country: "us",
        policy: 98765,
        baseline: 2,
        region: "us",
        year: 2026,
      });
    const oneReadWithoutType = () =>
      client.getEconomyComparison({
        country: "us",
        policy: 98765,
        baseline: 2,
        region: "us",
        year: 2026,
      });

    expectTypeOf(
      calculateWithoutType,
    ).returns.resolves.toEqualTypeOf<unknown>();
    expectTypeOf(metadataWithoutType).returns.resolves.toEqualTypeOf<unknown>();
    expectTypeOf(
      comparisonWithoutType,
    ).returns.resolves.toEqualTypeOf<unknown>();
    expectTypeOf(oneReadWithoutType).returns.resolves.toEqualTypeOf<
      DashboardApiAnswer<unknown>
    >();
  });
});
