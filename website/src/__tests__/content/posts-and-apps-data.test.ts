import { describe, expect, test } from "vitest";
import appsData from "@/data/apps.json";
import {
  getLocationTags,
  getPostsSorted,
  locationLabels,
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

  test("slugs are URL-safe", () => {
    const invalid = apps.filter((app) => !/^[a-z0-9-]+$/.test(app.slug ?? ""));
    expect(invalid.map((app) => app.slug)).toEqual([]);
  });

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
