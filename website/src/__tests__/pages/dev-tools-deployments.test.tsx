import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import DevToolsPage from "../../app/[countryId]/dev-tools/page";
import DeploymentsPage from "../../app/[countryId]/dev-tools/deployments/page";
import type { DeploymentRow, DeploymentsResponse } from "@/lib/deployments";
import { DEPLOYMENT_SURFACES, NOT_REPORTED } from "@/lib/deployments";

function surface(id: string) {
  return DEPLOYMENT_SURFACES.find((candidate) => candidate.id === id)!;
}

function row(
  overrides: Partial<DeploymentRow> & { surface: DeploymentRow["surface"] },
): DeploymentRow {
  return {
    lock_url: null,
    py_version: "6.10.0",
    core_version: "3.33.3",
    model_version: "2.2.1",
    data_build_id: "populace-us-2024-spm-20260915",
    certified_model_version: "2.2.1",
    status: "current",
    detail: "Same data build as the latest .py 6.11.1.",
    served: NOT_REPORTED,
    ...overrides,
  };
}

const response: DeploymentsResponse = {
  country: "us",
  model_package: "policyengine-us",
  checked_at: "2026-10-27T12:00:00Z",
  basis: "declared_default_branch_and_served",
  latest: {
    py_version: "6.11.1",
    data_build_id: "populace-us-2024-spm-20260915",
    certified_model_version: "2.2.1",
    core_version: "3.33.3",
  },
  latest_error: null,
  newest: {
    py_version: "6.11.1",
    model_version: "2.68.0",
    core_version: "3.33.13",
    data_build_id: "populace-us-2024-spm-20260915",
  },
  rows: [
    row({
      surface: surface("api"),
      py_version: "6.11.1",
      served: {
        status: "differs",
        py_version: "6.10.0",
        model_version: "2.2.1",
        data_build_id: "populace-us-2024-spm-20260915",
        data_basis: "served_py_bundle",
        source_url:
          "https://api.policyengine.org/v2/tax-benefit-models/by-country/us",
        detail:
          "Live differs from main: it serves .py 6.10.0, but the lock on main declares 6.11.1.",
        channels: [],
      },
    }),
    row({
      surface: surface("household-api"),
      status: "no_dataset",
      py_version: null,
      model_version: "2.53.1",
      served: {
        status: "differs",
        py_version: null,
        model_version: "2.42.4",
        data_build_id: null,
        data_basis: null,
        source_url: "https://household.api.policyengine.org/versions",
        detail: "Live differs from main.",
        channels: [
          { name: "current", model_version: "2.42.4" },
          { name: "frontier", model_version: "2.53.1" },
        ],
      },
    }),
  ],
};

function stubFetch(body: unknown, ok = true, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok, status, json: async () => body }) as Response),
  );
}

describe("Deployments developer tool", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("the developer tools page links to deployments for the current country", async () => {
    render(
      await DevToolsPage({ params: Promise.resolve({ countryId: "uk" }) }),
    );
    expect(screen.getByRole("link", { name: /deployments/i })).toHaveAttribute(
      "href",
      "/uk/dev-tools/deployments",
    );
  });

  test("flags a service that does not serve what its lock declares", async () => {
    stubFetch(response);
    render(
      await DeploymentsPage({ params: Promise.resolve({ countryId: "us" }) }),
    );
    await screen.findByText("PolicyEngine API");
    expect(screen.queryByText(/needs? attention/)).toBeNull();
    // The header shows the newest release of each part next to the bundle.
    const newestRow = screen.getByText("Newest release").closest("tr")!;
    expect(within(newestRow).getByText("2.68.0")).toBeInTheDocument();
    expect(within(newestRow).getByText("3.33.13")).toBeInTheDocument();
    // The overview shows lock and served values where they drift.
    const overviewApi = screen.getByText("PolicyEngine API").closest("tr")!;
    expect(within(overviewApi).getByText("main")).toBeInTheDocument();
    expect(within(overviewApi).getByText("live")).toBeInTheDocument();
    expect(within(overviewApi).getByText("6.11.1")).toBeInTheDocument();
    expect(within(overviewApi).getByText("6.10.0")).toBeInTheDocument();
    const overviewHousehold = screen.getByText("Household API").closest("tr")!;
    // The household API's model cell uses its own channel names.
    expect(within(overviewHousehold).getByText("current")).toBeInTheDocument();
    expect(within(overviewHousehold).getByText("frontier")).toBeInTheDocument();
    expect(within(overviewHousehold).getByText("2.42.4")).toBeInTheDocument();
    // Data builds link to their Microcosm page; lock and report links are gone.
    const apiRow = screen.getByText("PolicyEngine API").closest("tr")!;
    expect(
      within(apiRow).getByRole("link", { name: /spm · 2026-09-15/ }),
    ).toHaveAttribute(
      "href",
      "https://calibration-diagnostics.vercel.app/calibration/dashboard/microcosm?country=us&release=populace-us-2024-spm-20260915",
    );
    expect(screen.queryByRole("link", { name: "lock" })).toBeNull();
    expect(screen.queryByRole("link", { name: "report" })).toBeNull();
    // The status columns are gone.
    expect(screen.queryByText("Differs from main")).toBeNull();
    expect(screen.queryByText("No dataset")).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith("/api/deployments?country=us");
  });

  test("names the countries a .py bundle covers for any other country", async () => {
    stubFetch(response);
    render(
      await DeploymentsPage({ params: Promise.resolve({ countryId: "ca" }) }),
    );

    expect(
      screen.getByText(/no certified data for this country/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "United Kingdom" }),
    ).toHaveAttribute("href", "/uk/dev-tools/deployments");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("shows the error when the deployments request fails", async () => {
    stubFetch({ error: "Failed to read deployment versions" }, false, 502);
    render(
      await DeploymentsPage({ params: Promise.resolve({ countryId: "us" }) }),
    );

    expect(
      await screen.findByText(/unable to read deployments/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Failed to read deployment versions"),
    ).toBeInTheDocument();
  });
});
