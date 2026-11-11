// The Vercel pieces of forwarding: the Runtime Cache that the deployment's
// function instances share, and the browser's address as Vercel reports it.

import { getCache, ipAddress } from "@vercel/functions";

import type { SharedTokenStore } from "./accessToken";

const RUNTIME_CACHE_NAMESPACE = "policyengine-public-api";

/**
 * Vercel Runtime Cache, one copy per region. Outside Vercel, getCache()
 * falls back to an in-memory cache of its own.
 */
export function vercelRuntimeTokenStore(): SharedTokenStore {
  const runtimeCache = getCache({ namespace: RUNTIME_CACHE_NAMESPACE });
  return {
    get: (key) => runtimeCache.get(key),
    set: (key, value, ttlSeconds) =>
      runtimeCache.set(key, value, {
        ttl: ttlSeconds,
        // The name Vercel's observability shows; the key itself is hashed.
        name: "public-api-access-token",
      }),
  };
}

/**
 * The browser's IP address. Vercel sets x-real-ip itself and overwrites any
 * value a browser sends.
 */
export function vercelClientAddress(request: Request): string | undefined {
  return ipAddress(request);
}
