/**
 * Test fixtures for Blog.page component
 */

import { vi } from 'vitest';
import type { BlogPost } from '@/types/blog';

// Test scroll offset constant
export const TEST_SCROLL_OFFSET_PX = 72;

// Test blog post with headers for TOC testing
export const MOCK_BLOG_POST: BlogPost = {
  title: 'Test Blog Post',
  description: 'A test blog post with multiple headers',
  date: '2025-01-15',
  tags: ['us', 'policy', 'featured'],
  slug: 'test-blog-post',
  filename: 'test-blog-post.md',
  image: 'test-image.jpg',
  authors: ['test-author'],
};

// Mock markdown with headers for TOC
export const MOCK_MARKDOWN_WITH_HEADERS = `
# Main Title

This is the introduction paragraph.

## First Section

Content for the first section.

### Subsection One

Some subsection content.

## Second Section

Content for the second section.

### Subsection Two

More subsection content.

## Third Section with Special/Characters

Content with special characters in header.
`;

// Expected TOC slugs (must match MarkdownFormatter slug generation)
export const EXPECTED_TOC_SLUGS = {
  FIRST_SECTION: 'first-section',
  SUBSECTION_ONE: 'subsection-one',
  SECOND_SECTION: 'second-section',
  SUBSECTION_TWO: 'subsection-two',
  THIRD_SECTION: 'third-section-with-specialcharacters',
} as const;

// Mock element with getBoundingClientRect for scroll testing
export const createMockElementWithPosition = (top: number) => {
  const element = document.createElement('h2');
  element.id = EXPECTED_TOC_SLUGS.FIRST_SECTION;
  element.getBoundingClientRect = vi.fn(() => ({
    top,
    left: 0,
    right: 0,
    bottom: top + 50,
    width: 800,
    height: 50,
    x: 0,
    y: top,
    toJSON: () => ({}),
  }));
  return element;
};

// Mock window.scrollTo for testing
export const mockScrollTo = () => {
  const scrollToMock = vi.fn();
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: scrollToMock,
  });
  return scrollToMock;
};

// Mock window.pageYOffset for testing
export const mockPageYOffset = (offset: number) => {
  Object.defineProperty(window, 'pageYOffset', {
    writable: true,
    value: offset,
  });
};

// Mock share link constants
export const TEST_SHARE_URL = 'https://example.com/research/test-blog-post';

export const EXPECTED_SHARE_LINKS = {
  TWITTER: (url: string, title: string) =>
    `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
  FACEBOOK: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  LINKEDIN: (url: string, title: string, description: string) =>
    `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}&summary=${description}`,
  EMAIL: (url: string, title: string) => `mailto:?subject=${title}&body=${url}`,
} as const;

// Mock authors data
export const MOCK_AUTHORS = {
  'test-author': {
    name: 'Test Author',
    title: 'Test Title',
    headshot: 'test-headshot.jpg',
  },
};

// Mock post transformers setup
export const setupPostTransformersMocks = () => {
  vi.mock('@/data/posts/postTransformers', () => ({
    posts: [MOCK_BLOG_POST],
    topicLabels: {},
    locationLabels: {},
    topicTags: [],
    locationTags: [],
  }));

  vi.mock('@/data/posts/authors.json', () => ({
    default: MOCK_AUTHORS,
  }));
};

// Mock markdown module setup
export const setupMarkdownMocks = () => {
  vi.mock('../data/posts/articles/*.md', () => ({
    default: MOCK_MARKDOWN_WITH_HEADERS,
  }));
};
