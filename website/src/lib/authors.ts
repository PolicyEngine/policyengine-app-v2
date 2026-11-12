/**
 * Author display names for research posts.
 *
 * posts.json lists each post's authors as slugs ("david-trimmer"), and
 * authors.json maps each slug to a record that holds the author's name
 * ("David Trimmer"). The article byline and the article's schema.org JSON-LD
 * both read names from here, so readers and search engines see the same name.
 */

import authorsData from "@/data/posts/authors.json";
import type { AuthorsCollection } from "@/types/blog";

/** What the lookups need from authors.json. Tests pass their own. */
export type AuthorLookup = Readonly<
  Record<string, { name?: string } | undefined>
>;

/** The author records the site ships with, keyed by slug. */
const SITE_AUTHORS: AuthorLookup = authorsData as AuthorsCollection;

/** A schema.org Person, as the article JSON-LD lists each author. */
export interface JsonLdPerson {
  "@type": "Person";
  name: string;
}

/** Title-case a slug: "max-ghenis" becomes "Max Ghenis". */
export function formatAuthorSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The author's display name: the name in the author's authors.json record,
 * or the title-cased slug when the slug has no record or its record has no
 * name. Only the record's own keys count, so a slug such as "constructor"
 * doesn't pick up a name from Object.prototype.
 */
export function getAuthorName(
  slug: string,
  authors: AuthorLookup = SITE_AUTHORS,
): string {
  const record = Object.prototype.hasOwnProperty.call(authors, slug)
    ? authors[slug]
    : undefined;
  const name = typeof record?.name === "string" ? record.name.trim() : "";
  return name || formatAuthorSlug(slug);
}

/** The JSON-LD `author` array for a post's author slugs, in byline order. */
export function articleJsonLdAuthors(
  slugs: readonly string[],
  authors: AuthorLookup = SITE_AUTHORS,
): JsonLdPerson[] {
  return slugs.map((slug) => ({
    "@type": "Person",
    name: getAuthorName(slug, authors),
  }));
}
