import { describe, expect, test } from "vitest";
import {
  getPostsSorted,
  getLocationTags,
  getTopicTags,
  getResearchItems,
  topicLabels,
  locationLabels,
  getTopicLabel,
} from "../../data/posts/postTransformers";

describe("getPostsSorted", () => {
  test("returns posts sorted by date descending", () => {
    const posts = getPostsSorted();
    expect(posts.length).toBeGreaterThan(0);
    for (let i = 1; i < posts.length; i++) {
      expect(posts[i - 1].date >= posts[i].date).toBe(true);
    }
  });

  test("all posts have slugs", () => {
    const posts = getPostsSorted();
    for (const post of posts) {
      expect(post.slug).toBeTruthy();
      expect(post.slug).not.toContain("_");
      expect(post.slug).toBe(post.slug.toLowerCase());
    }
  });
});

describe("getLocationTags", () => {
  test("returns location tags", () => {
    const tags = getLocationTags();
    expect(tags).toContain("us");
    expect(tags).toContain("uk");
  });

  test("does not include topic tags", () => {
    const locationTags = getLocationTags();
    const topicTags = getTopicTags();
    for (const tag of topicTags) {
      expect(locationTags).not.toContain(tag);
    }
  });
});

describe("getTopicTags", () => {
  test("returns topic tags", () => {
    const tags = getTopicTags();
    expect(tags.length).toBeGreaterThan(0);
  });
});

describe("getResearchItems", () => {
  test("returns items with required fields", () => {
    const items = getResearchItems();
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.title).toBeTruthy();
      expect(item.slug).toBeTruthy();
      expect(item.date).toBeTruthy();
      expect(item.countryId).toBeTruthy();
    }
  });
});

describe("topicLabels and locationLabels", () => {
  test("topicLabels has entries", () => {
    expect(Object.keys(topicLabels).length).toBeGreaterThan(0);
  });

  test("locationLabels has country entries", () => {
    expect(locationLabels["us"]).toBe("United States");
    expect(locationLabels["uk"]).toBe("United Kingdom");
  });
});

describe("getTopicLabel", () => {
  test("returns UK variant for behavioural responses", () => {
    expect(getTopicLabel("behavioral-responses", "uk")).toBe(
      "Behavioural responses",
    );
  });

  test("returns US variant for behavioral responses", () => {
    expect(getTopicLabel("behavioral-responses", "us")).toBe(
      "Behavioral responses",
    );
  });

  test("returns default label for non-variant tags", () => {
    expect(getTopicLabel("tax", "us")).toBe("Tax");
  });
});
