/* eslint-disable no-console */
/**
 * Generate sitemap.xml and robots.txt for search engine discovery.
 *
 * Reads posts.json and apps.json to produce a complete sitemap of all
 * research articles, interactive tools, and static pages.
 *
 * Run with: npx tsx scripts/generate-sitemap.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PostMetadata {
  title: string;
  description: string;
  date: string;
  tags: string[];
  filename: string;
}

interface AppMetadata {
  slug: string;
  countryId: string;
  date?: string;
}

const BASE_URL = 'https://policyengine.org';
const PUBLIC_DIR = path.join(__dirname, '../public');
const POSTS_PATH = path.join(__dirname, '../src/data/posts/posts.json');
const APPS_PATH = path.join(__dirname, '../src/data/apps/apps.json');

function slugFromFilename(filename: string): string {
  return filename
    .replace(/\.(md|ipynb)$/, '')
    .toLowerCase()
    .replace(/_/g, '-');
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: string): string {
  // Ensure YYYY-MM-DD format
  return new Date(date).toISOString().split('T')[0];
}

type SitemapEntry = {
  url: string;
  lastmod?: string;
  changefreq: string;
  priority: string;
};

function generateSitemap(): string {
  const posts: PostMetadata[] = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
  const apps: AppMetadata[] = JSON.parse(fs.readFileSync(APPS_PATH, 'utf-8'));

  const entries: SitemapEntry[] = [];

  // Homepage
  entries.push({
    url: BASE_URL,
    changefreq: 'weekly',
    priority: '1.0',
  });

  // Country homepages
  for (const country of ['us', 'uk']) {
    entries.push({
      url: `${BASE_URL}/${country}`,
      changefreq: 'weekly',
      priority: '0.9',
    });
  }

  // Static pages
  const staticPages = ['research', 'team', 'donate', 'supporters'];
  for (const country of ['us', 'uk']) {
    for (const page of staticPages) {
      entries.push({
        url: `${BASE_URL}/${country}/${page}`,
        changefreq: page === 'research' ? 'daily' : 'monthly',
        priority: page === 'research' ? '0.8' : '0.5',
      });
    }
  }

  // Calculator pages
  for (const country of ['us', 'uk']) {
    entries.push({
      url: `${BASE_URL}/${country}/household`,
      changefreq: 'weekly',
      priority: '0.9',
    });
  }

  // Research articles
  for (const post of posts) {
    const slug = slugFromFilename(post.filename);
    const countries = post.tags.filter((t) => ['us', 'uk'].includes(t));
    // Default to US if no country tag
    const targetCountries = countries.length > 0 ? countries : ['us'];

    for (const country of targetCountries) {
      entries.push({
        url: `${BASE_URL}/${country}/research/${slug}`,
        lastmod: formatDate(post.date),
        changefreq: 'monthly',
        priority: '0.7',
      });
    }
  }

  // Interactive tools/apps (deduplicate by slug+country)
  const seen = new Set<string>();
  for (const app of apps) {
    const key = `${app.countryId}/${app.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    entries.push({
      url: `${BASE_URL}/${app.countryId}/${app.slug}`,
      lastmod: app.date ? formatDate(app.date) : undefined,
      changefreq: 'weekly',
      priority: '0.8',
    });
  }

  // State legislative tracker
  entries.push({
    url: `${BASE_URL}/us/state-legislative-tracker`,
    changefreq: 'daily',
    priority: '0.8',
  });

  // Build XML
  const urlEntries = entries
    .map((e) => {
      const parts = [
        `    <loc>${escapeXml(e.url)}</loc>`,
        e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
        `    <changefreq>${e.changefreq}</changefreq>`,
        `    <priority>${e.priority}</priority>`,
      ].filter(Boolean);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
}

function main() {
  console.log('Generating sitemap.xml...');
  const sitemap = generateSitemap();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'sitemap.xml'), sitemap);

  const urlCount = (sitemap.match(/<url>/g) || []).length;
  const sizeKB = (Buffer.byteLength(sitemap, 'utf8') / 1024).toFixed(1);
  console.log(`  sitemap.xml: ${sizeKB} KB (${urlCount} URLs)`);

  console.log('Generating robots.txt...');
  const robots = generateRobotsTxt();
  fs.writeFileSync(path.join(PUBLIC_DIR, 'robots.txt'), robots);
  console.log('  robots.txt: done');
}

main();
