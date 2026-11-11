import { lstatSync, realpathSync } from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import appsData from "@/data/apps.json";
import { appZoneRoutes } from "@/data/appZoneRoutes";
import {
  CALCULATOR_URL,
  getMainAppHref,
  getTools,
  getToolsMenu,
  MAIN_APP_ID,
  MAIN_APP_LABEL,
} from "@/lib/toolsMenu";
// The calculator header's copy of the lookup, checked against this one below.
import {
  getToolsMenuEntries,
  MAIN_APP_LABEL as CALCULATOR_MAIN_APP_LABEL,
} from "../../../../app/src/utils/toolsMenu";

// The header's Tools menu and the homepage's tools section list these.
// Invariants, for every country C:
//   1. C's menu is the main app (`<calculator>/C`), then every apps.json entry
//      for C with a toolsMenu label, sorted by label; nothing else.
//   2. A country with no tools has no menu, so the main app never stands alone.
//   3. Each tool links to `/C/<slug>`, a path the website proxies to a zone.
//   4. Labels and ids are unique within a menu.
//   5. The calculator header's lookup returns the same tools in the same order.

interface AppEntry {
  slug: string;
  countryId: string;
  description: string;
  toolsMenu?: { label: string };
}

const apps = appsData as AppEntry[];
const countryIds = [...new Set(apps.map((app) => app.countryId))];
const countriesWithTools = countryIds.filter((countryId) =>
  apps.some((app) => app.countryId === countryId && app.toolsMenu),
);
const zoneSources = new Set(appZoneRoutes.map((route) => route.source));

function isProxiedZonePath(href: string): boolean {
  const [, , ...rest] = href.split("/");
  return (
    zoneSources.has(href) || zoneSources.has(`/:countryId/${rest.join("/")}`)
  );
}

const anyCountryId = fc.oneof(
  fc.constantFrom(...countryIds, "__proto__", "constructor", "ca"),
  fc.string(),
);

describe("tools menu", () => {
  // Max's ruling (2026-10-25): the main app, then calculators that work for
  // any household under current law. Research about one policy or event, like
  // the OBBBA explorer and the bill tracker, stays out however interactive.
  test("given the US then lists the main app, then the current-law calculators by label", () => {
    expect(getToolsMenu("us").map((tool) => tool.label)).toEqual([
      "PolicyEngine app",
      "CliffWatch",
      "Coverage Compass",
      "GiveCalc",
      "Marriage calculator",
      "QBI deduction calculator",
      "SPM threshold calculator",
      "TANF calculator",
    ]);
  });

  test("given the UK then lists the main app, then the current-law calculators by label", () => {
    expect(getToolsMenu("uk").map((tool) => tool.label)).toEqual([
      "PolicyEngine app",
      "Marriage calculator",
      "Student loan calculator",
      "UK CliffWatch",
    ]);
  });

  test("given any country then leaves out the OBBBA explorer, the bill tracker and /uk/cliffwatch", () => {
    for (const countryId of countryIds) {
      const hrefs = getToolsMenu(countryId).map((tool) => tool.href);
      expect(hrefs).not.toContain(`/${countryId}/obbba-households`);
      expect(hrefs).not.toContain(`/${countryId}/bill-tracker`);
      expect(hrefs).not.toContain("/uk/cliffwatch");
    }
  });

  test("given any country id then the menu is the main app, then exactly its flagged apps by label", () => {
    fc.assert(
      fc.property(anyCountryId, (countryId) => {
        const menu = getToolsMenu(countryId);
        const flagged = apps.filter(
          (app) => app.countryId === countryId && app.toolsMenu,
        );

        if (flagged.length === 0) {
          expect(menu).toEqual([]);
          return;
        }
        expect(menu[0]).toEqual({
          id: MAIN_APP_ID,
          label: MAIN_APP_LABEL,
          description: expect.any(String),
          href: `${CALCULATOR_URL}/${countryId}`,
        });
        const tools = menu.slice(1);
        expect(tools).toHaveLength(flagged.length);
        for (const app of flagged) {
          expect(tools).toContainEqual({
            id: app.slug,
            label: app.toolsMenu!.label,
            description: app.description,
            href: `/${countryId}/${app.slug}`,
          });
        }
        for (let i = 1; i < tools.length; i++) {
          expect(
            tools[i - 1].label.localeCompare(tools[i].label, "en"),
          ).toBeLessThan(0);
        }
      }),
    );
  });

  test("given any country id then every link stays in that country", () => {
    fc.assert(
      fc.property(anyCountryId, (countryId) => {
        for (const tool of getTools(countryId)) {
          expect(tool.href.startsWith(`/${countryId}/`)).toBe(true);
        }
        expect(getMainAppHref(countryId)).toBe(
          `${CALCULATOR_URL}/${countryId}`,
        );
      }),
    );
  });

  test.each(countriesWithTools)(
    "every %s tool links to a proxied zone path",
    (countryId) => {
      for (const tool of getTools(countryId)) {
        expect(isProxiedZonePath(tool.href)).toBe(true);
      }
    },
  );

  test.each(countriesWithTools)(
    "%s menu labels and ids are unique",
    (countryId) => {
      const menu = getToolsMenu(countryId);

      expect(new Set(menu.map((tool) => tool.label)).size).toBe(menu.length);
      expect(new Set(menu.map((tool) => tool.id)).size).toBe(menu.length);
    },
  );
});

describe("tools menu, website and calculator", () => {
  test("given any country id then both lookups return the same tools in the same order", () => {
    fc.assert(
      fc.property(anyCountryId, (countryId) => {
        expect(getToolsMenuEntries(countryId)).toEqual(
          getTools(countryId).map((tool) => ({
            slug: tool.id,
            label: tool.label,
          })),
        );
      }),
    );
  });

  test("both name the main app the same way", () => {
    expect(CALCULATOR_MAIN_APP_LABEL).toBe(MAIN_APP_LABEL);
  });

  test("both read the same apps.json: the website's is a symlink to the calculator's", () => {
    const linkPath = path.resolve(__dirname, "../../data/apps.json");

    expect(lstatSync(linkPath).isSymbolicLink()).toBe(true);
    expect(realpathSync(linkPath)).toBe(
      realpathSync(
        path.resolve(__dirname, "../../../../app/src/data/apps/apps.json"),
      ),
    );
  });
});
