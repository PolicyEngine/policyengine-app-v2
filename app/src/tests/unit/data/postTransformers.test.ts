/**
 * Post Transformers Tests
 *
 * Tests for post data transformation and tag label validation.
 */

import { describe, expect, it } from 'vitest';
import { locationLabels, locationTags, posts, topicLabels } from '@/data/posts/postTransformers';

describe('postTransformers', () => {
  describe('tag labels', () => {
    it('should have display labels for all topic tags used in posts', () => {
      // Get all unique tags from posts
      const allTags = [...new Set(posts.flatMap((post) => post.tags))];

      // Filter to topic tags (non-location tags)
      const usedTopicTags = allTags.filter((tag) => !locationTags.includes(tag));

      // Find tags without labels
      const missingLabels = usedTopicTags.filter((tag) => !topicLabels[tag]);

      if (missingLabels.length > 0) {
        throw new Error(
          `The following topic tags are used in posts but do not have display labels in topicLabels:\n` +
            `  - ${missingLabels.join('\n  - ')}\n\n` +
            `Please add display labels for these tags in src/data/posts/postTransformers.ts`
        );
      }

      expect(missingLabels).toHaveLength(0);
    });

    it('should have display labels for all location tags used in posts', () => {
      // Get all unique tags from posts
      const allTags = [...new Set(posts.flatMap((post) => post.tags))];

      // Filter to location tags
      const usedLocationTags = allTags.filter((tag) => locationTags.includes(tag));

      // Find tags without labels
      const missingLabels = usedLocationTags.filter((tag) => !locationLabels[tag]);

      if (missingLabels.length > 0) {
        throw new Error(
          `The following location tags are used in posts but do not have display labels in locationLabels:\n` +
            `  - ${missingLabels.join('\n  - ')}\n\n` +
            `Please add display labels for these tags in src/data/posts/postTransformers.ts`
        );
      }

      expect(missingLabels).toHaveLength(0);
    });

    it('should have unique slugs for all posts', () => {
      const slugs = posts.map((post) => post.slug);
      const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);

      if (duplicates.length > 0) {
        const uniqueDuplicates = [...new Set(duplicates)];
        throw new Error(
          `The following post slugs are duplicated:\n` +
            `  - ${uniqueDuplicates.join('\n  - ')}\n\n` +
            `Each post must have a unique slug. Check posts.json for duplicate filenames.`
        );
      }

      expect(duplicates).toHaveLength(0);
    });
  });

  describe('post data integrity', () => {
    it('should have required fields for all posts', () => {
      const postsWithMissingFields = posts.filter(
        (post) =>
          !post.title ||
          !post.description ||
          !post.date ||
          !post.filename ||
          !post.authors ||
          post.authors.length === 0 ||
          !post.tags ||
          post.tags.length === 0
      );

      if (postsWithMissingFields.length > 0) {
        const titles = postsWithMissingFields.map((p) => p.title || p.filename || 'Unknown');
        throw new Error(
          `The following posts are missing required fields (title, description, date, filename, authors, tags):\n` +
            `  - ${titles.join('\n  - ')}`
        );
      }

      expect(postsWithMissingFields).toHaveLength(0);
    });
  });
});
