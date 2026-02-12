/* eslint-disable no-console */
/**
 * Generate llms.txt files for AI-friendly article extraction.
 *
 * This script creates:
 * - /llms.txt - Index with links to sections
 * - /llms-full.txt - All articles combined, charts replaced with summaries
 * - /llms-research-us.txt - US articles only
 * - /llms-research-uk.txt - UK articles only
 *
 * Run with: npx tsx scripts/generate-llms-txt.ts
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
  authors: string[];
  filename: string;
  image?: string;
  ai_summary?: string;
}

interface Author {
  name: string;
  title?: string;
}

const POSTS_DIR = path.join(__dirname, '../src/data/posts');
const ARTICLES_DIR = path.join(POSTS_DIR, 'articles');
const PUBLIC_DIR = path.join(__dirname, '../public');

function loadPosts(): PostMetadata[] {
  const postsPath = path.join(POSTS_DIR, 'posts.json');
  const content = fs.readFileSync(postsPath, 'utf-8');
  const posts: PostMetadata[] = JSON.parse(content);
  // Sort by date descending so slicing gives the most recent posts
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return posts;
}

function loadAuthors(): Record<string, Author> {
  const authorsPath = path.join(POSTS_DIR, 'authors.json');
  const content = fs.readFileSync(authorsPath, 'utf-8');
  return JSON.parse(content);
}

function loadArticle(filename: string): string | null {
  const filePath = path.join(ARTICLES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`Article not found: ${filename}`);
    return null;
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Extract chart summary from Plotly JSON or figure caption.
 * Returns a text description instead of the full JSON.
 */
function extractChartSummary(plotlyJson: string, caption?: string): string {
  if (caption) {
    return `[Chart: ${caption}]`;
  }

  try {
    const chart = JSON.parse(plotlyJson);
    const parts: string[] = [];

    // Extract axis labels
    if (chart.layout?.xaxis?.title?.text) {
      parts.push(`x-axis: ${chart.layout.xaxis.title.text}`);
    }
    if (chart.layout?.yaxis?.title?.text) {
      parts.push(`y-axis: ${chart.layout.yaxis.title.text}`);
    }

    // Extract chart type
    if (chart.data?.[0]?.type) {
      parts.push(`type: ${chart.data[0].type}`);
    }

    if (parts.length > 0) {
      return `[Chart: ${parts.join(', ')}]`;
    }
  } catch {
    // Failed to parse, use generic placeholder
  }

  return '[Chart: see original article]';
}

/**
 * Transform article content for LLM consumption:
 * - Replace Plotly JSON with text summaries
 * - Keep iframe descriptions but remove the HTML
 * - Preserve tables and text content
 */
function transformArticleContent(content: string): string {
  let result = content;

  // Find figure captions before plotly blocks
  // Pattern: **Figure N: Caption**\n\n```plotly
  const figurePattern = /\*\*(?:Figure|Table)\s*\d*:?\s*([^*]+)\*\*\s*\n+```plotly\n([\s\S]*?)```/g;
  result = result.replace(figurePattern, (_, caption, json) => {
    const summary = extractChartSummary(json.trim(), caption.trim());
    return `**${caption.trim()}**\n\n${summary}`;
  });

  // Handle plotly blocks without preceding captions
  const plotlyPattern = /```plotly\n([\s\S]*?)```/g;
  result = result.replace(plotlyPattern, (_, json) => {
    return extractChartSummary(json.trim());
  });

  // Transform iframes to descriptions
  const iframePattern = /<iframe[^>]*src="([^"]*)"[^>]*(?:title="([^"]*)")?[^>]*><\/iframe>/g;
  result = result.replace(iframePattern, (_, src, title) => {
    if (title) {
      return `[Interactive: ${title}]`;
    }
    // Extract meaningful part of URL
    const urlParts = src.split('/').filter(Boolean);
    const lastPart = urlParts[urlParts.length - 1]?.replace('.html', '') || '';
    const readable = lastPart.replace(/-/g, ' ');
    return `[Interactive: ${readable || 'see original article'}]`;
  });

  return result;
}

/**
 * Format a single article for llms.txt output.
 */
function formatArticle(
  post: PostMetadata,
  content: string,
  authors: Record<string, Author>
): string {
  const authorNames = post.authors.map((id) => authors[id]?.name || id).join(', ');

  const slug = post.filename.replace(/\.(md|ipynb)$/, '');
  const transformedContent = transformArticleContent(content);

  return `---
# ${post.title}
Slug: ${slug}
Date: ${post.date}
Authors: ${authorNames}
Tags: ${post.tags.join(', ')}
Description: ${post.description}
${post.ai_summary ? `AI Summary: ${post.ai_summary}` : ''}
---

${transformedContent}
`;
}

/**
 * Generate the main llms.txt index file.
 */
function generateIndex(posts: PostMetadata[], usCount: number, ukCount: number): string {
  const recentPosts = posts.slice(0, 10);

  return `# PolicyEngine Research

> PolicyEngine is a free, open-source tool for analyzing tax and benefit policy impacts through microsimulation modeling. We provide household calculators and society-wide impact analysis for the US and UK.

## About PolicyEngine

PolicyEngine enables users to:
- Calculate how policy changes affect individual households
- Estimate society-wide impacts on revenue, poverty, and inequality
- Compare reform proposals across different scenarios
- Access programmatic policy analysis via API

## Recent Research

${recentPosts.map((p) => `- [${p.title}](/research/${p.filename.replace(/\.(md|ipynb)$/, '')}): ${p.description}`).join('\n')}

## Research by Region

- [US Research](/llms-research-us.txt): ${usCount} articles on US federal and state policy
- [UK Research](/llms-research-uk.txt): ${ukCount} articles on UK tax and benefit policy

## Recent Research (Full Text)

- [Recent Articles](/llms-recent.txt): Last 50 articles with full text

## Full Archive

- [All Research](/llms-full.txt): Complete archive of all PolicyEngine research articles

## Documentation

- [API Documentation](https://policyengine.org/us/api-explorer): Programmatic access to PolicyEngine
- [Python Package](https://policyengine.github.io/policyengine-us/): policyengine-us documentation

## Contact

- Website: https://policyengine.org
- GitHub: https://github.com/PolicyEngine
- Email: hello@policyengine.org
`;
}

/**
 * Generate combined article file for a region or all articles.
 */
function generateArticleFile(
  posts: PostMetadata[],
  authors: Record<string, Author>,
  region?: 'us' | 'uk',
  customHeader?: string
): string {
  const header =
    customHeader ||
    (region
      ? `# PolicyEngine ${region.toUpperCase()} Research\n\n> ${region === 'us' ? 'US federal and state' : 'UK'} tax and benefit policy analysis.\n\n`
      : `# PolicyEngine Research Archive\n\n> Complete archive of PolicyEngine research articles.\n\n`);

  const filteredPosts = region ? posts.filter((p) => p.tags.includes(region)) : posts;

  const articles: string[] = [];

  for (const post of filteredPosts) {
    const content = loadArticle(post.filename);
    if (content) {
      articles.push(formatArticle(post, content, authors));
    }
  }

  return header + articles.join('\n\n---\n\n');
}

function main() {
  console.log('Loading posts and authors...');
  const posts = loadPosts();
  const authors = loadAuthors();

  const usPosts = posts.filter((p) => p.tags.includes('us'));
  const ukPosts = posts.filter((p) => p.tags.includes('uk'));

  console.log(`Found ${posts.length} total posts (${usPosts.length} US, ${ukPosts.length} UK)`);

  // Generate llms.txt index
  console.log('Generating llms.txt...');
  const index = generateIndex(posts, usPosts.length, ukPosts.length);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'llms.txt'), index);

  // Generate region-specific files
  console.log('Generating llms-research-us.txt...');
  const usContent = generateArticleFile(posts, authors, 'us');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'llms-research-us.txt'), usContent);

  console.log('Generating llms-research-uk.txt...');
  const ukContent = generateArticleFile(posts, authors, 'uk');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'llms-research-uk.txt'), ukContent);

  // Generate recent articles (last 50)
  console.log('Generating llms-recent.txt...');
  const recentPosts = posts.slice(0, 50);
  const recentContent = generateArticleFile(
    recentPosts,
    authors,
    undefined,
    `# PolicyEngine Recent Research\n\n> The ${recentPosts.length} most recent PolicyEngine research articles.\n\n`
  );
  fs.writeFileSync(path.join(PUBLIC_DIR, 'llms-recent.txt'), recentContent);

  // Generate full archive
  console.log('Generating llms-full.txt...');
  const fullContent = generateArticleFile(posts, authors);
  fs.writeFileSync(path.join(PUBLIC_DIR, 'llms-full.txt'), fullContent);

  // Print stats
  const indexSize = Buffer.byteLength(index, 'utf8');
  const recentSize = Buffer.byteLength(recentContent, 'utf8');
  const usSize = Buffer.byteLength(usContent, 'utf8');
  const ukSize = Buffer.byteLength(ukContent, 'utf8');
  const fullSize = Buffer.byteLength(fullContent, 'utf8');

  console.log('\nGenerated files:');
  console.log(`  llms.txt:             ${(indexSize / 1024).toFixed(1)} KB`);
  console.log(
    `  llms-recent.txt:      ${(recentSize / 1024).toFixed(1)} KB (${recentPosts.length} articles)`
  );
  console.log(
    `  llms-research-us.txt: ${(usSize / 1024).toFixed(1)} KB (${usPosts.length} articles)`
  );
  console.log(
    `  llms-research-uk.txt: ${(ukSize / 1024).toFixed(1)} KB (${ukPosts.length} articles)`
  );
  console.log(
    `  llms-full.txt:        ${(fullSize / 1024).toFixed(1)} KB (${posts.length} articles)`
  );
}

main();
