// Which model and data each PolicyEngine service declares and serves, per
// country.
//
// The chain is: a service's dependency lock pins `policyengine` (.py) -> that
// .py tag's bundle manifest (`src/policyengine/data/bundle/manifest.json`)
// certifies one data build and one country-model version per country -> the
// data build is a Microcosm release. The *declared* side is the lock
// file on each repository's default branch. The *served* side is what a
// running service reports, for the services that report it; a merged change
// that is not deployed is declared but not served. Isomorphic types; the
// fetchers take an injected `fetch` so they can be tested without the network.

// Countries a .py bundle certifies data for.
export const DEPLOYMENT_COUNTRIES = ["us", "uk"] as const;
export type DeploymentCountry = (typeof DEPLOYMENT_COUNTRIES)[number];

export function isDeploymentCountry(value: string): value is DeploymentCountry {
  return (DEPLOYMENT_COUNTRIES as readonly string[]).includes(value);
}

// Microcosm publishes each data build as a release on its calibration
// dashboard.
export const MICROCOSM_DASHBOARD_URL =
  "https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm";

export const PY_REPOSITORY = "PolicyEngine/policyengine.py";
export const PY_BUNDLE_MANIFEST_PATH =
  "src/policyengine/data/bundle/manifest.json";
export const PY_PYPI_URL = "https://pypi.org/pypi/policyengine/json";

export type LockFormat = "uv" | "requirements";

// Runtime reports. `api_v2` is the API's small model route (the full
// `/metadata` is ~75 MB for the US and has no range support); it reports the
// served .py only. `sim_gateway` reports .py, model and data build directly.
// `household_versions` is the household API's channel manifest: the `current`
// channel serves users, and `frontier` is the next release being rolled out.
export type ServedSourceKind = "api_v2" | "sim_gateway" | "household_versions";

export const API_ORIGIN = "https://api.policyengine.org";
export const HOUSEHOLD_API_ORIGIN = "https://household.api.policyengine.org";
export const SIM_GATEWAY_ORIGIN =
  "https://policyengine--policyengine-simulation-gateway-web-app.modal.run";

export interface DeploymentSurface {
  id: string;
  label: string;
  // Public host or product name the surface is known by.
  serves: string;
  repository: string;
  branch: string;
  // A surface that pins no Python packages and takes its model from another
  // surface (the app frontend calls the API).
  via?: string;
  lock?: { path: string; format: LockFormat };
  // False for a surface that calculates single households and loads no
  // microdata, so no data build applies to it.
  loads_dataset?: boolean;
  // Where the running service reports its versions; omitted when it reports
  // none.
  served?: { kind: ServedSourceKind; origin: string };
  note?: string;
}

export const DEPLOYMENT_SURFACES: readonly DeploymentSurface[] = [
  {
    id: "api",
    label: "PolicyEngine API",
    serves: "api.policyengine.org",
    repository: "PolicyEngine/policyengine-api",
    branch: "master",
    lock: { path: "uv.lock", format: "uv" },
    served: { kind: "api_v2", origin: API_ORIGIN },
  },
  {
    id: "app-v3",
    label: "App v3",
    serves: "app.policyengine.org, policyengine.org",
    repository: "PolicyEngine/policyengine-app-v2",
    branch: "main",
    via: "api",
    note: "The frontend pins no model; it calls api.policyengine.org.",
  },
  {
    id: "sim-api",
    label: "Simulation API (executor)",
    serves: "policyengine-sim-api simulation executor",
    repository: "PolicyEngine/policyengine-sim-api",
    branch: "main",
    lock: {
      path: "projects/policyengine-simulation-executor/uv.lock",
      format: "uv",
    },
    served: { kind: "sim_gateway", origin: SIM_GATEWAY_ORIGIN },
  },
  {
    id: "household-api",
    label: "Household API",
    serves: "household.api.policyengine.org",
    repository: "PolicyEngine/policyengine-household-api",
    branch: "main",
    lock: { path: "uv.lock", format: "uv" },
    // Its country metadata reports `dataset: None` and `data_version: None`.
    loads_dataset: false,
    served: { kind: "household_versions", origin: HOUSEHOLD_API_ORIGIN },
  },
];

const TRACKED_PACKAGES = [
  "policyengine",
  "policyengine-core",
  "policyengine-us",
  "policyengine-uk",
] as const;
export type TrackedPackage = (typeof TRACKED_PACKAGES)[number];
export type LockedVersions = Partial<Record<TrackedPackage, string>>;

const COUNTRY_MODEL_PACKAGE: Partial<
  Record<DeploymentCountry, TrackedPackage>
> = {
  us: "policyengine-us",
  uk: "policyengine-uk",
};

export function countryModelPackage(
  country: DeploymentCountry,
): TrackedPackage | null {
  return COUNTRY_MODEL_PACKAGE[country] ?? null;
}

function normalizePackageName(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, "-");
}

function tracked(name: string): TrackedPackage | null {
  const normalized = normalizePackageName(name);
  return (TRACKED_PACKAGES as readonly string[]).includes(normalized)
    ? (normalized as TrackedPackage)
    : null;
}

// uv.lock: one `[[package]]` table per resolved package, with `name` and
// `version` as its first keys.
export function parseUvLock(text: string): LockedVersions {
  const versions: LockedVersions = {};
  let name: string | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("[")) {
      name = null;
      continue;
    }
    const match = /^(name|version)\s*=\s*"([^"]*)"/.exec(line);
    if (!match) continue;
    if (match[1] === "name") {
      name = match[2];
    } else if (name) {
      const pkg = tracked(name);
      if (pkg && versions[pkg] === undefined) versions[pkg] = match[2];
      name = null;
    }
  }
  return versions;
}

// pip-compile output: `name[extra]==version \` at the start of a line.
export function parseRequirementsLock(text: string): LockedVersions {
  const versions: LockedVersions = {};
  for (const line of text.split("\n")) {
    const match = /^([A-Za-z0-9_.-]+)(?:\[[^\]]*\])?==([^\s;\\]+)/.exec(
      line.trim(),
    );
    if (!match) continue;
    const pkg = tracked(match[1]);
    if (pkg && versions[pkg] === undefined) versions[pkg] = match[2];
  }
  return versions;
}

export function parseLock(text: string, format: LockFormat): LockedVersions {
  return format === "uv" ? parseUvLock(text) : parseRequirementsLock(text);
}

export interface BundleCountryRelease {
  build_id: string;
  model_package: string | null;
  certified_model_version: string | null;
}

export interface BundleSummary {
  py_version: string;
  core_version: string | null;
  countries: Partial<Record<string, BundleCountryRelease>>;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function parseBundleManifest(
  json: unknown,
  pyVersion: string,
): BundleSummary {
  const manifest = record(json);
  if (!manifest)
    throw new Error(`.py ${pyVersion} bundle manifest is not an object`);
  const releases = record(manifest.data_releases) ?? {};
  const packages = record(manifest.packages) ?? {};
  const countries: BundleSummary["countries"] = {};
  for (const [country, value] of Object.entries(releases)) {
    const release = record(value);
    if (!release) continue;
    const certification = record(release.certification);
    const buildId = str(release.build_id) ?? str(certification?.data_build_id);
    if (!buildId) continue;
    const modelPackage =
      str(release.model_package) ??
      str(record(record(manifest.countries)?.[country])?.model_package);
    countries[country] = {
      build_id: buildId,
      model_package: modelPackage,
      certified_model_version:
        str(certification?.certified_for_model_version) ??
        str(record(modelPackage ? packages[modelPackage] : null)?.version),
    };
  }
  return {
    py_version:
      str(manifest.bundle_version) ??
      str(manifest.policyengine_version) ??
      pyVersion,
    core_version: str(record(packages["policyengine-core"])?.version),
    countries,
  };
}

export type DeploymentStatus =
  | "current"
  | "behind"
  | "model_mismatch"
  | "no_bundle"
  | "no_py"
  | "not_in_bundle"
  | "no_dataset"
  | "unavailable";

export interface DeploymentRow {
  surface: DeploymentSurface;
  lock_url: string | null;
  py_version: string | null;
  core_version: string | null;
  model_version: string | null;
  // The data build the surface's .py certifies for this country.
  data_build_id: string | null;
  certified_model_version: string | null;
  status: DeploymentStatus;
  detail: string;
  served: ServedState;
}

// What a running service reports. A field is null when the service does not
// report it.
export interface ServedReport {
  kind: ServedSourceKind;
  py_version: string | null;
  model_version: string | null;
  data_build_id: string | null;
  source_url: string;
  // Other .py versions the service also serves on request (the gateway keeps
  // older worker apps routable).
  other_py_versions: number;
  // Added to the status explanation (e.g. another channel's version).
  note: string;
  // The gateway's worker for each routable .py version, for this country.
  routes: Record<
    string,
    { model_version: string | null; data_build_id: string | null }
  >;
}

export type ServedStatus =
  | "matches"
  | "differs"
  | "no_worker"
  | "unavailable"
  | "not_reported";

export interface ServedState {
  status: ServedStatus;
  py_version: string | null;
  model_version: string | null;
  data_build_id: string | null;
  // "reported": the service names the data build itself. "served_py_bundle":
  // the build the served .py's bundle certifies.
  data_basis: "reported" | "served_py_bundle" | null;
  source_url: string | null;
  detail: string;
}

export const NOT_REPORTED: ServedState = {
  status: "not_reported",
  py_version: null,
  model_version: null,
  data_build_id: null,
  data_basis: null,
  source_url: null,
  detail:
    "The service reports no versions at runtime, so only the lock is known.",
};

export function servedUrl(
  served: NonNullable<DeploymentSurface["served"]>,
  country: DeploymentCountry,
): string {
  return served.kind === "api_v2"
    ? `${served.origin}/v2/tax-benefit-models/by-country/${country}`
    : `${served.origin}/versions`;
}

// GET /v2/tax-benefit-models/by-country/{country}
export function parseApiV2Model(
  json: unknown,
  sourceUrl: string,
): ServedReport {
  const py = str(record(record(json)?.result)?.policyengine_version);
  if (!py) throw new Error(`${sourceUrl} reported no policyengine_version`);
  return {
    kind: "api_v2",
    py_version: py,
    model_version: null,
    data_build_id: null,
    source_url: sourceUrl,
    other_py_versions: 0,
    note: "",
    routes: {},
  };
}

// GET /versions on the household API: the country-model version of each
// channel. The household API pins country models directly, not .py.
export function parseHouseholdVersions(
  json: unknown,
  country: DeploymentCountry,
  sourceUrl: string,
): ServedReport {
  const channels = record(json);
  const channelVersion = (channel: string) =>
    str(record(record(channels?.[channel])?.package_versions)?.[country]);
  const current = channelVersion("current");
  if (!current) {
    throw new Error(`${sourceUrl} reported no current ${country} version`);
  }
  const frontier = channelVersion("frontier");
  const modelPackage = countryModelPackage(country) ?? "the country model";
  return {
    kind: "household_versions",
    py_version: null,
    model_version: current,
    data_build_id: null,
    source_url: sourceUrl,
    other_py_versions: 0,
    note:
      frontier && frontier !== current
        ? ` Its frontier channel, which is not yet serving users, runs ${modelPackage} ${frontier}.`
        : "",
    routes: {},
  };
}

// GET /versions on the simulation gateway: the `latest` route per kind, and
// the bundle each .py route serves.
export function parseGatewayVersions(
  json: unknown,
  country: DeploymentCountry,
  sourceUrl: string,
): ServedReport {
  const versions = record(json);
  const pyRoutes = record(versions?.policyengine) ?? {};
  const py = str(pyRoutes.latest);
  if (!py) throw new Error(`${sourceUrl} reported no latest .py route`);
  const bundles = record(versions?.bundles) ?? {};
  const workerFor = (version: string) => {
    const entry = record(record(bundles[version])?.[country]);
    return {
      model_version: str(entry?.model_version),
      data_build_id: str(entry?.data_version),
    };
  };
  const routes: ServedReport["routes"] = {};
  for (const version of Object.keys(pyRoutes)) {
    if (version !== "latest") routes[version] = workerFor(version);
  }
  const bundle = record(record(bundles[py])?.[country]);
  return {
    kind: "sim_gateway",
    py_version: py,
    model_version:
      str(bundle?.model_version) ?? str(record(versions?.[country])?.latest),
    data_build_id: str(bundle?.data_version),
    source_url: sourceUrl,
    other_py_versions: Object.keys(pyRoutes).filter(
      (key) => key !== "latest" && key !== py,
    ).length,
    note: "",
    routes,
  };
}

// Pure: compare what a service serves with what its lock declares. The API
// runs economy simulations on the simulation gateway's worker for its own
// .py, so `gateway` (when readable) supplies the API's data build and shows a
// missing worker.
export function compareServed(
  row: DeploymentRow,
  report: ServedReport | { error: string; source_url: string },
  bundles: ReadonlyMap<string, BundleSummary | null>,
  country: DeploymentCountry,
  gateway: ServedReport | null = null,
): ServedState {
  if ("error" in report) {
    return {
      ...NOT_REPORTED,
      status: "unavailable",
      source_url: report.source_url,
      detail: `Could not read the runtime report: ${report.error}`,
    };
  }
  const servedRelease = report.py_version
    ? bundles.get(report.py_version)?.countries[country]
    : undefined;
  const usesWorker =
    report.kind === "api_v2" && gateway !== null && report.py_version !== null;
  const worker = usesWorker ? gateway.routes[report.py_version!] : undefined;
  if (usesWorker && !worker) {
    return {
      status: "no_worker",
      py_version: report.py_version,
      model_version: servedRelease?.certified_model_version ?? null,
      data_build_id: null,
      data_basis: null,
      source_url: gateway.source_url,
      detail:
        `The simulation gateway has no worker for .py ${report.py_version}, ` +
        "so this service's economy simulations fail.",
    };
  }
  const reportedBuild =
    row.surface.loads_dataset === false
      ? null
      : (report.data_build_id ?? worker?.data_build_id ?? null);
  const dataBuild = reportedBuild ?? servedRelease?.build_id ?? null;
  const state: Omit<ServedState, "status" | "detail"> = {
    py_version: report.py_version,
    model_version:
      report.model_version ??
      worker?.model_version ??
      servedRelease?.certified_model_version ??
      null,
    data_build_id: row.surface.loads_dataset === false ? null : dataBuild,
    data_basis:
      row.surface.loads_dataset === false || !dataBuild
        ? null
        : reportedBuild
          ? "reported"
          : "served_py_bundle",
    source_url: report.source_url,
  };

  const differences: string[] = [];
  const compare = (
    label: string,
    served: string | null,
    declared: string | null,
  ) => {
    if (served && declared && served !== declared) {
      differences.push(
        `it serves ${label} ${served}, but the lock on main declares ${declared}`,
      );
    }
  };
  compare(".py", state.py_version, row.py_version);
  compare("model", state.model_version, row.model_version);
  compare("data build", state.data_build_id, row.data_build_id);
  if (
    worker?.data_build_id &&
    servedRelease &&
    worker.data_build_id !== servedRelease.build_id
  ) {
    differences.push(
      `its gateway worker for .py ${report.py_version} serves data build ` +
        `${worker.data_build_id}, but .py ${report.py_version} certifies ${servedRelease.build_id}`,
    );
  }

  const workerNote = worker
    ? ` Its economy simulations run on the gateway worker for .py ${report.py_version}.`
    : "";
  const others =
    report.other_py_versions > 0
      ? ` It also keeps ${report.other_py_versions} older .py versions routable for callers that ask for them.`
      : "";
  if (differences.length) {
    return {
      ...state,
      status: "differs",
      detail: `Live differs from main: ${differences.join("; ")}.${report.note}${others}`,
    };
  }
  return {
    ...state,
    status: "matches",
    detail: `Serves what the lock on main declares.${workerNote}${report.note}${others}`,
  };
}

export interface DeploymentsResponse {
  country: DeploymentCountry;
  model_package: string | null;
  checked_at: string;
  basis: "declared_default_branch_and_served";
  latest: {
    py_version: string;
    data_build_id: string | null;
    certified_model_version: string | null;
  } | null;
  latest_error: string | null;
  rows: DeploymentRow[];
}

// Data builds published by Microcosm are releases on its dashboard; a .py
// bundle can also certify a legacy dataset (e.g. policyengine-uk-data).
export function isMicrocosmBuild(buildId: string): boolean {
  return /^(populace|microcosm)-/.test(buildId);
}

// A Microcosm build ID repeats its producer, country and data year, then
// names the build ("microcosm-uk-2024-25-national-20261025T091414Z-a6299504",
// "populace-us-2024-spm-20260915"). An overview shows only the build part,
// with the date readable: "national · 2026-10-25 · a6299504", "spm ·
// 2026-09-15". Other IDs are shown whole.
export function shortBuildId(buildId: string): string {
  const match = /^(?:populace|microcosm)-[a-z]{2}-\d{4}(?:-\d{2})?-(.+)$/.exec(
    buildId,
  );
  if (!match) return buildId;
  return match[1]
    .replace(/(\d{4})(\d{2})(\d{2})(?:T\d{6}Z)?/, "$1-$2-$3")
    .replace(/-(?=\d{4}-\d{2}-\d{2})/, " · ")
    .replace(/(\d{4}-\d{2}-\d{2})-/, "$1 · ");
}

export function microcosmBuildUrl(
  country: DeploymentCountry,
  buildId: string,
): string {
  return `${MICROCOSM_DASHBOARD_URL}?country=${country}&release=${encodeURIComponent(buildId)}`;
}

export function rawGitHubUrl(
  repository: string,
  ref: string,
  path: string,
): string {
  return `https://raw.githubusercontent.com/${repository}/${ref}/${path}`;
}

export function lockUrl(surface: DeploymentSurface): string | null {
  return surface.lock
    ? rawGitHubUrl(surface.repository, surface.branch, surface.lock.path)
    : null;
}

export function lockBrowseUrl(surface: DeploymentSurface): string | null {
  return surface.lock
    ? `https://github.com/${surface.repository}/blob/${surface.branch}/${surface.lock.path}`
    : null;
}

export interface SurfaceDeclaration {
  versions: LockedVersions | null;
  error: string | null;
}

// Pure: classify one surface against the bundle its .py carries and the latest
// .py bundle.
export function classifyDeployment(
  surface: DeploymentSurface,
  declaration: SurfaceDeclaration,
  country: DeploymentCountry,
  bundles: ReadonlyMap<string, BundleSummary | null>,
  latest: BundleSummary | null,
): DeploymentRow {
  const modelPackage = countryModelPackage(country);
  const versions = declaration.versions ?? {};
  const pyVersion = versions.policyengine ?? null;
  const modelVersion = modelPackage ? (versions[modelPackage] ?? null) : null;
  const bundle = pyVersion ? bundles.get(pyVersion) : undefined;
  const release = bundle?.countries[country] ?? null;
  const base = {
    surface,
    lock_url: lockBrowseUrl(surface),
    py_version: pyVersion,
    core_version: versions["policyengine-core"] ?? null,
    model_version: modelVersion,
    data_build_id: release?.build_id ?? null,
    certified_model_version: release?.certified_model_version ?? null,
    served: NOT_REPORTED,
  };
  const latestRelease = latest?.countries[country] ?? null;

  if (declaration.error) {
    return { ...base, status: "unavailable", detail: declaration.error };
  }
  if (surface.loads_dataset === false) {
    const pin = modelVersion
      ? `${modelPackage} ${modelVersion}`
      : "its country model";
    return {
      ...base,
      data_build_id: null,
      certified_model_version: null,
      status: "no_dataset",
      detail: `Calculates single households and loads no microdata. Pins ${pin}${
        pyVersion ? ` through .py ${pyVersion}` : " directly, without .py"
      }.`,
    };
  }
  if (!pyVersion) {
    return {
      ...base,
      status: "no_py",
      detail: modelVersion
        ? `Pins ${modelPackage} ${modelVersion} without .py, so no bundle certifies its data.`
        : "The lock pins neither .py nor the country model.",
    };
  }
  if (bundle === null || bundle === undefined) {
    return {
      ...base,
      status: "no_bundle",
      detail: `.py ${pyVersion} has no bundle manifest, so it certifies no data build.`,
    };
  }
  if (!release) {
    return {
      ...base,
      status: "not_in_bundle",
      detail: `.py ${pyVersion} certifies no ${country.toUpperCase()} data build.`,
    };
  }
  if (
    modelVersion &&
    release.certified_model_version &&
    modelVersion !== release.certified_model_version
  ) {
    return {
      ...base,
      status: "model_mismatch",
      detail:
        `Locks ${modelPackage} ${modelVersion}, but .py ${pyVersion} certifies its data for ` +
        `${release.certified_model_version}.`,
    };
  }
  if (latestRelease && latestRelease.build_id !== release.build_id) {
    return {
      ...base,
      status: "behind",
      detail: `The latest .py ${latest!.py_version} certifies ${latestRelease.build_id}.`,
    };
  }
  return {
    ...base,
    status: "current",
    detail: latest
      ? `Same data build as the latest .py ${latest.py_version}.`
      : "The latest .py version is unknown.",
  };
}

type FetchLike = (
  input: string,
  init?: RequestInit & { next?: { revalidate?: number } },
) => Promise<Response>;

async function fetchText(
  fetchImpl: FetchLike,
  url: string,
  revalidate: number,
): Promise<string> {
  const response = await fetchImpl(url, { next: { revalidate } });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.text();
}

export async function loadSurfaceDeclaration(
  surface: DeploymentSurface,
  fetchImpl: FetchLike,
  revalidate: number,
): Promise<SurfaceDeclaration> {
  const url = lockUrl(surface);
  if (!url || !surface.lock) return { versions: null, error: null };
  try {
    return {
      versions: parseLock(
        await fetchText(fetchImpl, url, revalidate),
        surface.lock.format,
      ),
      error: null,
    };
  } catch (error) {
    return {
      versions: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// null when the tag has no bundle manifest (a .py release before bundles).
export async function loadBundle(
  pyVersion: string,
  fetchImpl: FetchLike,
  revalidate: number,
): Promise<BundleSummary | null> {
  const url = rawGitHubUrl(PY_REPOSITORY, pyVersion, PY_BUNDLE_MANIFEST_PATH);
  const response = await fetchImpl(url, { next: { revalidate } });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return parseBundleManifest(await response.json(), pyVersion);
}

export async function loadServedReport(
  surface: DeploymentSurface,
  country: DeploymentCountry,
  fetchImpl: FetchLike,
  revalidate: number,
): Promise<ServedReport | { error: string; source_url: string } | null> {
  if (!surface.served) return null;
  const url = servedUrl(surface.served, country);
  try {
    const response = await fetchImpl(url, { next: { revalidate } });
    if (!response.ok) throw new Error(`${response.status} from ${url}`);
    const json = await response.json();
    switch (surface.served.kind) {
      case "api_v2":
        return parseApiV2Model(json, url);
      case "sim_gateway":
        return parseGatewayVersions(json, country, url);
      case "household_versions":
        return parseHouseholdVersions(json, country, url);
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      source_url: url,
    };
  }
}

export async function loadLatestPyVersion(
  fetchImpl: FetchLike,
  revalidate: number,
): Promise<string> {
  const response = await fetchImpl(PY_PYPI_URL, { next: { revalidate } });
  if (!response.ok) throw new Error(`${response.status} from ${PY_PYPI_URL}`);
  const version = str(record(record(await response.json())?.info)?.version);
  if (!version) throw new Error("PyPI returned no policyengine version");
  return version;
}

export async function loadDeployments(
  country: DeploymentCountry,
  fetchImpl: FetchLike,
  revalidate: number,
  now: () => Date = () => new Date(),
): Promise<DeploymentsResponse> {
  const surfaces = DEPLOYMENT_SURFACES;
  const [declaredEntries, servedEntries] = await Promise.all([
    Promise.all(
      surfaces.map(
        async (surface) =>
          [
            surface.id,
            await loadSurfaceDeclaration(surface, fetchImpl, revalidate),
          ] as const,
      ),
    ),
    Promise.all(
      surfaces.map(
        async (surface) =>
          [
            surface.id,
            await loadServedReport(surface, country, fetchImpl, revalidate),
          ] as const,
      ),
    ),
  ]);
  const declared = new Map(declaredEntries);
  const served = new Map(servedEntries);

  let latestVersion: string | null = null;
  let latestError: string | null = null;
  try {
    latestVersion = await loadLatestPyVersion(fetchImpl, revalidate);
  } catch (error) {
    latestError = error instanceof Error ? error.message : String(error);
  }

  const pyVersions = new Set<string>();
  for (const declaration of declared.values()) {
    if (declaration.versions?.policyengine)
      pyVersions.add(declaration.versions.policyengine);
  }
  for (const report of served.values()) {
    if (report && !("error" in report) && report.py_version)
      pyVersions.add(report.py_version);
  }
  if (latestVersion) pyVersions.add(latestVersion);

  const bundles = new Map<string, BundleSummary | null>();
  const bundleErrors = new Map<string, string>();
  await Promise.all(
    [...pyVersions].map(async (version) => {
      try {
        bundles.set(version, await loadBundle(version, fetchImpl, revalidate));
      } catch (error) {
        bundleErrors.set(
          version,
          error instanceof Error ? error.message : String(error),
        );
      }
    }),
  );
  const latest = latestVersion ? (bundles.get(latestVersion) ?? null) : null;
  if (latestVersion && !latest && !latestError) {
    latestError =
      bundleErrors.get(latestVersion) ??
      `.py ${latestVersion} has no bundle manifest.`;
  }

  const gatewaySurface = surfaces.find(
    (surface) => surface.served?.kind === "sim_gateway",
  );
  const gatewayReport = gatewaySurface ? served.get(gatewaySurface.id) : null;
  const gateway =
    gatewayReport && !("error" in gatewayReport) ? gatewayReport : null;

  const rows = surfaces.map((surface) => {
    // A surface that calls another surface inherits its declaration.
    const source = surface.via
      ? surfaces.find((other) => other.id === surface.via)
      : surface;
    const declaration = declared.get(source?.id ?? surface.id) ?? {
      versions: null,
      error: null,
    };
    const pyVersion = declaration.versions?.policyengine;
    const bundleError = pyVersion ? bundleErrors.get(pyVersion) : undefined;
    const row = classifyDeployment(
      surface,
      bundleError
        ? {
            versions: declaration.versions,
            error: `Bundle manifest: ${bundleError}`,
          }
        : declaration,
      country,
      bundles,
      latest,
    );
    // A surface that calls another surface is served by it, too.
    const report = served.get(source?.id ?? surface.id);
    const withServed: DeploymentRow = report
      ? {
          ...row,
          served: compareServed(row, report, bundles, country, gateway),
        }
      : row;
    if (surface.via && source) {
      return {
        ...withServed,
        lock_url: lockBrowseUrl(source),
        detail: `Through ${source.label}. ${withServed.detail}`,
      };
    }
    return withServed;
  });

  const latestRelease = latest?.countries[country] ?? null;
  return {
    country,
    model_package: countryModelPackage(country),
    checked_at: now().toISOString(),
    basis: "declared_default_branch_and_served",
    latest: latest
      ? {
          py_version: latest.py_version,
          data_build_id: latestRelease?.build_id ?? null,
          certified_model_version:
            latestRelease?.certified_model_version ?? null,
        }
      : null,
    latest_error: latestError,
    rows,
  };
}
