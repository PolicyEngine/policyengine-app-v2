// Fixtures for social media crawler detection tests

// Known crawler user agents
export const CRAWLER_USER_AGENTS = {
  FACEBOOK: 'facebookexternalhit/1.1',
  FACEBOT: 'Facebot/1.0',
  TWITTER: 'Twitterbot/1.0',
  LINKEDIN: 'LinkedInBot/1.0',
  PINTEREST: 'Pinterest/0.2',
  SLACK: 'Slackbot-LinkExpanding 1.0',
  TELEGRAM: 'TelegramBot (like TwitterBot)',
  WHATSAPP: 'WhatsApp/2.21.4.22',
  DISCORD: 'Discordbot/2.0',
} as const;

// Non-crawler user agents (should NOT be detected as crawlers)
export const NON_CRAWLER_USER_AGENTS = {
  CHROME:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  FIREFOX: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
  SAFARI:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  EDGE: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
  GOOGLEBOT: 'Googlebot/2.1 (+http://www.google.com/bot.html)', // Search bot, not social
  BINGBOT: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  CURL: 'curl/7.88.1',
  EMPTY: '',
} as const;

// Test request URLs
export const TEST_URLS = {
  BLOG_POST: 'https://policyengine.org/uk/research/uk-income-tax-ni-reforms-2025',
  RESEARCH_PAGE: 'https://policyengine.org/us/research',
  TEAM_PAGE: 'https://policyengine.org/us/team',
  DONATE_PAGE: 'https://policyengine.org/uk/donate',
  COUNTRY_HOME_US: 'https://policyengine.org/us',
  COUNTRY_HOME_UK: 'https://policyengine.org/uk',
  HOME: 'https://policyengine.org',
} as const;
