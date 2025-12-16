import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CRAWLER_USER_AGENTS } from '@/tests/fixtures/middleware/crawlerMocks';
import {
  MOCK_APP_WITH_IMAGE,
  MOCK_APP_WITHOUT_IMAGE,
  MOCK_POST,
  MOCK_POST_WITHOUT_IMAGE,
  TEST_URLS,
} from '@/tests/fixtures/middleware/ogMocks';
// Import after mocks
// @ts-ignore - importing from root middleware file
import middleware from '../../../../middleware';

// Mock the JSON imports
vi.mock('../../../../src/data/posts/posts.json', () => ({
  default: [MOCK_POST, MOCK_POST_WITHOUT_IMAGE],
}));

vi.mock('../../../../src/data/apps/apps.json', () => ({
  default: [MOCK_APP_WITH_IMAGE, MOCK_APP_WITHOUT_IMAGE],
}));

describe('middleware route handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleBlogPost', () => {
    test('given valid blog post route then returns OG response', async () => {
      // Given
      const request = new Request(TEST_URLS.BLOG_POST, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.FACEBOOK },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeDefined();
      expect(response?.status).toBe(200);
      expect(response?.headers.get('Content-Type')).toBe('text/html');
    });

    test('given blog post route then response contains post title', async () => {
      // Given
      const request = new Request(TEST_URLS.BLOG_POST, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.TWITTER },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain(MOCK_POST.title);
    });

    test('given blog post route then response contains post description', async () => {
      // Given
      const request = new Request(TEST_URLS.BLOG_POST, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.LINKEDIN },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain(MOCK_POST.description);
    });

    test('given blog post route then response contains custom image', async () => {
      // Given
      const request = new Request(TEST_URLS.BLOG_POST, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.SLACK },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('test-post-image.jpg');
      expect(html).toContain('/assets/posts/');
    });

    test('given blog post route then OG type is article', async () => {
      // Given
      const request = new Request(TEST_URLS.BLOG_POST, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.FACEBOOK },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('og:type" content="article"');
    });

    test('given non-existent blog post then passes through', async () => {
      // Given
      const request = new Request('https://policyengine.org/us/research/non-existent-post', {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.FACEBOOK },
      });

      // When
      const response = await middleware(request);

      // Then - Should pass through (return undefined or null)
      expect(response).toBeFalsy();
    });
  });

  describe('handleApp', () => {
    test('given valid app route then returns OG response', async () => {
      // Given
      const request = new Request(TEST_URLS.APP, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.TWITTER },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeDefined();
      expect(response?.status).toBe(200);
    });

    test('given app route then response contains app title', async () => {
      // Given
      const request = new Request(TEST_URLS.APP, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.FACEBOOK },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain(MOCK_APP_WITH_IMAGE.title);
    });

    test('given app route then response contains app description', async () => {
      // Given
      const request = new Request(TEST_URLS.APP, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.LINKEDIN },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain(MOCK_APP_WITH_IMAGE.description);
    });

    test('given app with image then response contains custom image', async () => {
      // Given
      const request = new Request(TEST_URLS.APP, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.SLACK },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('test-app-image.jpg');
    });

    test('given app route then OG type is website', async () => {
      // Given
      const request = new Request(TEST_URLS.APP, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.DISCORD },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('og:type" content="website"');
    });

    test('given app without image then uses default image', async () => {
      // Given
      const request = new Request('https://policyengine.org/uk/simple-calc', {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.FACEBOOK },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('assets/logos/policyengine/teal.png');
    });

    test('given non-existent app then passes through', async () => {
      // Given
      const request = new Request('https://policyengine.org/us/non-existent-app', {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.TWITTER },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeFalsy();
    });

    test('given app with wrong country then passes through', async () => {
      // Given - test-calculator is US only
      const request = new Request('https://policyengine.org/uk/test-calculator', {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.FACEBOOK },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeFalsy();
    });
  });

  describe('handleStaticPage', () => {
    test('given research page then returns OG response', async () => {
      // Given
      const request = new Request(TEST_URLS.STATIC_PAGE, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.LINKEDIN },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeDefined();
      expect(response?.status).toBe(200);
    });

    test('given research page then response contains research title', async () => {
      // Given
      const request = new Request(TEST_URLS.STATIC_PAGE, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.FACEBOOK },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('Research');
    });

    test('given team page then response contains team title', async () => {
      // Given
      const request = new Request('https://policyengine.org/us/team', {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.TWITTER },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('Our Team');
    });

    test('given static page then uses default image', async () => {
      // Given
      const request = new Request(TEST_URLS.STATIC_PAGE, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.SLACK },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('assets/logos/policyengine/teal.png');
    });

    test('given static page then OG type is website', async () => {
      // Given
      const request = new Request(TEST_URLS.STATIC_PAGE, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.DISCORD },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('og:type" content="website"');
    });
  });

  describe('handleCountryHomepage', () => {
    test('given US homepage then returns OG response', async () => {
      // Given
      const request = new Request(TEST_URLS.COUNTRY_HOME_US, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.FACEBOOK },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeDefined();
      expect(response?.status).toBe(200);
    });

    test('given US homepage then response contains US in title', async () => {
      // Given
      const request = new Request(TEST_URLS.COUNTRY_HOME_US, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.TWITTER },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('PolicyEngine US');
    });

    test('given UK homepage then response contains UK in title', async () => {
      // Given
      const request = new Request(TEST_URLS.COUNTRY_HOME_UK, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.LINKEDIN },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('PolicyEngine UK');
    });

    test('given country homepage then uses default image', async () => {
      // Given
      const request = new Request(TEST_URLS.COUNTRY_HOME_US, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.SLACK },
      });

      // When
      const response = await middleware(request);
      const html = await response?.text();

      // Then
      expect(html).toContain('assets/logos/policyengine/teal.png');
    });
  });

  describe('middleware main handler', () => {
    test('given non-crawler user agent then passes through', async () => {
      // Given
      const request = new Request(TEST_URLS.BLOG_POST, {
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/119.0' },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeUndefined();
    });

    test('given no user agent then passes through', async () => {
      // Given
      const request = new Request(TEST_URLS.BLOG_POST);

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeUndefined();
    });

    test('given root path then passes through', async () => {
      // Given
      const request = new Request('https://policyengine.org/', {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.FACEBOOK },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response).toBeUndefined();
    });

    test('given cache control header then has correct max-age', async () => {
      // Given
      const request = new Request(TEST_URLS.BLOG_POST, {
        headers: { 'User-Agent': CRAWLER_USER_AGENTS.TWITTER },
      });

      // When
      const response = await middleware(request);

      // Then
      expect(response?.headers.get('Cache-Control')).toBe('public, max-age=3600');
    });
  });
});
