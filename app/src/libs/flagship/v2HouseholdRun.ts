import { isAccountId } from '@/api/v2Associations';
import {
  calculateV2Household,
  storeV2Household,
  type CalculateV2HouseholdOptions,
  type V2HouseholdCalculationOutput,
} from '@/api/v2HouseholdCalculations';
import { isV2ApiError } from '@/api/v2UserClient';
import {
  compareHouseholds,
  plainHouseholdError,
  type FlagshipHouseholdRun,
  type HouseholdCalculationProvenance,
} from '@/libs/flagship/householdRun';
import type { Household } from '@/models/Household';
import { householdDataFromV2Calculation } from '@/models/household/v2DocumentCodec';
import type { SPMProvenance, SPMSelection } from '@/types/spm';
import type { V2HouseholdItem } from '@/types/v2Households';

/**
 * A household run for v3 on the Public API's v2 routes: the household is
 * stored (`POST /v2/households`), then calculated under the baseline and
 * the reform at once (`/v2/household-calculations`), each with every
 * variable the household lacks, as v1's household routes calculate them,
 * for the household's default year. The result is the one the v1 run
 * gives (`runFlagshipHouseholdPayload`): the calculated households in
 * their v1 names, what the reform changes, and how each was calculated.
 */

export interface V2HouseholdRunArgs {
  /** The report's year: the household's own year, which the calculation runs in. */
  year: string;
  household: Household;
  /** A v2 policy (`/v2/policies`); null for current law. */
  baselinePolicyId: string | null;
  reformPolicyId: string | null;
}

/**
 * The policy a v2 household calculation names, for a policy ID v3 holds:
 * none for current law (no ID, or the model catalog's current-law ID), and
 * a v2 policy (`/v2/policies`) by its own ID. A policy known only by its v1
 * number cannot be calculated on the v2 routes, so it is refused rather
 * than calculated as current law.
 */
export function v2PolicyIdFor(
  policyId: string | null | undefined,
  currentLawId: string | number
): string | null {
  if (!policyId || policyId === String(currentLawId)) {
    return null;
  }
  if (isAccountId(policyId)) {
    return policyId;
  }
  throw new Error(
    `Policy ${policyId} is a v1 policy, which the v2 household calculations cannot use.`
  );
}

/** What a calculation's output says about how it was made: as v1's responses say it. */
export function provenanceOfV2Calculation(
  output: V2HouseholdCalculationOutput
): HouseholdCalculationProvenance {
  return {
    // v2 names the .py version that calculated the household, not a whole bundle.
    policyengineBundle: output.policyengine_version
      ? { policyengine_version: output.policyengine_version }
      : null,
    ...(output.spm_config ? { spmConfig: output.spm_config as unknown as SPMSelection } : {}),
    ...(output.spm_provenance
      ? { spmProvenance: output.spm_provenance as unknown as SPMProvenance }
      : {}),
  };
}

/**
 * A v2 household failure in plain words, as the v1 run gives them: a
 * request that never reached the Public API, and a calculation that took
 * too long; any other failure keeps its message.
 */
export function plainV2HouseholdError(error: unknown): Error {
  if (isV2ApiError(error, 0)) {
    return new Error('Could not reach PolicyEngine. Check your connection.', { cause: error });
  }
  return plainHouseholdError(error);
}

/**
 * The run of a household already stored, as v1's run gives it, from its
 * calculations under the baseline and the reform (the same calculation
 * when they are one policy).
 */
export function householdRunFromV2Calculations(
  stored: V2HouseholdItem,
  year: string,
  baseline: V2HouseholdCalculationOutput,
  reform: V2HouseholdCalculationOutput
): FlagshipHouseholdRun {
  const readCalculated = (output: V2HouseholdCalculationOutput) =>
    householdDataFromV2Calculation(stored.country_id, stored.household_data, output.household);
  const baselineData = readCalculated(baseline);
  const reformData = reform === baseline ? baselineData : readCalculated(reform);
  return {
    householdId: stored.id,
    baseline: baselineData,
    reform: reformData,
    provenance: {
      baseline: provenanceOfV2Calculation(baseline),
      reform: provenanceOfV2Calculation(reform),
    },
    ...compareHouseholds(baselineData, reformData, year, stored.country_id),
  };
}

/** Stores the household and calculates it under the baseline and the reform at once. */
export async function runV2FlagshipHousehold(
  { year, household, baselinePolicyId, reformPolicyId }: V2HouseholdRunArgs,
  options: CalculateV2HouseholdOptions = {}
): Promise<FlagshipHouseholdRun> {
  if (household.year !== null && String(household.year) !== year) {
    throw new Error(`The household is set up for ${household.year}, not ${year}.`);
  }
  // Both calculations wait on one signal: when either fails, or the caller
  // stops waiting, the other stops being read (it still runs on the service).
  const stopWaiting = new AbortController();
  const stopWithCaller = () => stopWaiting.abort(options.signal?.reason);
  if (options.signal?.aborted) {
    stopWithCaller();
  }
  options.signal?.addEventListener('abort', stopWithCaller, { once: true });
  try {
    const stored = await storeV2Household(household, options.client);
    const calculate = (policyId: string | null) =>
      calculateV2Household(
        {
          countryId: stored.country_id,
          householdId: stored.id,
          policyId,
          addMissingVariables: true,
        },
        { ...options, signal: stopWaiting.signal }
      ).catch((error: unknown) => {
        stopWaiting.abort();
        throw error;
      });
    const [baseline, reform] = await Promise.all([
      calculate(baselinePolicyId),
      baselinePolicyId === reformPolicyId ? null : calculate(reformPolicyId),
    ]);
    return householdRunFromV2Calculations(stored, year, baseline, reform ?? baseline);
  } catch (error) {
    throw plainV2HouseholdError(error);
  } finally {
    options.signal?.removeEventListener('abort', stopWithCaller);
  }
}
