// The dashboard API's four operations, each checked and turned into what it
// asks of API v1 (the Public API): the one request it stands for, or for a
// household calculation, the household the website's server calculates
// through /v2/household-calculations. Dashboards see only these shapes,
// never API v1's paths, so API v1 can change its routes without a change to
// any dashboard.

import type {
  InlineHouseholdCalculationRequest,
  PublicApiRequest,
} from "@policyengine/public-api-forwarding";

/** The countries the Public API serves. */
export const DASHBOARD_API_COUNTRIES = ["us", "uk"] as const;
export type DashboardApiCountry = (typeof DASHBOARD_API_COUNTRIES)[number];

export type OperationResult<Requested = PublicApiRequest> =
  | { readonly ok: true; readonly request: Requested }
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

function refused(message: string): { ok: false; message: string } {
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
 * POST /api/household/calculate {country, household, policy?}: the household
 * to calculate, under the policy's parameter values, or under current law
 * when the policy is absent or empty.
 */
export function householdCalculation(
  body: unknown,
): OperationResult<InlineHouseholdCalculationRequest> {
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
      country: body.country,
      household: body.household,
      ...(Object.keys(policy).length === 0 ? {} : { policy }),
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
