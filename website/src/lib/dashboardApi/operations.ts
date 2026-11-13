// The dashboard API's four operations, each checked and turned into the one
// Public API request it stands for. Dashboards see only these shapes, never
// the Public API's paths, so the Public API can change its routes without a
// change to any dashboard.

import type { PublicApiRequest } from "@policyengine/public-api-forwarding";

/** The countries the Public API serves. */
export const DASHBOARD_API_COUNTRIES = ["us", "uk"] as const;
export type DashboardApiCountry = (typeof DASHBOARD_API_COUNTRIES)[number];

export type OperationResult =
  | { readonly ok: true; readonly request: PublicApiRequest }
  | { readonly ok: false; readonly message: string };

const POLICY_ID_PATTERN = /^[0-9]{1,10}$/;
const YEAR_PATTERN = /^[0-9]{4}$/;
const MAXIMUM_REGION_LENGTH = 200;

function isCountry(value: unknown): value is DashboardApiCountry {
  return (
    typeof value === "string" &&
    (DASHBOARD_API_COUNTRIES as readonly string[]).includes(value)
  );
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function refused(message: string): OperationResult {
  return { ok: false, message };
}

function unknownFields(
  fields: Record<string, unknown> | URLSearchParams,
  knownFields: readonly string[],
): string[] {
  const names =
    fields instanceof URLSearchParams
      ? [...fields.keys()]
      : Object.keys(fields);
  return [...new Set(names)].filter((name) => !knownFields.includes(name));
}

function countryMessage(): string {
  return `country must be one of: ${DASHBOARD_API_COUNTRIES.join(", ")}.`;
}

/**
 * How long POST /api/household/calculate waits for the Public API's response
 * headers: as long as the route's function may run (`maxDuration`, 800 s,
 * Vercel Pro's limit on Fluid compute), less 50 s for reading the request,
 * getting a token and streaming the answer, the same wait as the calculator's
 * Public API route. The Public API's Cloud Run services end a request 300 s
 * after an instance takes it, but a request can first wait for an instance to
 * start: its load balancer recorded household calculations answering after
 * up to 396 s (2026-11-08).
 */
export const HOUSEHOLD_CALCULATION_WAIT_MILLISECONDS = 750_000;

/** POST /api/household/calculate {country, household, policy?} */
export function householdCalculation(body: unknown): OperationResult {
  if (!isJsonObject(body)) {
    return refused("The request body must be a JSON object.");
  }
  const unknown = unknownFields(body, ["country", "household", "policy"]);
  if (unknown.length > 0) {
    return refused(`Unknown fields: ${unknown.join(", ")}.`);
  }
  if (!isCountry(body.country)) {
    return refused(countryMessage());
  }
  if (!isJsonObject(body.household)) {
    return refused("household must be a JSON object.");
  }
  const policy = body.policy ?? {};
  if (!isJsonObject(policy)) {
    return refused("policy must be a JSON object.");
  }
  return {
    ok: true,
    request: {
      method: "POST",
      path: `/${body.country}/calculate`,
      body: JSON.stringify({ household: body.household, policy }),
    },
  };
}

/** POST /api/policies {country, parameters} */
export function policyCreation(body: unknown): OperationResult {
  if (!isJsonObject(body)) {
    return refused("The request body must be a JSON object.");
  }
  const unknown = unknownFields(body, ["country", "parameters"]);
  if (unknown.length > 0) {
    return refused(`Unknown fields: ${unknown.join(", ")}.`);
  }
  if (!isCountry(body.country)) {
    return refused(countryMessage());
  }
  if (!isJsonObject(body.parameters)) {
    return refused("parameters must be a JSON object.");
  }
  return {
    ok: true,
    request: {
      method: "POST",
      path: `/${body.country}/policy`,
      body: JSON.stringify({ data: body.parameters }),
    },
  };
}

const ECONOMY_COMPARISON_PARAMETERS = [
  "country",
  "policy",
  "baseline",
  "region",
  "year",
] as const;

/** GET /api/economy/compare?country=&policy=&baseline=&region=&year= */
export function economyComparison(query: URLSearchParams): OperationResult {
  const unknown = unknownFields(query, ECONOMY_COMPARISON_PARAMETERS);
  if (unknown.length > 0) {
    return refused(`Unknown query parameters: ${unknown.join(", ")}.`);
  }
  for (const name of ECONOMY_COMPARISON_PARAMETERS) {
    const values = query.getAll(name);
    if (values.length !== 1 || values[0] === "") {
      return refused(`Give the query parameter ${name} exactly once.`);
    }
  }
  const country = query.get("country");
  const policyId = query.get("policy") as string;
  const baselineId = query.get("baseline") as string;
  const region = query.get("region") as string;
  const year = query.get("year") as string;

  if (!isCountry(country)) {
    return refused(countryMessage());
  }
  if (
    !POLICY_ID_PATTERN.test(policyId) ||
    !POLICY_ID_PATTERN.test(baselineId)
  ) {
    return refused("policy and baseline must be policy IDs (whole numbers).");
  }
  if (region.length > MAXIMUM_REGION_LENGTH) {
    return refused(
      `region must be at most ${MAXIMUM_REGION_LENGTH} characters.`,
    );
  }
  if (!YEAR_PATTERN.test(year)) {
    return refused("year must be a four-digit year.");
  }
  return {
    ok: true,
    request: {
      method: "GET",
      path: `/${country}/economy/${policyId}/over/${baselineId}`,
      query: new URLSearchParams({ region, time_period: year }),
    },
  };
}

/** Browsers keep country metadata for an hour; Vercel's CDN does not. */
export const METADATA_CACHE_CONTROL = "max-age=3600";

/** GET /api/metadata/{country} */
export function countryMetadata(country: string): OperationResult {
  if (!isCountry(country)) {
    return refused(countryMessage());
  }
  return { ok: true, request: { method: "GET", path: `/${country}/metadata` } };
}
