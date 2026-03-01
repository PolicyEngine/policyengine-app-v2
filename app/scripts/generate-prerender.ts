/* eslint-disable no-console */
/**
 * Generate pre-rendered HTML files for each blog post so that LLM bots
 * and search engines can read full article content without executing JS.
 *
 * Creates:
 * - /prerender/{slug}.html  - Full HTML page per article
 * - /prerender/index.json   - Slug → metadata mapping for the middleware
 *
 * Run with: npx tsx scripts/generate-prerender.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface PrerenderIndexEntry {
  title: string;
  description: string;
  date: string;
  country: string;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const POSTS_DIR = path.join(__dirname, '../src/data/posts');
const ARTICLES_DIR = path.join(POSTS_DIR, 'articles');
const PUBLIC_DIR = path.join(__dirname, '../public');
const PRERENDER_DIR = path.join(PUBLIC_DIR, 'prerender');
const BASE_URL = 'https://policyengine.org';

// ---------------------------------------------------------------------------
// Helpers – slug / loading
// ---------------------------------------------------------------------------

/**
 * Convert a post filename to the URL slug used by the app router.
 * Must match the convention in the middleware and generate-sitemap.ts.
 */
function slugFromFilename(filename: string): string {
  return filename
    .replace(/\.(md|ipynb)$/, '')
    .toLowerCase()
    .replace(/_/g, '-');
}

function loadPosts(): PostMetadata[] {
  const postsPath = path.join(POSTS_DIR, 'posts.json');
  const content = fs.readFileSync(postsPath, 'utf-8');
  const posts: PostMetadata[] = JSON.parse(content);
  // Sort by date descending (most recent first)
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
 * Determine the primary country tag for a post.
 */
function primaryCountry(tags: string[]): string {
  if (tags.includes('us')) {
    return 'us';
  }
  if (tags.includes('uk')) {
    return 'uk';
  }
  if (tags.includes('canada') || tags.includes('ca')) {
    return 'ca';
  }
  return 'us'; // default
}

// ---------------------------------------------------------------------------
// Content transformation (duplicated from generate-llms-txt.ts to keep
// scripts independent)
// ---------------------------------------------------------------------------

function extractChartSummary(plotlyJson: string, caption?: string): string {
  if (caption) {
    return `[Chart: ${caption}]`;
  }

  try {
    const chart = JSON.parse(plotlyJson);
    const parts: string[] = [];

    if (chart.layout?.xaxis?.title?.text) {
      parts.push(`x-axis: ${chart.layout.xaxis.title.text}`);
    }
    if (chart.layout?.yaxis?.title?.text) {
      parts.push(`y-axis: ${chart.layout.yaxis.title.text}`);
    }
    if (chart.data?.[0]?.type) {
      parts.push(`type: ${chart.data[0].type}`);
    }

    if (parts.length > 0) {
      return `[Chart: ${parts.join(', ')}]`;
    }
  } catch {
    // Failed to parse – use generic placeholder
  }

  return '[Chart: see original article]';
}

function transformArticleContent(content: string): string {
  let result = content;

  // Figure/table captions followed by plotly blocks
  const figurePattern = /\*\*(?:Figure|Table)\s*\d*:?\s*([^*]+)\*\*\s*\n+```plotly\n([\s\S]*?)```/g;
  result = result.replace(figurePattern, (_, caption, json) => {
    const summary = extractChartSummary(json.trim(), caption.trim());
    return `**${caption.trim()}**\n\n${summary}`;
  });

  // Plotly blocks without captions
  const plotlyPattern = /```plotly\n([\s\S]*?)```/g;
  result = result.replace(plotlyPattern, (_, json) => extractChartSummary(json.trim()));

  // Iframes → text placeholders
  const iframePattern = /<iframe[^>]*src="([^"]*)"[^>]*(?:title="([^"]*)")?[^>]*><\/iframe>/g;
  result = result.replace(iframePattern, (_, src, title) => {
    if (title) {
      return `[Interactive: ${title}]`;
    }
    const urlParts = (src as string).split('/').filter(Boolean);
    const lastPart = urlParts[urlParts.length - 1]?.replace('.html', '') || '';
    const readable = lastPart.replace(/-/g, ' ');
    return `[Interactive: ${readable || 'see original article'}]`;
  });

  return result;
}

// ---------------------------------------------------------------------------
// Jupyter notebook extraction
// ---------------------------------------------------------------------------

interface NotebookCell {
  cell_type: string;
  source: string[];
  outputs?: Array<{
    output_type: string;
    text?: string[];
    data?: Record<string, string[]>;
  }>;
}

function extractNotebookContent(raw: string): string {
  try {
    const nb = JSON.parse(raw) as { cells: NotebookCell[] };
    const parts: string[] = [];

    for (const cell of nb.cells) {
      const source = cell.source.join('');
      if (cell.cell_type === 'markdown') {
        parts.push(source);
      } else if (cell.cell_type === 'code') {
        parts.push(`\`\`\`python\n${source}\n\`\`\``);
        // Include text output if present
        if (cell.outputs) {
          for (const output of cell.outputs) {
            if (output.text) {
              parts.push(`\`\`\`\n${output.text.join('')}\n\`\`\``);
            } else if (output.data?.['text/plain']) {
              parts.push(`\`\`\`\n${output.data['text/plain'].join('')}\n\`\`\``);
            }
          }
        }
      }
    }

    return parts.join('\n\n');
  } catch {
    return raw;
  }
}

// ---------------------------------------------------------------------------
// Simple markdown → HTML conversion
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * A lightweight markdown-to-HTML converter. Does not need to be perfect –
 * LLMs handle markdown well, and we also include the raw markdown in the
 * output.
 */
function markdownToHtml(md: string): string {
  let html = md;

  // Fenced code blocks (``` ... ```)
  html = html.replace(
    /```(\w*)\n([\s\S]*?)```/g,
    (_, lang, code) =>
      `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trimEnd())}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings (# through ######)
  html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr />');

  // Unordered lists (simple single-level)
  html = html.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>\n$1</ul>\n');

  // Ordered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

  // Blockquotes
  html = html.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');

  // Wrap remaining plain-text lines in <p> tags.
  // Split on double-newlines to identify paragraphs.
  const blocks = html.split(/\n{2,}/);
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) {
        return '';
      }
      // Skip blocks that already start with an HTML tag
      if (/^<(?:h[1-6]|ul|ol|li|pre|blockquote|hr|img|div|table|p)/i.test(trimmed)) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n\n');

  return html;
}

// ---------------------------------------------------------------------------
// HTML page generation
// ---------------------------------------------------------------------------

function generateHtmlPage(
  post: PostMetadata,
  rawContent: string,
  authors: Record<string, Author>
): string {
  const slug = slugFromFilename(post.filename);
  const country = primaryCountry(post.tags);
  const canonicalUrl = `${BASE_URL}/${country}/research/${slug}`;
  const authorNames = post.authors.map((id) => authors[id]?.name || id).join(', ');

  // Transform content (charts → summaries, iframes → placeholders)
  const transformed = transformArticleContent(rawContent);

  // Convert to simple HTML for rendered section
  const renderedHtml = markdownToHtml(transformed);

  const safeTitle = escapeHtml(post.title);
  const safeDescription = escapeHtml(post.description);
  const imageUrl = post.image
    ? post.image.startsWith('http')
      ? post.image
      : `${BASE_URL}/assets/posts/${post.image}`
    : `${BASE_URL}/assets/logos/policyengine/teal.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} | PolicyEngine</title>
  <meta name="description" content="${safeDescription}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="PolicyEngine" />

  <!-- Structured data -->
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: imageUrl,
    url: canonicalUrl,
    datePublished: post.date,
    author: post.authors.map((id) => ({
      '@type': 'Person',
      name: authors[id]?.name || id,
    })),
    publisher: {
      '@type': 'Organization',
      name: 'PolicyEngine',
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/assets/logos/policyengine/teal.png`,
      },
    },
  }).replace(/</g, '\\u003c')}</script>

  <style>
    body { max-width: 800px; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 1.8rem; margin-bottom: 0.25rem; }
    .meta { color: #555; margin-bottom: 1.5rem; }
    a { color: #2b6cb0; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; border-radius: 4px; }
    code { font-size: 0.9em; }
    blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1rem; color: #555; }
    img { max-width: 100%; }
    table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
    .raw-markdown { background: #fafafa; border: 1px solid #e0e0e0; border-radius: 4px; padding: 1rem; white-space: pre-wrap; font-family: monospace; font-size: 0.85rem; }
  </style>
</head>
<body>
  <header>
    <h1>${safeTitle}</h1>
    <p class="meta">
      By ${escapeHtml(authorNames)} &middot; ${escapeHtml(post.date)}<br />
      Tags: ${post.tags.map((t) => escapeHtml(t)).join(', ')}
    </p>
    <p>${safeDescription}</p>
    <p><a href="${canonicalUrl}">View the interactive version on PolicyEngine</a></p>
  </header>

  <main>
    <article>
${renderedHtml}
    </article>
  </main>

  <hr />

  <details>
    <summary>Raw markdown source</summary>
    <div class="raw-markdown">${escapeHtml(transformed)}</div>
  </details>

  <footer style="margin-top:2rem;color:#777;font-size:0.85rem;">
    <p>&copy; PolicyEngine. <a href="${canonicalUrl}">View on policyengine.org</a> &middot; <a href="${BASE_URL}/llms-full.txt">All articles (llms-full.txt)</a></p>
  </footer>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('Loading posts and authors...');
  const posts = loadPosts();
  const authors = loadAuthors();

  // Ensure output directory exists
  if (!fs.existsSync(PRERENDER_DIR)) {
    fs.mkdirSync(PRERENDER_DIR, { recursive: true });
  }

  const indexEntries: Record<string, PrerenderIndexEntry> = {};
  let generated = 0;
  let skipped = 0;

  for (const post of posts) {
    const slug = slugFromFilename(post.filename);
    const rawContent = loadArticle(post.filename);
    if (!rawContent) {
      skipped++;
      continue;
    }

    // For notebooks, extract text content first
    const content = post.filename.endsWith('.ipynb')
      ? extractNotebookContent(rawContent)
      : rawContent;

    const html = generateHtmlPage(post, content, authors);
    const outPath = path.join(PRERENDER_DIR, `${slug}.html`);
    fs.writeFileSync(outPath, html);

    indexEntries[slug] = {
      title: post.title,
      description: post.description,
      date: post.date,
      country: primaryCountry(post.tags),
    };

    generated++;
  }

  // Write the index mapping
  const indexPath = path.join(PRERENDER_DIR, 'index.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexEntries, null, 2));

  console.log(`\nGenerated ${generated} pre-rendered HTML files (${skipped} skipped).`);
  console.log(`Index: ${indexPath}`);
}

main();
