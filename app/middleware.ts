// Vercel Edge Middleware for social media preview support
// This intercepts requests from social media crawlers and returns proper OG tags

import postsData from './src/data/posts/posts.json';

// Crawler user agents that need OG tags
export const CRAWLER_USER_AGENTS = [
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
export function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) {
    return false;
  }
  return CRAWLER_USER_AGENTS.some((crawler) =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

// Default OG tags
const DEFAULT_OG = {
  title: 'PolicyEngine',
  description:
    'Free, open-source tools to understand tax and benefit policies. Calculate your taxes and benefits, or analyze policy reforms.',
  image: 'https://policyengine.org/assets/logos/policyengine/teal.png',
};

// Static page OG configs
const STATIC_PAGES: Record<string, { title: string; description: string }> = {
  research: {
    title: 'Research',
    description: 'Policy analysis and research from PolicyEngine.',
  },
  team: {
    title: 'Our Team',
    description: "Meet the team behind PolicyEngine's tax and benefit policy tools.",
  },
  donate: {
    title: 'Donate',
    description:
      'Support PolicyEngine in building free, open-source tools for tax and benefit policy analysis.',
  },
  supporters: {
    title: 'Our Supporters',
    description: 'Organizations and individuals supporting PolicyEngine.',
  },
};

// Generate HTML with Open Graph meta tags
function generateOgHtml(
  title: string,
  description: string,
  image: string,
  url: string,
  type: string = 'article'
): string {
  const siteName = 'PolicyEngine';
  const twitterHandle = '@ThePolicyEngine';

  // Escape HTML entities
  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} | ${siteName}</title>
  <meta name="description" content="${safeDescription}" />

  <!-- Open Graph -->
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="${type}" />
  <meta property="og:site_name" content="${siteName}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="${twitterHandle}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <meta name="twitter:image" content="${image}" />
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${safeDescription}</p>
  <p><a href="${url}">View on PolicyEngine</a></p>
</body>
</html>`;
}

export const config = {
  matcher: ['/:countryId/:path*', '/:countryId'],
};

export default async function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent');

  // Only intercept crawler requests
  if (!isCrawler(userAgent)) {
    // Return undefined to continue to the next handler
    return;
  }

  const url = new URL(request.url);
  const pathname = url.pathname;
  const pathParts = pathname.split('/').filter(Boolean);

  if (pathParts.length < 1) {
    return;
  }

  const countryId = pathParts[0];
  const section = pathParts[1];
  const slug = pathParts[2];

  const baseUrl = 'https://policyengine.org';
  const fullUrl = `${baseUrl}${pathname}`;

  let html: string;

  // Blog post: /:countryId/research/:slug
  if (section === 'research' && slug) {
    // For blog posts, use imported post data
    const post = postsData.find((p: { filename: string }) => {
      const filenameWithoutExt = p.filename.substring(0, p.filename.indexOf('.'));
      return filenameWithoutExt.toLowerCase().replace(/_/g, '-') === slug;
    });

    if (post) {
      const imageUrl = post.image ? `${baseUrl}/assets/posts/${post.image}` : DEFAULT_OG.image;
      html = generateOgHtml(post.title, post.description, imageUrl, fullUrl, 'article');
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  }

  // Static pages
  const staticPage = STATIC_PAGES[section];
  if (staticPage && !slug) {
    html = generateOgHtml(
      staticPage.title,
      staticPage.description,
      DEFAULT_OG.image,
      fullUrl,
      'website'
    );
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Country homepage
  if (pathParts.length === 1) {
    const countryName =
      countryId === 'uk' ? 'UK' : countryId === 'us' ? 'US' : countryId.toUpperCase();
    html = generateOgHtml(
      `PolicyEngine ${countryName}`,
      DEFAULT_OG.description,
      DEFAULT_OG.image,
      fullUrl,
      'website'
    );
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // For other pages, let them pass through
}
