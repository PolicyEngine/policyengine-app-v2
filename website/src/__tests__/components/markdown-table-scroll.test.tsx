import { render, screen } from "@testing-library/react";
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { MarkdownFormatter } from "@/components/blog/MarkdownFormatter";

const WIDE_TABLE_MARKDOWN = [
  "Table 3: Cost of the energy bill measures (£ million)",
  "",
  "| Measure | PolicyEngine, 2026-27 | HM Treasury, 2026-27 | PolicyEngine, 2027-28 | HM Treasury, 2027-28 |",
  "| --- | --- | --- | --- | --- |",
  "| Household Energy Payment | 1,969 | 2,625 | 0 | 0 |",
  "| Total | 2,808 | 3,380 | 353 | 350 |",
].join("\n");

const RAW_HTML_TABLE_MARKDOWN =
  "<table><thead><tr><th>Year</th><th>Cost</th></tr></thead>" +
  "<tbody><tr><td>2026</td><td>1</td></tr></tbody></table>";

const SCROLL_REGION_NAME = "Scrollable table";

function markdownTable(columns: number, rows: number, tableIndex: number) {
  const cells = (row: number) =>
    Array.from({ length: columns }, (_, col) => `t${tableIndex}r${row}c${col}`);
  return [
    `| ${cells(0).join(" | ")} |`,
    `| ${Array.from({ length: columns }, () => "---").join(" | ")} |`,
    ...Array.from(
      { length: rows },
      (_, row) => `| ${cells(row + 1).join(" | ")} |`,
    ),
  ].join("\n");
}

describe("MarkdownFormatter table scroll container", () => {
  beforeEach(() => {
    // jsdom has no matchMedia; the formatter's display-category hook reads it.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("given a markdown table then it renders inside a horizontal scroll container", () => {
    // Given / When
    render(<MarkdownFormatter markdown={WIDE_TABLE_MARKDOWN} />);

    // Then
    const scroller = screen.getByRole("table").parentElement;
    expect(scroller).toHaveAttribute("data-table-scroll");
    expect(scroller).toHaveStyle({ overflowX: "auto", maxWidth: "100%" });
  });

  test("given a raw HTML table then it is wrapped in the scroll container too", () => {
    // Given / When
    render(<MarkdownFormatter markdown={RAW_HTML_TABLE_MARKDOWN} />);

    // Then
    expect(screen.getByRole("table").parentElement).toHaveAttribute(
      "data-table-scroll",
    );
  });

  test("given a table that fits its column then the container adds no tab stop", () => {
    // Given / When (jsdom reports zero widths, so nothing overflows)
    render(<MarkdownFormatter markdown={WIDE_TABLE_MARKDOWN} />);

    // Then
    const scroller = screen.getByRole("table").parentElement;
    expect(scroller).toHaveAttribute("data-table-scroll");
    expect(scroller).not.toHaveAttribute("tabindex");
    expect(
      screen.queryByRole("region", { name: SCROLL_REGION_NAME }),
    ).toBeNull();
  });

  test("given a table wider than its column then the container is a focusable labelled region", () => {
    // Given
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(527);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(343);

    // When
    render(<MarkdownFormatter markdown={WIDE_TABLE_MARKDOWN} />);

    // Then
    const region = screen.getByRole("region", { name: SCROLL_REGION_NAME });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toContainElement(screen.getByRole("table"));
  });

  test("given any number of tables then each sits alone in its own scroll container", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 4 }),
        fc.integer({ min: 1, max: 8 }),
        fc.integer({ min: 1, max: 5 }),
        (tableCount, columns, rows) => {
          // Given
          const markdown = Array.from({ length: tableCount }, (_, i) =>
            markdownTable(columns, rows, i),
          ).join("\n\nA paragraph between tables.\n\n");

          // When
          const { container, unmount } = render(
            <MarkdownFormatter markdown={markdown} />,
          );

          // Then
          const tables = Array.from(container.querySelectorAll("table"));
          const scrollers = container.querySelectorAll("[data-table-scroll]");
          expect(tables).toHaveLength(tableCount);
          expect(scrollers).toHaveLength(tableCount);
          for (const table of tables) {
            expect(table.parentElement).toHaveAttribute("data-table-scroll");
            expect(table.parentElement?.querySelectorAll("table")).toHaveLength(
              1,
            );
          }
          unmount();
        },
      ),
      { numRuns: 25 },
    );
  });
});
