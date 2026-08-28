/**
 * Shared logic for generating llms.txt content.
 *
 * Ported from app/scripts/generate-llms-txt.ts with minimal changes:
 * - Replaced standalone fs/path scaffolding with existing website modules
 * - Core transformation logic (charts, iframes, notebooks) is unchanged
 */

import { getPostsSorted, type BlogPost } from "@/data/posts/postTransformers";
import { getArticleContent } from "@/lib/articles";
import authorsData from "@/data/posts/authors.json";
import type { AuthorsCollection } from "@/types/blog";

const authors = authorsData as AuthorsCollection;

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
      return `[Chart: ${parts.join(", ")}]`;
    }
  } catch {
    // Failed to parse, use generic placeholder
  }

  return "[Chart: see original article]";
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
  const figurePattern =
    /\*\*(?:Figure|Table)\s*\d*:?\s*([^*]+)\*\*\s*\n+```plotly\n([\s\S]*?)```/g;
  result = result.replace(figurePattern, (_, caption, json) => {
    const summary = extractChartSummary(json.trim(), caption.trim());
    return `**${caption.trim()}**\n\n${summary}`;
  });

  // Handle plotly blocks without preceding captions
  const plotlyPattern = /```plotly\n([\s\S]*?)```/g;
  result = result.replace(plotlyPattern, (_, json) =>
    extractChartSummary(json.trim()),
  );

  // Transform iframes to descriptions
  const iframePattern =
    /<iframe[^>]*src="([^"]*)"[^>]*(?:title="([^"]*)")?[^>]*><\/iframe>/g;
  result = result.replace(iframePattern, (_, src, title) => {
    if (title) {
      return `[Interactive: ${title}]`;
    }
    // Extract meaningful part of URL
    const urlParts = (src as string).split("/").filter(Boolean);
    const lastPart = urlParts[urlParts.length - 1]?.replace(".html", "") || "";
    const readable = lastPart.replace(/-/g, " ");
    return `[Interactive: ${readable || "see original article"}]`;
  });

  return result;
}

/**
 * Extract text content from Jupyter notebook JSON.
 */
function extractNotebookContent(raw: string): string {
  try {
    const nb = JSON.parse(raw) as {
      cells: Array<{
        cell_type: string;
        source: string[];
        outputs?: Array<{
          output_type: string;
          text?: string[];
          data?: Record<string, string[]>;
        }>;
      }>;
    };
    const parts: string[] = [];

    for (const cell of nb.cells) {
      const source = cell.source.join("");
      if (cell.cell_type === "markdown") {
        parts.push(source);
      } else if (cell.cell_type === "code") {
        parts.push(`\`\`\`python\n${source}\n\`\`\``);
        // Include text output if present
        if (cell.outputs) {
          for (const output of cell.outputs) {
            if (output.text) {
              parts.push(`\`\`\`\n${output.text.join("")}\n\`\`\``);
            } else if (output.data?.["text/plain"]) {
              parts.push(
                `\`\`\`\n${output.data["text/plain"].join("")}\n\`\`\``,
              );
            }
          }
        }
      }
    }

    return parts.join("\n\n");
  } catch {
    return raw;
  }
}

/**
 * Format a single article for llms.txt output.
 */
function formatArticle(post: BlogPost): string {
  const authorNames = post.authors
    .map((id) => authors[id]?.name || id)
    .join(", ");

  const rawContent = getArticleContent(post.filename);
  const content = post.filename.endsWith(".ipynb")
    ? extractNotebookContent(rawContent)
    : rawContent;
  const transformedContent = transformArticleContent(content);

  return `---
# ${post.title}
Slug: ${post.slug}
Date: ${post.date}
Authors: ${authorNames}
Tags: ${post.tags.join(", ")}
Description: ${post.description}
---

${transformedContent}
`;
}

/**
 * Generate the main llms.txt index file.
 */
export function generateIndex(): string {
  const posts = getPostsSorted();
  const usPosts = posts.filter((p) => p.tags.includes("us"));
  const ukPosts = posts.filter((p) => p.tags.includes("uk"));
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

${recentPosts.map((p) => `- [${p.title}](/research/${p.slug}): ${p.description}`).join("\n")}

## Research by Region

- [US Research](/llms-research-us.txt): ${usPosts.length} articles on US federal and state policy
- [UK Research](/llms-research-uk.txt): ${ukPosts.length} articles on UK tax and benefit policy

## Recent Research (Full Text)

- [Recent Articles](/llms-recent.txt): Last 50 articles with full text

## Full Archive

- [All Research](/llms-full.txt): Complete archive of all PolicyEngine research articles

## Documentation

- [API Documentation](https://policyengine.org/us/api): Programmatic access to PolicyEngine
- [Python Package](https://policyengine.github.io/policyengine-us/): policyengine-us documentation

## Contact

- Website: https://policyengine.org
- GitHub: https://github.com/PolicyEngine
- Email: hello@policyengine.org
`;
}

/**
 * Generate combined article file for a region, recent subset, or full archive.
 */
export function generateArticleFile(
  region?: "us" | "uk",
  limit?: number,
): string {
  const posts = getPostsSorted();
  let filtered = region ? posts.filter((p) => p.tags.includes(region)) : posts;

  let header: string;
  if (limit) {
    filtered = filtered.slice(0, limit);
    header = `# PolicyEngine Recent Research\n\n> The ${filtered.length} most recent PolicyEngine research articles.\n\n`;
  } else if (region) {
    const regionLabel = region === "us" ? "US federal and state" : "UK";
    header = `# PolicyEngine ${region.toUpperCase()} Research\n\n> ${regionLabel} tax and benefit policy analysis.\n\n`;
  } else {
    header = `# PolicyEngine Research Archive\n\n> Complete archive of PolicyEngine research articles.\n\n`;
  }

  const articles: string[] = [];
  for (const post of filtered) {
    try {
      articles.push(formatArticle(post));
    } catch {
      // Skip articles whose files are missing
    }
  }

  return header + articles.join("\n\n---\n\n");
}
