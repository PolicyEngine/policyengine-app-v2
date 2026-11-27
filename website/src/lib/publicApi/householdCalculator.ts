// The website's household calculations on API v1, for its server code only:
// submitted to /v2/household-calculations and read until they finish,
// through the website's connection to API v1 (forwarder.ts).

import {
  createHouseholdCalculator,
  type HouseholdCalculator,
} from "@policyengine/public-api-forwarding";

import {
  NO_ANSWER_IDS,
  answerIdsOf,
  type ApiV1AnswerIds,
} from "./apiV1AnswerIds";
import { websitePublicApi } from "./forwarder";

export interface WebsiteHouseholdCalculation {
  readonly calculator: HouseholdCalculator;
  /**
   * The IDs of API v1's answer to this calculation's submission: the
   * request that started the calculation, as /calculate's request did, and
   * the only one whose answer has an observability ID. A submission sent
   * again after API v1 said no job would run replaces them.
   */
  readonly submissionAnswerIds: () => ApiV1AnswerIds;
}

/**
 * A calculator for one household calculation, which notes the IDs of API
 * v1's answer to its submission. One per calculation, so calculations
 * running at the same time don't see each other's IDs.
 */
export function websiteHouseholdCalculation(): WebsiteHouseholdCalculation {
  let submissionAnswerIds = NO_ANSWER_IDS;
  const calculator = createHouseholdCalculator({
    forwarder: {
      async fetchFromServer(request, options) {
        const response = await websitePublicApi.fetchFromServer(
          request,
          options,
        );
        // The helper sends only its submission with POST.
        if (request.method === "POST") {
          submissionAnswerIds = answerIdsOf(response);
        }
        return response;
      },
    },
    // Date.now looked up at each call, not kept from when the calculator is
    // made, so a test that fakes the clock moves the calculation's deadline
    // as well as its waits.
    now: () => Date.now(),
  });
  return { calculator, submissionAnswerIds: () => submissionAnswerIds };
}
