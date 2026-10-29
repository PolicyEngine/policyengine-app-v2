import { getPathMatch } from "next/dist/shared/lib/router/utils/path-match";
import { describe, expect, test } from "vitest";

import nextConfig from "../../../next.config";
import sitemap from "@/app/sitemap";
import appsData from "@/data/apps.json";
import { appZoneRewrites } from "@/data/appZoneRoutes";

// The sitemap's interactives. Invariants:
//   1. every page an app zone serves is listed, and every listed interactive
//      is a page an app zone serves;
//   2. an apps.json app is listed if and only if an app zone serves its path;
//   3. every URL is a concrete path, with no route token left in it;
//   4. no URL is listed twice, and none but the homepage redirects.

const SITE = "https://www.policyengine.org";

interface AppEntry {
  slug: string;
  countryId: string;
  date?: string;
}

const apps = appsData as AppEntry[];

// Next.js's own matcher for a redirect or rewrite source, with the options it
// builds them with (next/dist/server/lib/router-utils/filesystem.js), so a
// source such as "/x/:path*" matches "/x" as well as "/x/a/b".
const matcher = (source: string) =>
  getPathMatch(source, { strict: true, removeUnnamedParams: true });

// Each zone's own page: its sources without the deep `/:path*` routes
const zoneMatchers = appZoneRewrites
  .filter((route) => !route.source.endsWith("*"))
  .map((route) => matcher(route.source));
const zoneServes = (path: string) =>
  zoneMatchers.some((match) => match(path) !== false);

const entries = sitemap();
const pathOf = (url: string) => url.slice(SITE.length) || "/";
const paths = entries.map((entry) => pathOf(entry.url));
// Interactives share priority 0.8 with the research index pages only
const interactives = entries
  .filter((entry) => entry.priority === 0.8)
  .map((entry) => pathOf(entry.url))
  .filter((path) => !path.endsWith("/research"));
const entryFor = (path: string) =>
  entries.find((entry) => entry.url === `${SITE}${path}`);

describe("sitemap", () => {
  test("matches route sources as Next.js does", () => {
    const deep = matcher("/x/:path*");
    expect(deep("/x")).not.toBe(false);
    expect(deep("/x/a/b")).not.toBe(false);
    expect(deep("/xy")).toBe(false);
    const shared = matcher("/:countryId/bill-tracker");
    expect(shared("/us/bill-tracker")).not.toBe(false);
    expect(shared("/us/bill-tracker/x")).toBe(false);
  });

  test("lists the Autumn Budget dashboards, the 2026 one at its own address", () => {
    expect(paths).toContain("/uk/autumn-budget-2025");
    expect(paths).toContain("/uk/budgets/autumn-2026");
    // Its former address redirects there (next.config.ts)
    expect(paths).not.toContain("/uk/autumn-budget-2026");
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

  test("lists concrete paths only, with no route token left in them", () => {
    for (const path of paths) expect(path, path).not.toMatch(/[:*()?]/);
  });

  test("dates an app from apps.json", () => {
    const app = apps.find((entry) => entry.slug === "autumn-budget-2025")!;
    expect(app.date).toBe("2025-12-09 12:00:00");
    expect(entryFor("/uk/autumn-budget-2025")?.lastModified).toBe("2025-12-09");
  });

  test("lists the bill tracker as changing daily, with no date", () => {
    const entry = entryFor("/us/bill-tracker");
    expect(entry?.changeFrequency).toBe("daily");
    expect(entry?.lastModified).toBeUndefined();
  });

  test("lists TAXSIM, which the site serves from its own deployment", () => {
    expect(entryFor("/us/taxsim")).toEqual({
      url: `${SITE}/us/taxsim`,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  test("lists no URL twice, and none but the homepage redirects", async () => {
    expect(new Set(paths).size).toBe(paths.length);

    const redirects = await nextConfig.redirects!();
    const unconditional = redirects
      .filter((redirect) => !redirect.has && !redirect.missing)
      .map((redirect) => matcher(redirect.source));
    // The homepage sends readers to /us for now (next.config.ts)
    for (const path of paths.filter((p) => p !== "/")) {
      expect(
        unconditional.some((match) => match(path) !== false),
        path,
      ).toBe(false);
    }
  });
});
