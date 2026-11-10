// The calculator's connection to the Public API, for its server code only:
// the Public API route (/api/policyengine/{Public API path}) and the US ask
// route's metadata read share it, so a function instance keeps one token
// cache. Configured by POLICYENGINE_API_URL and the POLICYENGINE_API_AUTH0_*
// variables; see packages/public-api-forwarding/README.md.
//
// Not a route: Next.js serves only route.ts files in this directory. Like
// the routes, it avoids next/server, since app/tsconfig.json also
// type-checks this directory.

import {
  createPublicApiForwarder,
  vercelClientAddress,
  vercelRuntimeTokenStore,
} from "@policyengine/public-api-forwarding";

/** Sent as the User-Agent, so the Public API's logs name the calculator. */
export const CALCULATOR_CALLER_NAME = "policyengine-calculator";

export const calculatorPublicApi = createPublicApiForwarder({
  environment: process.env,
  callerName: CALCULATOR_CALLER_NAME,
  sharedTokenStore: vercelRuntimeTokenStore(),
  clientAddress: vercelClientAddress,
});
