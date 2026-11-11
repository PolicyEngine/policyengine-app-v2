/**
 * Reading time counts a ```chart block as the prose a reader reads in it
 * (title, subtitle, note and source), not its JSON. Kept free of chart
 * imports so the article page can use it without loading Recharts.
 */

/** A ```chart fence; either fence line may carry trailing spaces or a CR. */
export const CHART_FENCE = /^```chart[ \t]*\r?\n([\s\S]*?)^```[ \t]*\r?$/gm;
const PROSE_FIELDS = ["title", "subtitle", "note", "source"];

export function chartBlocksAsProse(markdown: string): string {
  return markdown.replace(CHART_FENCE, (_, raw: string) => {
    try {
      const spec: unknown = JSON.parse(raw);
      if (!spec || typeof spec !== "object") return " ";
      const fields = spec as Record<string, unknown>;
      return ` ${PROSE_FIELDS.map((k) => fields[k])
        .filter((v): v is string => typeof v === "string")
        .join(" ")} `;
    } catch {
      return " ";
    }
  });
}

/** "N min read" at 200 words a minute. */
export function readingTimeLabel(markdown: string): string {
  const words = chartBlocksAsProse(markdown).trim().split(/\s+/).length;
  return `${Math.ceil(words / 200)} min read`;
}
