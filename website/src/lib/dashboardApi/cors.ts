// Which pages, other than www.policyengine.org's own, may call the dashboard
// API from a browser. Dashboards served through the website's rewrites are
// same-origin and need none of this; the list covers dashboards in local
// development, on their previews and on their own hosts.

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

/**
 * Production hosts of PolicyEngine dashboards whose pages call the dashboard
 * API (once their phase 4.1 changes, which move them off the Public API,
 * ship) and that DASHBOARD_VERCEL_HOSTS doesn't cover. Each is an exact host
 * name, never a pattern.
 */
export const OTHER_DASHBOARD_HOSTS: ReadonlySet<string> = new Set([
  // autumn-budget-2025-in-review's Vercel project. Not on the website yet.
  "autumn-budget-2025-in-review.vercel.app",
  // nc-stein-2027-tax-proposals: both production domains of its Vercel
  // project, nc-governor-tax-proposals. Not on the website yet.
  "nc-governor-tax-proposals.vercel.app",
  "policyengine-nc-stein-2027-tax-prop.vercel.app",
  // policyengine-model, which the website serves at /{country}/model through
  // a rewrite in next.config.ts rather than appZoneRoutes.ts.
  "policyengine-model-phi.vercel.app",
  // state-legislative-tracker, which the website serves at
  // /{country}/bill-tracker from PolicyEngine's Modal workspace.
  "policyengine--state-legislative-tracker.modal.run",
]);

export function isAllowedDashboardOrigin(origin: URL): boolean {
  if (isLocalDevelopmentOrigin(origin)) {
    return true;
  }
  if (origin.protocol !== "https:" || origin.port !== "") {
    return false;
  }
  return (
    TEAM_PREVIEW_HOST_PATTERN.test(origin.hostname) ||
    DASHBOARD_VERCEL_HOSTS.has(origin.hostname) ||
    OTHER_DASHBOARD_HOSTS.has(origin.hostname)
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
