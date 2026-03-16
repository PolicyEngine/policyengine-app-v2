"use client";

/**
 * NotebookRenderer component.
 *
 * Renders Jupyter notebook content in blog articles.
 * Handles markdown cells, code cell outputs (Plotly, markdown, plain text),
 * and consolidates footnotes at the end of the article.
 */

import { useMemo } from "react";
import type {
  Notebook,
  NotebookCell as NotebookCellType,
} from "@/types/blog";
import {
  extractNotebookFootnotes,
  hasFootnoteReferences,
  parseJSONSafe,
} from "@/lib/notebookUtils";
import { blogColors, blogSpacing, blogTypography } from "./blogStyles";
import { LazyPlot } from "./LazyPlot";
import {
  FootnotesSection,
  HighlightedBlock,
  MarkdownFormatter,
  PlotlyChartCode,
} from "./MarkdownFormatter";
import { useDisplayCategory } from "./useDisplayCategory";

function buildFootnotesMarkdown(
  footnotes: Record<string, string>,
): string {
  const sortedKeys = Object.keys(footnotes).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10),
  );
  if (sortedKeys.length === 0) return "";
  return sortedKeys.map((key) => `[^${key}]: ${footnotes[key]}`).join("\n\n");
}

interface NotebookRendererProps {
  notebook: Notebook;
  displayCategory?: string;
}

export function NotebookRenderer({
  notebook,
  displayCategory: propDisplayCategory,
}: NotebookRendererProps) {
  const hookDisplayCategory = useDisplayCategory();
  const displayCategory = propDisplayCategory || hookDisplayCategory;

  const { footnotes, hasFootnotes, footnotesMarkdown } = useMemo(() => {
    if (!notebook?.cells) {
      return { footnotes: {}, hasFootnotes: false, footnotesMarkdown: "" };
    }
    const extractedFootnotes = extractNotebookFootnotes(notebook);
    const hasAnyFootnotes = Object.keys(extractedFootnotes).length > 0;
    const markdown = buildFootnotesMarkdown(extractedFootnotes);
    return {
      footnotes: extractedFootnotes,
      hasFootnotes: hasAnyFootnotes,
      footnotesMarkdown: markdown,
    };
  }, [notebook]);

  if (!notebook?.cells) return null;

  const renderCell = (cell: NotebookCellType, index: number) => {
    // Highlighted-left: side-by-side content (desktop only)
    if (
      cell.metadata?.tags?.includes("highlighted-left") &&
      displayCategory === "desktop"
    ) {
      const nextCell = notebook.cells[index + 1];
      if (nextCell && cell.outputs?.[0]?.data?.["text/plain"]) {
        const currentCellData = cell.outputs[0].data["text/plain"];
        const dataString = Array.isArray(currentCellData)
          ? currentCellData[0]
          : currentCellData;
        try {
          const parsedData = parseJSONSafe(dataString as string);
          let nextCellMarkdown = nextCell.source.join("");
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
          console.error("Failed to parse highlighted-left cell data:", e);
        }
      }
    }

    // Skip highlighted-right cells (rendered as part of highlighted-left)
    if (
      cell.metadata?.tags?.includes("highlighted-right") &&
      displayCategory === "desktop"
    ) {
      return null;
    }

    // Markdown cells
    if (cell.cell_type === "markdown") {
      let cellMarkdown = cell.source.join("");
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

    // Code cells — render outputs only
    if (cell.cell_type === "code") {
      return <NotebookCodeCell key={`cell-${index}`} cell={cell} />;
    }

    return (
      <pre key={`cell-${index}`} style={{ color: blogColors.textSecondary }}>
        {JSON.stringify(cell, null, 2)}
      </pre>
    );
  };

  return (
    <>
      {notebook.cells.map(renderCell)}
      {hasFootnotes && (
        <FootnotesSection
          footnotes={footnotes}
          displayCategory={displayCategory}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Code cell output renderers                                         */
/* ------------------------------------------------------------------ */

function NotebookCodeCell({ cell }: { cell: NotebookCellType }) {
  const outputCell = cell.outputs?.[0]?.data;
  if (!outputCell) return null;

  if (outputCell["application/vnd.plotly.v1+json"]) {
    return (
      <NotebookOutputPlotly
        data={
          outputCell["application/vnd.plotly.v1+json"] as Record<
            string,
            unknown
          >
        }
      />
    );
  }
  if (outputCell["text/markdown"]) {
    return (
      <NotebookOutputMarkdown
        data={outputCell["text/markdown"] as string | string[]}
      />
    );
  }
  if (outputCell["text/html"]) return null;
  if (outputCell["text/plain"]) {
    return (
      <NotebookOutputPlain
        data={outputCell["text/plain"] as string | string[]}
      />
    );
  }

  const outputType = Object.keys(outputCell)[0];
  return (
    <p style={{ color: blogColors.textSecondary, fontStyle: "italic" }}>
      Unknown output type: {outputType}
    </p>
  );
}

function NotebookOutputPlain({ data }: { data: string | string[] }) {
  try {
    const processedData = typeof data === "string" ? data : data[0];
    const content = parseJSONSafe(processedData);

    if (typeof content === "string" || typeof content === "number") {
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

    return (
      <pre
        style={{
          fontFamily: blogTypography.monoFont,
          backgroundColor: blogColors.backgroundCode,
          padding: blogSpacing.md,
          overflow: "auto",
          marginBottom: blogSpacing.md,
        }}
      >
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  } catch {
    return (
      <pre
        style={{
          fontFamily: blogTypography.monoFont,
          backgroundColor: blogColors.backgroundCode,
          padding: blogSpacing.md,
          overflow: "auto",
          marginBottom: blogSpacing.md,
        }}
      >
        {JSON.stringify(data)}
      </pre>
    );
  }
}

function NotebookOutputPlotly({
  data,
}: {
  data: Record<string, unknown>;
}) {
  const displayCategory = useDisplayCategory();
  const layout = data.layout as Record<string, unknown> | undefined;
  const title = (layout?.title as Record<string, unknown>)?.text as
    | string
    | undefined;

  const images = (layout?.images as Record<string, unknown>[])?.map(
    (img) => ({
      ...img,
      source:
        typeof img.source === "string"
          ? img.source.replace("/teal-square.png", "/teal-square.svg")
          : img.source,
    }),
  );

  const defaultMargins = { l: 20, r: 20, t: 20, b: 20 };
  const margins = {
    ...defaultMargins,
    ...((layout?.margin as Record<string, number>) || {}),
  };

  return (
    <div style={{ marginBottom: blogSpacing.lg }}>
      {title && (
        <h5
          style={{
            fontFamily: blogTypography.bodyFont,
            color: blogColors.textSecondary,
            fontStyle: "italic",
            marginBottom: blogSpacing.sm,
          }}
        >
          {title}
        </h5>
      )}
      <LazyPlot
        data={(data.data as Plotly.Data[]) || []}
        layout={{
          ...(layout as Partial<Plotly.Layout>),
          images: images as Plotly.Layout["images"],
          width:
            displayCategory === "mobile"
              ? 600
              : typeof layout?.width === "number"
                ? layout.width
                : undefined,
          height:
            typeof layout?.height === "number"
              ? (layout.height as number)
              : 600,
          title: { text: "" },
          paper_bgcolor: "transparent",
          plot_bgcolor: "transparent",
          margin: margins,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
        useResizeHandler
      />
    </div>
  );
}

function NotebookOutputMarkdown({
  data,
}: {
  data: string | string[];
}) {
  const markdown = Array.isArray(data) ? data.join("") : data;
  return <MarkdownFormatter markdown={markdown} />;
}

export default NotebookRenderer;
