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
      expect(post.filename).toBeDefined();
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

  test('all posts have filename field', () => {
    posts.forEach((post) => {
      expect(post.filename).toBeDefined();
      expect(typeof post.filename).toBe('string');
      expect(post.filename.length).toBeGreaterThan(0);
    });
  });

  test('posts have correct slugs from filename', () => {
    posts.forEach((post) => {
      const expectedSlug = post.filename
        .substring(0, post.filename.indexOf('.'))
        .toLowerCase()
        .replace(/_/g, '-');
      expect(post.slug).toBe(expectedSlug);
    });
  });
});
