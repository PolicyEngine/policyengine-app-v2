import {
  createPublicApiClient,
  publicApiCountryId,
  requireResult,
  type PublicApiClient,
} from '@/api/publicApi/client';
import type { components } from '@/api/publicApi/schema';
import { pollUntilFinished, type PollOptions } from '@/api/v2Polling';
import type { Household } from '@/models/Household';
import { householdToV2CreateBody } from '@/models/household/v2DocumentCodec';
import type { V2HouseholdItem } from '@/types/v2Households';

/**
 * Households calculated on the Public API's v2 routes: a household is
 * stored once (`POST /v2/households`, which returns the existing one for
 * identical content), then calculated under a stored policy, or current
 * law, for its default year (`POST /v2/household-calculations`), and the
 * calculation is read (`GET /v2/household-calculations/{calculation_id}`)
 * until it has succeeded or failed.
 */

type Schemas = components['schemas'];

export type V2HouseholdCalculationItem = Schemas['HouseholdCalculationItem'];
export type V2HouseholdCalculationAxis = Schemas['HouseholdCalculationAxis'];
/** A succeeded calculation's household, warnings, SPM settings and receipt, and .py version. */
export type V2HouseholdCalculationOutput = Schemas['HouseholdCalculationOutput'];

export interface V2HouseholdCalculationRequest {
  countryId: string;
  /** The stored household (`/v2/households`). */
  householdId: string;
  /** A stored policy (`/v2/policies`); null for current law. */
  policyId: string | null;
  /** Inputs to vary across points, as the variation charts ask. */
  axes?: V2HouseholdCalculationAxis[][];
  /** Calculate every variable the household lacks, as v1's household routes do. */
  addMissingVariables?: boolean;
}

/** A calculation the simulation service ran and could not finish, with its reason. */
export class V2HouseholdCalculationFailedError extends Error {
  readonly code: string | null;

  constructor(message: string, code: string | null) {
    super(message);
    this.name = 'V2HouseholdCalculationFailedError';
    this.code = code;
  }
}

/** Stores a household's content, or finds the identical stored household. */
export async function storeV2Household(
  household: Household,
  client: PublicApiClient = createPublicApiClient()
): Promise<V2HouseholdItem> {
  const body = householdToV2CreateBody(household);
  const result = await requireResult(
    client.POST('/v2/households', {
      params: { query: { country_id: body.country_id } },
      // The app's document type is the stored shape the generated types describe.
      body: body as unknown as Schemas['HouseholdCreateRequest'],
    })
  );
  return result.item as unknown as V2HouseholdItem;
}

/** A stored household by its ID. Stored households never change, so callers may cache them. */
export async function fetchV2Household(
  countryId: string,
  householdId: string,
  client: PublicApiClient = createPublicApiClient()
): Promise<V2HouseholdItem> {
  const result = await requireResult(
    client.GET('/v2/households/{household_id}', {
      params: {
        path: { household_id: householdId },
        query: { country_id: publicApiCountryId(countryId) },
      },
    })
  );
  return result.item as unknown as V2HouseholdItem;
}

export async function submitV2HouseholdCalculation(
  request: V2HouseholdCalculationRequest,
  client: PublicApiClient = createPublicApiClient()
): Promise<V2HouseholdCalculationItem> {
  return requireResult(
    client.POST('/v2/household-calculations', {
      body: {
        country_id: publicApiCountryId(request.countryId),
        household_id: request.householdId,
        policy_id: request.policyId,
        ...(request.axes ? { axes: request.axes } : {}),
        add_missing_variables: request.addMissingVariables ?? false,
      },
    })
  );
}

export async function fetchV2HouseholdCalculation(
  calculationId: string,
  client: PublicApiClient = createPublicApiClient()
): Promise<V2HouseholdCalculationItem> {
  return requireResult(
    client.GET('/v2/household-calculations/{calculation_id}', {
      params: { path: { calculation_id: calculationId } },
    })
  );
}

/** How a calculation is waited for (see `pollUntilFinished`), and the client it is sent with. */
export interface CalculateV2HouseholdOptions extends PollOptions {
  client?: PublicApiClient;
}

/**
 * Submits a calculation and reads it until it has succeeded, returning its
 * output, or failed, rejecting with its reason. A calculation the Public API
 * already holds (identical, succeeded within 28 days) answers at once. The
 * Public API's refusals reject with its status and message: 404 for a
 * household or policy the country lacks, 422 for a country without household
 * calculations, a household without a default year or a policy the catalog
 * version cannot apply, and 503 when the simulation service is unavailable.
 */
export async function calculateV2Household(
  request: V2HouseholdCalculationRequest,
  { client = createPublicApiClient(), ...pollOptions }: CalculateV2HouseholdOptions = {}
): Promise<V2HouseholdCalculationOutput> {
  let calculationId = '';
  const calculation = await pollUntilFinished({
    first: async () => {
      const submitted = await submitV2HouseholdCalculation(request, client);
      calculationId = submitted.calculation_id;
      return submitted;
    },
    read: () => fetchV2HouseholdCalculation(calculationId, client),
    isFinished: ({ status }) => status === 'succeeded' || status === 'failed',
    timeoutMessage: 'The household calculation timed out.',
    ...pollOptions,
  });
  if (calculation.status === 'failed' || !calculation.result) {
    throw new V2HouseholdCalculationFailedError(
      calculation.error?.message || 'The household calculation failed.',
      calculation.error?.code ?? null
    );
  }
  return calculation.result;
}
