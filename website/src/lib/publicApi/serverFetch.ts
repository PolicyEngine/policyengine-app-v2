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

// The request options a Public API request may carry; fetchFromServer()
// builds every header itself and sets its own timeout.
const PASSED_REQUEST_OPTIONS = new Set(["method", "body", "next"]);

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
    // fetch reads null as "none" for these, so null is passed over too.
    const droppedOptions = Object.entries(init ?? {})
      .filter(
        ([name, value]) =>
          value !== undefined &&
          value !== null &&
          !PASSED_REQUEST_OPTIONS.has(name),
      )
      .map(([name]) => name);
    if (droppedOptions.length > 0) {
      throw new TypeError(
        `A Public API request cannot carry: ${droppedOptions.join(", ")}`,
      );
    }
    if (
      init?.body !== undefined &&
      init.body !== null &&
      typeof init.body !== "string"
    ) {
      throw new TypeError("A Public API request body must be a string.");
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
        body: init?.body ?? undefined,
      },
      { next: init?.next },
    );
  };
}
