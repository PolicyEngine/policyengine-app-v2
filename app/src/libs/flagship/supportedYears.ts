/**
 * Budget windows kept inside the years the model and data cover. The
 * last year comes from the country metadata (see getLastSupportedYear);
 * a year after it fails on the server, so no window asks for one.
 */

/**
 * A window's length, shortened to end on the last supported year when it
 * would run past it. Never less than one year, the start year itself, so
 * a report's own year is always kept. Unchanged when the last year is
 * not known (the metadata has not loaded).
 */
export function windowSizeWithin(
  windowSize: number,
  startYear: number,
  lastSupportedYear: number | null
): number {
  if (lastSupportedYear === null) {
    return windowSize;
  }
  return Math.max(1, Math.min(windowSize, lastSupportedYear - startYear + 1));
}

/**
 * The window lengths to offer from a start year: each of `windowSizes`
 * shortened to end by the last supported year, without repeats, shortest
 * first. From 2026 with 2032 the last year, [1, 3, 5, 10] gives [1, 3, 5, 7].
 */
export function windowSizeChoices(
  windowSizes: number[],
  startYear: number,
  lastSupportedYear: number | null
): number[] {
  const sizesWithin = windowSizes.map((windowSize) =>
    windowSizeWithin(windowSize, startYear, lastSupportedYear)
  );
  return Array.from(new Set(sizesWithin)).sort((firstSize, secondSize) => firstSize - secondSize);
}
