import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";

import { READER_TIME_ZONES, withTimeZone } from "@/__tests__/helpers/timeZone";
import ArticlePage, {
  generateMetadata,
} from "@/app/[countryId]/research/[slug]/page";
import sitemap from "@/app/sitemap";
import { getPostsSorted } from "@/data/posts/postTransformers";
import { parsePostDate } from "@/lib/postDate";

const posts = getPostsSorted();
const bareDatePost = posts.find((post) => !parsePostDate(post.date)?.time);
const timestampPost = posts.find((post) => parsePostDate(post.date)?.time);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

function params(slug: string) {
  return { params: Promise.resolve({ countryId: "us", slug }) };
}

async function articleJsonLd(slug: string): Promise<Record<string, unknown>> {
  const page = (await ArticlePage(params(slug))) as ReactElement<{
    children: ReactElement<{
      type?: string;
      dangerouslySetInnerHTML?: { __html: string };
    }>[];
  }>;
  const script = page.props.children.find(
    (child) => child.props.type === "application/ld+json",
  );
  return JSON.parse(script!.props.dangerouslySetInnerHTML!.__html);
}

describe("article dates in machine-readable output", () => {
  test("given posts.json then it has a bare-date post and a timestamp post", () => {
    expect(bareDatePost).toBeDefined();
    expect(timestampPost).toBeDefined();
  });

  test("given a bare-date post then Open Graph and JSON-LD carry the date unchanged", async () => {
    const metadata = await generateMetadata(params(bareDatePost!.slug));
    const jsonLd = await articleJsonLd(bareDatePost!.slug);

    expect(metadata.openGraph).toMatchObject({
      publishedTime: bareDatePost!.date,
    });
    expect(jsonLd.datePublished).toBe(bareDatePost!.date);
    expect(jsonLd.datePublished).toMatch(ISO_DATE);
  });

  test("given a timestamp post then Open Graph and JSON-LD use an ISO 8601 date-time", async () => {
    const expected = timestampPost!.date.replace(" ", "T");
    const metadata = await generateMetadata(params(timestampPost!.slug));
    const jsonLd = await articleJsonLd(timestampPost!.slug);

    expect(metadata.openGraph).toMatchObject({ publishedTime: expected });
    expect(jsonLd.datePublished).toBe(expected);
    expect(jsonLd.datePublished).toMatch(ISO_DATE_TIME);
  });

  test("given every post then JSON-LD datePublished is ISO 8601 and names the post's day", async () => {
    for (const post of posts) {
      const jsonLd = await articleJsonLd(post.slug);
      const datePublished = jsonLd.datePublished as string;
      expect(datePublished, post.slug).toMatch(
        /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/,
      );
      expect(datePublished.slice(0, 10), post.slug).toBe(
        post.date.slice(0, 10),
      );
    }
  });
});

describe("sitemap lastModified for research articles", () => {
  function researchEntries() {
    return sitemap().filter((entry) => entry.url.includes("/research/"));
  }

  test("given every article then lastModified is the post's calendar date", () => {
    const entries = researchEntries();
    const dateBySlug = new Map(posts.map((post) => [post.slug, post.date]));
    expect(entries.length).toBeGreaterThanOrEqual(posts.length);

    for (const entry of entries) {
      const slug = entry.url.split("/research/")[1];
      expect(entry.lastModified, entry.url).toMatch(ISO_DATE);
      expect(entry.lastModified, entry.url).toBe(
        dateBySlug.get(slug)!.slice(0, 10),
      );
    }
  });

  test("given builds in different zones then the sitemap is identical", () => {
    const [west, east] = READER_TIME_ZONES.map(({ timeZone }) =>
      withTimeZone(timeZone, () => researchEntries()),
    );
    expect(east).toEqual(west);
  });
});
