"use client";

import Link from "next/link";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";
import type { BlogPost } from "@/types/blog";
import postsData from "@/data/posts/posts.json";

const LEFT_COUNT = 2;
const RIGHT_COUNT = 3;
const TOTAL_POSTS = LEFT_COUNT + RIGHT_COUNT;

function getPostImageUrl(post: BlogPost): string {
  if (!post.image) return "";
  if (post.image.startsWith("http")) return post.image;
  return `/assets/posts/${post.image}`;
}

function formatPostDate(dateStr: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? `${dateStr}T12:00:00`
    : dateStr;
  return new Date(normalized).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getSlug(filename: string): string {
  return filename.replace(/\.md$/, "");
}

function PrimaryCard({
  post,
  countryId,
}: {
  post: BlogPost;
  countryId: string;
}) {
  const imageUrl = getPostImageUrl(post);
  const date = formatPostDate(post.date);
  const slug = getSlug(post.filename);

  return (
    <Link
      href={`/${countryId}/research/${slug}`}
      style={{
        flex: 1,
        textDecoration: "none",
        color: "inherit",
        display: "block",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderRadius: spacing.radius.feature,
          overflow: "hidden",
          backgroundColor: colors.white,
          border: `1px solid ${colors.border.light}`,
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 8px 30px ${colors.shadow.medium}`;
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {imageUrl && (
          <div
            style={{
              minHeight: "200px",
              flex: 1,
              overflow: "hidden",
              backgroundColor: colors.gray[100],
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={post.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}
        <div style={{ padding: spacing["2xl"], flexShrink: 0 }}>
          <p
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.primary[600],
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: spacing.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {date}
          </p>
          <p
            style={{
              fontSize: typography.fontSize["2xl"],
              fontWeight: typography.fontWeight.bold,
              lineHeight: typography.lineHeight.tight,
              color: colors.gray[900],
              marginBottom: spacing.md,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {post.title}
          </p>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              fontFamily: typography.fontFamily.primary,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.description}
          </p>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.primary[600],
              marginTop: spacing.lg,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            Read more &rarr;
          </p>
        </div>
      </div>
    </Link>
  );
}

function SecondaryCard({
  post,
  countryId,
}: {
  post: BlogPost;
  countryId: string;
}) {
  const imageUrl = getPostImageUrl(post);
  const date = formatPostDate(post.date);
  const slug = getSlug(post.filename);

  return (
    <Link
      href={`/${countryId}/research/${slug}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        display: "block",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          borderRadius: spacing.radius.feature,
          overflow: "hidden",
          backgroundColor: colors.white,
          border: `1px solid ${colors.border.light}`,
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 6px 24px ${colors.shadow.medium}`;
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {imageUrl && (
          <div
            style={{
              height: "180px",
              overflow: "hidden",
              backgroundColor: colors.gray[100],
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={post.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: spacing.lg,
          }}
        >
          <p
            style={{
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              color: colors.primary[600],
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: spacing.xs,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            {date}
          </p>
          <p
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              lineHeight: typography.lineHeight.snug,
              color: colors.gray[900],
              marginBottom: spacing.sm,
              fontFamily: typography.fontFamily.primary,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.title}
          </p>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.normal,
              fontFamily: typography.fontFamily.primary,
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {post.description}
          </p>
          <p
            style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.primary[600],
              marginTop: spacing.md,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            Read &rarr;
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function HomeBlogPreview({ countryId }: { countryId: string }) {
  const relevantPosts = (postsData as BlogPost[])
    .filter(
      (post) => post.tags.includes(countryId) || post.tags.includes("global"),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, TOTAL_POSTS);

  if (relevantPosts.length === 0) return null;

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
      <div
        style={{
          maxWidth: spacing.layout.content,
          margin: "0 auto",
          padding: `0 ${spacing.xl}`,
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: spacing["3xl"],
          }}
        >
          <p
            style={{
              fontWeight: typography.fontWeight.bold,
              fontSize: typography.fontSize["3xl"],
              color: colors.primary[800],
              fontFamily: typography.fontFamily.primary,
              lineHeight: typography.lineHeight.tight,
              margin: 0,
            }}
          >
            Expert policy analysis
          </p>
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
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: spacing["2xl"],
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing["2xl"],
            }}
          >
            {leftPosts.map((post) => (
              <PrimaryCard
                key={getSlug(post.filename)}
                post={post}
                countryId={countryId}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: spacing["2xl"],
            }}
          >
            {rightPosts.map((post) => (
              <SecondaryCard
                key={getSlug(post.filename)}
                post={post}
                countryId={countryId}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
