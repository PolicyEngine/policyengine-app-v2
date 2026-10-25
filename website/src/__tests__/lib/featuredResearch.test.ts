import { existsSync } from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { describe, expect, test } from "vitest";
import appsData from "@/data/apps.json";
import { appZoneRoutes } from "@/data/appZoneRoutes";
import {
  FEATURED_RESEARCH_SLUGS,
  getFeaturedResearch,
} from "@/lib/featuredResearch";
import { getToolsMenu } from "@/lib/toolsMenu";

// The homepage's featured research. Invariants, for every country C:
//   1. each item is an apps.json entry for C, with that entry's copy and image;
//   2. it links to `/C/<slug>`, a path the website proxies to a zone;
//   3. it isn't also in C's tools menu: research about one policy or event is
//      not a tool;
//   4. its image exists.

interface AppEntry {
  slug: string;
  countryId: string;
  title: string;
  description: string;
  image?: string;
}

const apps = appsData as AppEntry[];
const zoneSources = new Set(appZoneRoutes.map((route) => route.source));
const publicDir = path.resolve(__dirname, "../../../public");

describe("featured research", () => {
  test("given the US then features the bill tracker, then the OBBBA explorer", () => {
    expect(getFeaturedResearch("us").map((item) => item.href)).toEqual([
      "/us/bill-tracker",
      "/us/obbba-households",
    ]);
  });

  test.each(Object.keys(FEATURED_RESEARCH_SLUGS))(
    "every %s item is its apps.json entry, with that entry's copy and image",
    (countryId) => {
      const items = getFeaturedResearch(countryId);

      expect(items.map((item) => item.slug)).toEqual(
        FEATURED_RESEARCH_SLUGS[countryId],
      );
      for (const item of items) {
        const app = apps.find(
          (entry) => entry.countryId === countryId && entry.slug === item.slug,
        )!;
        expect(item).toEqual({
          slug: app.slug,
          title: app.title,
          description: app.description,
          image: `/assets/posts/${app.image}`,
          href: `/${countryId}/${app.slug}`,
        });
        expect(existsSync(path.join(publicDir, item.image))).toBe(true);
      }
    },
  );

  test.each(Object.keys(FEATURED_RESEARCH_SLUGS))(
    "every %s item links to a proxied zone path and isn't in the tools menu",
    (countryId) => {
      const toolHrefs = getToolsMenu(countryId).map((tool) => tool.href);

      for (const item of getFeaturedResearch(countryId)) {
        const [, , ...rest] = item.href.split("/");
        expect(
          zoneSources.has(item.href) ||
            zoneSources.has(`/:countryId/${rest.join("/")}`),
        ).toBe(true);
        expect(toolHrefs).not.toContain(item.href);
      }
    },
  );

  test("given any other country id then features nothing", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constantFrom("uk", "ca", "__proto__", "constructor"),
          fc.string(),
        ),
        (countryId) => {
          fc.pre(!Object.hasOwn(FEATURED_RESEARCH_SLUGS, countryId));
          expect(getFeaturedResearch(countryId)).toEqual([]);
        },
      ),
    );
  });
});
