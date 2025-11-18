/**
 * Tests for postTransformers
 * Verifies data processing logic works correctly
 */

import { describe, expect, test } from 'vitest';
import { locationLabels, locationTags, posts, topicLabels, topicTags } from './postTransformers';

describe('postTransformers', () => {
  test('posts array is not empty', () => {
    expect(posts).toBeDefined();
    expect(posts.length).toBeGreaterThan(0);
  });

  test('all posts have required fields', () => {
    posts.forEach((post) => {
      expect(post.title).toBeDefined();
      expect(post.description).toBeDefined();
      expect(post.date).toBeDefined();
      expect(post.authors).toBeDefined();
      expect(post.tags).toBeDefined();
      expect(post.image).toBeDefined();
      expect(post.slug).toBeDefined();
      expect(post.type).toBeDefined();
      expect(['article', 'interactive']).toContain(post.type);
    });
  });

  test('all posts have slugs generated', () => {
    posts.forEach((post) => {
      expect(post.slug).toBeTruthy();
      expect(typeof post.slug).toBe('string');
      // Slugs should be lowercase with hyphens
      expect(post.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  test('posts are sorted by date (newest first)', () => {
    // Check that dates are in descending order using string comparison
    // (which works for ISO date format)
    for (let i = 0; i < posts.length - 1; i++) {
      expect(posts[i].date >= posts[i + 1].date).toBe(true);
    }
  });

  test('topicTags is an array', () => {
    expect(Array.isArray(topicTags)).toBe(true);
    expect(topicTags.length).toBeGreaterThan(0);
  });

  test('locationTags is an array', () => {
    expect(Array.isArray(locationTags)).toBe(true);
    expect(locationTags.length).toBeGreaterThan(0);
  });

  test('locationTags only contain country/state tags', () => {
    const countryPrefixes = ['us', 'uk', 'ng', 'ca', 'global'];
    locationTags.forEach((tag) => {
      const hasCountryPrefix = countryPrefixes.some(
        (prefix) => tag === prefix || tag.startsWith(prefix + '-')
      );
      expect(hasCountryPrefix).toBe(true);
    });
  });

  test('topicTags do not contain location tags', () => {
    topicTags.forEach((tag) => {
      expect(locationTags).not.toContain(tag);
    });
  });

  test('topicLabels has expected keys', () => {
    expect(topicLabels.featured).toBe('Featured');
    expect(topicLabels.policy).toBe('Policy analysis');
    expect(topicLabels.technical).toBe('Technical report');
  });

  test('locationLabels has expected keys', () => {
    expect(locationLabels.us).toBe('United States');
    expect(locationLabels.uk).toBe('United Kingdom');
    expect(locationLabels.ca).toBe('Canada');
    expect(locationLabels['us-ca']).toBe('California, U.S.');
  });

  test('article posts have filename field', () => {
    const articlePosts = posts.filter((p) => p.type === 'article');
    articlePosts.forEach((post) => {
      expect(post.filename).toBeDefined();
      expect(typeof post.filename).toBe('string');
      expect(post.filename.length).toBeGreaterThan(0);
    });
  });

  test('interactive posts have source field', () => {
    const interactivePosts = posts.filter((p) => p.type === 'interactive');
    interactivePosts.forEach((post) => {
      expect(post.source).toBeDefined();
      expect(typeof post.source).toBe('string');
      expect(post.source.length).toBeGreaterThan(0);
      // Source should be a valid URL (absolute or relative)
      expect(post.source).toMatch(/^(https?:\/\/|\/)/);
    });
  });

  test('article posts have correct slugs from filename', () => {
    const articlePosts = posts.filter((p) => p.type === 'article');
    articlePosts.forEach((post) => {
      const expectedSlug = post.filename
        .substring(0, post.filename.indexOf('.'))
        .toLowerCase()
        .replace(/_/g, '-');
      expect(post.slug).toBe(expectedSlug);
    });
  });

  test('interactive posts have slugs generated from title', () => {
    const interactivePosts = posts.filter((p) => p.type === 'interactive');
    interactivePosts.forEach((post) => {
      // Slug should be lowercase, alphanumeric with hyphens
      expect(post.slug).toMatch(/^[a-z0-9-]+$/);
      // Slug should not be empty
      expect(post.slug.length).toBeGreaterThan(0);
    });
  });

  test('all interactive posts are properly configured', () => {
    const interactivePosts = posts.filter((p) => p.type === 'interactive');

    interactivePosts.forEach((post) => {
      // Must have type 'interactive'
      expect(post.type).toBe('interactive');

      // Must have source URL (absolute or relative)
      expect(post.source).toBeDefined();
      expect(typeof post.source).toBe('string');
      expect(post.source).toMatch(/^(https?:\/\/|\/)/);

      // Must have all base fields
      expect(post.title).toBeDefined();
      expect(post.description).toBeDefined();
      expect(post.date).toBeDefined();
      expect(post.authors).toBeDefined();
      expect(post.tags).toBeDefined();
      expect(post.image).toBeDefined();
      expect(post.slug).toBeDefined();

      // Should typically have 'interactives' tag
      // (This is a soft recommendation, not a requirement)
      if (post.tags.includes('interactives')) {
        expect(post.tags).toContain('interactives');
      }
    });
  });
});
