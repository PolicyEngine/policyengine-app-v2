/* eslint-disable @typescript-eslint/no-unused-vars -- placeholder until the implementation commit */
import type { PublicApiForwarder } from "@policyengine/public-api-forwarding";

import type { FetchLike } from "@/lib/deployments";

import { websitePublicApi } from "./forwarder";

export function withPublicApiCredential(
  fetchImplementation: FetchLike,
  _publicApi: PublicApiForwarder = websitePublicApi,
): FetchLike {
  return fetchImplementation;
}
