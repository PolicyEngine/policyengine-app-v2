"use client";

/**
 * ArticleClient — client component for rendering a blog article.
 *
 * Receives post metadata and raw content from the server component.
 * Handles the responsive 3-column layout (TOC | content | related),
 * heading section, author bios, and share links.
 */

import { useMemo } from "react";
import Link from "next/link";
import type { AuthorsCollection, BlogPost, Notebook } from "@/types/blog";
import { MarkdownFormatter } from "@/components/blog/MarkdownFormatter";
import { NotebookRenderer } from "@/components/blog/NotebookRenderer";
import { useDisplayCategory } from "@/components/blog/useDisplayCategory";
import { blogSpacing } from "@/components/blog/blogStyles";
import {
  getLocationTags,
  getTopicTags,
  locationLabels,
  topicLabels,
} from "@/data/posts/postTransformers";
import { extractMarkdownFromNotebook } from "@/lib/notebookUtils";
import authorsData from "@/data/posts/authors.json";
import {
  colors,
  spacing,
  typography,
} from "@policyengine/design-system/tokens";

const authors = authorsData as AuthorsCollection;

const SCROLL_OFFSET_PX = 72;

function calculateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  return `${Math.ceil(words / 200)} min read`;
}

function formatAuthorName(authorId: string): string {
  return authorId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface ArticleClientProps {
  post: BlogPost;
  content: string;
  isNotebook: boolean;
  countryId: string;
}

export default function ArticleClient({
  post,
  content,
  isNotebook,
  countryId,
}: ArticleClientProps) {
  const displayCategory = useDisplayCategory();

  const { markdown, notebook } = useMemo(() => {
    if (isNotebook) {
      const nb: Notebook = JSON.parse(content);
      return { markdown: extractMarkdownFromNotebook(nb), notebook: nb };
    }
    return { markdown: content, notebook: null };
  }, [content, isNotebook]);

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const imageUrl = post.image
    ? post.image.startsWith("http")
      ? post.image
      : `/assets/posts/${post.image}`
    : "";

  return (
    <>
      {/* Header section */}
      <div style={{ backgroundColor: colors.gray[50] }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: `${post.hideHeaderImage ? spacing.lg : spacing["5xl"]} ${spacing["2xl"]}`,
          }}
        >
          <PostHeading
            post={post}
            imageUrl={imageUrl}
            markdown={markdown}
            formattedDate={formattedDate}
            countryId={countryId}
            displayCategory={displayCategory}
          />
        </div>
      </div>

      {/* Body section */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: `${spacing.xl} ${spacing["2xl"]}`,
        }}
      >
        <PostBody
          post={post}
          markdown={markdown}
          notebook={notebook}
          countryId={countryId}
          displayCategory={displayCategory}
        />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Heading                                                            */
/* ------------------------------------------------------------------ */

function PostHeading({
  post,
  imageUrl,
  markdown,
  formattedDate,
  countryId,
  displayCategory,
}: {
  post: BlogPost;
  imageUrl: string;
  markdown: string;
  formattedDate: string;
  countryId: string;
  displayCategory: string;
}) {
  const readingTime = calculateReadingTime(markdown);

  if (displayCategory === "desktop") {
    return (
      <div style={{ display: "flex" }}>
        {/* Left sidebar */}
        <div style={{ flex: 1, paddingRight: spacing["3xl"] }}>
          <p
            style={{
              fontWeight: typography.fontWeight.semibold,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: spacing.sm,
              fontSize: typography.fontSize.base,
            }}
          >
            {formattedDate}
          </p>
          <Authorship post={post} countryId={countryId} />
          <div style={{ marginBottom: spacing["5xl"] }} />
          <p
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: colors.gray[500],
              fontSize: typography.fontSize.base,
            }}
          >
            {readingTime}
          </p>
          <div style={{ marginTop: spacing["5xl"] }} />
          <ShareLinks post={post} displayCategory={displayCategory} />
        </div>

        {/* Main content */}
        <div style={{ flex: 3 }}>
          <h1
            style={{
              fontSize: typography.fontSize["4xl"],
              fontWeight: typography.fontWeight.bold,
              lineHeight: typography.lineHeight.tight,
              marginBottom: spacing.xl,
              marginTop: 0,
            }}
          >
            {post.title}
          </h1>
          <p
            style={{
              marginTop: spacing["3xl"],
              fontSize: typography.fontSize.xl,
              color: colors.gray[500],
            }}
          >
            {post.description}
          </p>
          {imageUrl && !post.hideHeaderImage && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              alt={post.title}
              title={post.imageCredit}
              src={imageUrl}
              style={{ width: "100%", marginTop: spacing["3xl"] }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>

        {/* Right spacer */}
        <div style={{ flex: 1 }} />
      </div>
    );
  }

  // Tablet and mobile
  return (
    <div>
      <h1
        style={{
          fontSize:
            displayCategory === "mobile"
              ? typography.fontSize["3xl"]
              : typography.fontSize["4xl"],
          fontWeight: typography.fontWeight.bold,
          lineHeight: typography.lineHeight.tight,
          marginBottom: spacing.md,
          marginTop: 0,
        }}
      >
        {post.title}
      </h1>
      <p
        style={{
          color: colors.gray[500],
          fontSize: typography.fontSize.lg,
          marginBottom: spacing.lg,
        }}
      >
        {post.description}
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: spacing.xl,
          flexWrap: "wrap",
          gap: spacing.sm,
        }}
      >
        <Authorship post={post} countryId={countryId} />
        <p
          style={{
            fontWeight: typography.fontWeight.semibold,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: typography.fontSize.base,
            margin: 0,
          }}
        >
          {formattedDate}
        </p>
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: colors.gray[500],
            fontSize: typography.fontSize.base,
            margin: 0,
          }}
        >
          {readingTime}
        </p>
      </div>
      {imageUrl && !post.hideHeaderImage && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          alt={post.title}
          title={post.imageCredit}
          src={imageUrl}
          style={{ width: "100%" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}
      <div style={{ marginTop: spacing.xl }}>
        <ShareLinks post={post} displayCategory={displayCategory} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Body                                                               */
/* ------------------------------------------------------------------ */

function PostBody({
  post,
  markdown,
  notebook,
  countryId,
  displayCategory,
}: {
  post: BlogPost;
  markdown: string;
  notebook: Notebook | null;
  countryId: string;
  displayCategory: string;
}) {
  const bodyContent = notebook ? (
    <NotebookRenderer notebook={notebook} displayCategory={displayCategory} />
  ) : (
    <MarkdownFormatter markdown={markdown} />
  );

  if (displayCategory === "desktop") {
    return (
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, marginRight: spacing["3xl"] }}>
          <div
            style={{
              position: "sticky",
              top: 150,
              marginTop: blogSpacing.marginTop.paragraph,
            }}
          >
            <SectionLabel>Contents</SectionLabel>
            <LeftContents markdown={markdown} />
          </div>
        </div>
        <div style={{ flex: 4, minWidth: 0 }}>
          {bodyContent}
          <AuthorSection post={post} countryId={countryId} />
        </div>
        <div style={{ flex: 1, marginLeft: spacing.xl }}>
          <div
            style={{
              position: "sticky",
              top: 150,
              marginTop: blogSpacing.marginTop.paragraph,
            }}
          >
            <MoreOn post={post} countryId={countryId} />
          </div>
        </div>
      </div>
    );
  }

  if (displayCategory === "tablet") {
    return (
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1, marginRight: spacing["3xl"] }}>
          <div style={{ position: "sticky", top: 150 }}>
            <SectionLabel>Contents</SectionLabel>
            <LeftContents markdown={markdown} />
            <div style={{ marginTop: spacing.lg }} />
            <MoreOn post={post} countryId={countryId} />
          </div>
        </div>
        <div style={{ flex: 3 }}>
          {bodyContent}
          <AuthorSection post={post} countryId={countryId} />
        </div>
      </div>
    );
  }

  // Mobile
  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <SectionLabel>Contents</SectionLabel>
        <LeftContents markdown={markdown} />
      </div>
      {bodyContent}
      <AuthorSection post={post} countryId={countryId} />
      <div style={{ marginTop: spacing.lg }}>
        <MoreOn post={post} countryId={countryId} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        fontWeight: typography.fontWeight.semibold,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: colors.primary[600],
        fontSize: typography.fontSize.sm,
        marginBottom: spacing.xs,
        marginTop: 0,
      }}
    >
      {children}
    </p>
  );
}

function Authorship({
  post,
  countryId,
}: {
  post: BlogPost;
  countryId: string;
}) {
  const names = post.authors.map((id) => (
    <Link
      key={id}
      href={`/${countryId}/research?authors=${id}`}
      style={{
        color: colors.primary[600],
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {formatAuthorName(id)}
    </Link>
  ));

  return (
    <p
      style={{
        fontWeight: typography.fontWeight.semibold,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        fontSize: typography.fontSize.base,
        margin: 0,
      }}
    >
      By{" "}
      {names.length <= 2
        ? names.reduce((prev, curr, i) => (
            <>
              {prev}
              {i > 0 ? " and " : ""}
              {curr}
            </>
          ))
        : names.map((name, i) => (
            <span key={i}>
              {i > 0 && i < names.length - 1 ? ", " : ""}
              {i === names.length - 1 ? ", and " : ""}
              {name}
            </span>
          ))}
    </p>
  );
}

function AuthorSection({
  post,
  countryId,
}: {
  post: BlogPost;
  countryId: string;
}) {
  return (
    <div style={{ marginTop: spacing["4xl"] }}>
      {post.authors.map((authorId) => {
        const author = authors[authorId];
        if (!author) return null;

        return (
          <div
            key={authorId}
            style={{
              display: "flex",
              justifyContent: "start",
              gap: spacing.lg,
              padding: `${spacing.lg} ${spacing.sm}`,
              borderTop: `1px solid ${colors.border.dark}`,
            }}
          >
            {author.headshot && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                alt={author.name}
                src={`/assets/authors/${author.headshot}`}
                width={70}
                height={70}
                style={{ objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
            <div style={{ paddingTop: spacing.xs }}>
              <p
                style={{
                  fontWeight: typography.fontWeight.semibold,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontSize: typography.fontSize.sm,
                  margin: 0,
                }}
              >
                <Link
                  href={`/${countryId}/research?authors=${authorId}`}
                  style={{
                    color: colors.primary[600],
                    textDecoration: "none",
                  }}
                >
                  {formatAuthorName(authorId)}
                </Link>
              </p>
              <p
                style={{
                  color: colors.gray[500],
                  fontSize: typography.fontSize.xs,
                  margin: 0,
                }}
              >
                {author.title}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MoreOn({ post, countryId }: { post: BlogPost; countryId: string }) {
  const locationTagList = getLocationTags();
  const topicTagList = getTopicTags();

  const links = post.tags
    .filter(
      (tag) => locationTagList.includes(tag) || topicTagList.includes(tag),
    )
    .map((tag) => {
      const isLocation = locationTagList.includes(tag);
      const label = isLocation ? locationLabels[tag] : topicLabels[tag];
      if (!label) return null;

      return (
        <div key={tag} style={{ marginBottom: 2 }}>
          <Link
            href={`/${countryId}/research?${isLocation ? "locations" : "topics"}=${tag}`}
            style={{
              color: colors.gray[700],
              textDecoration: "none",
              fontSize: typography.fontSize.base,
              transition: "color 0.2s ease",
              display: "block",
              padding: "2px 0",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.primary[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.gray[700];
            }}
          >
            {label}
          </Link>
        </div>
      );
    });

  if (links.filter(Boolean).length === 0) return null;

  return (
    <>
      <SectionLabel>More on</SectionLabel>
      {links}
    </>
  );
}

function ShareLinks({
  post,
  displayCategory,
}: {
  post: BlogPost;
  displayCategory: string;
}) {
  const desktop = displayCategory === "desktop";

  const links = [
    { name: "Twitter", icon: "𝕏", param: "tweet" },
    { name: "Facebook", icon: "f", param: "fb" },
    { name: "LinkedIn", icon: "in", param: "li" },
    { name: "Email", icon: "✉", param: "email" },
  ];

  const getUrl = (param: string) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    switch (param) {
      case "tweet":
        return `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`;
      case "fb":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      case "li":
        return `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(post.title)}`;
      case "email":
        return `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(url)}`;
      default:
        return "#";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: desktop ? "column" : "row",
        gap: desktop ? spacing.sm : spacing.xl,
      }}
    >
      {desktop && <SectionLabel>Share</SectionLabel>}
      {links.map((link) => (
        <a
          key={link.name}
          href={getUrl(link.param)}
          target="_blank"
          rel="noopener noreferrer"
          title={link.name}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            color: colors.gray[600],
            textDecoration: "none",
            fontSize: typography.fontSize.xs,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: desktop ? colors.gray[500] : "transparent",
              color: desktop ? colors.white : colors.gray[600],
              border: desktop ? "none" : `1px solid ${colors.gray[400]}`,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
            }}
          >
            {link.icon}
          </span>
          {desktop && <span>{link.name}</span>}
        </a>
      ))}
    </div>
  );
}

function LeftContents({ markdown }: { markdown: string }) {
  if (!markdown) return null;

  const headers = markdown.split("\n").filter((line) => line.startsWith("##"));

  if (headers.length === 0) return null;

  return (
    <>
      {headers.map((header, index) => {
        const level = header.split("#").length - 1;
        let text = header.split(" ").slice(1).join(" ");

        // Extract text from markdown links [text](url)
        if (text.includes("[")) {
          text = text.split("[").slice(1).join("[").split("]")[0];
        }

        const slug = header
          .replace(/[#,/]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();

        return (
          <div key={`${slug}-${index}`} style={{ marginBottom: 2 }}>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById(slug);
                if (el) {
                  const top =
                    el.getBoundingClientRect().top +
                    window.pageYOffset -
                    SCROLL_OFFSET_PX;
                  window.scrollTo({ top, behavior: "smooth" });
                }
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontSize: 15 - 1.5 * (level - 2),
                paddingLeft: 8 * (level - 2),
                padding: "2px 0",
                color: colors.gray[700],
                transition: "color 0.2s ease",
                fontFamily: typography.fontFamily.primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.primary[600];
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.gray[700];
              }}
            >
              {text}
            </button>
          </div>
        );
      })}
    </>
  );
}
