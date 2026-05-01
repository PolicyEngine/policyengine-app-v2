/**
 * MarkdownFormatter Component
 *
 * Renders markdown content with custom styling for blog posts.
 * Ported from old app's MarkdownFormatter.jsx with Mantine styling.
 *
 * Maintains ALL custom renderers:
 * - Headings (h1-h4) with anchor links
 * - Links (internal/external) with footnote support
 * - Images with captions
 * - Code blocks and inline code
 * - Tables with custom styling
 * - Lists (ordered/unordered)
 * - Blockquotes (including Twitter embeds)
 * - Footnotes section
 * - Special code blocks (highlighted-block, plotly charts)
 */

import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import OptimisedImage from '@/components/ui/OptimisedImage';
import type { MarkdownFormatterProps } from '@/types/blog';
import {
  blogColors,
  blogFontWeights,
  blogRadius,
  blogShadows,
  blogSpacing,
  blogTypography,
} from './blogStyles';
import { LazyPlot } from './LazyPlot';
import { isSafeHref } from './safeHref';
import { useDisplayCategory } from './useDisplayCategory';

// Google Fonts URL for code blocks (Roboto Mono). Injected lazily from the
// component so SSR / non-browser environments (vitest jsdom setup, etc.) do
// not hit `document` at module-evaluation time.
const ROBOTO_MONO_HREF =
  'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap';

function useRobotoMonoFont(): void {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    if (document.head.querySelector(`link[href="${ROBOTO_MONO_HREF}"]`)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = ROBOTO_MONO_HREF;
    document.head.appendChild(link);
  }, []);
}

/**
 * Type guard for React elements whose children/props we introspect. Using
 * `React.isValidElement` here lets us drop `as any` casts in the custom
 * renderers — if the node isn't a valid element we return early instead of
 * dereferencing untyped props.
 */
function isReactElement(
  node: React.ReactNode
): node is React.ReactElement<Record<string, unknown>> {
  return React.isValidElement(node);
}

/**
 * Narrowed shape of the `props` object react-markdown exposes on anchor-like
 * elements inside custom renderers. Only the fields actually read below are
 * listed; anything else is kept as an index signature so we don't need `any`.
 */
interface AnchorLikeElementProps {
  href?: string;
  className?: string;
  id?: string;
  children?: React.ReactNode;
  node?: {
    tagName?: string;
    properties?: { href?: string };
  };
  [key: string]: unknown;
}

function elementProps(node: React.ReactNode): AnchorLikeElementProps | null {
  if (!isReactElement(node)) {
    return null;
  }
  return node.props as AnchorLikeElementProps;
}

/**
 * Parse JSON safely with fallback
 */
function safeJsonParse(data: string | string[]): any {
  try {
    const jsonString = Array.isArray(data) ? data[0] : data;
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (err) {
    console.error('[PLOTLY] Failed to parse JSON:', err);
    return null;
  }
}

/**
 * Custom Table Cell Component
 */
function Td({ children }: { children?: React.ReactNode }) {
  const displayCategory = useDisplayCategory();
  const mobile = displayCategory === 'mobile';
  const ref = useRef<HTMLTableCellElement>(null);
  const [columnNumber, setColumnNumber] = useState<number | null>(null);

  // Match the website/ copy: `ref.current?.cellIndex` is not a reactive value,
  // so listing it as a dep is misleading. Run once after mount (and because
  // DOM geometry is being measured, `useLayoutEffect` would be marginally
  // better, but we keep `useEffect` to avoid SSR hydration warnings).
  useEffect(() => {
    setColumnNumber(ref.current?.cellIndex ?? null);
  }, []);

  return (
    <td
      ref={ref}
      style={{
        padding: blogSpacing.padding.table.cell,
        fontFamily: blogTypography.bodyFont,
        fontSize: mobile ? blogTypography.smallMobile : blogTypography.smallDesktop,
        borderRight: columnNumber === 0 ? '1px solid black' : '',
        textAlign: columnNumber === 0 ? 'left' : 'center',
        verticalAlign: 'middle',
        boxShadow: blogShadows.tableCell,
      }}
    >
      {children}
    </td>
  );
}

/**
 * Custom Table Row Component
 */
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
          rowIndex % 2 === 0 ? blogColors.backgroundPrimary : blogColors.backgroundTable,
      }}
    >
      {children}
    </tr>
  );
}

/**
 * Highlighted Block Component (side-by-side content)
 */
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
    const parts = content.split('&&&');
    if (parts.length !== 2) {
      // Malformed highlighted-block: fall back to rendering the single pane
      // so we still show the content instead of silently breaking the layout.
      console.warn(
        `[HighlightedBlock] Expected 2 parts separated by "&&&" but got ${parts.length}; ` +
          'rendering as a single column.'
      );
      left = <MarkdownFormatter markdown={content} />;
      right = null;
    } else {
      left = <MarkdownFormatter markdown={parts[0]} />;
      right = (
        <MarkdownFormatter markdown={parts[1]} backgroundColor={blogColors.backgroundSecondary} />
      );
    }
  }

  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setHeight(ref.current?.clientHeight ?? 0);
  }, []);

  return (
    <>
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          left: 0,
          width: '100%',
          backgroundColor: blogColors.backgroundSecondary,
          zIndex: 999,
          alignItems: 'start',
          justifyContent: 'center',
          paddingLeft: '10vw',
          paddingRight: '10vw',
          boxShadow: blogShadows.highlightedBlock,
          paddingBottom: 0,
          paddingTop: blogSpacing.xxl + 18,
        }}
        ref={ref}
      >
        <div
          style={{
            width: '50vw',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: blogColors.backgroundSecondary,
            position: 'sticky',
            top: 150,
            paddingBottom: blogSpacing.lg,
          }}
        >
          {left}
        </div>
        <div
          style={{
            width: '30vw',
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

/**
 * Plotly Chart Code Block Component
 * Copied as closely as possible from app v1's MarkdownFormatter.jsx
 */
export function PlotlyChartCode({
  data,
  backgroundColor,
}: {
  data: string | string[];
  backgroundColor?: string;
}) {
  const displayCategory = useDisplayCategory();
  const mobile = displayCategory === 'mobile';

  const plotlyData = safeJsonParse(data);

  if (!plotlyData) {
    return null;
  }

  // Use the margins defined in the plotly data, falling back to reasonable defaults
  // Don't override what's in the data, but ensure we have at least some margin
  const defaultMargins = { l: 20, r: 20, t: 20, b: 20 };
  const margins = { ...defaultMargins, ...(plotlyData.layout?.margin || {}) };

  return (
    <div
      style={{
        paddingLeft: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: 20,
      }}
    >
      <LazyPlot
        data={plotlyData.data}
        layout={{
          ...plotlyData.layout,
          width: mobile ? 400 : undefined,
          height: 600,
          plot_bgcolor: backgroundColor || 'transparent',
          paper_bgcolor: backgroundColor || 'transparent',
          margin: margins,
          autosize: true,
        }}
        config={{
          displayModeBar: false,
          responsive: true,
        }}
        style={{
          width: '100%',
          maxWidth: '100%',
        }}
        useResizeHandler
      />
    </div>
  );
}

/**
 * Main MarkdownFormatter Component
 */
export function MarkdownFormatter({
  markdown,
  backgroundColor,
  displayCategory: propDisplayCategory,
  hideFootnotes = false,
}: MarkdownFormatterProps & {
  backgroundColor?: string;
  dict?: Record<string, any>;
  pSize?: number;
  hideFootnotes?: boolean;
}) {
  const hookDisplayCategory = useDisplayCategory();
  const displayCategory = propDisplayCategory || hookDisplayCategory;
  const mobile = displayCategory === 'mobile';

  useRobotoMonoFont();

  if (!markdown) {
    return null;
  }

  const components: Components = {
    // Blockquote - includes Twitter embed detection
    blockquote: ({ children }) => {
      // Check if this is a Twitter embed
      const childArray = React.Children.toArray(children);
      const anchorTag = childArray.find((child) => {
        const props = elementProps(child);
        return typeof props?.href === 'string' && props.href.startsWith('https://twitter.com/');
      });
      const anchorHref = elementProps(anchorTag)?.href;
      const tweetId =
        typeof anchorHref === 'string' ? anchorHref.split('/').pop()?.split('?')[0] : undefined;

      if (tweetId) {
        // Twitter embed would go here - for now just render as blockquote
        return (
          <blockquote
            style={{
              borderLeft: `4px solid ${blogColors.primary}`,
              paddingLeft: blogSpacing.md,
              margin: `${blogSpacing.lg}px 0`,
              fontStyle: 'italic',
              color: blogColors.textSecondary,
              backgroundColor: blogColors.backgroundSecondary,
              padding: `${blogSpacing.sm}px ${blogSpacing.md}px`,
              borderRadius: blogRadius.blockquote,
            }}
          >
            {children}
          </blockquote>
        );
      }

      return (
        <blockquote
          style={{
            borderLeft: `4px solid ${blogColors.primary}`,
            paddingLeft: blogSpacing.md,
            margin: `${blogSpacing.lg}px 0`,
            fontStyle: 'italic',
            color: blogColors.textSecondary,
            backgroundColor: blogColors.backgroundSecondary,
            padding: `${blogSpacing.sm}px ${blogSpacing.md}px`,
            borderRadius: blogRadius.blockquote,
          }}
        >
          {children}
        </blockquote>
      );
    },

    // Paragraph
    p: ({ children }) => (
      <p
        style={{
          fontFamily: blogTypography.bodyFont,
          fontSize: mobile ? blogTypography.bodyMobile : blogTypography.bodyDesktop,
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

    // Images with captions
    // Note: Using span instead of div to avoid "p cannot contain div" error
    img: ({ src, alt }) => {
      if (!src) {
        console.warn('Image with no src:', { alt });
        return null;
      }

      // Transform /images/ paths to /assets/ paths
      // Old markdown references /images/posts/ and /images/authors/
      // But we store them in /assets/posts/ and /assets/authors/
      const transformedSrc = src.startsWith('/images/') ? src.replace('/images/', '/assets/') : src;

      return (
        <span
          style={{
            display: 'block',
            padding: 0,
            marginTop: blogSpacing.marginTop.image,
            marginBottom: blogSpacing.marginBottom.image,
          }}
        >
          <OptimisedImage
            src={transformedSrc}
            alt={alt || ''}
            width={750}
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              borderRadius: blogRadius.md,
              boxShadow: blogShadows.image,
              display: 'block',
            }}
            onError={(e) => {
              console.error('Failed to load image:', transformedSrc);
              e.currentTarget.style.border = '2px solid red';
              e.currentTarget.style.minHeight = '100px';
              e.currentTarget.alt = `Failed to load: ${transformedSrc}`;
            }}
          />
          {alt && (
            <span
              style={{
                display: 'block',
                fontFamily: blogTypography.bodyFont,
                color: blogColors.anchorLink,
                fontStyle: 'italic',
                fontSize: mobile ? blogTypography.smallMobile : blogTypography.smallDesktop,
                marginTop: blogSpacing.sm,
                textAlign: 'center',
              }}
            >
              {alt}
            </span>
          )}
        </span>
      );
    },

    // Unordered list
    ul: ({ children }) => (
      <ul
        style={{
          paddingLeft: blogSpacing.lg,
          marginBottom: blogSpacing.marginBottom.list,
          marginTop: blogSpacing.marginTop.list,
          fontFamily: blogTypography.bodyFont,
          fontSize: mobile ? blogTypography.bodyMobile : blogTypography.bodyDesktop,
          lineHeight: blogTypography.bodyLineHeight,
          color: blogColors.textPrimary,
        }}
      >
        {children}
      </ul>
    ),

    // Ordered list
    ol: ({ children }) => (
      <ol
        style={{
          paddingLeft: blogSpacing.lg,
          marginBottom: blogSpacing.marginBottom.list,
          marginTop: blogSpacing.marginTop.list,
          fontFamily: blogTypography.bodyFont,
          fontSize: mobile ? blogTypography.bodyMobile : blogTypography.bodyDesktop,
          lineHeight: blogTypography.bodyLineHeight,
          color: blogColors.textPrimary,
        }}
      >
        {children}
      </ol>
    ),

    // List item with footnote support
    li: ({ children }) => {
      let value: string | null = null;
      let validValue = false;

      try {
        const childArray = React.Children.toArray(children);
        const pChild = childArray.find((child) => elementProps(child)?.node?.tagName === 'p');
        const pChildren = elementProps(pChild)?.children;
        const pChildrenArray = React.Children.toArray(pChildren);
        const aChild = pChildrenArray.find((child) => elementProps(child)?.node?.tagName === 'a');
        const footnoteLinkBack = elementProps(aChild)?.node?.properties?.href;
        const extractedValue =
          typeof footnoteLinkBack === 'string' ? (footnoteLinkBack.split('-').pop() ?? '') : '';
        value = extractedValue;
        validValue = /^-?\d+$/.test(extractedValue);
      } catch {
        // Ignore parsing errors
      }

      return (
        <li
          style={{
            marginLeft: blogSpacing.xs + 2,
            marginBottom: blogSpacing.xs,
            lineHeight: 1.5,
          }}
          value={validValue && value ? parseInt(value, 10) : undefined}
        >
          {children}
        </li>
      );
    },

    // Iframe for embedded content
    iframe: ({ src, width, height }) => (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: blogSpacing.lg,
          width: '100%',
        }}
      >
        <iframe
          title="embedded-content"
          src={src}
          scrolling="no"
          style={{
            width: mobile ? '100%' : width,
            objectFit: 'contain',
            height,
            border: 'none',
          }}
        />
      </div>
    ),

    // Strong/bold text
    strong: ({ children }) => (
      <span style={{ fontWeight: blogFontWeights.semiBold, color: blogColors.textHeading }}>
        {children}
      </span>
    ),

    // Links with footnote support and CTA button styling
    a: ({ href, children, className }) => {
      let id: string | undefined;
      let footnoteNumber: number | null = null;
      let isFootnoteRef = false;

      if (href?.startsWith('#user-content-fn-')) {
        id = href.replace('#user-content-fn-', 'user-content-fnref-');
        footnoteNumber = parseInt(id?.split('-').pop() || '0', 10);
        isFootnoteRef = true;
      } else if (href?.startsWith('#user-content-fnref-')) {
        id = href.replace('#user-content-fnref-', 'user-content-fn-');
      }

      // Never pass untrusted schemes (javascript:, data:, vbscript:, …) to
      // the anchor href. If the href is unsafe, fall through to rendering
      // the link text as a plain span so the content is still visible.
      const safeHref = href && isSafeHref(href) ? href : undefined;

      // CTA button styling for links with class="cta-button"
      if (className === 'cta-button') {
        if (!safeHref) {
          return (
            <span
              style={{
                display: 'inline-block',
                color: blogColors.textSecondary,
                fontWeight: blogFontWeights.semiBold,
                fontFamily: blogTypography.bodyFont,
              }}
            >
              {children}
            </span>
          );
        }
        return (
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              backgroundColor: blogColors.primary,
              color: 'white',
              padding: '12px 24px',
              borderRadius: blogRadius.md,
              textDecoration: 'none',
              fontWeight: blogFontWeights.semiBold,
              fontFamily: blogTypography.bodyFont,
              transition: 'background-color 0.2s ease',
              border: 'none',
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

      if (!safeHref) {
        return <span style={{ color: blogColors.textSecondary }}>{children}</span>;
      }

      return (
        <a
          id={id}
          href={safeHref}
          target={safeHref.startsWith('#') ? '' : '_blank'}
          rel="noopener noreferrer"
          style={{
            color: blogColors.link,
            textDecoration: 'none',
            borderBottom: `1px solid ${blogColors.link}`,
            fontWeight: safeHref.startsWith('#') ? 'normal' : blogFontWeights.medium,
            transition: 'background-color 0.2s ease, color 0.2s ease',
            borderRadius: blogRadius.sm,
            // Add scroll margin for footnote references so they don't hide behind navbar
            scrollMarginTop: isFootnoteRef ? '80px' : undefined,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = blogColors.link;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = blogColors.link;
          }}
        >
          {footnoteNumber || children}
        </a>
      );
    },

    // H1 with anchor link
    h1: ({ children }) => {
      const headerText = String(children);
      const slug = headerText.replace(/[/,]/g, '').trim().replace(/\s+/g, '-').toLowerCase();

      return (
        <div style={{ position: 'relative' }}>
          <h1
            id={slug}
            style={{
              marginBottom: blogSpacing.xl,
              marginTop: blogSpacing.marginTop.heading1,
              fontWeight: blogFontWeights.bold,
              color: blogColors.textHeading,
              borderBottom: `1px solid ${blogColors.borderLight}`,
              paddingBottom: blogSpacing.xs,
              fontSize: mobile ? blogTypography.h1Mobile : blogTypography.h1Desktop,
              scrollMarginTop: '70px',
            }}
          >
            {children}
            <a
              href={`#${slug}`}
              aria-label="Direct link to heading"
              style={{
                position: 'absolute',
                marginLeft: '10px',
                opacity: 0,
                fontSize: '0.6em',
                transition: 'opacity 0.2s',
                color: blogColors.anchorLink,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              #
            </a>
          </h1>
        </div>
      );
    },

    // H2 with anchor link
    h2: ({ children }) => {
      const headerText = String(children || '');
      const slug = headerText.replace(/[/,]/g, '').trim().replace(/\s+/g, '-').toLowerCase();

      return (
        <div style={{ position: 'relative' }}>
          <h2
            id={slug}
            style={{
              marginBottom: blogSpacing.lg,
              marginTop: blogSpacing.marginTop.heading2,
              fontWeight: blogFontWeights.semiBold,
              color: blogColors.textHeading2,
              fontSize: mobile ? blogTypography.h2Mobile : blogTypography.h2Desktop,
              borderBottom: `1px solid ${blogColors.borderLight}`,
              paddingBottom: 6,
              scrollMarginTop: '70px',
            }}
          >
            {children}
            <a
              href={`#${slug}`}
              aria-label="Direct link to heading"
              style={{
                position: 'absolute',
                marginLeft: blogSpacing.xs,
                opacity: 0,
                fontSize: '0.8em',
                transition: 'opacity 0.2s',
                color: blogColors.anchorLink,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              #
            </a>
          </h2>
        </div>
      );
    },

    // H3 with anchor link
    h3: ({ children }) => {
      const headerText = String(children);
      const slug = headerText.replace(/[/,]/g, '').trim().replace(/\s+/g, '-').toLowerCase();

      return (
        <div style={{ position: 'relative' }}>
          <h3
            id={slug}
            style={{
              marginBottom: blogSpacing.md,
              marginTop: blogSpacing.marginTop.heading3,
              fontWeight: blogFontWeights.semiBold,
              color: blogColors.textHeading3,
              fontSize: mobile ? blogTypography.h3Mobile : blogTypography.h3Desktop,
              scrollMarginTop: '70px',
            }}
          >
            {children}
            <a
              href={`#${slug}`}
              aria-label="Direct link to heading"
              style={{
                position: 'absolute',
                marginLeft: '6px',
                opacity: 0,
                fontSize: '0.7em',
                transition: 'opacity 0.2s',
                color: blogColors.anchorLink,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              #
            </a>
          </h3>
        </div>
      );
    },

    // H4 with anchor link
    h4: ({ children }) => {
      const headerText = String(children);
      const slug = headerText.replace(/[/,]/g, '').trim().replace(/\s+/g, '-').toLowerCase();

      return (
        <div style={{ position: 'relative' }}>
          <h4
            id={slug}
            style={{
              marginBottom: 14,
              marginTop: blogSpacing.marginTop.heading4,
              fontWeight: blogFontWeights.semiBold,
              color: blogColors.textHeading4,
              fontSize: mobile ? blogTypography.h4Mobile : blogTypography.h4Desktop,
              scrollMarginTop: '70px',
            }}
          >
            {children}
            <a
              href={`#${slug}`}
              aria-label="Direct link to heading"
              style={{
                position: 'absolute',
                marginLeft: '5px',
                opacity: 0,
                fontSize: '0.7em',
                transition: 'opacity 0.2s',
                color: blogColors.anchorLink,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              #
            </a>
          </h4>
        </div>
      );
    },

    // Footnotes section
    section: ({ children, className }) => {
      const filteredChildren = React.Children.toArray(children).filter(
        (child) => elementProps(child)?.id !== 'footnote-label'
      );

      if (className === 'footnotes') {
        // Hide footnotes section when requested (for notebooks where we consolidate at end)
        if (hideFootnotes) {
          return null;
        }

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
              fontSize: mobile ? blogTypography.smallMobile : blogTypography.smallDesktop,
              color: blogColors.textSecondary,
            }}
          >
            {filteredChildren}
          </div>
        );
      }

      return <section>{children}</section>;
    },

    // Table
    table: ({ children }) => (
      <table
        style={{
          marginTop: blogSpacing.marginTop.table,
          marginBottom: blogSpacing.marginBottom.table,
          display: 'table',
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          overflow: 'hidden',
          boxShadow: blogShadows.table,
        }}
      >
        {children}
      </table>
    ),

    // Table header
    th: ({ children }) => (
      <th
        style={{
          padding: blogSpacing.padding.table.header,
          fontFamily: blogTypography.bodyFont,
          fontWeight: blogFontWeights.semiBold,
          fontSize: mobile ? blogTypography.smallMobile : blogTypography.smallDesktop,
          borderBottom: '1px solid black',
          backgroundColor: blogColors.primary,
          textAlign: 'center',
          verticalAlign: 'middle',
          color: 'white',
        }}
      >
        {children}
      </th>
    ),

    // Table data and row use custom components
    td: Td,
    tr: Tr,

    // Code (inline and special blocks)
    code: ({ children, className }) => {
      const childText = String(children);

      // Special code block types
      if (className === 'language-highlighted-block') {
        return <HighlightedBlock data={[childText]} />;
      }

      if (className === 'language-plotly') {
        return <PlotlyChartCode data={childText} />;
      }

      // Regular inline code
      return (
        <code
          style={{
            fontFamily: blogTypography.monoFont,
            padding: blogSpacing.padding.code,
            borderRadius: blogRadius.none,
            backgroundColor: blogColors.backgroundCode,
            fontSize: mobile ? blogTypography.smallMobile : blogTypography.smallDesktop,
            boxShadow: blogShadows.tableCell,
            position: 'relative',
          }}
        >
          {children}
        </code>
      );
    },

    // Pre (code blocks)
    pre: ({ children }) => {
      const codeChild = React.Children.toArray(children).find((child) => {
        const className = elementProps(child)?.className;
        return typeof className === 'string' && className.includes('language-');
      });
      const codeClassName = elementProps(codeChild)?.className;
      const language =
        typeof codeClassName === 'string' ? codeClassName.replace('language-', '') : undefined;

      return (
        <div
          style={{
            margin: `${blogSpacing.marginBottom.code}px 0`,
            overflow: 'hidden',
            backgroundColor: blogColors.backgroundCode,
            border: `1px solid ${blogColors.borderMedium}`,
            boxShadow: blogShadows.codeBlock,
            position: 'relative',
          }}
        >
          {language && language !== 'highlighted-block' && language !== 'plotly' && (
            <div
              style={{
                position: 'absolute',
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
          <div style={{ padding: blogSpacing.padding.codeBlock }}>{children}</div>
        </div>
      );
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
      {markdown}
    </ReactMarkdown>
  );
}

/**
 * Parse inline markdown links [text](url) to React elements
 * Lightweight alternative to full MarkdownFormatter for simple inline content
 */
function parseInlineLinks(text: string): React.ReactNode[] {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add the link
    parts.push(
      isSafeHref(match[2]) ? (
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: blogColors.link,
            textDecoration: 'none',
            borderBottom: `1px solid ${blogColors.link}`,
          }}
        >
          {match[1]}
        </a>
      ) : (
        <span key={match.index}>{match[1]}</span>
      )
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last link
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * FootnotesSection Component
 * Renders a consolidated footnotes section for notebooks.
 * Creates elements with the correct IDs that remark-gfm's footnote references link to.
 */
export function FootnotesSection({
  footnotes,
  displayCategory: propDisplayCategory,
}: {
  footnotes: Record<string, string>;
  displayCategory?: string;
}) {
  const hookDisplayCategory = useDisplayCategory();
  const displayCategory = propDisplayCategory || hookDisplayCategory;
  const mobile = displayCategory === 'mobile';

  const sortedKeys = Object.keys(footnotes).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

  if (sortedKeys.length === 0) {
    return null;
  }

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
        fontSize: mobile ? '0.8rem' : '0.85rem',
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
              scrollMarginTop: '80px',
            }}
          >
            {parseInlineLinks(footnotes[key])}{' '}
            <a
              href={`#user-content-fnref-${key}`}
              style={{
                color: blogColors.link,
                textDecoration: 'none',
                fontSize: '0.85em',
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
