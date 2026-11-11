import Fuse, { type FuseResultMatch } from "fuse.js";

import type { ResearchItem } from "@/data/posts/postTransformers";

const MAX_EXCERPT_CONTENT_LENGTH = 180;
const TOKEN_MATCH_RADIUS = 120;
const IGNORED_QUERY_TOKENS = new Set(["and", "for", "from", "the", "with"]);

export interface ResearchSearchIndexEntry {
  slug: string;
  content: string;
}

export interface SearchExcerpt {
  text: string;
  highlightedText: string;
  highlightStart: number;
  highlightEnd: number;
}

export interface ResearchSearchResult extends ResearchItem {
  searchExcerpt?: SearchExcerpt;
}

interface SearchDocument {
  item: ResearchItem;
  title: string;
  description: string;
  content: string;
}

function getFallbackMatchRange(
  match: FuseResultMatch,
): [number, number] | null {
  const longestRange = match.indices.reduce<[number, number] | null>(
    (longest, [start, end]) => {
      if (!longest || end - start > longest[1] - longest[0]) {
        return [start, end];
      }
      return longest;
    },
    null,
  );

  return longestRange;
}

function getTokenMatchRange(
  content: string,
  query: string,
): [number, number] | null {
  const normalizedContent = content.toLocaleLowerCase();
  const tokens = [
    ...new Set(
      query
        .toLocaleLowerCase()
        .match(/[\p{L}\p{N}]+/gu)
        ?.filter(
          (token) => token.length >= 2 && !IGNORED_QUERY_TOKENS.has(token),
        ) || [],
    ),
  ];
  const tokenOccurrences = tokens.map((token) => {
    const occurrences: Array<[number, number]> = [];
    let start = normalizedContent.indexOf(token);

    while (start >= 0) {
      occurrences.push([start, start + token.length - 1]);
      start = normalizedContent.indexOf(token, start + token.length);
    }

    return occurrences;
  });
  const anchors = tokenOccurrences.flat();

  return anchors.reduce<[number, number] | null>((bestRange, anchor) => {
    const nearbyMatches = tokenOccurrences
      .map((occurrences) =>
        occurrences.reduce<[number, number] | null>((nearest, occurrence) => {
          const distance = Math.abs(occurrence[0] - anchor[0]);
          if (distance > TOKEN_MATCH_RADIUS) {
            return nearest;
          }
          if (!nearest || distance < Math.abs(nearest[0] - anchor[0])) {
            return occurrence;
          }
          return nearest;
        }, null),
      )
      .filter((occurrence): occurrence is [number, number] =>
        Boolean(occurrence),
      );

    if (nearbyMatches.length === 0) {
      return bestRange;
    }

    const candidate: [number, number] = [
      Math.min(...nearbyMatches.map(([start]) => start)),
      Math.max(...nearbyMatches.map(([, end]) => end)),
    ];
    if (!bestRange) {
      return candidate;
    }

    const bestTokenCount = tokenOccurrences.filter((occurrences) =>
      occurrences.some(
        ([start]) => start >= bestRange[0] && start <= bestRange[1],
      ),
    ).length;
    if (nearbyMatches.length > bestTokenCount) {
      return candidate;
    }
    if (
      nearbyMatches.length === bestTokenCount &&
      candidate[1] - candidate[0] < bestRange[1] - bestRange[0]
    ) {
      return candidate;
    }
    return bestRange;
  }, null);
}

function getBodyMatchRange(
  content: string,
  query: string,
  match: FuseResultMatch,
): [number, number] | null {
  const normalizedQuery = query.trim();
  const exactStart = content
    .toLocaleLowerCase()
    .indexOf(normalizedQuery.toLocaleLowerCase());

  if (exactStart >= 0) {
    return [exactStart, exactStart + normalizedQuery.length - 1];
  }

  return (
    getTokenMatchRange(content, normalizedQuery) || getFallbackMatchRange(match)
  );
}

function createSearchExcerpt(
  content: string,
  query: string,
  match: FuseResultMatch,
): SearchExcerpt | undefined {
  const range = getBodyMatchRange(content, query, match);
  if (!range) {
    return undefined;
  }

  const [matchStart, inclusiveMatchEnd] = range;
  const matchEnd = inclusiveMatchEnd + 1;
  const matchLength = matchEnd - matchStart;
  const excerptContentLength = Math.max(
    MAX_EXCERPT_CONTENT_LENGTH,
    matchLength,
  );
  const surroundingLength = Math.max(0, excerptContentLength - matchLength);

  let excerptStart = Math.max(
    0,
    matchStart - Math.floor(surroundingLength / 2),
  );
  let excerptEnd = Math.min(
    content.length,
    excerptStart + excerptContentLength,
  );
  excerptStart = Math.max(0, excerptEnd - excerptContentLength);

  if (excerptStart > 0) {
    const nextSpace = content.indexOf(" ", excerptStart);
    if (nextSpace >= 0 && nextSpace < matchStart) {
      excerptStart = nextSpace + 1;
    }
  }

  if (excerptEnd < content.length) {
    const previousSpace = content.lastIndexOf(" ", excerptEnd);
    if (previousSpace > matchEnd) {
      excerptEnd = previousSpace;
    }
  }

  const excerptContent = content.slice(excerptStart, excerptEnd).trim();
  const contentStart = content.indexOf(excerptContent, excerptStart);
  const prefix = contentStart > 0 ? "…" : "";
  const suffix =
    contentStart + excerptContent.length < content.length ? "…" : "";
  const text = `${prefix}${excerptContent}${suffix}`;
  const highlightStart = prefix.length + matchStart - contentStart;
  const highlightEnd = highlightStart + matchLength;

  return {
    text,
    highlightedText: text.slice(highlightStart, highlightEnd),
    highlightStart,
    highlightEnd,
  };
}

export function searchResearchItems(
  items: ResearchItem[],
  searchIndex: ResearchSearchIndexEntry[],
  query: string,
): ResearchSearchResult[] {
  const contentBySlug = new Map(
    searchIndex.map((entry) => [entry.slug, entry.content]),
  );
  const documents: SearchDocument[] = items.map((item) => ({
    item,
    title: item.title,
    description: item.description,
    content: item.isApp ? "" : contentBySlug.get(item.slug) || "",
  }));
  const fuse = new Fuse(documents, {
    keys: [
      { name: "title", weight: 0.5 },
      { name: "description", weight: 0.3 },
      { name: "content", weight: 0.2 },
    ],
    threshold: 0.3,
    includeMatches: true,
    ignoreLocation: true,
  });

  return fuse.search(query).map((result) => {
    const metadataMatched = result.matches?.some(
      (match) => match.key === "title" || match.key === "description",
    );
    const bodyMatch = result.matches?.find((match) => match.key === "content");
    const searchExcerpt =
      !metadataMatched && bodyMatch
        ? createSearchExcerpt(result.item.content, query, bodyMatch)
        : undefined;

    return {
      ...result.item.item,
      ...(searchExcerpt ? { searchExcerpt } : {}),
    };
  });
}
