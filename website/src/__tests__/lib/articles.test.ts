import { describe, expect, test } from "vitest";
import { getAllSlugs, getPostBySlug } from "../../lib/articles";

describe("getAllSlugs", () => {
  test("returns non-empty array of slugs", () => {
    const slugs = getAllSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      expect(typeof slug).toBe("string");
      expect(slug.length).toBeGreaterThan(0);
    }
  });
});

describe("getPostBySlug", () => {
  test("returns a post for a valid slug", () => {
    const slugs = getAllSlugs();
    const post = getPostBySlug(slugs[0]);
    expect(post).toBeDefined();
    expect(post!.title).toBeTruthy();
    expect(post!.slug).toBe(slugs[0]);
  });

  test("returns undefined for an invalid slug", () => {
    expect(getPostBySlug("nonexistent-post-slug-xyz")).toBeUndefined();
  });
});
