// The website's household calculations on API v1, for its server code only:
// submitted to /v2/household-calculations and read until they finish,
// through the website's connection to API v1 (forwarder.ts).

import { createHouseholdCalculator } from "@policyengine/public-api-forwarding";

import { websitePublicApi } from "./forwarder";

export const websiteHouseholdCalculator = createHouseholdCalculator({
  forwarder: websitePublicApi,
  // Date.now looked up at each call, not kept from when this module loads,
  // so a test that fakes the clock moves the calculation's deadline as well
  // as its waits.
  now: () => Date.now(),
});
