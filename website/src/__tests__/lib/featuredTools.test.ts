import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import appsData from "@/data/apps.json";
import { appZoneRoutes } from "@/data/appZoneRoutes";
import featuredToolsData from "@/data/featuredTools.json";
import { getResearchItems } from "@/data/posts/postTransformers";
import { getAllToolsHref, getFeaturedTools } from "@/lib/featuredTools";
import { searchResearchItems } from "@/lib/researchSearch";

// The header's Tools menu and the homepage tool cards link to these tools.
// Invariants, for every country and every tool:
//   1. its link stays in that country: `/<country>/<slug>`;
//   2. the link is a path the website proxies to a zone;
//   3. apps.json registers the tool under that same country, so a US-only
//      tool is never offered on the UK site (and vice versa).

interface AppEntry {
  slug?: string;
  countryId?: string;
}

const apps = appsData as AppEntry[];
const countries = Object.keys(featuredToolsData);
const zoneSources = new Set(appZoneRoutes.map((route) => route.source));

function isProxiedZonePath(href: string): boolean {
  const [, , ...rest] = href.split("/");
  return (
    zoneSources.has(href) || zoneSources.has(`/:countryId/${rest.join("/")}`)
  );
}

describe("featured tools", () => {
  test.each(countries)(
    "every %s tool links to a proxied zone path",
    (country) => {
      const tools = getFeaturedTools(country);

      expect(tools.length).toBeGreaterThan(0);
      for (const tool of tools) {
        expect(tool.href).toBe(`/${country}/${tool.slug}`);
        expect(isProxiedZonePath(tool.href)).toBe(true);
      }
    },
  );

  test.each(countries)(
    "every %s tool is registered for that country in apps.json",
    (country) => {
      for (const tool of getFeaturedTools(country)) {
        expect(
          apps.some(
            (app) => app.slug === tool.slug && app.countryId === country,
          ),
        ).toBe(true);
      }
    },
  );

  test.each(countries)("%s tool slugs and labels are unique", (country) => {
    const tools = getFeaturedTools(country);

    expect(new Set(tools.map((tool) => tool.slug)).size).toBe(tools.length);
    expect(new Set(tools.map((tool) => tool.label)).size).toBe(tools.length);
  });

  test("features CliffWatch and the OBBBA household explorer on the US site", () => {
    const hrefs = getFeaturedTools("us").map((tool) => tool.href);

    expect(hrefs).toContain("/us/cliffwatch");
    expect(hrefs).toContain("/us/obbba-households");
  });

  test("offers UK CliffWatch directly on the UK site, not the /uk/cliffwatch redirect", () => {
    const hrefs = getFeaturedTools("uk").map((tool) => tool.href);

    expect(hrefs).toContain("/uk/uk-cliff-watch");
    expect(hrefs).not.toContain("/uk/cliffwatch");
    expect(hrefs).not.toContain("/uk/obbba-households");
  });

  test("given any country id then every tool link stays in that country", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constantFrom(...countries, "__proto__", "ca"), fc.string()),
        (country) => {
          const tools = getFeaturedTools(country);
          const known = Object.hasOwn(featuredToolsData, country);

          expect(tools.length > 0).toBe(known);
          for (const tool of tools) {
            expect(tool.href.startsWith(`/${country}/`)).toBe(true);
          }
        },
      ),
    );
  });

  test("given any country id then the all-tools link filters that country's research to interactive items", () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z]{2}$/), (country) => {
        const url = new URL(getAllToolsHref(country), "https://example.org");

        expect(url.pathname).toBe(`/${country}/research`);
        expect(url.searchParams.get("types")).toBe("interactive");
      }),
    );
  });

  test("shares one list with the calculator header through app/src/data", () => {
    const linkPath = path.resolve(__dirname, "../../data/featuredTools.json");

    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true);
    expect(realpathSync(linkPath)).toBe(
      realpathSync(
        path.resolve(__dirname, "../../../../app/src/data/featuredTools.json"),
      ),
    );
  });
});

describe("research search", () => {
  test.each(["obbba", "OBBBA", "One Big Beautiful Bill"])(
    "finds the OBBBA household explorer for %s",
    (query) => {
      const results = searchResearchItems(getResearchItems(), [], query);

      expect(
        results.some((item) => item.isApp && item.slug === "obbba-households"),
      ).toBe(true);
    },
  );

  test("finds CliffWatch for cliffwatch", () => {
    const results = searchResearchItems(getResearchItems(), [], "cliffwatch");

    expect(
      results.some(
        (item) =>
          item.isApp && item.slug === "cliffwatch" && item.countryId === "us",
      ),
    ).toBe(true);
  });
});
