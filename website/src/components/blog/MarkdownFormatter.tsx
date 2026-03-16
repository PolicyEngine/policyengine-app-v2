"use client";

/**
 * MarkdownFormatter component.
 *
 * Renders markdown content with custom styling for blog posts.
 * Custom renderers for headings, links, images, code blocks,
 * tables, blockquotes, footnotes, and Plotly charts.
 */

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import {
  blogColors,
  blogFontWeights,
  blogRadius,
  blogShadows,
  blogSpacing,
  blogTypography,
} from "./blogStyles";
import { LazyPlot } from "./LazyPlot";
import { useDisplayCategory } from "./useDisplayCategory";

function safeJsonParse(data: string | string[]): Record<string, unknown> | null {
  try {
    const jsonString = Array.isArray(data) ? data[0] : data;
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("[PLOTLY] Failed to parse JSON:", err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Table components                                                   */
/* ------------------------------------------------------------------ */

function Td({ children }: { children?: React.ReactNode }) {
  const displayCategory = useDisplayCategory();
  const mobile = displayCategory === "mobile";
  const ref = useRef<HTMLTableCellElement>(null);
  const [columnNumber, setColumnNumber] = useState<number | null>(null);

  useEffect(() => {
    setColumnNumber(ref.current?.cellIndex ?? null);
  }, []);

  return (
    <td
      ref={ref}
      style={{
        padding: blogSpacing.padding.table.cell,
        fontFamily: blogTypography.bodyFont,
        fontSize: mobile
          ? blogTypography.smallMobile
          : blogTypography.smallDesktop,
        borderRight: columnNumber === 0 ? "1px solid black" : "",
        textAlign: columnNumber === 0 ? "left" : "center",
        verticalAlign: "middle",
        boxShadow: blogShadows.tableCell,
      }}
    >
      {children}
    </td>
  );
}

function Tr({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLTableRowElement>(null);
  const [rowIndex, setRowIndex] = useState(0);

  useEffect(() => {
    setRowIndex(ref.current?.rowIndex ?? 0);
  }, []);

  return (
    <tr
      ref={ref}
      style={{
        backgroundColor:
          rowIndex % 2 === 0
            ? blogColors.backgroundPrimary
            : blogColors.backgroundTable,
      }}
    >
      {children}
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Highlighted block (side-by-side content)                           */
/* ------------------------------------------------------------------ */

export function HighlightedBlock({
  data,
  leftContent,
  rightContent,
}: {
  data?: string[];
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}) {
  let left = leftContent;
  let right = rightContent;

  if (!left && !right && data) {
    const content = data[0];
    const parts = content.split("&&&");
    left = <MarkdownFormatter markdown={parts[0]} />;
    right = (
      <MarkdownFormatter
        markdown={parts[1]}
        backgroundColor={blogColors.backgroundSecondary}
      />
    );
  }

  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setHeight(ref.current?.clientHeight ?? 0);
  }, []);

  return (
    <>
      <div
        ref={ref}
        style={{
          display: "flex",
          position: "absolute",
          left: 0,
          width: "100%",
          backgroundColor: blogColors.backgroundSecondary,
          zIndex: 999,
          alignItems: "start",
          justifyContent: "center",
          paddingLeft: "10vw",
          paddingRight: "10vw",
          boxShadow: blogShadows.highlightedBlock,
          paddingBottom: 0,
          paddingTop: blogSpacing.xxl + 18,
        }}
      >
        <div
          style={{
            width: "50vw",
            display: "flex",
            flexDirection: "column",
            backgroundColor: blogColors.backgroundSecondary,
            position: "sticky",
            top: 150,
            paddingBottom: blogSpacing.lg,
          }}
        >
          {left}
        </div>
        <div
          style={{
            width: "30vw",
            backgroundColor: blogColors.backgroundSecondary,
          }}
        >
          {right}
        </div>
      </div>
      <div
        style={{
          height,
          marginBottom: blogSpacing.xxl + 18,
          marginTop: blogSpacing.xxl + 18,
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Plotly chart code block                                            */
/* ------------------------------------------------------------------ */

export function PlotlyChartCode({
  data,
  backgroundColor,
}: {
  data: string | string[];
  backgroundColor?: string;
}) {
  const displayCategory = useDisplayCategory();
  const mobile = displayCategory === "mobile";
  const plotlyData = safeJsonParse(data);

  if (!plotlyData) return null;

  const layout = plotlyData.layout as Record<string, unknown> | undefined;
  const defaultMargins = { l: 20, r: 20, t: 20, b: 20 };
  const margins = {
    ...defaultMargins,
    ...((layout?.margin as Record<string, number>) || {}),
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        marginBottom: 20,
      }}
    >
      <LazyPlot
        data={(plotlyData.data as Plotly.Data[]) || []}
        layout={{
          ...(layout as Partial<Plotly.Layout>),
          width: mobile ? 400 : undefined,
          height: 600,
          plot_bgcolor: backgroundColor || "transparent",
          paper_bgcolor: backgroundColor || "transparent",
          margin: margins,
          autosize: true,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%", maxWidth: "100%" }}
        useResizeHandler
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main MarkdownFormatter                                             */
/* ------------------------------------------------------------------ */

export function MarkdownFormatter({
  markdown,
  backgroundColor,
  displayCategory: propDisplayCategory,
  hideFootnotes = false,
}: {
  markdown: string;
  backgroundColor?: string;
  displayCategory?: string;
  hideFootnotes?: boolean;
}) {
  const hookDisplayCategory = useDisplayCategory();
  const displayCategory = propDisplayCategory || hookDisplayCategory;
  const mobile = displayCategory === "mobile";

  if (!markdown) return null;

  const components: Components = {
    blockquote: ({ children }) => (
      <blockquote
        style={{
          borderLeft: `4px solid ${blogColors.primary}`,
          paddingLeft: blogSpacing.md,
          margin: `${blogSpacing.lg}px 0`,
          fontStyle: "italic",
          color: blogColors.textSecondary,
          backgroundColor: blogColors.backgroundSecondary,
          padding: `${blogSpacing.sm}px ${blogSpacing.md}px`,
          borderRadius: blogRadius.blockquote,
        }}
      >
        {children}
      </blockquote>
    ),

    p: ({ children }) => (
      <p
        style={{
          fontFamily: blogTypography.bodyFont,
          fontSize: mobile
            ? blogTypography.bodyMobile
            : blogTypography.bodyDesktop,
          backgroundColor,
          lineHeight: blogTypography.bodyLineHeight,
          marginTop: blogSpacing.marginTop.paragraph,
          marginBottom: blogSpacing.marginBottom.paragraph,
          color: blogColors.textPrimary,
        }}
      >
        {children}
      </p>
    ),

    img: ({ src, alt }) => {
      if (!src || typeof src !== "string") return null;
      const transformedSrc = src.startsWith("/images/")
        ? src.replace("/images/", "/assets/")
        : src;

      return (
        <span
          style={{
            display: "block",
            padding: 0,
            marginTop: blogSpacing.marginTop.image,
            marginBottom: blogSpacing.marginBottom.image,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={transformedSrc}
            alt={alt || ""}
            style={{
              width: "100%",
              height: "auto",
              maxWidth: "100%",
              objectFit: "contain",
              borderRadius: blogRadius.md,
              boxShadow: blogShadows.image,
              display: "block",
            }}
          />
          {alt && (
            <span
              style={{
                display: "block",
                fontFamily: blogTypography.bodyFont,
                color: blogColors.anchorLink,
                fontStyle: "italic",
                fontSize: mobile
                  ? blogTypography.smallMobile
                  : blogTypography.smallDesktop,
                marginTop: blogSpacing.sm,
                textAlign: "center",
              }}
            >
              {alt}
            </span>
          )}
        </span>
      );
    },

    ul: ({ children }) => (
      <ul
        style={{
          paddingLeft: blogSpacing.lg,
          marginBottom: blogSpacing.marginBottom.list,
          marginTop: blogSpacing.marginTop.list,
          fontFamily: blogTypography.bodyFont,
          fontSize: mobile
            ? blogTypography.bodyMobile
            : blogTypography.bodyDesktop,
          lineHeight: blogTypography.bodyLineHeight,
          color: blogColors.textPrimary,
        }}
      >
        {children}
      </ul>
    ),

    ol: ({ children }) => (
      <ol
        style={{
          paddingLeft: blogSpacing.lg,
          marginBottom: blogSpacing.marginBottom.list,
          marginTop: blogSpacing.marginTop.list,
          fontFamily: blogTypography.bodyFont,
          fontSize: mobile
            ? blogTypography.bodyMobile
            : blogTypography.bodyDesktop,
          lineHeight: blogTypography.bodyLineHeight,
          color: blogColors.textPrimary,
        }}
      >
        {children}
      </ol>
    ),

    li: ({ children }) => (
      <li
        style={{
          marginLeft: blogSpacing.xs + 2,
          marginBottom: blogSpacing.xs,
          lineHeight: 1.5,
        }}
      >
        {children}
      </li>
    ),

    iframe: ({ src, width, height }) => (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          paddingBottom: blogSpacing.lg,
          width: "100%",
        }}
      >
        <iframe
          title="embedded-content"
          src={src}
          scrolling="no"
          style={{
            width: mobile ? "100%" : width,
            objectFit: "contain",
            height,
            border: "none",
          }}
        />
      </div>
    ),

    strong: ({ children }) => (
      <span
        style={{
          fontWeight: blogFontWeights.semiBold,
          color: blogColors.textHeading,
        }}
      >
        {children}
      </span>
    ),

    a: ({ href, children, className }) => {
      let id: string | undefined;
      let footnoteNumber: number | null = null;
      let isFootnoteRef = false;

      if (href?.startsWith("#user-content-fn-")) {
        id = href.replace("#user-content-fn-", "user-content-fnref-");
        footnoteNumber = parseInt(id?.split("-").pop() || "0", 10);
        isFootnoteRef = true;
      } else if (href?.startsWith("#user-content-fnref-")) {
        id = href.replace("#user-content-fnref-", "user-content-fn-");
      }

      if (className === "cta-button") {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              backgroundColor: blogColors.primary,
              color: "white",
              padding: "12px 24px",
              borderRadius: blogRadius.md,
              textDecoration: "none",
              fontWeight: blogFontWeights.semiBold,
              fontFamily: blogTypography.bodyFont,
              transition: "background-color 0.2s ease",
              border: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = blogColors.primaryHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = blogColors.primary;
            }}
          >
            {children}
          </a>
        );
      }

      return (
        <a
          id={id}
          href={href}
          target={href?.startsWith("#") ? "" : "_blank"}
          rel="noopener noreferrer"
          style={{
            color: blogColors.link,
            textDecoration: "none",
            borderBottom: `1px solid ${blogColors.link}`,
            fontWeight: href?.startsWith("#")
              ? "normal"
              : blogFontWeights.medium,
            transition: "background-color 0.2s ease, color 0.2s ease",
            borderRadius: blogRadius.sm,
            scrollMarginTop: isFootnoteRef ? "80px" : undefined,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = blogColors.link;
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = blogColors.link;
          }}
        >
          {footnoteNumber || children}
        </a>
      );
    },

    h1: ({ children }) => {
      const slug = String(children)
        .replace(/[/,]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      return (
        <div style={{ position: "relative" }}>
          <h1
            id={slug}
            style={{
              marginBottom: blogSpacing.xl,
              marginTop: blogSpacing.marginTop.heading1,
              fontWeight: blogFontWeights.bold,
              color: blogColors.textHeading,
              borderBottom: `1px solid ${blogColors.borderLight}`,
              paddingBottom: blogSpacing.xs,
              fontSize: mobile
                ? blogTypography.h1Mobile
                : blogTypography.h1Desktop,
              scrollMarginTop: "70px",
            }}
          >
            {children}
            <a
              href={`#${slug}`}
              aria-label="Direct link to heading"
              style={{
                position: "absolute",
                marginLeft: "10px",
                opacity: 0,
                fontSize: "0.6em",
                transition: "opacity 0.2s",
                color: blogColors.anchorLink,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              #
            </a>
          </h1>
        </div>
      );
    },

    h2: ({ children }) => {
      const slug = String(children || "")
        .replace(/[/,]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      return (
        <div style={{ position: "relative" }}>
          <h2
            id={slug}
            style={{
              marginBottom: blogSpacing.lg,
              marginTop: blogSpacing.marginTop.heading2,
              fontWeight: blogFontWeights.semiBold,
              color: blogColors.textHeading2,
              fontSize: mobile
                ? blogTypography.h2Mobile
                : blogTypography.h2Desktop,
              borderBottom: `1px solid ${blogColors.borderLight}`,
              paddingBottom: 6,
              scrollMarginTop: "70px",
            }}
          >
            {children}
            <a
              href={`#${slug}`}
              aria-label="Direct link to heading"
              style={{
                position: "absolute",
                marginLeft: blogSpacing.xs,
                opacity: 0,
                fontSize: "0.8em",
                transition: "opacity 0.2s",
                color: blogColors.anchorLink,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              #
            </a>
          </h2>
        </div>
      );
    },

    h3: ({ children }) => {
      const slug = String(children)
        .replace(/[/,]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      return (
        <div style={{ position: "relative" }}>
          <h3
            id={slug}
            style={{
              marginBottom: blogSpacing.md,
              marginTop: blogSpacing.marginTop.heading3,
              fontWeight: blogFontWeights.semiBold,
              color: blogColors.textHeading3,
              fontSize: mobile
                ? blogTypography.h3Mobile
                : blogTypography.h3Desktop,
              scrollMarginTop: "70px",
            }}
          >
            {children}
            <a
              href={`#${slug}`}
              aria-label="Direct link to heading"
              style={{
                position: "absolute",
                marginLeft: "6px",
                opacity: 0,
                fontSize: "0.7em",
                transition: "opacity 0.2s",
                color: blogColors.anchorLink,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              #
            </a>
          </h3>
        </div>
      );
    },

    h4: ({ children }) => {
      const slug = String(children)
        .replace(/[/,]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .toLowerCase();
      return (
        <div style={{ position: "relative" }}>
          <h4
            id={slug}
            style={{
              marginBottom: 14,
              marginTop: blogSpacing.marginTop.heading4,
              fontWeight: blogFontWeights.semiBold,
              color: blogColors.textHeading4,
              fontSize: mobile
                ? blogTypography.h4Mobile
                : blogTypography.h4Desktop,
              scrollMarginTop: "70px",
            }}
          >
            {children}
            <a
              href={`#${slug}`}
              aria-label="Direct link to heading"
              style={{
                position: "absolute",
                marginLeft: "5px",
                opacity: 0,
                fontSize: "0.7em",
                transition: "opacity 0.2s",
                color: blogColors.anchorLink,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
            >
              #
            </a>
          </h4>
        </div>
      );
    },

    section: ({ children, className }) => {
      const filteredChildren = React.Children.toArray(children).filter(
        (child) => {
          const el = child as React.ReactElement<{ id?: string }>;
          return el?.props?.id !== "footnote-label";
        },
      );

      if (className === "footnotes") {
        if (hideFootnotes) return null;
        return (
          <div
            style={{
              borderTop: `1px solid ${blogColors.borderDark}`,
              paddingTop: blogSpacing.xl,
              marginTop: blogSpacing.xxl,
              marginBottom: blogSpacing.lg,
              backgroundColor: blogColors.backgroundSecondary,
              borderRadius: blogRadius.md,
              padding: `${blogSpacing.lg}px ${blogSpacing.md}px`,
              fontSize: mobile
                ? blogTypography.smallMobile
                : blogTypography.smallDesktop,
              color: blogColors.textSecondary,
            }}
          >
            {filteredChildren}
          </div>
        );
      }
      return <section>{children}</section>;
    },

    table: ({ children }) => (
      <table
        style={{
          marginTop: blogSpacing.marginTop.table,
          marginBottom: blogSpacing.marginBottom.table,
          display: "table",
          width: "100%",
          borderCollapse: "separate",
          borderSpacing: 0,
          overflow: "hidden",
          boxShadow: blogShadows.table,
        }}
      >
        {children}
      </table>
    ),

    th: ({ children }) => {
      const displayCategory = useDisplayCategory();
      const mobile = displayCategory === "mobile";
      return (
        <th
          style={{
            padding: blogSpacing.padding.table.header,
            fontFamily: blogTypography.bodyFont,
            fontWeight: blogFontWeights.semiBold,
            fontSize: mobile
              ? blogTypography.smallMobile
              : blogTypography.smallDesktop,
            borderBottom: "1px solid black",
            backgroundColor: blogColors.primary,
            textAlign: "center",
            verticalAlign: "middle",
            color: "white",
          }}
        >
          {children}
        </th>
      );
    },

    td: Td,
    tr: Tr,

    code: ({ children, className }) => {
      const childText = String(children);

      if (className === "language-highlighted-block") {
        return <HighlightedBlock data={[childText]} />;
      }
      if (className === "language-plotly") {
        return <PlotlyChartCode data={childText} />;
      }

      return (
        <code
          style={{
            fontFamily: blogTypography.monoFont,
            padding: blogSpacing.padding.code,
            borderRadius: blogRadius.none,
            backgroundColor: blogColors.backgroundCode,
            fontSize: mobile
              ? blogTypography.smallMobile
              : blogTypography.smallDesktop,
            boxShadow: blogShadows.tableCell,
            position: "relative",
          }}
        >
          {children}
        </code>
      );
    },

    pre: ({ children }) => {
      const codeChild = React.Children.toArray(children).find((child) => {
        const el = child as React.ReactElement<{ className?: string }>;
        return el?.props?.className?.includes("language-");
      });
      const language = (
        codeChild as React.ReactElement<{ className?: string }>
      )?.props?.className?.replace("language-", "");

      return (
        <div
          style={{
            margin: `${blogSpacing.marginBottom.code}px 0`,
            overflow: "hidden",
            backgroundColor: blogColors.backgroundCode,
            border: `1px solid ${blogColors.borderMedium}`,
            boxShadow: blogShadows.codeBlock,
            position: "relative",
          }}
        >
          {language &&
            language !== "highlighted-block" &&
            language !== "plotly" && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  fontSize: blogTypography.smallMobile,
                  color: blogColors.textTertiary,
                  padding: blogSpacing.padding.code,
                  backgroundColor: blogColors.backgroundCodeLabel,
                  borderRadius: blogRadius.none,
                  borderLeft: `1px solid ${blogColors.borderDark}`,
                  borderBottom: `1px solid ${blogColors.borderDark}`,
                }}
              >
                {language}
              </div>
            )}
          <div style={{ padding: blogSpacing.padding.codeBlock }}>
            {children}
          </div>
        </div>
      );
    },
  };

  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {markdown}
    </ReactMarkdown>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline link parser (for footnotes section)                         */
/* ------------------------------------------------------------------ */

function parseInlineLinks(text: string): React.ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: blogColors.link,
          textDecoration: "none",
          borderBottom: `1px solid ${blogColors.link}`,
        }}
      >
        {match[1]}
      </a>,
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/* ------------------------------------------------------------------ */
/*  FootnotesSection (consolidated footnotes for notebooks)            */
/* ------------------------------------------------------------------ */

export function FootnotesSection({
  footnotes,
  displayCategory: propDisplayCategory,
}: {
  footnotes: Record<string, string>;
  displayCategory?: string;
}) {
  const hookDisplayCategory = useDisplayCategory();
  const displayCategory = propDisplayCategory || hookDisplayCategory;
  const mobile = displayCategory === "mobile";

  const sortedKeys = Object.keys(footnotes).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10),
  );

  if (sortedKeys.length === 0) return null;

  return (
    <div
      style={{
        borderTop: `1px solid ${blogColors.borderDark}`,
        paddingTop: blogSpacing.md,
        marginTop: blogSpacing.xxl,
        marginBottom: blogSpacing.lg,
        backgroundColor: blogColors.backgroundSecondary,
        borderRadius: blogRadius.md,
        padding: `${blogSpacing.md}px ${blogSpacing.md}px`,
        fontSize: mobile ? "0.8rem" : "0.85rem",
        color: blogColors.textSecondary,
      }}
    >
      <ol style={{ margin: 0, paddingLeft: blogSpacing.lg }}>
        {sortedKeys.map((key) => (
          <li
            key={key}
            id={`user-content-fn-${key}`}
            style={{
              marginBottom: blogSpacing.xs,
              lineHeight: 1.4,
              scrollMarginTop: "80px",
            }}
          >
            {parseInlineLinks(footnotes[key])}{" "}
            <a
              href={`#user-content-fnref-${key}`}
              style={{
                color: blogColors.link,
                textDecoration: "none",
                fontSize: "0.85em",
              }}
              aria-label="Back to reference"
            >
              ↩
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
