import type { ImgHTMLAttributes } from 'react';

/**
 * Wraps an <img> to serve images through Vercel's edge image optimisation.
 *
 * On Vercel, rewrites the src to `/_vercel/image?url=...&w=...&q=...` which
 * automatically resizes, compresses, and converts to WebP/AVIF based on the
 * browser's Accept header. Locally / in dev, falls through to the original src.
 *
 * Usage:
 *   <OptimisedImage src="/assets/team/nikhil.webp" width={250} quality={80} />
 */

interface OptimisedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Desired display width in pixels — used for resizing on the edge. */
  width?: number;
  /** Image quality 1–100 (default 80). */
  quality?: number;
}

// Must match the "sizes" array in vercel.json
const ALLOWED_WIDTHS = [128, 256, 384, 512, 640, 750, 828, 1080, 1200, 1920];

/** Snap to the smallest allowed width that is >= the requested width. */
function snapWidth(w: number): number {
  for (const size of ALLOWED_WIDTHS) {
    if (size >= w) {
      return size;
    }
  }
  return ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
}

function optimisedSrc(src: string, width?: number, quality = 80): string {
  // Only optimise local paths served from the same origin
  if (!src.startsWith('/')) {
    return src;
  }

  // Skip in dev — Vercel image API isn't available locally
  if (import.meta.env.DEV) {
    return src;
  }

  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const params = new URLSearchParams({ url: src, q: String(quality) });
  if (width) {
    params.set('w', String(snapWidth(Math.round(width * dpr))));
  }
  return `/_vercel/image?${params}`;
}

export default function OptimisedImage({
  src,
  width,
  quality = 80,
  alt = '',
  ...rest
}: OptimisedImageProps) {
  const resolvedSrc = src ? optimisedSrc(src, width, quality) : undefined;

  return <img {...rest} src={resolvedSrc} width={width} loading="lazy" alt={alt} />;
}
