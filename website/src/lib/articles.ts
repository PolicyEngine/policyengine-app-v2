/**
 * Server-only article loading module.
 *
 * Reads markdown and notebook files from the filesystem at build time
 * (via generateStaticParams) or on-demand for dynamic routes.
 * This module must only be imported in server components or build-time functions.
 */

import fs from "fs";
import path from "path";
import { getPostsSorted, type BlogPost } from "@/data/posts/postTransformers";

const ARTICLES_DIR = path.join(
  process.cwd(),
  "src",
  "data",
  "posts",
  "articles",
);

/**
 * Read raw article content from disk.
 * Returns the file contents as a string (markdown or JSON for notebooks).
 */
export function getArticleContent(filename: string): string {
  const filePath = path.join(ARTICLES_DIR, filename);
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Find a post by its URL slug.
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return getPostsSorted().find((post) => post.slug === slug);
}

/**
 * Get all article slugs for static generation.
 */
export function getAllSlugs(): string[] {
  return getPostsSorted().map((post) => post.slug);
}
