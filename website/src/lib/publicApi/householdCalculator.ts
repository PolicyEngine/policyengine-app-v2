// The website's household calculations on API v1, for its server code only:
// submitted to /v2/household-calculations and read until they finish,
// through the website's connection to API v1 (forwarder.ts).

import {
  createHouseholdCalculator,
  type HouseholdCalculator,
} from "@policyengine/public-api-forwarding";

import {
  OBSERVABILITY_ID_HEADER,
  REQUEST_ID_HEADER,
  type ApiV1AnswerIds,
} from "@/lib/dashboardApi/householdCalculationAnswer";

import { websitePublicApi } from "./forwarder";

export interface WebsiteHouseholdCalculation {
  readonly calculator: HouseholdCalculator;
  /** The IDs of API v1's last answer to this calculation's requests. */
  readonly lastAnswerIds: () => ApiV1AnswerIds;
}

/**
 * A calculator for one household calculation, which notes the IDs of each
 * answer API v1 gives it. One per calculation, so calculations running at
 * the same time don't see each other's IDs.
 */
export function websiteHouseholdCalculation(): WebsiteHouseholdCalculation {
  let lastAnswerIds: ApiV1AnswerIds = {
    requestId: null,
    observabilityId: null,
  };
  const calculator = createHouseholdCalculator({
    forwarder: {
      async fetchFromServer(request, options) {
        const response = await websitePublicApi.fetchFromServer(
          request,
          options,
        );
        lastAnswerIds = {
          requestId: response.headers.get(REQUEST_ID_HEADER),
          observabilityId: response.headers.get(OBSERVABILITY_ID_HEADER),
        };
        return response;
      },
    },
    // Date.now looked up at each call, not kept from when the calculator is
    // made, so a test that fakes the clock moves the calculation's deadline
    // as well as its waits.
    now: () => Date.now(),
  });
  return { calculator, lastAnswerIds: () => lastAnswerIds };
}
