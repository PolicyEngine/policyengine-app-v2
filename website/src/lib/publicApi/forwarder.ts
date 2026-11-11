// The website's connection to the Public API, for its server code only.
// Configured by POLICYENGINE_API_URL and the POLICYENGINE_API_AUTH0_*
// variables; see packages/public-api-forwarding/README.md.

import {
  createPublicApiForwarder,
  vercelClientAddress,
  vercelRuntimeTokenStore,
} from "@policyengine/public-api-forwarding";

export const WEBSITE_CALLER_NAME = "policyengine-website";

export const websitePublicApi = createPublicApiForwarder({
  environment: process.env,
  callerName: WEBSITE_CALLER_NAME,
  sharedTokenStore: vercelRuntimeTokenStore(),
  clientAddress: vercelClientAddress,
});
