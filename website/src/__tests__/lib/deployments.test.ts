import { expect, test } from "vitest";

import {
  DEPLOYMENT_SURFACES,
  classifyDeployment,
  compareServed,
  loadDeployments,
  parseApiV2Model,
  parseGatewayVersions,
  parseHouseholdVersions,
  parseBundleManifest,
  parseRequirementsLock,
  parseUvLock,
  isMicrocosmBuild,
  microcosmBuildUrl,
  shortBuildId,
  type BundleSummary,
} from "@/lib/deployments";

const UV_LOCK = `version = 1

[[package]]
name = "policyengine"
version = "6.10.0"
source = { registry = "https://pypi.org/simple" }
dependencies = [
    { name = "policyengine-core" },
]

[package.optional-dependencies]
us = [
    { name = "policyengine-us" },
]

[[package]]
name = "policyengine-core"
version = "3.33.3"

[[package]]
name = "policyengine-us"
version = "2.2.1"

[[package]]
name = "policyengine-uk"
version = "2.132.6"

[[package]]
name = "numpy"
version = "2.1.0"
`;

const REQUIREMENTS_LOCK = `#    uv pip compile backend/requirements.txt
policyengine==6.7.5 \\
    --hash=sha256:aaaa
    # via -r backend/requirements.txt
policyengine-core==3.33.0 \\
    --hash=sha256:bbbb
policyengine-us==2.2.1 \\
    --hash=sha256:cccc
`;

function manifest(
  version: string,
  usBuild: string,
  usModel: string,
  ukBuild?: string,
) {
  return {
    bundle_version: version,
    packages: {
      "policyengine-core": { version: "3.33.3" },
      "policyengine-us": { version: usModel },
      "policyengine-uk": { version: "2.151.0" },
    },
    countries: {
      us: { model_package: "policyengine-us" },
      uk: { model_package: "policyengine-uk" },
    },
    data_releases: {
      us: {
        build_id: usBuild,
        model_package: "policyengine-us",
        certification: {
          certified_for_model_version: usModel,
          data_build_id: usBuild,
        },
      },
      ...(ukBuild
        ? {
            uk: {
              build_id: ukBuild,
              certification: { certified_for_model_version: "2.151.0" },
            },
          }
        : {}),
    },
  };
}

test("reads tracked package versions from a uv lock", () => {
  expect(parseUvLock(UV_LOCK)).toEqual({
    policyengine: "6.10.0",
    "policyengine-core": "3.33.3",
    "policyengine-us": "2.2.1",
    "policyengine-uk": "2.132.6",
  });
});

test("reads tracked package versions from a pip-compile lock", () => {
  expect(parseRequirementsLock(REQUIREMENTS_LOCK)).toEqual({
    policyengine: "6.7.5",
    "policyengine-core": "3.33.0",
    "policyengine-us": "2.2.1",
  });
  expect(parseRequirementsLock("policyengine[us]==6.7.5 \\\n")).toEqual({
    policyengine: "6.7.5",
  });
});

test("reads each country's certified build and model version from a bundle manifest", () => {
  const bundle = parseBundleManifest(
    manifest("6.11.1", "us-b", "2.2.1", "uk-b"),
    "6.11.1",
  );
  expect(bundle).toEqual({
    py_version: "6.11.1",
    core_version: "3.33.3",
    countries: {
      us: {
        build_id: "us-b",
        model_package: "policyengine-us",
        certified_model_version: "2.2.1",
      },
      uk: {
        build_id: "uk-b",
        model_package: "policyengine-uk",
        certified_model_version: "2.151.0",
      },
    },
  });
});

const api = DEPLOYMENT_SURFACES.find((surface) => surface.id === "api")!;

function bundles(entries: [string, BundleSummary | null][]) {
  return new Map(entries);
}

const LATEST = parseBundleManifest(
  manifest("6.11.1", "us-new", "2.2.1", "uk-new"),
  "6.11.1",
);
const OLDER = parseBundleManifest(
  manifest("6.10.0", "us-new", "2.2.1", "uk-old"),
  "6.10.0",
);

test("a surface whose .py certifies the latest build is current", () => {
  const row = classifyDeployment(
    api,
    {
      versions: { policyengine: "6.10.0", "policyengine-us": "2.2.1" },
      error: null,
    },
    "us",
    bundles([
      ["6.10.0", OLDER],
      ["6.11.1", LATEST],
    ]),
    LATEST,
  );
  expect(row.status).toBe("current");
  expect(row.data_build_id).toBe("us-new");
});

test("a surface whose .py certifies an older build is behind", () => {
  const row = classifyDeployment(
    api,
    {
      versions: { policyengine: "6.10.0", "policyengine-uk": "2.151.0" },
      error: null,
    },
    "uk",
    bundles([
      ["6.10.0", OLDER],
      ["6.11.1", LATEST],
    ]),
    LATEST,
  );
  expect(row.status).toBe("behind");
  expect(row.data_build_id).toBe("uk-old");
  expect(row.detail).toContain("uk-new");
});

test("a locked country model that differs from the certified one is a mismatch", () => {
  const row = classifyDeployment(
    api,
    {
      versions: { policyengine: "6.11.1", "policyengine-us": "2.3.0" },
      error: null,
    },
    "us",
    bundles([["6.11.1", LATEST]]),
    LATEST,
  );
  expect(row.status).toBe("model_mismatch");
});

test("a .py release without a bundle manifest certifies no data", () => {
  const row = classifyDeployment(
    api,
    {
      versions: { policyengine: "4.4.4", "policyengine-us": "1.691.3" },
      error: null,
    },
    "us",
    bundles([["4.4.4", null]]),
    LATEST,
  );
  expect(row.status).toBe("no_bundle");
  expect(row.data_build_id).toBeNull();
});

test("a surface that pins only the country model has no .py", () => {
  const row = classifyDeployment(
    api,
    { versions: { "policyengine-us": "2.53.1" }, error: null },
    "us",
    bundles([]),
    LATEST,
  );
  expect(row.status).toBe("no_py");
  expect(row.model_version).toBe("2.53.1");
});

test("loads every surface, resolves bundles once per .py version, and inherits through via", async () => {
  const requested: string[] = [];
  const fetchImpl = async (url: string) => {
    requested.push(url);
    if (url.endsWith("/v2/tax-benefit-models/by-country/us")) {
      // The API still runs an older .py than its lock declares, and the
      // gateway has no worker for it.
      return Response.json({
        status: "ok",
        result: { policyengine_version: "6.9.0" },
      });
    }
    if (url === "https://household.api.policyengine.org/versions") {
      return Response.json({
        current: {
          deployed_at: "2026-10-14T23:33:43.410557+00:00",
          package_versions: { uk: "2.88.18", us: "2.42.4" },
        },
        frontier: { package_versions: { uk: "2.88.18", us: "2.53.1" } },
      });
    }
    if (url.endsWith("/versions")) {
      return Response.json({
        policyengine: {
          "6.2.1": "app-6-2-1",
          "6.10.0": "app-6-10-0",
          latest: "6.10.0",
        },
        us: { latest: "2.2.1" },
        bundles: {
          "6.10.0": { us: { model_version: "2.2.1", data_version: "us-old" } },
        },
      });
    }
    if (url.startsWith("https://pypi.org/")) {
      const newest: Record<string, string> = {
        policyengine: "6.11.1",
        "policyengine-us": "2.68.0",
        "policyengine-core": "3.33.13",
      };
      const name = url.split("/")[4];
      return Response.json({ info: { version: newest[name] } });
    }
    if (url.includes("/api/microcosm/releases?country=us")) {
      return Response.json({ latest_release_id: "us-new" });
    }
    if (url.includes("/policyengine.py/6.11.1/"))
      return Response.json(manifest("6.11.1", "us-new", "2.2.1"));
    if (url.includes("/policyengine.py/6.10.0/"))
      return Response.json(manifest("6.10.0", "us-old", "2.2.1"));
    if (url.includes("/policyengine.py/"))
      return new Response("missing", { status: 404 });
    if (url.includes("policyengine-household-api"))
      return new Response(
        '[[package]]\nname = "policyengine-us"\nversion = "2.53.1"\n',
      );
    return new Response(UV_LOCK);
  };
  const response = await loadDeployments(
    "us",
    fetchImpl,
    0,
    () => new Date("2026-10-27T00:00:00Z"),
  );

  expect(response.latest).toEqual({
    py_version: "6.11.1",
    data_build_id: "us-new",
    certified_model_version: "2.2.1",
    core_version: "3.33.3",
  });
  expect(response.newest).toEqual({
    py_version: "6.11.1",
    model_version: "2.68.0",
    core_version: "3.33.13",
    data_build_id: "us-new",
  });
  const status = Object.fromEntries(
    response.rows.map((row) => [row.surface.id, row.status]),
  );
  expect(status).toEqual({
    api: "behind",
    "app-v3": "behind",
    "sim-api": "behind",
    "household-api": "no_dataset",
  });
  const app = response.rows.find((row) => row.surface.id === "app-v3")!;
  expect(app.py_version).toBe("6.10.0");
  expect(app.detail.startsWith("Through PolicyEngine API.")).toBe(true);
  expect(
    requested.filter((url) => url.includes("/policyengine.py/6.10.0/")),
  ).toHaveLength(1);

  const served = Object.fromEntries(
    response.rows.map((row) => [row.surface.id, row.served.status]),
  );
  expect(served).toEqual({
    api: "no_worker",
    "app-v3": "no_worker",
    "sim-api": "matches",
    "household-api": "differs",
  });
  const household = response.rows.find(
    (row) => row.surface.id === "household-api",
  )!;
  expect(household.served).toMatchObject({
    live_since: "2026-10-14T23:33:43.410557+00:00",
    model_version: "2.42.4",
    data_build_id: null,
    data_basis: null,
  });
  expect(household.served.detail).toBe(
    "Live differs from main: it serves model 2.42.4, but the lock on main declares 2.53.1. " +
      "Its frontier channel, which is not yet serving users, runs policyengine-us 2.53.1.",
  );
  expect(app.served.detail).toBe(
    "The simulation gateway has no worker for .py 6.9.0, so this service's economy simulations fail.",
  );
  const sim = response.rows.find((row) => row.surface.id === "sim-api")!;
  expect(sim.served).toMatchObject({
    py_version: "6.10.0",
    data_build_id: "us-old",
    data_basis: "reported",
  });
  expect(sim.served.detail).toContain("1 older .py versions routable");
});

test("reads the served .py from the API's model route", () => {
  expect(
    parseApiV2Model({ result: { policyengine_version: "6.10.0" } }, "u"),
  ).toEqual({
    kind: "api_v2",
    py_version: "6.10.0",
    model_version: null,
    data_build_id: null,
    source_url: "u",
    other_py_versions: 0,
    note: "",
    channels: [],
    live_since: null,
    routes: {},
  });
  expect(() => parseApiV2Model({ result: {} }, "u")).toThrow();
});

test("reads the latest route and its bundle from the gateway", () => {
  const report = parseGatewayVersions(
    {
      policyengine: { "6.7.5": "a", "6.10.0": "b", latest: "6.10.0" },
      uk: { latest: "2.132.6" },
      bundles: {
        "6.10.0": { uk: { model_version: "2.132.6", data_version: "uk-b" } },
      },
    },
    "uk",
    "u",
  );
  expect(report).toEqual({
    kind: "sim_gateway",
    py_version: "6.10.0",
    model_version: "2.132.6",
    data_build_id: "uk-b",
    source_url: "u",
    other_py_versions: 1,
    note: "",
    channels: [],
    live_since: null,
    routes: {
      "6.7.5": { model_version: null, data_build_id: null },
      "6.10.0": { model_version: "2.132.6", data_build_id: "uk-b" },
    },
  });
});

test("a served data build that differs from the declared one is not deployed", () => {
  const row = classifyDeployment(
    api,
    {
      versions: { policyengine: "6.11.1", "policyengine-uk": "2.151.0" },
      error: null,
    },
    "uk",
    bundles([
      ["6.11.1", LATEST],
      ["6.10.0", OLDER],
    ]),
    LATEST,
  );
  expect(row.data_build_id).toBe("uk-new");
  const served = compareServed(
    row,
    {
      kind: "api_v2",
      py_version: "6.10.0",
      model_version: null,
      data_build_id: null,
      source_url: "u",
      other_py_versions: 0,
      note: "",
      channels: [],
      live_since: null,
      routes: {},
    },
    bundles([
      ["6.11.1", LATEST],
      ["6.10.0", OLDER],
    ]),
    "uk",
  );
  expect(served.status).toBe("differs");
  expect(served.data_build_id).toBe("uk-old");
  expect(served.data_basis).toBe("served_py_bundle");
  expect(served.detail).toBe(
    "Live differs from main: it serves .py 6.10.0, but the lock on main declares 6.11.1; " +
      "it serves data build uk-old, but the lock on main declares uk-new.",
  );
  expect(
    compareServed(row, { error: "timeout", source_url: "u" }, bundles([]), "us")
      .status,
  ).toBe("unavailable");
});

test("only Microcosm builds are dashboard releases", () => {
  expect(isMicrocosmBuild("populace-us-2024-spm-20260915")).toBe(true);
  expect(
    isMicrocosmBuild("microcosm-uk-2024-25-national-20261025T091414Z-a6299504"),
  ).toBe(true);
  expect(isMicrocosmBuild("policyengine-uk-data-1.58.1")).toBe(false);
  expect(microcosmBuildUrl("uk", "microcosm-uk-2024-25-national-x")).toBe(
    "https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm?country=uk&release=microcosm-uk-2024-25-national-x",
  );
});

test("a surface that loads no microdata has no data build to compare", () => {
  const household = DEPLOYMENT_SURFACES.find(
    (surface) => surface.id === "household-api",
  )!;
  const row = classifyDeployment(
    household,
    { versions: { "policyengine-us": "2.53.1" }, error: null },
    "us",
    bundles([]),
    LATEST,
  );
  expect(row.status).toBe("no_dataset");
  expect(row.data_build_id).toBeNull();
  expect(row.detail).toBe(
    "Calculates single households and loads no microdata. Pins policyengine-us 2.53.1 directly, without .py.",
  );
});

test("shortens a Microcosm build ID to the part that names the build", () => {
  expect(
    shortBuildId("microcosm-uk-2024-25-national-20261025T091414Z-a6299504"),
  ).toBe("national · 2026-10-25 · a6299504");
  expect(shortBuildId("populace-us-2024-spm-20260915")).toBe(
    "spm · 2026-09-15",
  );
  expect(
    shortBuildId("populace-us-2024-buildo-acs-local-766b7c7-20261017T030317Z"),
  ).toBe("buildo-acs-local-766b7c7 · 2026-10-17");
  expect(shortBuildId("policyengine-uk-data-1.58.1")).toBe(
    "policyengine-uk-data-1.58.1",
  );
});

function apiReport(py: string) {
  return {
    kind: "api_v2" as const,
    py_version: py,
    model_version: null,
    data_build_id: null,
    source_url: "api",
    other_py_versions: 0,
    note: "",
    channels: [],
    live_since: null,
    routes: {},
  };
}

function gatewayReport(routes: Record<string, string | null>) {
  return {
    kind: "sim_gateway" as const,
    py_version: "6.10.0",
    model_version: "2.151.0",
    data_build_id: "uk-old",
    source_url: "gateway",
    other_py_versions: 0,
    note: "",
    channels: [],
    live_since: null,
    routes: Object.fromEntries(
      Object.entries(routes).map(([py, build]) => [
        py,
        { model_version: "2.151.0", data_build_id: build },
      ]),
    ),
  };
}

const ukApiRow = classifyDeployment(
  api,
  {
    versions: { policyengine: "6.10.0", "policyengine-uk": "2.151.0" },
    error: null,
  },
  "uk",
  bundles([
    ["6.11.1", LATEST],
    ["6.10.0", OLDER],
  ]),
  LATEST,
);
const ukBundles = bundles([
  ["6.11.1", LATEST],
  ["6.10.0", OLDER],
]);

test("the API's data build is the one its gateway worker reports", () => {
  const served = compareServed(
    ukApiRow,
    apiReport("6.10.0"),
    ukBundles,
    "uk",
    gatewayReport({ "6.10.0": "uk-old" }),
  );
  expect(served).toMatchObject({
    status: "matches",
    data_build_id: "uk-old",
    data_basis: "reported",
  });
});

test("a missing gateway worker for the API's .py is flagged", () => {
  const served = compareServed(
    ukApiRow,
    apiReport("6.10.0"),
    ukBundles,
    "uk",
    gatewayReport({ "6.7.5": "uk-legacy" }),
  );
  expect(served.status).toBe("no_worker");
  expect(served.source_url).toBe("gateway");
});

test("a gateway worker that serves another build than its .py certifies is flagged", () => {
  const served = compareServed(
    ukApiRow,
    apiReport("6.10.0"),
    ukBundles,
    "uk",
    gatewayReport({ "6.10.0": "uk-rebuilt" }),
  );
  expect(served.status).toBe("differs");
  expect(served.detail).toBe(
    "Live differs from main: it serves data build uk-rebuilt, but the lock on main declares uk-old; " +
      "its gateway worker for .py 6.10.0 serves data build uk-rebuilt, but .py 6.10.0 certifies uk-old.",
  );
});

test("without a readable gateway the API's data build comes from its .py bundle", () => {
  const served = compareServed(ukApiRow, apiReport("6.10.0"), ukBundles, "uk");
  expect(served).toMatchObject({
    status: "matches",
    data_build_id: "uk-old",
    data_basis: "served_py_bundle",
  });
});

test("reads the household API's current and frontier channels", () => {
  const report = parseHouseholdVersions(
    {
      current: { package_versions: { uk: "2.88.18", us: "2.42.4" } },
      frontier: { package_versions: { uk: "2.88.18", us: "2.53.1" } },
    },
    "uk",
    "u",
  );
  expect(report).toMatchObject({
    kind: "household_versions",
    py_version: null,
    model_version: "2.88.18",
    note: "",
    channels: [
      { name: "current", model_version: "2.88.18" },
      { name: "frontier", model_version: "2.88.18" },
    ],
  });
  expect(() => parseHouseholdVersions({ frontier: {} }, "us", "u")).toThrow();
});
