// The website's own server-side requests to the Public API, as opposed to
// requests it forwards for a browser. They go to this deployment's Public
// API (POLICYENGINE_API_URL, or production on a production deployment) and
// carry the website's server credential when one is configured.

import type {
  PublicApiForwarder,
  PublicApiMethod,
} from "@policyengine/public-api-forwarding";

import { API_ORIGIN, type FetchLike } from "@/lib/deployments";

import { websitePublicApi } from "./forwarder";

const PUBLIC_API_METHODS: readonly PublicApiMethod[] = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];

/**
 * Wraps a fetch so that every request to the Public API's address goes
 * through the website's Public API connection, with its credential. Other
 * requests (GitHub, PyPI and the like) are passed on unchanged, so they
 * never see the credential.
 */
export function withPublicApiCredential(
  fetchImplementation: FetchLike,
  publicApi: PublicApiForwarder = websitePublicApi,
): FetchLike {
  return async (input, init) => {
    const url = new URL(input);
    if (url.origin !== API_ORIGIN) {
      return fetchImplementation(input, init);
    }
    const method = (init?.method ?? "GET").toUpperCase() as PublicApiMethod;
    if (!PUBLIC_API_METHODS.includes(method)) {
      throw new TypeError(`Unsupported method for the Public API: ${method}`);
    }
    return publicApi.fetchFromServer(
      {
        method,
        path: url.pathname,
        query: url.search ? url.searchParams : undefined,
        body: typeof init?.body === "string" ? init.body : undefined,
      },
      { next: init?.next },
    );
  };
}
