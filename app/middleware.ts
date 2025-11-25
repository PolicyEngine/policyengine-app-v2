// Vercel Edge Middleware for social media preview support
// This intercepts requests from social media crawlers and returns proper OG tags

// Crawler user agents that need OG tags
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Pinterest',
  'Slackbot',
  'TelegramBot',
  'WhatsApp',
  'Discordbot',
];

// Check if request is from a social media crawler
function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) {
    return false;
  }
  return CRAWLER_USER_AGENTS.some((crawler) =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

export const config = {
  matcher: ['/:countryId/:path*', '/:countryId'],
};

export default async function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent');

  // Only intercept crawler requests
  if (!isCrawler(userAgent)) {
    return;
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // Rewrite to OG API endpoint
  const ogUrl = new URL(`/api/og`, url.origin);
  ogUrl.searchParams.set('path', pathname);

  // Fetch from the OG API
  const response = await fetch(ogUrl.toString());
  return response;
}
