# Research Content Structure Guide

## Purpose
This skill orientates contributors to how PolicyEngine structures articles and interactive applications for the Research page.

## Overview

PolicyEngine uses two separate JSON files to manage content:
- **`posts.json`** - Stores research articles and blog posts
- **`apps.json`** - Stores interactive applications and calculators

## Content Structure

### Articles (`posts.json`)

Articles are blog posts and research pieces. Each entry includes:

**Required fields:**
- `title` - Article title
- `description` - Brief summary
- `date` - Publication date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
- `filename` - Markdown filename (e.g., `article-slug.md`)
- `image` - Image filename from `/public/images/posts/`
- `authors` - Array of author IDs (must match entries in `authors.json`)
- `tags` - Array of tags (location tags like `us`, `uk` and topic tags like `policy`, `featured`)

**Example:**
```json
{
  "title": "How removing the two-child benefit limit would affect the UK",
  "description": "Removing the two-child limit would cost £2.8 billion in 2026-27 and reduce child poverty by 15.7%.",
  "date": "2025-10-06 11:00:00",
  "tags": ["uk", "policy", "featured"],
  "authors": ["vahid-ahmadi"],
  "filename": "uk-two-child-limit.md",
  "image": "uk-reeves.jpg"
}
```

### Interactive Apps (`apps.json`)

Interactive applications and calculators that can be embedded on the site. Each entry includes:

**Required fields:**
- `type` - Embedding method (see types below)
- `slug` - URL-safe identifier (becomes `/{countryId}/{slug}`)
- `title` - App title
- `description` - Brief summary
- `source` - URL of the hosted application
- `tags` - Array of tags (location and topic)
- `countryId` - Country code (`us`, `uk`, etc.) - used for routing

**Optional fields (for Research page display):**
- `displayWithResearch` - Boolean flag to show on Research page alongside articles
- `image` - Image filename from `/public/images/posts/` (required if `displayWithResearch` is true)
- `date` - Publication date (YYYY-MM-DD) (required if `displayWithResearch` is true)
- `authors` - Array of author IDs (required if `displayWithResearch` is true)

**Important:** If `displayWithResearch: true` is set but required fields (`image`, `date`, `authors`) are missing, a console error will be logged.

**Example (basic standalone app):**
```json
{
  "type": "streamlit",
  "slug": "aca-calc",
  "title": "ACA-Calc",
  "description": "Calculate your household's premium tax credits under the Affordable Care Act",
  "source": "https://policyengine-aca-calc.streamlit.app",
  "tags": ["us", "featured", "healthcare", "policy"],
  "countryId": "us"
}
```

**Example (app displayed on Research page):**
```json
{
  "type": "iframe",
  "slug": "two-child-limit-comparison",
  "title": "Two-child limit calculator",
  "description": "Explore policy reforms to the two-child benefit limit and their impacts on households, government spending, and child poverty.",
  "source": "https://uk-two-child-limit-app.vercel.app",
  "tags": ["uk", "featured", "policy", "interactives"],
  "countryId": "uk",
  "displayWithResearch": true,
  "image": "young-child-exemption-two-child-limit.jpg",
  "date": "2025-10-28",
  "authors": ["vahid-ahmadi"]
}
```

## App Types

The `type` field determines how the interactive is embedded:

### `streamlit`
For Streamlit apps hosted on `*.streamlit.app`. The app is embedded with `?embedded=true` appended.
- Use for: Streamlit-based calculators and tools
- Source URL pattern: `https://*.streamlit.app`

### `iframe`
For standard iframe embeds. The source URL is embedded directly as-is.
- Use for: Any web app that works in a standard iframe
- **Most common and versatile option**
- Can be used for standalone apps or apps displayed on the Research page

### `obbba-iframe`
For OBBBA-specific interactive visualizations requiring special handling.
- Use for: OBBBA scatter plots and related visualizations
- Source URL pattern: `https://policyengine.github.io/obbba-*`

### `custom`
For apps requiring custom React component handling (advanced use case).
- Requires additional `component` field specifying the component name
- Rarely used

## Routing

**No custom react-router-dom configuration needed!**

Apps are automatically routed based on their JSON configuration:
- Route pattern: `/{countryId}/{slug}`
- Example: An app with `countryId: "us"` and `slug: "aca-calc"` becomes `/us/aca-calc`
- The country ID is used to restrict access (users accessing wrong country are auto-redirected)

## Research Page Display

Both articles and interactive apps can appear on the Research page (`/us/research`, `/uk/research`, etc.):

**Articles:** Automatically appear (from `posts.json`)

**Interactive Apps:** Only appear when explicitly configured:
1. Set `displayWithResearch: true`
2. Add `image` field (filename from `/public/images/posts/`)
3. Add `date` field (YYYY-MM-DD)
4. Add `authors` array (author IDs from `authors.json`)
5. Any app `type` can be displayed on the Research page as long as it has these fields

**Note:** The app type (streamlit, iframe, etc.) determines how it's embedded, but any type can be displayed on the Research page if it has the required metadata fields.

## Quick Reference

| To add... | File | Required fields | Optional |
|-----------|------|----------------|----------|
| Blog article | `posts.json` | title, description, date, filename, image, authors, tags | - |
| Interactive app (standalone) | `apps.json` | type, slug, title, description, source, tags, countryId | - |
| Interactive app (on Research page) | `apps.json` | type, slug, title, description, source, tags, countryId, displayWithResearch, image, date, authors | - |

## Common Workflows

### Adding a blog article
1. Create markdown file in `/src/data/posts/articles/{slug}.md`
2. Add image to `/public/images/posts/{image-name}.jpg`
3. Add entry to `posts.json` with all required fields
4. Article appears automatically on Research page

### Adding a standalone interactive
1. Host the app externally (Streamlit, Vercel, etc.)
2. Add entry to `apps.json` with appropriate `type` (usually `iframe` or `streamlit`)
3. App is accessible at `/{countryId}/{slug}`

### Adding an interactive to Research page
1. Host the app externally
2. Add image to `/public/images/posts/{image-name}.jpg`
3. Add entry to `apps.json` with appropriate `type` (usually `iframe`)
4. Set `displayWithResearch: true`
5. Include all research metadata: `image`, `date`, `authors`
6. Appears on Research page alongside articles

## Best Practices

- **Slugs**: Use lowercase with hyphens (e.g., `two-child-limit-comparison`)
- **Images**: Use descriptive names, store in `/public/images/posts/`
- **Tags**: Include both location (`us`, `uk`) and topic tags (`policy`, `featured`, `interactives`)
- **Type selection**: Use `iframe` for most embeds, `streamlit` for Streamlit apps, `obbba-iframe` for OBBBA visualizations
- **Research page apps**: Any app type can appear on the Research page - just set `displayWithResearch: true` and include the required metadata
- **Country routing**: Always set correct `countryId` - users accessing wrong country are auto-redirected
- **Validation**: If you set `displayWithResearch: true`, make sure to include `image`, `date`, and `authors` to avoid console errors
