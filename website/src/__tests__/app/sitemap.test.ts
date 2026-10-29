import { describe, expect, test } from "vitest";

import nextConfig from "../../../next.config";
import sitemap from "@/app/sitemap";
import appsData from "@/data/apps.json";
import { appZoneRewrites } from "@/data/appZoneRoutes";

// The sitemap's interactives. Invariants:
//   1. every page an app zone serves is listed, and every listed interactive
//      is a page an app zone serves;
//   2. an apps.json app is listed if and only if an app zone serves its path;
//   3. no URL is listed twice, and none but the homepage redirects.

const SITE = "https://www.policyengine.org";

interface AppEntry {
  slug: string;
  countryId: string;
  date?: string;
}

const apps = appsData as AppEntry[];

/** A Next.js route source ("/:countryId/x", "/x/:path*") as a regex. */
function sourcePattern(source: string): RegExp {
  const pattern = source
    .split("/")
    .map((segment) =>
      segment.startsWith(":")
        ? segment.endsWith("*")
          ? ".*"
          : "[^/]+"
        : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    )
    .join("/");
  return new RegExp(`^${pattern}$`);
}

// Each zone's own page: its sources without the deep `/:path*` routes
const zonePatterns = appZoneRewrites
  .filter((route) => !route.source.endsWith("*"))
  .map((route) => sourcePattern(route.source));
const zoneServes = (path: string) =>
  zonePatterns.some((pattern) => pattern.test(path));

const entries = sitemap();
const paths = entries.map((entry) => entry.url.slice(SITE.length) || "/");
const interactives = entries
  .filter(
    (entry) => entry.priority === 0.8 && entry.changeFrequency === "weekly",
  )
  .map((entry) => entry.url.slice(SITE.length));

describe("sitemap", () => {
  test("lists the Autumn Budget dashboards", () => {
    expect(paths).toContain("/uk/autumn-budget-2025");
    expect(paths).toContain("/uk/autumn-budget-2026");
  });

  test("lists every page an app zone serves, and only those as interactives", () => {
    const concrete = appZoneRewrites
      .map((route) => route.source)
      .filter((source) => !source.includes(":"));
    expect(concrete.length).toBeGreaterThan(50);
    for (const source of concrete) expect(paths, source).toContain(source);
    for (const path of interactives) expect(zoneServes(path), path).toBe(true);
  });

  test("lists an apps.json app if and only if an app zone serves its path", () => {
    for (const app of apps) {
      const path = `/${app.countryId}/${app.slug}`;
      expect(paths.includes(path), path).toBe(zoneServes(path));
    }
    // A zone shared by every country, listed under the app's own country
    expect(paths).toContain("/us/bill-tracker");
    // Old slugs that redirect to their app's current one
    expect(paths).not.toContain("/us/aca-reforms-calculator");
    expect(paths).not.toContain("/us/obbba-scatter");
  });

  test("dates an app from apps.json", () => {
    const app = apps.find((entry) => entry.slug === "autumn-budget-2025")!;
    expect(app.date).toBe("2025-12-09 12:00:00");
    expect(
      entries.find((entry) => entry.url === `${SITE}/uk/autumn-budget-2025`)
        ?.lastModified,
    ).toBe("2025-12-09");
  });

  test("lists no URL twice, and none but the homepage redirects", async () => {
    expect(new Set(paths).size).toBe(paths.length);

    const redirects = await nextConfig.redirects!();
    const unconditional = redirects
      .filter((redirect) => !redirect.has && !redirect.missing)
      .map((redirect) => sourcePattern(redirect.source));
    // The homepage sends readers to /us for now (next.config.ts)
    for (const path of paths.filter((p) => p !== "/")) {
      expect(
        unconditional.some((pattern) => pattern.test(path)),
        path,
      ).toBe(false);
    }
  });
});
