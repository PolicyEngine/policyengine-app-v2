/**
 * NotebookRenderer Component
 *
 * Renders Jupyter notebook content in blog articles.
 * Handles different cell types (markdown, code) and output formats
 * (plain text, Plotly charts, HTML, markdown).
 *
 * Ported from old app's BlogPage.jsx notebook handling.
 */

import Plot from 'react-plotly.js';
import type { Notebook, NotebookCell as NotebookCellType, PlotlyData } from '@/types/blog';
import { parseJSONSafe } from '@/utils/notebookUtils';
import { blogColors, blogSpacing, blogTypography } from './blogStyles';
import { HighlightedBlock, MarkdownFormatter, PlotlyChartCode } from './MarkdownFormatter';
import { useDisplayCategory } from './useDisplayCategory';

interface NotebookRendererProps {
  notebook: Notebook;
  displayCategory?: string;
}

/**
 * Main NotebookRenderer component
 * Iterates through notebook cells and renders them appropriately
 */
export function NotebookRenderer({ notebook, displayCategory: propDisplayCategory }: NotebookRendererProps) {
  const hookDisplayCategory = useDisplayCategory();
  const displayCategory = propDisplayCategory || hookDisplayCategory;

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
          const nextCellData = nextCell.source.join('');
          return (
            <HighlightedBlock
              key={`cell-${index}`}
              leftContent={
                <PlotlyChartCode
                  data={JSON.stringify(parsedData)}
                  backgroundColor={blogColors.backgroundSecondary}
                />
              }
              rightContent={<MarkdownFormatter markdown={nextCellData} />}
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
      return <MarkdownFormatter key={`cell-${index}`} markdown={cell.source.join('')} />;
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

  return <>{notebook.cells.map(renderCell)}</>;
}

/**
 * NotebookCell component
 * Renders a single code cell with its outputs
 */
function NotebookCell({ cell }: { cell: NotebookCellType }) {
  const outputCell = cell.outputs?.[0]?.data;

  if (!outputCell) {
    // No output - just skip (we don't show code input)
    return null;
  }

  const outputType = Object.keys(outputCell)[0];

  if (outputType === 'text/plain') {
    return <NotebookOutputPlain data={outputCell[outputType]} />;
  }

  if (outputType === 'application/vnd.plotly.v1+json') {
    return <NotebookOutputPlotly data={outputCell[outputType]} />;
  }

  if (outputType === 'text/html') {
    return <NotebookOutputHTML data={outputCell[outputType]} />;
  }

  if (outputType === 'text/markdown') {
    return <NotebookOutputMarkdown data={outputCell[outputType]} />;
  }

  // Unknown output type
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
