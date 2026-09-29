/**
 * Reading time counts a ```chart block as the prose a reader reads in it
 * (title, subtitle, note and source), not its JSON. Kept free of chart
 * imports so the article page can use it without loading Recharts.
 */

const CHART_FENCE = /^```chart\n([\s\S]*?)^```$/gm;
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
