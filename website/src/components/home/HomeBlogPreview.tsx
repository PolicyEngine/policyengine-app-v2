"use client";

import Link from "next/link";
import { Container, Group, Text } from "@/components/ui";
import OptimisedImage from "@/components/ui/OptimisedImage";
import { cn } from "@/lib/utils";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";
import { getPostsSorted } from "@/data/posts/postTransformers";
import type { BlogPost } from "@/types/blog";

/**
 * Number of posts shown in the blog preview on the home page.
 * 2 on the left (primary cards), 3 on the right (secondary cards).
 */
const LEFT_COUNT = 2;
const RIGHT_COUNT = 3;
const TOTAL_POSTS = LEFT_COUNT + RIGHT_COUNT;

function getPostImageUrl(post: BlogPost): string {
  if (!post.image) {
    return "";
  }
  if (post.image.startsWith("http")) {
    return post.image;
  }
  return `/assets/posts/${post.image}`;
}

function formatPostDate(dateStr: string): string {
  // Append T12:00:00 to date-only strings to avoid UTC midnight timezone shift
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? `${dateStr}T12:00:00`
    : dateStr;
  return new Date(normalized).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  PrimaryCard                                                        */
/* ------------------------------------------------------------------ */

interface PrimaryCardProps {
  post: BlogPost;
  countryId: string;
  flex?: number;
}

function PrimaryCard({ post, countryId, flex }: PrimaryCardProps) {
  const imageUrl = getPostImageUrl(post);
  const date = formatPostDate(post.date);

  return (
    <Link
      href={`/${countryId}/research/${post.slug}`}
      className="tw:block tw:no-underline tw:text-inherit tw:group"
      style={{ flex: flex ?? "none" }}
    >
      <div
        className={cn(
          "tw:flex tw:flex-col tw:h-full",
          "tw:rounded-feature tw:overflow-hidden tw:bg-white tw:border tw:border-border-light",
          "tw:transition-all tw:duration-300 tw:ease-out",
          "tw:hover:shadow-[0_8px_30px_rgba(16,24,40,0.1)] tw:hover:-translate-y-0.5",
          "tw:focus-within:shadow-[0_0_0_2px_var(--color-primary-500)] tw:focus-within:outline-none",
        )}
      >
        {imageUrl && (
          <div className="tw:min-h-[200px] tw:flex-1 tw:overflow-hidden tw:bg-gray-100">
            <OptimisedImage
              src={imageUrl}
              alt={post.title}
              width={640}
              className="tw:w-full tw:h-full tw:object-cover tw:block tw:transition-transform tw:duration-500 tw:group-hover:scale-[1.03]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="tw:p-2xl tw:shrink-0">
          <p className="tw:text-xs tw:font-semibold tw:text-primary-600 tw:uppercase tw:tracking-wide tw:mb-sm">
            {date}
          </p>

          <p className="tw:text-2xl tw:font-bold tw:leading-tight tw:text-gray-900 tw:mb-md">
            {post.title}
          </p>

          <p className="tw:text-sm tw:text-text-secondary tw:leading-relaxed tw:line-clamp-3">
            {post.description}
          </p>

          <p className="tw:text-sm tw:font-semibold tw:text-primary-600 tw:mt-lg tw:transition-transform tw:duration-200 tw:group-hover:translate-x-1">
            Read more &rarr;
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  SecondaryCard                                                      */
/* ------------------------------------------------------------------ */

interface SecondaryCardProps {
  post: BlogPost;
  countryId: string;
}

function SecondaryCard({ post, countryId }: SecondaryCardProps) {
  const imageUrl = getPostImageUrl(post);
  const date = formatPostDate(post.date);

  return (
    <Link
      href={`/${countryId}/research/${post.slug}`}
      className="tw:block tw:no-underline tw:text-inherit tw:h-full tw:group"
    >
      <div
        className={cn(
          "tw:flex tw:flex-col tw:h-full",
          "tw:rounded-feature tw:overflow-hidden tw:bg-white tw:border tw:border-border-light",
          "tw:transition-all tw:duration-300 tw:ease-out",
          "tw:hover:shadow-[0_6px_24px_rgba(16,24,40,0.1)] tw:hover:-translate-y-0.5",
          "tw:focus-within:shadow-[0_0_0_2px_var(--color-primary-500)] tw:focus-within:outline-none",
        )}
      >
        {imageUrl && (
          <div className="tw:h-[180px] tw:overflow-hidden tw:bg-gray-100 tw:shrink-0">
            <OptimisedImage
              src={imageUrl}
              alt={post.title}
              width={384}
              className="tw:w-full tw:h-full tw:object-cover tw:block tw:transition-transform tw:duration-500 tw:group-hover:scale-[1.03]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="tw:flex tw:flex-col tw:flex-1 tw:p-lg">
          <p className="tw:text-xs tw:font-semibold tw:text-primary-600 tw:uppercase tw:tracking-wide tw:mb-xs">
            {date}
          </p>

          <p className="tw:text-base tw:font-semibold tw:leading-snug tw:text-gray-900 tw:line-clamp-2 tw:mb-sm">
            {post.title}
          </p>

          <p className="tw:text-sm tw:text-text-secondary tw:leading-normal tw:line-clamp-2 tw:flex-1">
            {post.description}
          </p>

          <p className="tw:text-sm tw:font-semibold tw:text-primary-600 tw:mt-md tw:transition-transform tw:duration-200 tw:group-hover:translate-x-1">
            Read &rarr;
          </p>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  HomeBlogPreview                                                    */
/* ------------------------------------------------------------------ */

export default function HomeBlogPreview({
  countryId,
}: {
  countryId: string;
}) {
  // getPostsSorted() returns posts sorted newest-first with slugs pre-computed
  const relevantPosts = getPostsSorted()
    .filter(
      (post: BlogPost) =>
        post.tags.includes(countryId) || post.tags.includes("global"),
    )
    .slice(0, TOTAL_POSTS);

  if (relevantPosts.length === 0) {
    return null;
  }

  const leftPosts = relevantPosts.slice(0, LEFT_COUNT);
  const rightPosts = relevantPosts.slice(LEFT_COUNT, TOTAL_POSTS);

  return (
    <div
      style={{
        backgroundColor: colors.gray[50],
        paddingTop: spacing["5xl"],
        paddingBottom: spacing["5xl"],
      }}
    >
      <Container size="xl">
        {/* Section header */}
        <Group
          justify="space-between"
          align="baseline"
          style={{ marginBottom: spacing["3xl"] }}
        >
          <Text
            fw={typography.fontWeight.bold}
            style={{
              fontSize: typography.fontSize["3xl"],
              color: colors.primary[800],
              fontFamily: typography.fontFamily.primary,
              lineHeight: typography.lineHeight.tight,
            }}
          >
            Expert policy analysis
          </Text>

          <Link
            href={`/${countryId}/research`}
            style={{
              textDecoration: "none",
              color: colors.primary[600],
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            View all research &rarr;
          </Link>
        </Group>

        {/* Two-column layout: 2 left (stacked), 3 right (stacked) */}
        <div
          className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2"
          style={{ gap: spacing["2xl"] }}
        >
          {/* Left column: 2 posts stacked, filling equal height */}
          <div
            className="tw:flex tw:flex-col"
            style={{ gap: spacing["2xl"] }}
          >
            {leftPosts.map((post: BlogPost) => (
              <PrimaryCard
                key={post.slug}
                post={post}
                countryId={countryId}
                flex={1}
              />
            ))}
          </div>

          {/* Right column: 3 smaller posts stacked */}
          <div
            className="tw:flex tw:flex-col"
            style={{ gap: spacing["2xl"] }}
          >
            {rightPosts.map((post: BlogPost) => (
              <SecondaryCard
                key={post.slug}
                post={post}
                countryId={countryId}
              />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
