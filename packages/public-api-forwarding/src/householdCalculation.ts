// Calculates a household on API v1 by submitting it to
// POST /v2/household-calculations and reading the calculation until it
// finishes. Not implemented yet: the tests come first.

import type { PublicApiForwarder } from "./forward";

export const HOUSEHOLD_CALCULATION_POLL_INTERVAL_MILLISECONDS = 2_000;
export const HOUSEHOLD_CALCULATION_TIME_LIMIT_MILLISECONDS = 10 * 60_000;

export type HouseholdCalculationCountry = "us" | "uk";
export type HouseholdCalculationStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed";

export interface InlineHouseholdCalculationRequest {
  readonly country: HouseholdCalculationCountry;
  readonly household: Readonly<Record<string, unknown>>;
  readonly policy?: Readonly<Record<string, unknown>>;
  readonly addMissingVariables?: boolean;
  readonly spm?: Readonly<Record<string, unknown>>;
}

export interface HouseholdCalculationOptions {
  readonly signal?: AbortSignal;
  readonly timeLimitMilliseconds?: number;
}

export interface CalculatedHousehold {
  readonly calculationId: string;
  readonly household: Record<string, unknown>;
  readonly warnings: readonly string[];
  readonly spmConfig: Record<string, unknown> | null;
  readonly spmProvenance: Record<string, unknown> | null;
  readonly countryPackageVersion: string;
  readonly policyengineVersion: string;
}

export interface HouseholdCalculatorDependencies {
  readonly forwarder: Pick<PublicApiForwarder, "fetchFromServer">;
  readonly now?: () => number;
  readonly wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
}

export interface HouseholdCalculator {
  calculateHousehold(
    request: InlineHouseholdCalculationRequest,
    options?: HouseholdCalculationOptions,
  ): Promise<CalculatedHousehold>;
}

export class HouseholdCalculationFailedError extends Error {
  override name = "HouseholdCalculationFailedError";
}

export class HouseholdCalculationTimeoutError extends Error {
  override name = "HouseholdCalculationTimeoutError";
}

export class HouseholdCalculationRefusedError extends Error {
  override name = "HouseholdCalculationRefusedError";
}

export function createHouseholdCalculator(
  _dependencies: HouseholdCalculatorDependencies,
): HouseholdCalculator {
  return {
    async calculateHousehold() {
      throw new Error("calculateHousehold is not implemented yet.");
    },
  };
}
