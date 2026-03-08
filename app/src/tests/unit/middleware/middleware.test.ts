import { describe, expect, test } from 'vitest';
import {
  CRAWLER_USER_AGENTS as CRAWLER_MOCKS,
  NON_CRAWLER_USER_AGENTS,
} from '@/tests/fixtures/middleware/crawlerMocks';
import { CRAWLER_USER_AGENTS, isCrawler } from '../../../../../middleware';

describe('middleware', () => {
  describe('CRAWLER_USER_AGENTS', () => {
    test('given crawler list then contains expected social platforms', () => {
      // Then
      expect(CRAWLER_USER_AGENTS).toContain('facebookexternalhit');
      expect(CRAWLER_USER_AGENTS).toContain('Twitterbot');
      expect(CRAWLER_USER_AGENTS).toContain('LinkedInBot');
      expect(CRAWLER_USER_AGENTS).toContain('Slackbot');
      expect(CRAWLER_USER_AGENTS).toContain('Discordbot');
    });
  });

  describe('isCrawler', () => {
    test('given null user agent then returns false', () => {
      // When
      const result = isCrawler(null);

      // Then
      expect(result).toBe(false);
    });

    test('given empty string user agent then returns false', () => {
      // When
      const result = isCrawler('');

      // Then
      expect(result).toBe(false);
    });

    test('given Facebook crawler then returns true', () => {
      // When
      const result = isCrawler(CRAWLER_MOCKS.FACEBOOK);

      // Then
      expect(result).toBe(true);
    });

    test('given Twitter crawler then returns true', () => {
      // When
      const result = isCrawler(CRAWLER_MOCKS.TWITTER);

      // Then
      expect(result).toBe(true);
    });

    test('given LinkedIn crawler then returns true', () => {
      // When
      const result = isCrawler(CRAWLER_MOCKS.LINKEDIN);

      // Then
      expect(result).toBe(true);
    });

    test('given Slack crawler then returns true', () => {
      // When
      const result = isCrawler(CRAWLER_MOCKS.SLACK);

      // Then
      expect(result).toBe(true);
    });

    test('given Discord crawler then returns true', () => {
      // When
      const result = isCrawler(CRAWLER_MOCKS.DISCORD);

      // Then
      expect(result).toBe(true);
    });

    test('given WhatsApp crawler then returns true', () => {
      // When
      const result = isCrawler(CRAWLER_MOCKS.WHATSAPP);

      // Then
      expect(result).toBe(true);
    });

    test('given Telegram crawler then returns true', () => {
      // When
      const result = isCrawler(CRAWLER_MOCKS.TELEGRAM);

      // Then
      expect(result).toBe(true);
    });

    test('given Pinterest crawler then returns true', () => {
      // When
      const result = isCrawler(CRAWLER_MOCKS.PINTEREST);

      // Then
      expect(result).toBe(true);
    });

    test('given Chrome browser then returns false', () => {
      // When
      const result = isCrawler(NON_CRAWLER_USER_AGENTS.CHROME);

      // Then
      expect(result).toBe(false);
    });

    test('given Firefox browser then returns false', () => {
      // When
      const result = isCrawler(NON_CRAWLER_USER_AGENTS.FIREFOX);

      // Then
      expect(result).toBe(false);
    });

    test('given Safari browser then returns false', () => {
      // When
      const result = isCrawler(NON_CRAWLER_USER_AGENTS.SAFARI);

      // Then
      expect(result).toBe(false);
    });

    test('given Googlebot then returns false', () => {
      // When
      const result = isCrawler(NON_CRAWLER_USER_AGENTS.GOOGLEBOT);

      // Then
      expect(result).toBe(false);
    });

    test('given curl then returns false', () => {
      // When
      const result = isCrawler(NON_CRAWLER_USER_AGENTS.CURL);

      // Then
      expect(result).toBe(false);
    });

    test('given case-insensitive match then returns true', () => {
      // When - lowercase version
      const result = isCrawler('TWITTERBOT/1.0');

      // Then
      expect(result).toBe(true);
    });
  });
});
