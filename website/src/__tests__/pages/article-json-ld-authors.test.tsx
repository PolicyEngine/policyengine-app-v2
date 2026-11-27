import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";

import ArticleClient from "@/app/[countryId]/research/[slug]/ArticleClient";
import ArticlePage from "@/app/[countryId]/research/[slug]/page";
import authorsData from "@/data/posts/authors.json";
import { getPostsSorted } from "@/data/posts/postTransformers";
import type { AuthorsCollection, BlogPost } from "@/types/blog";

// Search engines read an article's author from its schema.org JSON-LD. These
// tests read the JSON-LD the article page renders, for every post, and check
// that each author is named as authors.json names them, never by slug.

const authors = authorsData as AuthorsCollection;
const posts = getPostsSorted();

const DAVID_TRIMMER_POST = "federal-tax-inflation-adjustments-2027";
const MULTI_AUTHOR_POST = "uk-autumn-budget-2026-briefing";

interface JsonLdArticle {
  author: { "@type": string; name: string }[];
}

async function articleJsonLd(slug: string): Promise<JsonLdArticle> {
  const page = (await ArticlePage({
    params: Promise.resolve({ countryId: "us", slug }),
  })) as ReactElement<{
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

describe("article JSON-LD authors", () => {
  test("given every post then each author slug has an authors.json record with a name", () => {
    const missing = [
      ...new Set(
        posts
          .flatMap((post) => post.authors)
          .filter(
            (slug) =>
              !Object.prototype.hasOwnProperty.call(authors, slug) ||
              !authors[slug].name?.trim(),
          ),
      ),
    ];
    expect(missing).toEqual([]);
  });

  test("given posts.json then it has the posts these tests name", () => {
    const slugs = posts.map((post) => post.slug);
    expect(slugs).toContain(DAVID_TRIMMER_POST);
    expect(slugs).toContain(MULTI_AUTHOR_POST);
  });

  test("given David Trimmer's 2027 inflation post then the author is David Trimmer", async () => {
    const jsonLd = await articleJsonLd(DAVID_TRIMMER_POST);

    expect(jsonLd.author).toEqual([
      { "@type": "Person", name: "David Trimmer" },
    ]);
  });

  test("given a post with several authors then lists each by name, in byline order", async () => {
    const post = posts.find((p) => p.slug === MULTI_AUTHOR_POST);
    expect(post, MULTI_AUTHOR_POST).toBeDefined();
    const jsonLd = await articleJsonLd(MULTI_AUTHOR_POST);

    expect(jsonLd.author).toEqual(
      post!.authors.map((slug) => ({
        "@type": "Person",
        name: authors[slug].name.trim(),
      })),
    );
    expect(jsonLd.author.length).toBeGreaterThan(1);
  });

  test("given every post then the JSON-LD names each author as authors.json does", async () => {
    for (const post of posts) {
      const jsonLd = await articleJsonLd(post.slug);
      expect(jsonLd.author, post.slug).toEqual(
        post.authors.map((slug) => ({
          "@type": "Person",
          name: authors[slug].name.trim(),
        })),
      );
      for (const { name } of jsonLd.author) {
        expect(post.authors, post.slug).not.toContain(name);
      }
    }
  });
});

describe("article byline names", () => {
  beforeAll(() => {
    // jsdom has no matchMedia; the article's display-category hook reads it.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  const POST: BlogPost = {
    title: "A post by two authors",
    description: "Two authors whose names their slugs can't spell.",
    date: "2026-11-11",
    authors: ["jason-debacker", "maria-juaristi"],
    tags: ["us"],
    filename: "a-post-by-two-authors.md",
    image: "",
    slug: "a-post-by-two-authors",
  };

  test("given authors whose slugs lose their spelling then the byline shows the authors.json names", () => {
    render(
      <ArticleClient
        post={POST}
        content="Post body."
        isNotebook={false}
        countryId="us"
      />,
    );

    expect(
      screen.getAllByRole("link", { name: "Jason DeBacker" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "María Juaristi" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("link", { name: "Jason Debacker" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Maria Juaristi" }),
    ).not.toBeInTheDocument();
  });
});
