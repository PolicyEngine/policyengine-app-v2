/**
 * General chart utility functions
 */

import { typography } from '@/designTokens';
import { colors } from '@/designTokens/colors';

/**
 * Gets the label for the reform policy line in parameter charts
 *
 * Priority order:
 * 1. Policy label (if provided)
 * 2. Policy ID formatted as "Policy #123" (if provided)
 * 3. Default "Reform" label
 *
 * @param policyLabel - Optional custom label for the policy
 * @param policyId - Optional policy ID number
 * @returns The label to display for the reform line
 */
export function getReformPolicyLabel(
  policyLabel?: string | null,
  policyId?: number | null
): string {
  if (policyLabel) {
    return policyLabel;
  }

  if (policyId !== null && policyId !== undefined) {
    return `Policy #${policyId}`;
  }

  return 'Reform';
}

/**
 * Downloads data as a CSV file
 * @param data - 2D array of data to export
 * @param filename - Name of the file to download
 */
export function downloadCsv(data: string[][], filename: string): void {
  const csvContent = data.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const tempLink = document.createElement('a');
  tempLink.href = url;
  tempLink.setAttribute('download', filename);
  tempLink.click();
  URL.revokeObjectURL(url);
}

/**
 * Default Plotly chart configuration
 */
export const DEFAULT_CHART_CONFIG = {
  displayModeBar: false,
  responsive: true,
};

/**
 * Default font configuration for all charts
 * Matches the app's primary font (Inter)
 */
export const CHART_FONT = {
  family: typography.fontFamily.primary,
};

/**
 * Default layout properties that should be applied to all charts
 * Spread this into your layout object to automatically include font settings
 */
export const DEFAULT_CHART_LAYOUT = {
  font: CHART_FONT,
};

/**
 * Returns base layout configuration for charts
 * @param mobile - Whether the chart is being rendered on mobile
 * @returns Plotly layout object
 */
export function getBaseChartLayout(mobile: boolean) {
  return {
    ...DEFAULT_CHART_LAYOUT,
    height: mobile ? 300 : 500,
    margin: { t: 40, r: 20, b: 60, l: 80 },
    xaxis: { fixedrange: true },
    yaxis: { fixedrange: true },
  };
}

/**
 * Calculate responsive chart height with min/max constraints
 * @param viewportHeight - Current viewport height in pixels
 * @param mobile - Whether the chart is being rendered on mobile
 * @returns Clamped chart height in pixels
 */
export function getClampedChartHeight(viewportHeight: number, mobile: boolean): number {
  const targetHeight = mobile ? viewportHeight * 0.4 : viewportHeight * 0.5;
  const minHeight = mobile ? 250 : 400;
  const maxHeight = mobile ? 400 : 700;

  return Math.max(minHeight, Math.min(maxHeight, targetHeight));
}

/**
 * Chart logo image configuration for Plotly watermarks
 */
export interface ChartLogoOptions {
  /** X position (0-1, where 1 is right edge) */
  x?: number;
  /** Y position (0-1, where 0 is bottom edge) */
  y?: number;
  /** X size as fraction of chart width */
  sizex?: number;
  /** Y size as fraction of chart height */
  sizey?: number;
  /** Opacity (0-1) */
  opacity?: number;
}

/**
 * Default chart logo configuration
 * Positions the wide PolicyEngine logo below the chart, right-aligned with the x-axis
 */
const DEFAULT_CHART_LOGO = {
  source: '/assets/logos/policyengine/teal.png',
  xref: 'paper' as const,
  yref: 'paper' as const,
  x: 1,
  y: -0.18,
  sizex: 0.1,
  sizey: 0.1,
  xanchor: 'right' as const,
  yanchor: 'bottom' as const,
  opacity: 0.8,
};

/**
 * Returns the PolicyEngine logo image configuration for Plotly charts
 * Use in layout.images array to add watermark to bottom-right corner
 *
 * @param options - Optional overrides for position, size, or opacity
 * @returns Plotly image configuration object
 *
 * @example
 * const layout = {
 *   images: [getChartLogoImage()],
 *   // ... other layout options
 * };
 */
export function getChartLogoImage(options?: ChartLogoOptions) {
  return {
    ...DEFAULT_CHART_LOGO,
    ...options,
  };
}

// ---------------------------------------------------------------------------
// Recharts utilities
// ---------------------------------------------------------------------------

/**
 * Default margin for Recharts charts.
 * Left is minimal because getYAxisLayout() computes a dynamic left margin.
 */
export const DEFAULT_RECHARTS_MARGIN = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 0,
};

/**
 * Font style applied to Recharts axis ticks and labels
 */
export const RECHARTS_FONT_STYLE = {
  fontFamily: typography.fontFamily.primary,
  fontSize: 12,
  fill: colors.gray[500],
} as const;

// ---------------------------------------------------------------------------
// Y-axis layout (dynamic width, margin, and label offset)
// ---------------------------------------------------------------------------

const AXIS_FONT = '12px Inter, system-ui, sans-serif';
const Y_LABEL_FONT_SIZE = 12;
const TICK_PADDING = 4;

/**
 * Measure tick label widths using the Canvas API and compute the YAxis width,
 * left chart margin, and label dx so nothing clips and there's no wasted space.
 *
 * - yAxisWidth: set as the `width` prop on `<YAxis>`
 * - marginLeft: set as `margin.left` on the chart
 * - labelDx: set as `dx` on the YAxis `<Label>`
 */
export function getYAxisLayout(
  ticks: number[],
  hasLabel: boolean,
  formatter?: (value: number) => string
): { yAxisWidth: number; marginLeft: number; labelDx: number } {
  const fallbackTickWidth = 30;

  let maxTickWidth = fallbackTickWidth;
  if (typeof document !== 'undefined' && ticks.length > 0) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = AXIS_FONT;
      const labels = ticks.map((t) => (formatter ? formatter(t) : String(t)));
      maxTickWidth = Math.max(...labels.map((l) => ctx.measureText(l).width));
    }
  }

  const yAxisWidth = Math.ceil(maxTickWidth) + TICK_PADDING + 4;

  const BASE_MARGIN = 4;
  const marginLeft = hasLabel ? Y_LABEL_FONT_SIZE + 20 + BASE_MARGIN : BASE_MARGIN;

  const LABEL_GAP = 16;
  const labelDx = -(Math.ceil(maxTickWidth) / 2 + TICK_PADDING + LABEL_GAP);

  return { yAxisWidth, marginLeft, labelDx };
}

/**
 * Logo watermark image path for Recharts charts
 */
export const RECHARTS_LOGO_SRC = '/assets/logos/policyengine/teal.png';

/**
 * Default watermark size and opacity for Recharts charts
 */
export const RECHARTS_WATERMARK = {
  src: RECHARTS_LOGO_SRC,
  width: 80,
  height: 20,
  opacity: 0.8,
} as const;

// ---------------------------------------------------------------------------
// SVG download
// ---------------------------------------------------------------------------

export interface ChartDownloadOptions {
  /** Title rendered above the chart in the exported SVG. */
  title?: string;
  /** Subtitle rendered below the title. */
  subtitle?: string;
  filename?: string;
}

/** Resolve CSS var() references to concrete values. */
function resolveVars(value: string, computed: CSSStyleDeclaration): string {
  return value.replace(/var\(--([^),]+)(?:,\s*([^)]+))?\)/g, (_, name, fallback) => {
    const resolved = computed.getPropertyValue(`--${name}`).trim();
    return resolved || fallback?.trim() || '#000';
  });
}

/** Escape special XML characters. */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Walk the live SVG + its clone in parallel, inlining computed styles
 * and resolving CSS variables so the SVG is fully self-contained.
 */
function inlineStyles(liveSvg: SVGSVGElement, clone: SVGSVGElement): void {
  const computed = getComputedStyle(document.documentElement);
  const liveEls = Array.from(liveSvg.querySelectorAll('*'));
  const cloneEls = Array.from(clone.querySelectorAll('*'));

  for (let i = 0; i < liveEls.length; i++) {
    const liveEl = liveEls[i];
    const cloneEl = cloneEls[i];

    // Resolve CSS var() in presentation attributes
    for (const attr of ['fill', 'stroke', 'color', 'stop-color']) {
      const val = cloneEl.getAttribute(attr);
      if (val?.includes('var(')) {
        cloneEl.setAttribute(attr, resolveVars(val, computed));
      }
    }
    const styleAttr = cloneEl.getAttribute('style');
    if (styleAttr?.includes('var(')) {
      cloneEl.setAttribute('style', resolveVars(styleAttr, computed));
    }

    // Inline font styles on text elements from the live DOM
    if (liveEl.tagName === 'text' || liveEl.tagName === 'tspan') {
      const s = getComputedStyle(liveEl);
      const inl = (cloneEl as SVGElement).style;
      inl.fontFamily = s.fontFamily;
      inl.fontSize = s.fontSize;
      inl.fontWeight = s.fontWeight;
      const fill = cloneEl.getAttribute('fill');
      if (!fill || fill.includes('var(')) {
        inl.fill = s.fill;
      }
    }
  }
}

/**
 * Convert an <img> element to a base64 data URL.
 * Returns null if the image can't be read.
 */
function imgToDataUrl(img: HTMLImageElement): string | null {
  try {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth || img.width;
    c.height = img.naturalHeight || img.height;
    const cx = c.getContext('2d');
    if (!cx) {
      return null;
    }
    cx.drawImage(img, 0, 0);
    return c.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Export a chart or map container as a self-contained SVG file.
 *
 * Captures ALL `<svg>` elements (chart, color bars, etc.) and `<img>`
 * elements (watermark) from the container, inlines computed styles and
 * CSS variables, prepends a title/subtitle, and triggers a download.
 */
export function downloadChartAsSvg(
  container: HTMLElement,
  options: ChartDownloadOptions = {}
): void {
  const { title, subtitle, filename = 'chart.svg' } = options;

  // Collect content SVGs — skip tiny icon SVGs (e.g. lucide icons in buttons)
  const allSvgs = Array.from(container.querySelectorAll('svg'));
  const svgs = allSvgs.filter((s) => {
    const r = s.getBoundingClientRect();
    return r.width > 40 && r.height > 40;
  });
  if (svgs.length === 0) {
    return;
  }

  const computed = getComputedStyle(document.documentElement);
  const fontFamily = getComputedStyle(document.body).fontFamily || 'Inter, sans-serif';
  const containerRect = container.getBoundingClientRect();

  // Measure header
  const padding = 16;
  let headerH = padding;
  const headerEls: string[] = [];

  if (title) {
    headerH += 20;
    const color = resolveVars('var(--foreground)', computed);
    headerEls.push(
      `<text x="${padding}" y="${headerH}" font-family="${escapeXml(fontFamily)}" font-size="16" font-weight="600" fill="${color}">${escapeXml(title)}</text>`
    );
    headerH += 4;
  }
  if (subtitle) {
    headerH += 16;
    const color = resolveVars('var(--muted-foreground)', computed);
    headerEls.push(
      `<text x="${padding}" y="${headerH}" font-family="${escapeXml(fontFamily)}" font-size="14" fill="${color}">${escapeXml(subtitle)}</text>`
    );
    headerH += 4;
  }
  if (headerEls.length > 0) {
    headerH += 8; // gap before chart
  } else {
    headerH = 0;
  }

  // Clone each content SVG and position it at its actual DOM location
  const svgGroups: string[] = [];
  for (const svg of svgs) {
    const clone = svg.cloneNode(true) as SVGSVGElement;
    inlineStyles(svg, clone);

    const svgRect = svg.getBoundingClientRect();
    const x = svgRect.left - containerRect.left;
    const y = svgRect.top - containerRect.top + headerH;
    const w = svgRect.width;
    const h = svgRect.height;
    const viewBox = svg.getAttribute('viewBox') || `0 0 ${w} ${h}`;

    clone.removeAttribute('xmlns');
    const content = Array.from(clone.childNodes)
      .map((n) => new XMLSerializer().serializeToString(n))
      .join('\n');

    svgGroups.push(
      `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${viewBox}">`,
      content,
      '</svg>'
    );
  }

  // Collect <img> elements (watermark, etc.) at their actual positions
  const imageEls: string[] = [];
  for (const img of Array.from(container.querySelectorAll('img'))) {
    const dataUrl = imgToDataUrl(img);
    if (!dataUrl) {
      continue;
    }
    const imgRect = img.getBoundingClientRect();
    const opacity = parseFloat(getComputedStyle(img).opacity) || 1;
    const x = imgRect.left - containerRect.left;
    const y = imgRect.top - containerRect.top + headerH;
    const w = imgRect.width;
    const h = imgRect.height;
    imageEls.push(
      `<image href="${dataUrl}" x="${x}" y="${y}" width="${w}" height="${h}" opacity="${opacity}"/>`
    );
  }

  const totalW = containerRect.width;
  const totalH = headerH + containerRect.height;

  const svgStr = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">`,
    `<rect width="${totalW}" height="${totalH}" fill="#ffffff"/>`,
    ...headerEls,
    ...svgGroups,
    ...imageEls,
    '</svg>',
  ].join('\n');

  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Nice tick generation (D3-style)
// ---------------------------------------------------------------------------

const NICE_STEPS = [1, 2, 2.5, 5, 10];

/**
 * Compute a "nice" step size for axis ticks by snapping to {1, 2, 2.5, 5}
 * multiples at each order of magnitude.
 */
function niceStep(roughStep: number): number {
  if (roughStep <= 0) {
    return 1;
  }
  const exponent = Math.floor(Math.log10(roughStep));
  const magnitude = 10 ** exponent;
  const normalized = roughStep / magnitude;
  const nice = NICE_STEPS.find((s) => s >= normalized - 1e-10) ?? 10;
  return nice * magnitude;
}

/**
 * Generate nice tick values for a given domain and approximate tick count.
 * Ticks are rounded to human-friendly numbers (multiples of 1, 2, 2.5, 5).
 *
 * @param domain - [min, max] data range
 * @param count - Approximate number of ticks desired (default: 5)
 * @returns Array of tick values
 */
export function getNiceTicks(domain: [number, number], count = 5): number[] {
  const [dMin, dMax] = domain;
  if (dMin === dMax) {
    return [dMin];
  }

  const rawStep = (dMax - dMin) / Math.max(count - 1, 1);
  const step = niceStep(rawStep);
  const start = Math.floor(dMin / step) * step;
  const ticks: number[] = [];

  for (let v = start; v <= dMax + step * 0.01; v += step) {
    // Round to avoid floating-point noise and negative zero
    const rounded = Math.round(v * 1e10) / 1e10 || 0;
    ticks.push(rounded);
  }

  // Ensure the last tick is at or above dMax so the domain fully covers the data
  if (ticks.length >= 2 && ticks[ticks.length - 1] < dMax) {
    const lastTick = Math.round((ticks[ticks.length - 1] + step) * 1e10) / 1e10 || 0;
    ticks.push(lastTick);
  }

  return ticks;
}
