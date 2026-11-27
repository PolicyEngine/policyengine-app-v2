import { isAccountId } from '@/api/v2Associations';
import {
  calculateV2Household,
  type CalculateV2HouseholdOptions,
  type V2HouseholdCalculationOutput,
  type V2SucceededHouseholdCalculation,
} from '@/api/v2HouseholdCalculations';
import { storeV2HouseholdBody } from '@/api/v2Households';
import { isV2ApiError, type V2UserClient } from '@/api/v2UserClient';
import {
  compareHouseholds,
  plainHouseholdError,
  type FlagshipHouseholdRun,
  type HouseholdCalculationProvenance,
} from '@/libs/flagship/householdRun';
import type { Household } from '@/models/Household';
import type { V1HouseholdCreateEnvelope } from '@/models/household/v1Types';
import {
  householdDataFromV2Calculation,
  v2CreateBodyFromV1Payload,
} from '@/models/household/v2DocumentCodec';
import type { SPMProvenance, SPMSelection } from '@/types/spm';
import type { V2HouseholdItem } from '@/types/v2Households';

export interface V2HouseholdRunArgs {
  /** The report's year: the household's own year, which the calculation runs in. */
  year: string;
  household: Household;
  /**
   * The household as it is sent, when that carries more than the
   * household model (a UK household's claimant and partner roles); the
   * household's own v1 payload when left out.
   */
  payload?: V1HouseholdCreateEnvelope;
  /** A v2 policy (`/v2/policies`); null for current law. */
  baselinePolicyId: string | null;
  reformPolicyId: string | null;
}

/**
 * The policy a v2 household calculation names, for a policy ID v3 holds:
 * none for current law (no ID, or the model catalog's current-law ID), and
 * a v2 policy (`/v2/policies`) by its own ID. A policy known only by its v1
 * number cannot be calculated on the `/v2/` routes, so it is refused rather
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

/**
 * A US calculation's SPM settings and receipt, as the app types them (API
 * v1 gives each as open JSON); neither for a calculation without SPM.
 */
export function spmOfV2Calculation(output: V2HouseholdCalculationOutput): {
  spmConfig?: SPMSelection;
  spmProvenance?: SPMProvenance;
} {
  return {
    ...(output.spm_config ? { spmConfig: output.spm_config as unknown as SPMSelection } : {}),
    ...(output.spm_provenance
      ? { spmProvenance: output.spm_provenance as unknown as SPMProvenance }
      : {}),
  };
}

/**
 * How a calculation was made, as v1's responses say it: the .py and
 * country package versions it ran with, and its SPM settings and receipt.
 */
export function provenanceOfV2Calculation(
  calculation: V2SucceededHouseholdCalculation
): HouseholdCalculationProvenance {
  return {
    policyengineBundle: {
      policyengine_version: calculation.policyengine_version,
      model_version: calculation.country_package_version,
    },
    ...spmOfV2Calculation(calculation.result),
  };
}

/**
 * A v2 household failure in plain words, as the v1 run gives them: a
 * request that never reached API v1, and a calculation that took too long;
 * any other failure keeps its message. The /v2/ clients report a request
 * that got no answer as status 0, so a TypeError here comes from reading
 * an answer and keeps its own reason, unlike on the v1 routes.
 */
export function plainV2HouseholdError(error: unknown): Error {
  if (isV2ApiError(error, 0)) {
    return new Error('Could not reach PolicyEngine. Check your connection.', { cause: error });
  }
  if (error instanceof TypeError) {
    return error;
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
  baseline: V2SucceededHouseholdCalculation,
  reform: V2SucceededHouseholdCalculation
): FlagshipHouseholdRun {
  const readCalculated = (calculation: V2SucceededHouseholdCalculation) =>
    householdDataFromV2Calculation(
      stored.country_id,
      stored.household_data,
      calculation.result.household
    );
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

/** How the run waits for its calculations, the client the household is stored with, and who hears it is stored. */
export interface V2HouseholdRunOptions extends CalculateV2HouseholdOptions {
  householdClient?: V2UserClient;
  /** Called with the stored household once it is stored, before it is calculated. */
  onStored?: (stored: V2HouseholdItem) => void;
}

/**
 * A household run for v3 on API v1's `/v2/` routes: the household is
 * stored (`POST /v2/households`), then calculated under the baseline and
 * the reform at once (`/v2/household-calculations`), each with every
 * variable the household lacks, as v1's household routes calculate them,
 * for the household's default year. The result is the one the v1 run
 * gives (`runFlagshipHouseholdPayload`): the calculated households in
 * their v1 names, what the reform changes, and how each was calculated.
 */
export async function runV2FlagshipHousehold(
  { year, household, payload, baselinePolicyId, reformPolicyId }: V2HouseholdRunArgs,
  { householdClient, onStored, ...options }: V2HouseholdRunOptions = {}
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
    const stored = await storeV2HouseholdBody(
      v2CreateBodyFromV1Payload(payload ?? household.toV1CreationPayload(), household.year),
      householdClient
    );
    onStored?.(stored);
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
