// Fixtures for OG tag middleware tests

// Mock post data
export const MOCK_POST = {
  title: 'Test Blog Post Title',
  description: 'This is a test blog post description for testing OG tags.',
  filename: 'test-blog-post.md',
  image: 'test-post-image.jpg',
  date: '2025-01-15',
  authors: ['test-author'],
  tags: ['us', 'policy', 'featured'],
};

export const MOCK_POST_WITHOUT_IMAGE = {
  title: 'Post Without Image',
  description: 'Testing fallback to default image.',
  filename: 'post-without-image.md',
  image: undefined,
  date: '2025-01-16',
  authors: ['test-author'],
  tags: ['uk', 'policy'],
};

// Mock app data
export const MOCK_APP_WITH_IMAGE = {
  slug: 'test-calculator',
  title: 'Test Calculator',
  description: 'A test calculator for testing purposes.',
  source: 'https://test-calculator.vercel.app',
  countryId: 'us',
  tags: ['us', 'featured'],
  image: 'test-app-image.jpg',
  displayWithResearch: true,
  date: '2025-01-17',
  authors: ['test-author'],
};

export const MOCK_APP_WITHOUT_IMAGE = {
  slug: 'simple-calc',
  title: 'Simple Calculator',
  description: 'A simple calculator without an image.',
  source: 'https://simple-calc.streamlit.app',
  countryId: 'uk',
  tags: ['uk', 'policy'],
};

// Path parts for testing
export const TEST_PATH_PARTS = {
  BLOG_POST: {
    countryId: 'us',
    section: 'research',
    slug: 'test-blog-post',
  },
  APP: {
    countryId: 'us',
    section: 'test-calculator',
    slug: undefined,
  },
  STATIC_PAGE: {
    countryId: 'uk',
    section: 'research',
    slug: undefined,
  },
  COUNTRY_HOME: {
    countryId: 'us',
    section: undefined,
    slug: undefined,
  },
  INVALID_APP: {
    countryId: 'us',
    section: 'non-existent-app',
    slug: undefined,
  },
} as const;

// Expected OG metadata
export const EXPECTED_OG_METADATA = {
  BLOG_POST: {
    title: MOCK_POST.title,
    description: MOCK_POST.description,
    image: 'https://policyengine.org/assets/posts/test-post-image.jpg',
    type: 'article' as const,
  },
  APP: {
    title: MOCK_APP_WITH_IMAGE.title,
    description: MOCK_APP_WITH_IMAGE.description,
    image: 'https://policyengine.org/assets/posts/test-app-image.jpg',
    type: 'website' as const,
  },
  DEFAULT_IMAGE: 'https://policyengine.org/assets/logos/policyengine/teal.png',
} as const;

// Test URLs
export const TEST_URLS = {
  BLOG_POST: 'https://policyengine.org/us/research/test-blog-post',
  APP: 'https://policyengine.org/us/test-calculator',
  STATIC_PAGE: 'https://policyengine.org/uk/research',
  COUNTRY_HOME_US: 'https://policyengine.org/us',
  COUNTRY_HOME_UK: 'https://policyengine.org/uk',
} as const;

// HTML content expectations
export const HTML_EXPECTATIONS = {
  OG_TITLE: (title: string) => `<meta property="og:title" content="${title}"`,
  OG_DESCRIPTION: (desc: string) => `<meta property="og:description" content="${desc}"`,
  OG_IMAGE: (url: string) => `<meta property="og:image" content="${url}"`,
  OG_TYPE: (type: string) => `<meta property="og:type" content="${type}"`,
  TWITTER_CARD: '<meta name="twitter:card" content="summary_large_image"',
  TWITTER_SITE: '<meta name="twitter:site" content="@ThePolicyEngine"',
} as const;
