import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { spacing } from "@policyengine/design-system/tokens";
import DevToolsPage from "../../app/[countryId]/dev-tools/page";
import ApiStatusPage from "../../app/[countryId]/dev-tools/api-status/page";

function createFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

const mockStatusPageData = {
  monitors: [
    {
      id: "1160318",
      name: "US household API",
      url: "https://api.policyengine.org/us",
      status: "up",
      lastCheckedAt: "2026-03-31T12:00:00Z",
      availability: 99.95,
      totalDowntime: 240,
      numberOfIncidents: 2,
      days: [
        { date: "2026-03-30", status: "operational", downtimeMinutes: 0 },
        { date: "2026-03-31", status: "operational", downtimeMinutes: 0 },
      ],
    },
    {
      id: "4160084",
      name: "UK household API",
      url: "https://api.policyengine.org/uk",
      status: "up",
      lastCheckedAt: "2026-03-31T12:00:00Z",
      availability: 99.91,
      totalDowntime: 360,
      numberOfIncidents: 3,
      days: [
        { date: "2026-03-30", status: "operational", downtimeMinutes: 0 },
        { date: "2026-03-31", status: "degraded", downtimeMinutes: 12 },
      ],
    },
  ],
  fetchedAt: "2026-03-31T12:05:00Z",
};

describe("Developer tools pages", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => createFetchResponse(mockStatusPageData)),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("Developer tools page renders API status link for the current country", async () => {
    const page = await DevToolsPage({
      params: Promise.resolve({ countryId: "us" }),
    });

    const { container } = render(page);

    const apiStatusLink = screen.getByRole("link", { name: /api status/i });
    expect(apiStatusLink).toHaveAttribute("href", "/us/dev-tools/api-status");
    expect(container.firstElementChild).toHaveStyle({
      minHeight: `calc(100vh - ${spacing.layout.header})`,
      display: "flex",
      flexDirection: "column",
    });
  });

  test("API status page loads and renders monitor data", async () => {
    const { container } = render(<ApiStatusPage />);

    expect(
      await screen.findByText(/all systems operational/i),
    ).toBeInTheDocument();
    expect(screen.getByText("US household API")).toBeInTheDocument();
    expect(screen.getByText("UK household API")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveStyle({
      minHeight: `calc(100vh - ${spacing.layout.header})`,
      display: "flex",
      flexDirection: "column",
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/betterstack?monitors=1160318,4160084",
    );
  });

  test("API status page renders an error alert when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        createFetchResponse(
          { error: "Failed to fetch status data" },
          false,
          502,
        ),
      ),
    );

    render(<ApiStatusPage />);

    expect(
      await screen.findByText(/unable to load status data/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/failed to fetch status data/i),
    ).toBeInTheDocument();
  });
});
