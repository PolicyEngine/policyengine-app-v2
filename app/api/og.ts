import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

// Post type definition
interface Post {
  title: string;
  description: string;
  filename: string;
  image?: string;
}

// Posts data - read from file at cold start
const posts: Post[] = JSON.parse(readFileSync(join(__dirname, 'posts.json'), 'utf-8'));

// Generate slug from filename (same logic as postTransformers.ts)
export function getSlugFromFilename(filename: string): string {
  const filenameWithoutExt = filename.substring(0, filename.indexOf('.'));
  return filenameWithoutExt.toLowerCase().replace(/_/g, '-');
}

// Find post by slug
export function findPostBySlug(slug: string) {
  return posts.find((post) => getSlugFromFilename(post.filename) === slug);
}

// Default OG tags
export const DEFAULT_OG = {
  title: 'PolicyEngine',
  description:
    'Free, open-source tools to understand tax and benefit policies. Calculate your taxes and benefits, or analyze policy reforms.',
  image: 'https://policyengine.org/assets/logos/policyengine/teal.png',
};

// Static page OG configs
export const STATIC_PAGES: Record<string, { title: string; description: string }> = {
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
export function generateOgHtml(
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

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  const pathname = Array.isArray(path) ? `/${path.join('/')}` : `/${path || ''}`;

  // Parse path: /:countryId/research/:slug or /:countryId/:page
  const pathParts = pathname.split('/').filter(Boolean);

  if (pathParts.length < 1) {
    // Homepage
    const html = generateOgHtml(
      DEFAULT_OG.title,
      DEFAULT_OG.description,
      DEFAULT_OG.image,
      'https://policyengine.org',
      'website'
    );
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(html);
  }

  const countryId = pathParts[0];
  const section = pathParts[1];
  const slug = pathParts[2];

  const baseUrl = 'https://policyengine.org';
  const fullUrl = `${baseUrl}${pathname}`;

  // Blog post: /:countryId/research/:slug
  if (section === 'research' && slug) {
    const post = findPostBySlug(slug);

    if (post) {
      const imageUrl = post.image ? `${baseUrl}/assets/posts/${post.image}` : DEFAULT_OG.image;

      const html = generateOgHtml(post.title, post.description, imageUrl, fullUrl, 'article');

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.status(200).send(html);
    }
  }

  // Static pages
  const staticPage = STATIC_PAGES[section];
  if (staticPage && !slug) {
    const html = generateOgHtml(
      staticPage.title,
      staticPage.description,
      DEFAULT_OG.image,
      fullUrl,
      'website'
    );

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(html);
  }

  // Country homepage
  if (pathParts.length === 1) {
    const countryName =
      countryId === 'uk' ? 'UK' : countryId === 'us' ? 'US' : countryId.toUpperCase();
    const html = generateOgHtml(
      `PolicyEngine ${countryName}`,
      DEFAULT_OG.description,
      DEFAULT_OG.image,
      fullUrl,
      'website'
    );

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(html);
  }

  // Default fallback
  const html = generateOgHtml(
    DEFAULT_OG.title,
    DEFAULT_OG.description,
    DEFAULT_OG.image,
    fullUrl,
    'website'
  );

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(html);
}
