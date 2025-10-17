/**
 * Chart message utilities ported from v1 app
 * Original: policyengine-app/src/pages/policy/output/ImpactChart.jsx
 */

/**
 * Wrap text to a specified width, replacing newlines with <br> tags
 */
function wordWrap(text: string, width: number = 50): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= width) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.join('<br>');
}

/**
 * Generate an absolute change message
 * @param subjectTerm - The subject of the sentence (e.g., "This reform")
 * @param objectTerm - The object of the sentence (e.g., "tax revenues", "benefit spending")
 * @param change - The absolute change value
 * @param tolerance - Tolerance for "less than" messaging
 * @param formatter - Function to format the change value
 * @returns The formatted message with HTML line breaks
 */
export function absoluteChangeMessage(
  subjectTerm: string,
  objectTerm: string,
  change: number,
  tolerance: number,
  formatter: (value: number) => string
): string {
  const signTerm =
    change > tolerance
      ? `increase ${objectTerm} by ${formatter(change)}`
      : change > 0
        ? `increase ${objectTerm} by less than ${formatter(tolerance)}`
        : change < -tolerance
          ? `decrease ${objectTerm} by ${formatter(-change)}`
          : change < 0
            ? `decrease ${objectTerm} by less than ${formatter(tolerance)}`
            : `have no effect on ${objectTerm}`;

  const msg = `${subjectTerm} would ${signTerm}`;
  return wordWrap(msg, 50);
}
