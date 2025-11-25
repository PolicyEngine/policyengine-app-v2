// Fixtures for Open Graph API tests

export const TEST_FILENAMES = {
  STANDARD: 'uk_income_tax_ni_reforms_2025.md',
  WITH_DOTS: 'analysis.report.2024.md',
  SIMPLE: 'test.md',
} as const;

export const EXPECTED_SLUGS = {
  STANDARD: 'uk-income-tax-ni-reforms-2025',
  WITH_DOTS: 'analysis', // Takes everything before first dot
  SIMPLE: 'test',
} as const;

export const TEST_PATHS = {
  HOMEPAGE: '',
  COUNTRY_US: 'us',
  COUNTRY_UK: 'uk',
  RESEARCH_PAGE: 'us/research',
  TEAM_PAGE: 'us/team',
  DONATE_PAGE: 'uk/donate',
  SUPPORTERS_PAGE: 'us/supporters',
  BLOG_POST: 'uk/research/uk-income-tax-ni-reforms-2025',
  UNKNOWN_PAGE: 'us/unknown-page',
  CALCULATOR: 'us/calculator/12345',
} as const;

export const OG_DEFAULTS = {
  TITLE: 'PolicyEngine',
  DESCRIPTION:
    'Free, open-source tools to understand tax and benefit policies. Calculate your taxes and benefits, or analyze policy reforms.',
  IMAGE: 'https://policyengine.org/assets/logos/policyengine/teal.png',
  SITE_NAME: 'PolicyEngine',
  TWITTER_HANDLE: '@ThePolicyEngine',
} as const;

export const STATIC_PAGE_TITLES = {
  RESEARCH: 'Research',
  TEAM: 'Our Team',
  DONATE: 'Donate',
  SUPPORTERS: 'Our Supporters',
} as const;

// Mock post data for testing
export const MOCK_POST = {
  filename: 'test_post.md',
  title: 'Test Post Title',
  description: 'This is a test post description',
  image: 'test-image.png',
} as const;

export const MOCK_POST_NO_IMAGE = {
  filename: 'no_image_post.md',
  title: 'Post Without Image',
  description: 'This post has no custom image',
} as const;

// HTML content assertions
export const HTML_CONTENT = {
  DOCTYPE: '<!DOCTYPE html>',
  LANG_EN: '<html lang="en">',
  CHARSET: '<meta charset="UTF-8"',
  OG_TYPE_ARTICLE: 'og:type" content="article"',
  OG_TYPE_WEBSITE: 'og:type" content="website"',
  TWITTER_CARD: 'twitter:card" content="summary_large_image"',
} as const;

// Characters that need HTML escaping
export const HTML_ESCAPE_TEST = {
  INPUT: 'Test & <script>alert("xss")</script>',
  EXPECTED_ESCAPED: 'Test &amp; &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
} as const;
