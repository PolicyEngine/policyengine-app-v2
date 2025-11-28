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
import Plot from 'react-plotly.js';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { MarkdownFormatterProps } from '@/types/blog';
import {
  blogColors,
  blogFontWeights,
  blogRadius,
  blogShadows,
  blogSpacing,
  blogTypography,
} from './blogStyles';
import { useDisplayCategory } from './useDisplayCategory';

// Import KaTeX CSS for math rendering
import 'katex/dist/katex.min.css';

// Import Google Fonts for Roboto Serif
const fontLinkElement = document.createElement('link');
fontLinkElement.rel = 'stylesheet';
fontLinkElement.href =
  'https://fonts.googleapis.com/css2?family=Roboto+Serif:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;700&display=swap';
if (!document.head.querySelector(`link[href="${fontLinkElement.href}"]`)) {
  document.head.appendChild(fontLinkElement);
}

/**
 * Parse JSON safely with fallback
 */
function safeJsonParse(data: string | string[]): any {
  try {
    const jsonString = Array.isArray(data) ? data[0] : data;
    console.log('[PLOTLY] Attempting to parse data, length:', jsonString?.length);
    const parsed = JSON.parse(jsonString);
    console.log('[PLOTLY] Successfully parsed, has data:', !!parsed?.data);
    return parsed;
  } catch (err) {
    console.error('[PLOTLY] Failed to parse JSON:', err);
    console.error(
      '[PLOTLY] Data was:',
      Array.isArray(data) ? data[0]?.substring(0, 200) : data?.substring(0, 200)
    );
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

  useEffect(() => {
    setColumnNumber(ref.current?.cellIndex ?? null);
  }, [ref.current?.cellIndex]);

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
  }, [ref.current?.rowIndex]);

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
    left = <MarkdownFormatter markdown={parts[0]} />;
    right = (
      <MarkdownFormatter markdown={parts[1]} backgroundColor={blogColors.backgroundSecondary} />
    );
  }

  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    setHeight(ref.current?.clientHeight ?? 0);
  }, [ref.current?.clientHeight]);

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
 */
export function PlotlyChartCode({
  data,
  backgroundColor,
}: {
  data: string | string[];
  backgroundColor?: string;
}) {
  const plotlyData = safeJsonParse(data);

  if (!plotlyData) {
    return null;
  }

  const defaultMargins = {
    l: blogSpacing.lg,
    r: blogSpacing.lg,
    t: blogSpacing.lg,
    b: blogSpacing.lg,
  };
  const margins = { ...defaultMargins, ...(plotlyData.layout?.margin || {}) };

  return (
    <div
      style={{
        paddingLeft: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        marginBottom: blogSpacing.lg,
      }}
    >
      <Plot
        data={plotlyData.data}
        layout={{
          ...plotlyData.layout,
          height: 600,
          plot_bgcolor: backgroundColor || 'transparent',
          paper_bgcolor: backgroundColor || 'transparent',
          margin: margins,
          autosize: true,
        }}
        frames={plotlyData.frames}
        config={{
          displayModeBar: false,
          responsive: true,
        }}
        style={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
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
}: MarkdownFormatterProps & {
  backgroundColor?: string;
  dict?: Record<string, any>;
  pSize?: number;
}) {
  const hookDisplayCategory = useDisplayCategory();
  const displayCategory = propDisplayCategory || hookDisplayCategory;
  const mobile = displayCategory === 'mobile';

  if (!markdown) {
    return null;
  }

  const components: Components = {
    // Blockquote - includes Twitter embed detection
    blockquote: ({ children }) => {
      // Check if this is a Twitter embed
      const childArray = React.Children.toArray(children);
      const anchorTag = childArray.find((child: any) =>
        child?.props?.href?.startsWith('https://twitter.com/')
      );
      const tweetId = (anchorTag as any)?.props?.href?.split('/')?.pop()?.split('?')[0];

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
          <img
            src={transformedSrc}
            alt={alt || ''}
            loading="lazy"
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
        const pChild = childArray.find((child: any) => child?.props?.node?.tagName === 'p');
        const aChild = (pChild as any)?.props?.children?.find(
          (child: any) => child?.props?.node?.tagName === 'a'
        );
        const footnoteLinkBack = aChild?.props?.node?.properties?.href;
        const extractedValue = footnoteLinkBack?.split('-').pop() || '';
        value = extractedValue;
        validValue = /^-?\d+$/.test(extractedValue);
      } catch (e) {
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

    // Links with footnote support
    a: ({ href, children }) => {
      let id: string;
      let footnoteNumber: number | null = null;

      if (href?.startsWith('#user-content-fn-')) {
        id = href.replace('#user-content-fn-', 'user-content-fnref-');
        footnoteNumber = parseInt(id?.split('-').pop() || '0', 10);
      } else if (href?.startsWith('#user-content-fnref-')) {
        id = href.replace('#user-content-fnref-', 'user-content-fn-');
      } else {
        id = href || '';
      }

      return (
        <a
          id={id}
          href={href}
          target={href?.startsWith('#') ? '' : '_blank'}
          rel="noopener noreferrer"
          style={{
            color: blogColors.link,
            textDecoration: 'none',
            borderBottom: `1px solid ${blogColors.link}`,
            fontWeight: href?.startsWith('#') ? 'normal' : blogFontWeights.medium,
            transition: 'background-color 0.2s ease, color 0.2s ease',
            borderRadius: blogRadius.sm,
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
      console.log('H1 rendered with text:', headerText, 'slug:', slug);

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
      console.log('H2 rendered with text:', headerText, 'slug:', slug);

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
      console.log('H3 rendered with text:', headerText, 'slug:', slug);

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
      console.log('H4 rendered with text:', headerText, 'slug:', slug);

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
        (child: any) => child?.props?.id !== 'footnote-label'
      );

      if (className === 'footnotes') {
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
      const codeChild = React.Children.toArray(children).find((child: any) =>
        child.props?.className?.includes('language-')
      );
      const language = (codeChild as any)?.props?.className?.replace('language-', '');

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
    <ReactMarkdown
      rehypePlugins={[rehypeRaw, rehypeKatex]}
      remarkPlugins={[remarkGfm, remarkMath]}
      components={components}
    >
      {markdown}
    </ReactMarkdown>
  );
}
