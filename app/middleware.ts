// Vercel Edge Middleware for social media preview support
// This intercepts requests from social media crawlers and returns proper OG tags

import appsData from './src/data/apps/apps.json';
import postsData from './src/data/posts/posts.json';

// Types
type PathParts = {
  countryId: string;
  section?: string;
  slug?: string;
};

type OgMetadata = {
  title: string;
  description: string;
  image: string;
  type: 'article' | 'website';
};

// Constants
const BASE_URL = 'https://policyengine.org';

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

// Search engine bots that render JS — proxy tracker HTML so they see
// canonical policyengine.org URLs, structured data, and sitemap references
const SEARCH_ENGINE_BOTS = ['Googlebot', 'bingbot', 'Baiduspider', 'YandexBot', 'DuckDuckBot'];

function isSearchEngine(userAgent: string | null): boolean {
  if (!userAgent) {
    return false;
  }
  return SEARCH_ENGINE_BOTS.some((bot) => userAgent.includes(bot));
}

const TRACKER_PREFIX = '/us/state-legislative-tracker';
const TRACKER_MODAL_ORIGIN = 'https://policyengine--state-legislative-tracker.modal.run';

const DEFAULT_OG = {
  title: 'PolicyEngine',
  description:
    'Free, open-source tools to understand tax and benefit policies. Calculate your taxes and benefits, or analyze policy reforms.',
  image: 'https://policyengine.org/assets/logos/policyengine/teal.png',
};

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

// Helper functions
export function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) {
    return false;
  }
  return CRAWLER_USER_AGENTS.some((crawler) =>
    userAgent.toLowerCase().includes(crawler.toLowerCase())
  );
}

function parsePathParts(pathname: string): PathParts | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length < 1) {
    return null;
  }

  return {
    countryId: parts[0],
    section: parts[1],
    slug: parts[2],
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function generateOgHtml(metadata: OgMetadata, url: string): string {
  const siteName = 'PolicyEngine';
  const twitterHandle = '@ThePolicyEngine';
  const safeTitle = escapeHtml(metadata.title);
  const safeDescription = escapeHtml(metadata.description);

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
  <meta property="og:image" content="${metadata.image}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="${metadata.type}" />
  <meta property="og:site_name" content="${siteName}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="${twitterHandle}" />
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

function createOgResponse(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

function getImageUrl(imageName: string | undefined): string {
  if (!imageName) {
    return DEFAULT_OG.image;
  }
  return imageName.startsWith('http') ? imageName : `${BASE_URL}/assets/posts/${imageName}`;
}

// Content handlers
function findPostBySlug(slug: string): any {
  return postsData.find((p: { filename: string }) => {
    const filenameWithoutExt = p.filename.substring(0, p.filename.indexOf('.'));
    return filenameWithoutExt.toLowerCase().replace(/_/g, '-') === slug;
  });
}

function findAppBySlugAndCountry(slug: string, countryId: string): any {
  return appsData.find(
    (a: { slug: string; countryId: string }) => a.slug === slug && a.countryId === countryId
  );
}

function handleBlogPost(parts: PathParts, fullUrl: string): Response | null {
  if (parts.section !== 'research' || !parts.slug) {
    return null;
  }

  const post = findPostBySlug(parts.slug);
  if (!post) {
    return null;
  }

  const metadata: OgMetadata = {
    title: post.title,
    description: post.description,
    image: getImageUrl(post.image),
    type: 'article',
  };

  return createOgResponse(generateOgHtml(metadata, fullUrl));
}

function handleApp(parts: PathParts, fullUrl: string): Response | null {
  if (!parts.section || parts.slug) {
    return null;
  }
  if (STATIC_PAGES[parts.section]) {
    return null;
  }

  const app = findAppBySlugAndCountry(parts.section, parts.countryId);
  if (!app) {
    return null;
  }

  const metadata: OgMetadata = {
    title: app.title,
    description: app.description,
    image: getImageUrl(app.image),
    type: 'website',
  };

  return createOgResponse(generateOgHtml(metadata, fullUrl));
}

function handleStaticPage(parts: PathParts, fullUrl: string): Response | null {
  if (!parts.section || parts.slug) {
    return null;
  }

  const staticPage = STATIC_PAGES[parts.section];
  if (!staticPage) {
    return null;
  }

  const metadata: OgMetadata = {
    title: staticPage.title,
    description: staticPage.description,
    image: DEFAULT_OG.image,
    type: 'website',
  };

  return createOgResponse(generateOgHtml(metadata, fullUrl));
}

function handleCountryHomepage(parts: PathParts, fullUrl: string): Response | null {
  if (parts.section) {
    return null;
  }

  const countryName =
    parts.countryId === 'uk'
      ? 'UK'
      : parts.countryId === 'us'
        ? 'US'
        : parts.countryId.toUpperCase();

  const metadata: OgMetadata = {
    title: `PolicyEngine ${countryName}`,
    description: DEFAULT_OG.description,
    image: DEFAULT_OG.image,
    type: 'website',
  };

  return createOgResponse(generateOgHtml(metadata, fullUrl));
}

// Middleware config and main handler
export const config = {
  matcher: ['/:countryId/:path*', '/:countryId'],
};

export default async function middleware(request: Request) {
  const userAgent = request.headers.get('user-agent');
  const url = new URL(request.url);

  // State legislative tracker: proxy crawlers to Modal for SEO
  // (pre-rendered HTML with canonical policyengine.org URLs, structured data, sitemap)
  // Regular users fall through to the catch-all rewrite → website.html → iframe
  if (url.pathname.startsWith(TRACKER_PREFIX)) {
    if (isCrawler(userAgent) || isSearchEngine(userAgent)) {
      const trackerPath = url.pathname.slice(TRACKER_PREFIX.length) || '/';
      const modalUrl = `${TRACKER_MODAL_ORIGIN}${trackerPath}`;
      const response = await fetch(modalUrl);
      return new Response(response.body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    return;
  }

  if (!isCrawler(userAgent)) {
    return;
  }

  const parts = parsePathParts(url.pathname);
  if (!parts) {
    return;
  }

  const fullUrl = `${BASE_URL}${url.pathname}`;

  // Try each handler in order
  return (
    handleBlogPost(parts, fullUrl) ||
    handleApp(parts, fullUrl) ||
    handleStaticPage(parts, fullUrl) ||
    handleCountryHomepage(parts, fullUrl)
  );
}
