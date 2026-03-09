import { describe, expect, test } from 'vitest';
import {
  CRAWLER_USER_AGENTS as CRAWLER_MOCKS,
  LLM_BOT_USER_AGENTS,
  NON_CRAWLER_USER_AGENTS,
} from '@/tests/fixtures/middleware/crawlerMocks';
import {
  CRAWLER_USER_AGENTS,
  isCrawler,
  isLLMBot,
  LLM_USER_AGENTS,
} from '../../../../../middleware';

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

  describe('LLM_USER_AGENTS', () => {
    test('given LLM bot list then contains expected AI agents', () => {
      // Then
      expect(LLM_USER_AGENTS).toContain('GPTBot');
      expect(LLM_USER_AGENTS).toContain('ChatGPT-User');
      expect(LLM_USER_AGENTS).toContain('anthropic-ai');
      expect(LLM_USER_AGENTS).toContain('Claude-Web');
      expect(LLM_USER_AGENTS).toContain('PerplexityBot');
      expect(LLM_USER_AGENTS).toContain('CCBot');
      expect(LLM_USER_AGENTS).toContain('cohere-ai');
      expect(LLM_USER_AGENTS).toContain('Google-Extended');
      expect(LLM_USER_AGENTS).toContain('Bytespider');
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

  describe('isLLMBot', () => {
    test('given null user agent then returns false', () => {
      // When
      const result = isLLMBot(null);

      // Then
      expect(result).toBe(false);
    });

    test('given empty string user agent then returns false', () => {
      // When
      const result = isLLMBot('');

      // Then
      expect(result).toBe(false);
    });

    test('given GPTBot then returns true', () => {
      // When
      const result = isLLMBot(LLM_BOT_USER_AGENTS.GPTBOT);

      // Then
      expect(result).toBe(true);
    });

    test('given ChatGPT-User then returns true', () => {
      // When
      const result = isLLMBot(LLM_BOT_USER_AGENTS.CHATGPT_USER);

      // Then
      expect(result).toBe(true);
    });

    test('given CCBot then returns true', () => {
      // When
      const result = isLLMBot(LLM_BOT_USER_AGENTS.CCBOT);

      // Then
      expect(result).toBe(true);
    });

    test('given anthropic-ai then returns true', () => {
      // When
      const result = isLLMBot(LLM_BOT_USER_AGENTS.ANTHROPIC);

      // Then
      expect(result).toBe(true);
    });

    test('given Claude-Web then returns true', () => {
      // When
      const result = isLLMBot(LLM_BOT_USER_AGENTS.CLAUDE_WEB);

      // Then
      expect(result).toBe(true);
    });

    test('given PerplexityBot then returns true', () => {
      // When
      const result = isLLMBot(LLM_BOT_USER_AGENTS.PERPLEXITY);

      // Then
      expect(result).toBe(true);
    });

    test('given cohere-ai then returns true', () => {
      // When
      const result = isLLMBot(LLM_BOT_USER_AGENTS.COHERE);

      // Then
      expect(result).toBe(true);
    });

    test('given Chrome browser then returns false', () => {
      // When
      const result = isLLMBot(NON_CRAWLER_USER_AGENTS.CHROME);

      // Then
      expect(result).toBe(false);
    });

    test('given social media crawler then returns false', () => {
      // When
      const result = isLLMBot(CRAWLER_MOCKS.FACEBOOK);

      // Then
      expect(result).toBe(false);
    });

    test('given case-insensitive match then returns true', () => {
      // When
      const result = isLLMBot('GPTBOT/1.0');

      // Then
      expect(result).toBe(true);
    });
  });
});
