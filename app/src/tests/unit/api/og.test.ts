import { describe, expect, test } from 'vitest';
import {
  EXPECTED_SLUGS,
  HTML_CONTENT,
  HTML_ESCAPE_TEST,
  OG_DEFAULTS,
  STATIC_PAGE_TITLES,
  TEST_FILENAMES,
} from '@/tests/fixtures/api/ogMocks';
import { DEFAULT_OG, generateOgHtml, getSlugFromFilename, STATIC_PAGES } from '../../../../api/og';

describe('og API', () => {
  describe('getSlugFromFilename', () => {
    test('given standard filename then converts underscores to hyphens and lowercases', () => {
      // When
      const result = getSlugFromFilename(TEST_FILENAMES.STANDARD);

      // Then
      expect(result).toBe(EXPECTED_SLUGS.STANDARD);
    });

    test('given filename with multiple dots then takes content before first dot', () => {
      // When
      const result = getSlugFromFilename(TEST_FILENAMES.WITH_DOTS);

      // Then
      expect(result).toBe(EXPECTED_SLUGS.WITH_DOTS);
    });

    test('given simple filename then returns slug without extension', () => {
      // When
      const result = getSlugFromFilename(TEST_FILENAMES.SIMPLE);

      // Then
      expect(result).toBe(EXPECTED_SLUGS.SIMPLE);
    });

    test('given uppercase filename then returns lowercase slug', () => {
      // When
      const result = getSlugFromFilename('UPPERCASE_FILE.md');

      // Then
      expect(result).toBe('uppercase-file');
    });
  });

  describe('DEFAULT_OG', () => {
    test('given defaults then contains expected values', () => {
      // Then
      expect(DEFAULT_OG.title).toBe(OG_DEFAULTS.TITLE);
      expect(DEFAULT_OG.description).toBe(OG_DEFAULTS.DESCRIPTION);
      expect(DEFAULT_OG.image).toBe(OG_DEFAULTS.IMAGE);
    });
  });

  describe('STATIC_PAGES', () => {
    test('given static pages config then contains research page', () => {
      // Then
      expect(STATIC_PAGES.research).toBeDefined();
      expect(STATIC_PAGES.research.title).toBe(STATIC_PAGE_TITLES.RESEARCH);
    });

    test('given static pages config then contains team page', () => {
      // Then
      expect(STATIC_PAGES.team).toBeDefined();
      expect(STATIC_PAGES.team.title).toBe(STATIC_PAGE_TITLES.TEAM);
    });

    test('given static pages config then contains donate page', () => {
      // Then
      expect(STATIC_PAGES.donate).toBeDefined();
      expect(STATIC_PAGES.donate.title).toBe(STATIC_PAGE_TITLES.DONATE);
    });

    test('given static pages config then contains supporters page', () => {
      // Then
      expect(STATIC_PAGES.supporters).toBeDefined();
      expect(STATIC_PAGES.supporters.title).toBe(STATIC_PAGE_TITLES.SUPPORTERS);
    });
  });

  describe('generateOgHtml', () => {
    test('given valid inputs then returns HTML with DOCTYPE', () => {
      // When
      const html = generateOgHtml(
        'Title',
        'Description',
        'https://example.com/image.png',
        'https://example.com'
      );

      // Then
      expect(html).toContain(HTML_CONTENT.DOCTYPE);
    });

    test('given valid inputs then returns HTML with lang attribute', () => {
      // When
      const html = generateOgHtml(
        'Title',
        'Description',
        'https://example.com/image.png',
        'https://example.com'
      );

      // Then
      expect(html).toContain(HTML_CONTENT.LANG_EN);
    });

    test('given valid inputs then includes og:title meta tag', () => {
      // Given
      const title = 'Test Title';

      // When
      const html = generateOgHtml(
        title,
        'Description',
        'https://example.com/image.png',
        'https://example.com'
      );

      // Then
      expect(html).toContain(`og:title" content="${title}"`);
    });

    test('given valid inputs then includes og:description meta tag', () => {
      // Given
      const description = 'Test Description';

      // When
      const html = generateOgHtml(
        'Title',
        description,
        'https://example.com/image.png',
        'https://example.com'
      );

      // Then
      expect(html).toContain(`og:description" content="${description}"`);
    });

    test('given valid inputs then includes og:image meta tag', () => {
      // Given
      const image = 'https://example.com/test-image.png';

      // When
      const html = generateOgHtml('Title', 'Description', image, 'https://example.com');

      // Then
      expect(html).toContain(`og:image" content="${image}"`);
    });

    test('given valid inputs then includes og:url meta tag', () => {
      // Given
      const url = 'https://example.com/page';

      // When
      const html = generateOgHtml('Title', 'Description', 'https://example.com/image.png', url);

      // Then
      expect(html).toContain(`og:url" content="${url}"`);
    });

    test('given article type then includes og:type article', () => {
      // When
      const html = generateOgHtml(
        'Title',
        'Description',
        'https://example.com/image.png',
        'https://example.com',
        'article'
      );

      // Then
      expect(html).toContain(HTML_CONTENT.OG_TYPE_ARTICLE);
    });

    test('given website type then includes og:type website', () => {
      // When
      const html = generateOgHtml(
        'Title',
        'Description',
        'https://example.com/image.png',
        'https://example.com',
        'website'
      );

      // Then
      expect(html).toContain(HTML_CONTENT.OG_TYPE_WEBSITE);
    });

    test('given no type then defaults to article', () => {
      // When
      const html = generateOgHtml(
        'Title',
        'Description',
        'https://example.com/image.png',
        'https://example.com'
      );

      // Then
      expect(html).toContain(HTML_CONTENT.OG_TYPE_ARTICLE);
    });

    test('given valid inputs then includes Twitter card tags', () => {
      // When
      const html = generateOgHtml(
        'Title',
        'Description',
        'https://example.com/image.png',
        'https://example.com'
      );

      // Then
      expect(html).toContain(HTML_CONTENT.TWITTER_CARD);
      expect(html).toContain('twitter:site" content="@ThePolicyEngine"');
      expect(html).toContain('twitter:title');
      expect(html).toContain('twitter:description');
      expect(html).toContain('twitter:image');
    });

    test('given valid inputs then includes site name', () => {
      // When
      const html = generateOgHtml(
        'Title',
        'Description',
        'https://example.com/image.png',
        'https://example.com'
      );

      // Then
      expect(html).toContain('og:site_name" content="PolicyEngine"');
    });

    test('given HTML special characters in title then escapes them', () => {
      // Given
      const title = HTML_ESCAPE_TEST.INPUT;

      // When
      const html = generateOgHtml(
        title,
        'Description',
        'https://example.com/image.png',
        'https://example.com'
      );

      // Then
      expect(html).toContain(HTML_ESCAPE_TEST.EXPECTED_ESCAPED);
      expect(html).not.toContain('<script>');
    });

    test('given HTML special characters in description then escapes them', () => {
      // Given
      const description = HTML_ESCAPE_TEST.INPUT;

      // When
      const html = generateOgHtml(
        'Title',
        description,
        'https://example.com/image.png',
        'https://example.com'
      );

      // Then
      expect(html).toContain(HTML_ESCAPE_TEST.EXPECTED_ESCAPED);
    });

    test('given valid inputs then includes visible title in body', () => {
      // Given
      const title = 'Visible Title';

      // When
      const html = generateOgHtml(
        title,
        'Description',
        'https://example.com/image.png',
        'https://example.com'
      );

      // Then
      expect(html).toContain(`<h1>${title}</h1>`);
    });

    test('given valid inputs then includes link to page in body', () => {
      // Given
      const url = 'https://example.com/page';

      // When
      const html = generateOgHtml('Title', 'Description', 'https://example.com/image.png', url);

      // Then
      expect(html).toContain(`<a href="${url}">View on PolicyEngine</a>`);
    });
  });
});
