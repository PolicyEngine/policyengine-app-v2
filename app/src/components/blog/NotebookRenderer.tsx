/**
 * NotebookRenderer Component
 *
 * Renders Jupyter notebook content in blog articles.
 * Handles different cell types (markdown, code) and output formats
 * (plain text, Plotly charts, HTML, markdown).
 *
 * Ported from old app's BlogPage.jsx notebook handling.
 */

import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import type { Notebook, NotebookCell as NotebookCellType, PlotlyData } from '@/types/blog';
import {
  extractNotebookFootnotes,
  hasFootnoteReferences,
  parseJSONSafe,
} from '@/utils/notebookUtils';
import { blogColors, blogSpacing, blogTypography } from './blogStyles';
import { FootnotesSection, HighlightedBlock, MarkdownFormatter, PlotlyChartCode } from './MarkdownFormatter';
import { useDisplayCategory } from './useDisplayCategory';

/**
 * Build footnote definitions markdown to append to cells with references
 */
function buildFootnotesMarkdown(footnotes: Record<string, string>): string {
  const sortedKeys = Object.keys(footnotes).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  if (sortedKeys.length === 0) {
    return '';
  }
  return sortedKeys.map((key) => `[^${key}]: ${footnotes[key]}`).join('\n\n');
}

interface NotebookRendererProps {
  notebook: Notebook;
  displayCategory?: string;
}

/**
 * Main NotebookRenderer component
 * Iterates through notebook cells and renders them appropriately
 * Consolidates footnotes at the end of the article (above author profile)
 */
export function NotebookRenderer({ notebook, displayCategory: propDisplayCategory }: NotebookRendererProps) {
  const hookDisplayCategory = useDisplayCategory();
  const displayCategory = propDisplayCategory || hookDisplayCategory;

  // Memoize footnote extraction to avoid recomputing on every render
  const { footnotes, hasFootnotes, footnotesMarkdown } = useMemo(() => {
    if (!notebook?.cells) {
      return { footnotes: {}, hasFootnotes: false, footnotesMarkdown: '' };
    }
    const extractedFootnotes = extractNotebookFootnotes(notebook);
    const hasAnyFootnotes = Object.keys(extractedFootnotes).length > 0;
    const markdown = buildFootnotesMarkdown(extractedFootnotes);
    return { footnotes: extractedFootnotes, hasFootnotes: hasAnyFootnotes, footnotesMarkdown: markdown };
  }, [notebook]);

  if (!notebook?.cells) {
    return null;
  }

  const renderCell = (cell: NotebookCellType, index: number) => {
    // Handle highlighted-left tag (side-by-side content on desktop)
    if (cell.metadata?.tags?.includes('highlighted-left') && displayCategory === 'desktop') {
      const nextCell = notebook.cells[index + 1];
      if (nextCell && cell.outputs?.[0]?.data?.['text/plain']) {
        const currentCellData = cell.outputs[0].data['text/plain'];
        const dataString = Array.isArray(currentCellData) ? currentCellData[0] : currentCellData;
        try {
          const parsedData = parseJSONSafe(dataString as string);
          let nextCellMarkdown = nextCell.source.join('');
          // If cell has footnote references, append definitions so links work
          const cellHasRefs = hasFootnoteReferences(nextCellMarkdown);
          if (cellHasRefs && footnotesMarkdown) {
            nextCellMarkdown = `${nextCellMarkdown}\n\n${footnotesMarkdown}`;
          }
          return (
            <HighlightedBlock
              key={`cell-${index}`}
              leftContent={
                <PlotlyChartCode
                  data={JSON.stringify(parsedData)}
                  backgroundColor={blogColors.backgroundSecondary}
                />
              }
              rightContent={
                <MarkdownFormatter
                  markdown={nextCellMarkdown}
                  hideFootnotes={hasFootnotes && cellHasRefs}
                />
              }
            />
          );
        } catch (e) {
          console.error('Failed to parse highlighted-left cell data:', e);
        }
      }
    }

    // Skip highlighted-right cells (they're rendered as part of highlighted-left)
    if (cell.metadata?.tags?.includes('highlighted-right') && displayCategory === 'desktop') {
      return null;
    }

    // Render markdown cells
    if (cell.cell_type === 'markdown') {
      let cellMarkdown = cell.source.join('');
      // If cell has footnote references, append definitions so remark-gfm creates clickable links
      const cellHasRefs = hasFootnoteReferences(cellMarkdown);
      if (cellHasRefs && footnotesMarkdown) {
        cellMarkdown = `${cellMarkdown}\n\n${footnotesMarkdown}`;
      }
      return (
        <MarkdownFormatter
          key={`cell-${index}`}
          markdown={cellMarkdown}
          hideFootnotes={hasFootnotes && cellHasRefs}
        />
      );
    }

    // Render code cells
    if (cell.cell_type === 'code') {
      return <NotebookCell key={`cell-${index}`} cell={cell} />;
    }

    // Fallback for unknown cell types
    return (
      <pre key={`cell-${index}`} style={{ color: blogColors.textSecondary }}>
        {JSON.stringify(cell, null, 2)}
      </pre>
    );
  };

  return (
    <>
      {notebook.cells.map(renderCell)}
      {/* Render consolidated footnotes at the end */}
      {hasFootnotes && <FootnotesSection footnotes={footnotes} displayCategory={displayCategory} />}
    </>
  );
}

/**
 * NotebookCell component
 * Renders a single code cell with its outputs
 * Prioritizes richer output types (plotly > markdown > html > plain)
 */
function NotebookCell({ cell }: { cell: NotebookCellType }) {
  const outputCell = cell.outputs?.[0]?.data;

  if (!outputCell) {
    // No output - just skip (we don't show code input)
    return null;
  }

  // Prioritize output types - prefer richer formats over plain text
  // This is important because cells often have multiple output types
  if (outputCell['application/vnd.plotly.v1+json']) {
    return <NotebookOutputPlotly data={outputCell['application/vnd.plotly.v1+json']} />;
  }

  if (outputCell['text/markdown']) {
    return <NotebookOutputMarkdown data={outputCell['text/markdown']} />;
  }

  if (outputCell['text/html']) {
    return <NotebookOutputHTML data={outputCell['text/html']} />;
  }

  if (outputCell['text/plain']) {
    return <NotebookOutputPlain data={outputCell['text/plain']} />;
  }

  // Unknown output type - show first available
  const outputType = Object.keys(outputCell)[0];
  return (
    <p style={{ color: blogColors.textSecondary, fontStyle: 'italic' }}>
      Unknown output type: {outputType}
    </p>
  );
}

/**
 * Renders plain text output from notebook cells
 */
function NotebookOutputPlain({ data }: { data: string | string[] }) {
  try {
    const processedData = typeof data === 'string' ? data : data[0];
    const content = parseJSONSafe(processedData);

    // If it's a simple string or number, render it
    if (typeof content === 'string' || typeof content === 'number') {
      return (
        <p
          style={{
            fontFamily: blogTypography.bodyFont,
            color: blogColors.textPrimary,
            marginBottom: blogSpacing.md,
          }}
        >
          {String(content)}
        </p>
      );
    }

    // Otherwise stringify the result
    return (
      <pre
        style={{
          fontFamily: blogTypography.monoFont,
          backgroundColor: blogColors.backgroundCode,
          padding: blogSpacing.md,
          overflow: 'auto',
          marginBottom: blogSpacing.md,
        }}
      >
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  } catch (e) {
    console.error('Failed to parse plain output:', e, data);
    return (
      <pre
        style={{
          fontFamily: blogTypography.monoFont,
          backgroundColor: blogColors.backgroundCode,
          padding: blogSpacing.md,
          overflow: 'auto',
          marginBottom: blogSpacing.md,
        }}
      >
        {JSON.stringify(data)}
      </pre>
    );
  }
}

/**
 * Renders Plotly chart output from notebook cells
 */
function NotebookOutputPlotly({ data }: { data: PlotlyData }) {
  const displayCategory = useDisplayCategory();
  const title = data.layout?.title?.text;

  // Convert width/height to numbers (Plotly.js requires number | undefined)
  const layoutWidth = data.layout?.width;
  const layoutHeight = data.layout?.height;
  const width = displayCategory === 'mobile' ? 600 : (typeof layoutWidth === 'number' ? layoutWidth : undefined);
  const height = typeof layoutHeight === 'number' ? layoutHeight : 600;

  // Update image sources to use SVG with transparent background instead of PNG
  const images = data.layout?.images?.map((img: Record<string, unknown>) => ({
    ...img,
    source: typeof img.source === 'string'
      ? img.source.replace('/teal-square.png', '/teal-square.svg')
      : img.source,
  }));

  return (
    <div style={{ marginBottom: blogSpacing.lg }}>
      {title && (
        <h5
          style={{
            fontFamily: blogTypography.bodyFont,
            color: blogColors.textSecondary,
            fontStyle: 'italic',
            marginBottom: blogSpacing.sm,
          }}
        >
          {title}
        </h5>
      )}
      <Plot
        data={data.data}
        layout={{
          ...data.layout,
          images,
          width,
          height,
          title: { text: '' },
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: {
            l: 20,
            r: 20,
            t: 20,
            b: 20,
          },
        }}
        config={{
          displayModeBar: false,
          responsive: true,
        }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </div>
  );
}

/**
 * Renders HTML output from notebook cells
 */
function NotebookOutputHTML({ data }: { data: string | string[] }) {
  // We could potentially render this with dangerouslySetInnerHTML if needed
  void data; // Acknowledge unused parameter
  return null;
}

/**
 * Renders markdown output from notebook cells
 */
function NotebookOutputMarkdown({ data }: { data: string | string[] }) {
  const markdown = Array.isArray(data) ? data.join('') : data;
  return <MarkdownFormatter markdown={markdown} />;
}

export default NotebookRenderer;
