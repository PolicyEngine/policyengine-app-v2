"use client";

/**
 * ArticleClient — client component for rendering a blog article.
 *
 * Receives post metadata and raw content from the server component.
 * Handles the responsive 3-column layout (TOC | content | "More on" topics),
 * heading section, author bios, and share links.
 */

import { useEffect, useMemo } from "react";
import Link from "next/link";
import type { AuthorsCollection, BlogPost, Notebook } from "@/types/blog";
import { MarkdownFormatter } from "@/components/blog/MarkdownFormatter";
import { NotebookRenderer } from "@/components/blog/NotebookRenderer";
import { useDisplayCategory } from "@/components/blog/useDisplayCategory";
import { blogSpacing } from "@/components/blog/blogStyles";
import { Container, Spinner, Text } from "@/components/ui";
import OptimisedImage from "@/components/ui/OptimisedImage";
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
import { trackResearchArticleViewed } from "@/lib/posthog-events";

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
      try {
        const nb: Notebook = JSON.parse(content);
        return { markdown: extractMarkdownFromNotebook(nb), notebook: nb };
      } catch (err) {
        console.error("Failed to parse notebook JSON:", err);
        return { markdown: "", notebook: null };
      }
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

  useEffect(() => {
    trackResearchArticleViewed({
      country_id: countryId,
      slug: post.slug,
      title: post.title,
      author_count: post.authors.length,
      topic_tags: post.tags.filter((tag) => topicLabels[tag]),
      location_tags: post.tags.filter((tag) => locationLabels[tag]),
      is_notebook: isNotebook,
    });
  }, [
    countryId,
    isNotebook,
    post.authors.length,
    post.slug,
    post.tags,
    post.title,
  ]);

  return (
    <>
      {/* Header section */}
      <div style={{ backgroundColor: colors.gray[50] }}>
        <Container
          size="xl"
          style={{
            paddingTop: post.hideHeaderImage
              ? spacing.component.input.height
              : spacing["5xl"],
            paddingBottom: post.hideHeaderImage
              ? spacing.component.input.height
              : spacing["5xl"],
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
        </Container>
      </div>

      {/* Body section */}
      <Container size="xl" className="tw:py-xl">
        <PostBody
          post={post}
          markdown={markdown}
          notebook={notebook}
          countryId={countryId}
          displayCategory={displayCategory}
        />
      </Container>
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
          <Text
            size="md"
            fw={typography.fontWeight.semibold}
            className="tw:mb-sm tw:uppercase"
            style={{ letterSpacing: "0.05em" }}
          >
            {formattedDate}
          </Text>
          <Authorship post={post} countryId={countryId} />
          <div style={{ marginBottom: spacing["5xl"] }} />
          <Text
            size="md"
            className="tw:uppercase"
            style={{ letterSpacing: "0.05em", color: colors.gray[500] }}
          >
            {readingTime}
          </Text>
          <div style={{ marginTop: spacing["5xl"] }} />
          <ShareLinks post={post} displayCategory={displayCategory} />
        </div>

        {/* Main content */}
        <div style={{ flex: 3 }}>
          <Text
            component="h1"
            size="xl"
            fw={typography.fontWeight.bold}
            style={{
              fontSize: typography.fontSize["4xl"],
              lineHeight: typography.lineHeight.tight,
              marginBottom: spacing.xl,
            }}
          >
            {post.title}
          </Text>
          <Text
            size="lg"
            style={{
              marginTop: spacing["3xl"],
              fontSize: typography.fontSize.xl,
              color: colors.gray[500],
            }}
          >
            {post.description}
          </Text>
          {imageUrl && !post.hideHeaderImage && (
            <OptimisedImage
              alt={post.title}
              title={post.imageCredit}
              src={imageUrl}
              width={1080}
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
      <Text
        component="h1"
        size="xl"
        fw={typography.fontWeight.bold}
        style={{
          fontSize:
            displayCategory === "mobile"
              ? typography.fontSize["3xl"]
              : typography.fontSize["4xl"],
          lineHeight: typography.lineHeight.tight,
        }}
        className="tw:mb-md"
      >
        {post.title}
      </Text>
      <Text size="lg" className="tw:mb-lg" style={{ color: colors.gray[500] }}>
        {post.description}
      </Text>
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
        <Text
          size="md"
          fw={typography.fontWeight.semibold}
          className="tw:uppercase"
          style={{ letterSpacing: "0.05em" }}
        >
          {formattedDate}
        </Text>
        <Text
          size="md"
          className="tw:uppercase"
          style={{ letterSpacing: "0.05em", color: colors.gray[500] }}
        >
          {readingTime}
        </Text>
      </div>
      {imageUrl && !post.hideHeaderImage && (
        <OptimisedImage
          alt={post.title}
          title={post.imageCredit}
          src={imageUrl}
          width={750}
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
            <Text
              size="sm"
              fw={typography.fontWeight.semibold}
              className="tw:uppercase tw:mb-xs"
              style={{ letterSpacing: "0.1em", color: colors.primary[600] }}
            >
              Contents
            </Text>
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
            <Text
              size="sm"
              fw={typography.fontWeight.semibold}
              className="tw:uppercase tw:mb-xs"
              style={{ letterSpacing: "0.1em", color: colors.primary[600] }}
            >
              Contents
            </Text>
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
        <Text
          size="sm"
          fw={typography.fontWeight.semibold}
          className="tw:uppercase tw:mb-xs"
          style={{ letterSpacing: "0.1em", color: colors.primary[600] }}
        >
          Contents
        </Text>
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

function Authorship({
  post,
  countryId,
}: {
  post: BlogPost;
  countryId: string;
}) {
  const authorNames = post.authors.map((id) => (
    <span key={id} style={{ whiteSpace: "nowrap" }}>
      <Link
        href={`/${countryId}/research?authors=${id}`}
        style={{
          color: colors.primary[600],
          textDecoration: "none",
        }}
      >
        {formatAuthorName(id)}
      </Link>
    </span>
  ));

  let content;
  if (authorNames.length === 1) {
    content = <>By {authorNames}</>;
  } else if (authorNames.length === 2) {
    content = (
      <>
        By {authorNames[0]} and {authorNames[1]}
      </>
    );
  } else {
    const last = authorNames.pop();
    content = (
      <>
        By{" "}
        {authorNames.reduce((prev, curr, i) => (
          <>
            {prev}
            {i > 0 ? ", " : ""}
            {curr}
          </>
        ))}
        , and {last}
      </>
    );
  }

  return (
    <Text
      size="md"
      fw={typography.fontWeight.semibold}
      className="tw:uppercase"
      style={{ letterSpacing: "0.05em" }}
    >
      {content}
    </Text>
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
              <OptimisedImage
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
              <Text
                size="sm"
                fw={typography.fontWeight.semibold}
                className="tw:uppercase"
                style={{ letterSpacing: "0.05em" }}
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
              </Text>
              <Text size="xs" style={{ color: colors.gray[500] }}>
                {author.title}
              </Text>
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
      <Text
        size="sm"
        fw={typography.fontWeight.semibold}
        className="tw:uppercase tw:mb-xs"
        style={{ letterSpacing: "0.1em", color: colors.primary[600] }}
      >
        More on
      </Text>
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
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const desktop = displayCategory === "desktop";

  const links = [
    {
      name: "Twitter",
      icon: "\u{1D54F}",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: "Facebook",
      icon: "f",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: "LinkedIn",
      icon: "in",
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${currentUrl}&title=${post.title}&summary=${post.description}`,
    },
    {
      name: "Email",
      icon: "\u2709",
      url: `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(currentUrl)}`,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: desktop ? "column" : "row",
        gap: desktop ? spacing.sm : spacing.xl,
      }}
    >
      {desktop && (
        <Text
          size="sm"
          fw={typography.fontWeight.semibold}
          className="tw:uppercase"
          style={{ letterSpacing: "0.1em" }}
        >
          Share
        </Text>
      )}
      {links.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            color: colors.gray[600],
            textDecoration: "none",
            fontSize: typography.fontSize.xs,
          }}
          title={link.name}
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

  const contents = headers.map((header, index) => {
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
        <Text
          size="sm"
          style={{
            fontSize: 15 - 1.5 * (level - 2),
            cursor: "pointer",
            paddingLeft: 8 * (level - 2),
            padding: "2px 0",
            color: colors.gray[700],
            transition: "color 0.2s ease",
          }}
          onClick={() => {
            const element = document.getElementById(slug);
            if (element) {
              const elementPosition =
                element.getBoundingClientRect().top + window.pageYOffset;
              window.scrollTo({
                top: elementPosition - SCROLL_OFFSET_PX,
                behavior: "smooth",
              });
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.primary[600];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.gray[700];
          }}
        >
          {text}
        </Text>
      </div>
    );
  });

  return <>{contents}</>;
}
