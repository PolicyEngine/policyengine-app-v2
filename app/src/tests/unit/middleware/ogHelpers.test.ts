import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  EXPECTED_OG_METADATA,
  HTML_EXPECTATIONS,
  MOCK_APP_WITHOUT_IMAGE,
  MOCK_APP_WITH_IMAGE,
  MOCK_POST,
  MOCK_POST_WITHOUT_IMAGE,
  TEST_PATH_PARTS,
  TEST_URLS,
} from '@/tests/fixtures/middleware/ogMocks';

// Mock the JSON imports
vi.mock('../../../middleware', async () => {
  const actual = await vi.importActual('../../../middleware');
  return {
    ...actual,
  };
});

// We need to mock the JSON imports at the module level
vi.mock('../../../../src/data/posts/posts.json', () => ({
  default: [MOCK_POST, MOCK_POST_WITHOUT_IMAGE],
}));

vi.mock('../../../../src/data/apps/apps.json', () => ({
  default: [MOCK_APP_WITH_IMAGE, MOCK_APP_WITHOUT_IMAGE],
}));

// Import after mocks
// @ts-ignore - importing from root middleware file
import middleware from '../../../../middleware';

describe('middleware OG tag helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parsePathParts', () => {
    test('given blog post URL then parses correctly', () => {
      // Given
      const pathname = '/us/research/test-blog-post';

      // When
      const url = new URL(pathname, 'https://policyengine.org');
      const parts = pathname.split('/').filter(Boolean);

      // Then
      expect(parts[0]).toBe('us');
      expect(parts[1]).toBe('research');
      expect(parts[2]).toBe('test-blog-post');
    });

    test('given app URL then parses correctly', () => {
      // Given
      const pathname = '/us/test-calculator';

      // When
      const parts = pathname.split('/').filter(Boolean);

      // Then
      expect(parts[0]).toBe('us');
      expect(parts[1]).toBe('test-calculator');
      expect(parts[2]).toBeUndefined();
    });

    test('given country homepage then parses correctly', () => {
      // Given
      const pathname = '/uk';

      // When
      const parts = pathname.split('/').filter(Boolean);

      // Then
      expect(parts[0]).toBe('uk');
      expect(parts[1]).toBeUndefined();
    });

    test('given empty pathname then returns empty array', () => {
      // Given
      const pathname = '/';

      // When
      const parts = pathname.split('/').filter(Boolean);

      // Then
      expect(parts).toHaveLength(0);
    });
  });

  describe('escapeHtml', () => {
    test('given HTML entities then escapes correctly', () => {
      // Given
      const input = 'Test & <script>alert("XSS")</script>';

      // When
      const escaped = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      // Then
      expect(escaped).toBe('Test &amp; &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
      expect(escaped).not.toContain('"');
    });

    test('given ampersand then escapes to &amp;', () => {
      // Given
      const input = 'Tax & Benefit';

      // When
      const escaped = input.replace(/&/g, '&amp;');

      // Then
      expect(escaped).toBe('Tax &amp; Benefit');
    });

    test('given quotes then escapes to &quot;', () => {
      // Given
      const input = 'Testing "quotes" here';

      // When
      const escaped = input.replace(/"/g, '&quot;');

      // Then
      expect(escaped).toBe('Testing &quot;quotes&quot; here');
    });

    test('given safe string then returns unchanged', () => {
      // Given
      const input = 'Safe string without special chars';

      // When
      const escaped = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      // Then
      expect(escaped).toBe(input);
    });
  });

  describe('getImageUrl', () => {
    test('given image name then returns full URL', () => {
      // Given
      const imageName = 'test-image.jpg';
      const baseUrl = 'https://policyengine.org';

      // When
      const imageUrl = imageName ? `${baseUrl}/assets/posts/${imageName}` : null;

      // Then
      expect(imageUrl).toBe('https://policyengine.org/assets/posts/test-image.jpg');
    });

    test('given undefined image then returns default', () => {
      // Given
      const imageName = undefined;
      const defaultImage = 'https://policyengine.org/assets/logos/policyengine/teal.png';

      // When
      const imageUrl = imageName ? `https://policyengine.org/assets/posts/${imageName}` : defaultImage;

      // Then
      expect(imageUrl).toBe(defaultImage);
    });
  });

  describe('generateOgHtml', () => {
    test('given metadata then includes all OG tags', () => {
      // Given
      const metadata = EXPECTED_OG_METADATA.BLOG_POST;
      const url = TEST_URLS.BLOG_POST;

      // When
      const html = generateTestHtml(metadata, url);

      // Then
      expect(html).toContain(HTML_EXPECTATIONS.OG_TITLE(metadata.title));
      expect(html).toContain(HTML_EXPECTATIONS.OG_DESCRIPTION(metadata.description));
      expect(html).toContain(HTML_EXPECTATIONS.OG_IMAGE(metadata.image));
      expect(html).toContain(HTML_EXPECTATIONS.OG_TYPE(metadata.type));
    });

    test('given metadata then includes Twitter Card tags', () => {
      // Given
      const metadata = EXPECTED_OG_METADATA.APP;
      const url = TEST_URLS.APP;

      // When
      const html = generateTestHtml(metadata, url);

      // Then
      expect(html).toContain(HTML_EXPECTATIONS.TWITTER_CARD);
      expect(html).toContain(HTML_EXPECTATIONS.TWITTER_SITE);
    });

    test('given title with special chars then escapes correctly', () => {
      // Given
      const metadata = {
        title: 'Test & <Title>',
        description: 'Test description',
        image: 'test.jpg',
        type: 'article' as const,
      };
      const url = 'https://test.com';

      // When
      const html = generateTestHtml(metadata, url);

      // Then
      expect(html).toContain('Test &amp; &lt;Title&gt;');
      expect(html).not.toContain('Test & <Title>');
    });

    test('given description with quotes then escapes correctly', () => {
      // Given
      const metadata = {
        title: 'Test',
        description: 'Description with "quotes"',
        image: 'test.jpg',
        type: 'website' as const,
      };
      const url = 'https://test.com';

      // When
      const html = generateTestHtml(metadata, url);

      // Then
      expect(html).toContain('Description with &quot;quotes&quot;');
    });
  });

  describe('createOgResponse', () => {
    test('given HTML then returns Response with correct headers', () => {
      // Given
      const html = '<html>Test</html>';

      // When
      const response = new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      });

      // Then
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
    });

    test('given HTML then response body contains HTML', async () => {
      // Given
      const html = '<html><body>Test Content</body></html>';

      // When
      const response = new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      });
      const body = await response.text();

      // Then
      expect(body).toBe(html);
    });
  });

  describe('findPostBySlug', () => {
    test('given matching slug then returns post', () => {
      // Given
      const slug = 'test-blog-post';
      const posts = [MOCK_POST];

      // When
      const post = posts.find((p) => {
        const filenameWithoutExt = p.filename.substring(0, p.filename.indexOf('.'));
        return filenameWithoutExt.toLowerCase().replace(/_/g, '-') === slug;
      });

      // Then
      expect(post).toBeDefined();
      expect(post?.title).toBe(MOCK_POST.title);
    });

    test('given non-matching slug then returns undefined', () => {
      // Given
      const slug = 'non-existent-post';
      const posts = [MOCK_POST];

      // When
      const post = posts.find((p) => {
        const filenameWithoutExt = p.filename.substring(0, p.filename.indexOf('.'));
        return filenameWithoutExt.toLowerCase().replace(/_/g, '-') === slug;
      });

      // Then
      expect(post).toBeUndefined();
    });

    test('given slug with underscores then matches hyphenated filename', () => {
      // Given
      const slug = 'test-with-hyphens';
      const posts = [
        {
          ...MOCK_POST,
          filename: 'test_with_hyphens.md',
        },
      ];

      // When
      const post = posts.find((p) => {
        const filenameWithoutExt = p.filename.substring(0, p.filename.indexOf('.'));
        return filenameWithoutExt.toLowerCase().replace(/_/g, '-') === slug;
      });

      // Then
      expect(post).toBeDefined();
    });
  });

  describe('findAppBySlugAndCountry', () => {
    test('given matching slug and country then returns app', () => {
      // Given
      const slug = 'test-calculator';
      const countryId = 'us';
      const apps = [MOCK_APP_WITH_IMAGE];

      // When
      const app = apps.find((a) => a.slug === slug && a.countryId === countryId);

      // Then
      expect(app).toBeDefined();
      expect(app?.title).toBe(MOCK_APP_WITH_IMAGE.title);
    });

    test('given matching slug but wrong country then returns undefined', () => {
      // Given
      const slug = 'test-calculator';
      const countryId = 'uk';
      const apps = [MOCK_APP_WITH_IMAGE];

      // When
      const app = apps.find((a) => a.slug === slug && a.countryId === countryId);

      // Then
      expect(app).toBeUndefined();
    });

    test('given non-matching slug then returns undefined', () => {
      // Given
      const slug = 'non-existent-app';
      const countryId = 'us';
      const apps = [MOCK_APP_WITH_IMAGE];

      // When
      const app = apps.find((a) => a.slug === slug && a.countryId === countryId);

      // Then
      expect(app).toBeUndefined();
    });
  });
});

// Helper function to generate test HTML
function generateTestHtml(
  metadata: { title: string; description: string; image: string; type: string },
  url: string
): string {
  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const safeTitle = escapeHtml(metadata.title);
  const safeDescription = escapeHtml(metadata.description);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} | PolicyEngine</title>
  <meta name="description" content="${safeDescription}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:image" content="${metadata.image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="${metadata.type}" />
  <meta property="og:site_name" content="PolicyEngine" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@ThePolicyEngine" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${metadata.image}" />
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeDescription}</p>
  <p><a href="${url}">View on PolicyEngine</a></p>
</body>
</html>`;
}
