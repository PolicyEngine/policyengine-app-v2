/**
 * Hover text from the shared chart messages, as one paragraph. Those
 * messages break their lines by hand for the legacy Plotly charts; a v3
 * tooltip wraps to its own width, so the hand breaks would cut lines short.
 */
export function tooltipText(text: string): string {
  return text.replace(/\s*\n\s*/g, ' ').trim();
}
