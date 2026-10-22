// @vitest-environment node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import appsData from "@/data/apps.json";
import postsData from "@/data/posts/posts.json";
import { appZoneRewrites, appZoneRoutes } from "@/data/appZoneRoutes";
import {
  COMPARABLES_CUTOVER_DATE,
  entryKey,
  GRANDFATHERED,
  isValidDate,
  MAX_SEARCH_AGE_DAYS,
  requiresComparables,
  researchEntries,
  routeEntryKey,
  SCORECARD_INDEX_URL,
  validateComparables,
} from "@/data/comparables";
import {
  getLocationTags,
  getPostsSorted,
  locationLabels,
  postSlug,
  topicLabels,
} from "@/data/posts/postTransformers";

// posts.json and apps.json live in app/src/data and feed the research pages
// and the sitemap. These checks came over from the Vite app's tests when its
// copy of the website was deleted.

interface AppEntry {
  slug?: string;
  title?: string;
  description?: string;
  source?: string;
  type?: string;
  tags?: unknown;
  countryId?: string;
  displayWithResearch?: boolean;
  image?: string;
  date?: string;
  authors?: string[];
}

const apps = appsData as AppEntry[];

function duplicates(values: string[]): string[] {
  return [...new Set(values.filter((v, i) => values.indexOf(v) !== i))];
}

describe("posts.json", () => {
  test("every topic tag used in a post has a display label", () => {
    const locationTags = getLocationTags();
    const unlabelled = [
      ...new Set(getPostsSorted().flatMap((post) => post.tags)),
    ].filter((tag) => !locationTags.includes(tag) && !topicLabels[tag]);
    expect(unlabelled).toEqual([]);
  });

  test("every location tag used in a post has a display label", () => {
    const unlabelled = getLocationTags().filter((tag) => !locationLabels[tag]);
    expect(unlabelled).toEqual([]);
  });

  test("post slugs are unique", () => {
    expect(duplicates(getPostsSorted().map((post) => post.slug))).toEqual([]);
  });

  test("every post has a title, description, date, filename, authors and tags", () => {
    const incomplete = getPostsSorted()
      .filter(
        (post) =>
          !post.title ||
          !post.description ||
          !post.date ||
          !post.filename ||
          !post.authors?.length ||
          !post.tags?.length,
      )
      .map((post) => post.title || post.filename || "(untitled)");
    expect(incomplete).toEqual([]);
  });
});

describe("apps.json", () => {
  test("every app has the required fields and a known type", () => {
    expect(apps.length).toBeGreaterThan(0);
    const invalid = apps
      .filter(
        (app) =>
          !app.slug ||
          !app.title ||
          !app.description ||
          !app.source ||
          ![
            "streamlit",
            "iframe",
            "obbba-iframe",
            "custom",
            "rewrite",
          ].includes(app.type ?? "") ||
          !Array.isArray(app.tags) ||
          !app.countryId,
      )
      .map((app) => app.slug ?? app.title ?? "(untitled)");
    expect(invalid).toEqual([]);
  });

  test("every source is an external URL, an asset, or a country path", () => {
    const invalid = apps.filter(
      (app) => !/^(https?:\/\/|\/assets\/|\/[a-z]{2}\/)/.test(app.source ?? ""),
    );
    expect(invalid.map((app) => app.slug)).toEqual([]);
  });

  // Research card keys (getResearchItemKey) rely on slugs having no "/".
  test("slugs are URL-safe", () => {
    const invalid = apps.filter((app) => !/^[a-z0-9-]+$/.test(app.slug ?? ""));
    expect(invalid.map((app) => app.slug)).toEqual([]);
  });

  // Slugs repeat across countries (the US and UK "marriage" apps), so pages
  // and research card keys identify an app by its country and slug.
  test("country and slug pairs are unique", () => {
    expect(
      duplicates(apps.map((app) => `${app.countryId}/${app.slug}`)),
    ).toEqual([]);
  });

  test("apps listed with research have an image, a date and authors", () => {
    const researchApps = apps.filter((app) => app.displayWithResearch);
    expect(researchApps.length).toBeGreaterThan(0);
    const incomplete = researchApps.filter(
      (app) =>
        typeof app.image !== "string" ||
        !/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(app.date ?? "") ||
        !Array.isArray(app.authors) ||
        app.authors.length === 0,
    );
    expect(incomplete.map((app) => app.slug)).toEqual([]);
  });
});

// Pre-publish comparables (website/src/data/comparables.ts): every research
// entry not on the list of entries live before the gate names a complete
// record in PolicyEngine/policyengine-scorecard. The Comparables gate workflow
// checks the record against the scorecard's index; these checks need no
// network.
describe("comparables", () => {
  const entries = researchEntries(
    apps,
    postsData as Parameters<typeof researchEntries>[1],
  );
  const keys = entries.map(entryKey);
  const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
  const deepRoutes = new Set(
    appZoneRoutes.map((route) => `${route.source}/:path*`),
  );
  const routes = [
    ...new Set(
      appZoneRewrites
        .map((route) => route.source)
        .filter((source) => !deepRoutes.has(source)),
    ),
  ];

  test("every research entry passes the gate's own checks", () => {
    expect(entries.flatMap((entry) => validateComparables(entry))).toEqual([]);
  });

  test("each research entry has its own key, and each that needs a record its own record name", () => {
    expect(duplicates(keys)).toEqual([]);
    const records = entries.map((entry) => ({
      entry,
      names: entry.countryIds.map(
        (country) => `analysis-${country}-${entry.slug}`,
      ),
    }));
    // the GiveCalc app and post share a name, and both were live before the
    // gate; an entry that needs a record may share its name with nothing
    const clashes = records
      .filter(({ entry }) => requiresComparables(entry))
      .flatMap(({ entry, names }) =>
        names.filter((name) =>
          records.some(
            (other) => other.entry !== entry && other.names.includes(name),
          ),
        ),
      );
    expect(clashes).toEqual([]);
  });

  test("every post's file name gives it a slug", () => {
    const slugs = (postsData as Array<{ filename: string }>).map((post) =>
      postSlug(post.filename),
    );
    expect(
      slugs.filter((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)),
    ).toEqual([]);
    expect(duplicates(slugs)).toEqual([]);
  });

  test("the grandfather list names only research entries on the site, listed before the cutover", () => {
    const byKey = new Map(entries.map((entry) => [entryKey(entry), entry]));
    expect(GRANDFATHERED.entries.filter((key) => !byKey.has(key))).toEqual([]);
    const late = GRANDFATHERED.entries.filter((key) => {
      const entry = byKey.get(key);
      if (!entry) return false;
      if (entry.date === null) return entry.kind === "post";
      return !isValidDate(entry.date) || entry.date >= COMPARABLES_CUTOVER_DATE;
    });
    expect(late).toEqual([]);
    expect(GRANDFATHERED.entries).toEqual(
      [...new Set(GRANDFATHERED.entries)].sort(),
    );
    expect(isValidDate(GRANDFATHERED.snapshotDate)).toBe(true);
    expect(GRANDFATHERED.snapshotDate < COMPARABLES_CUTOVER_DATE).toBe(true);
  });

  test("every app route is a research entry's, or was live before the gate", () => {
    const entryKeys = new Set(keys);
    const unlisted = routes.filter((route) => {
      const key = routeEntryKey(route);
      return !(key && entryKeys.has(key));
    });
    expect(
      unlisted.filter((route) => !GRANDFATHERED.routes.includes(route)),
    ).toEqual([]);
    // a route taken down, or given a research entry, leaves the list
    expect(
      GRANDFATHERED.routes.filter((route) => !unlisted.includes(route)),
    ).toEqual([]);
    expect(GRANDFATHERED.routes).toEqual(
      [...new Set(GRANDFATHERED.routes)].sort(),
    );
  });

  test("every featured research card links a research entry", () => {
    const banner = readFileSync(
      `${repoRoot}website/src/components/home/FeaturedResearchBanner.tsx`,
      "utf8",
    );
    const hrefs = [...banner.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    const entryKeys = new Set(keys);
    const postKeys = new Set(
      entries.filter((e) => e.kind === "post").map((e) => entryKey(e)),
    );
    const orphans = hrefs.filter((href) => {
      const app = routeEntryKey(href);
      const post = href.match(/^\/[a-z]{2}\/research\/([a-z0-9-]+)$/);
      return !(
        (app && entryKeys.has(app)) ||
        (post && postKeys.has(`post ${post[1]}`))
      );
    });
    expect(orphans).toEqual([]);
  });

  test("the gate's settings stay where Max set them", () => {
    // decision d1812: the cutover is 2026-10-29 or earlier
    expect(isValidDate(COMPARABLES_CUTOVER_DATE)).toBe(true);
    expect(COMPARABLES_CUTOVER_DATE <= "2026-10-29").toBe(true);
    expect(MAX_SEARCH_AGE_DAYS).toBeGreaterThan(0);
    expect(MAX_SEARCH_AGE_DAYS).toBeLessThanOrEqual(30);
  });

  test("the workflow downloads the index from the scorecard's main, and runs on every pull request", () => {
    const workflow = readFileSync(
      `${repoRoot}.github/workflows/comparables-gate.yml`,
      "utf8",
    );
    const pinned = workflow.match(/^\s*SCORECARD_INDEX_URL:\s*(\S+)\s*$/m);
    expect(pinned?.[1]).toBe(SCORECARD_INDEX_URL);
    expect(SCORECARD_INDEX_URL).toBe(
      "https://raw.githubusercontent.com/PolicyEngine/policyengine-scorecard/main/data/comparables/index.json",
    );
    expect(workflow).not.toMatch(/^\s*paths(-ignore)?:/m);
    expect(workflow).toMatch(/COMPARABLES_GATE: "1"/);
  });
});
