// Which pages, other than www.policyengine.org's own, may call the dashboard
// API from a browser. Dashboards served through the website's rewrites are
// same-origin and need none of this; the list covers dashboards in local
// development, on their previews and on their own Vercel hosts.

import {
  isLocalDevelopmentOrigin,
  type CorsPolicy,
} from "@policyengine/public-api-forwarding";

import { appZoneRoutes } from "@/data/appZoneRoutes";

// The PolicyEngine team's preview deployments end in "-policy-engine",
// the team's Vercel slug.
const TEAM_PREVIEW_HOST_PATTERN = /^[a-z0-9-]+-policy-engine\.vercel\.app$/;

/** The dashboards' own *.vercel.app hosts, from the website's zone routes. */
export const DASHBOARD_VERCEL_HOSTS: ReadonlySet<string> = new Set(
  appZoneRoutes
    // A few destinations are paths on the website itself.
    .map((route) => new URL(route.destination, "https://www.policyengine.org"))
    .map((destination) => destination.hostname)
    .filter((hostname) => hostname.endsWith(".vercel.app")),
);

export function isAllowedDashboardOrigin(origin: URL): boolean {
  if (isLocalDevelopmentOrigin(origin)) {
    return true;
  }
  if (origin.protocol !== "https:" || origin.port !== "") {
    return false;
  }
  return (
    TEAM_PREVIEW_HOST_PATTERN.test(origin.hostname) ||
    DASHBOARD_VERCEL_HOSTS.has(origin.hostname)
  );
}

export const DASHBOARD_API_CORS_POLICY: CorsPolicy = {
  isAllowedOrigin: isAllowedDashboardOrigin,
  allowedMethods: ["GET", "POST"],
  allowedRequestHeaders: [
    "Content-Type",
    "Authorization",
    "PolicyEngine-Unauthenticated-User",
  ],
  exposedResponseHeaders: ["Retry-After", "X-PolicyEngine-Request-Id"],
  preflightMaxAgeSeconds: 600,
};
