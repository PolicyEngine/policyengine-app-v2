import type { ImgHTMLAttributes } from "react";

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

interface StaticImageData {
  src: string;
  height: number;
  width: number;
}

interface OptimisedImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src"
> {
  /** Desired display width in pixels — used for resizing on the edge. */
  width?: number;
  /** Image quality 1–100 (default 80). */
  quality?: number;
  /** Accept both string URLs and Next.js static imports */
  src?: string | StaticImageData;
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

/**
 * True when the asset should bypass Vercel's image optimiser (external URLs,
 * already-optimised Next.js static chunks, SVGs, local dev, or missing width).
 */
function shouldSkipOptimisation(src: string, width?: number): boolean {
  if (!src.startsWith("/")) return true;
  if (src.startsWith("/_next/")) return true;
  if (src.endsWith(".svg")) return true;
  if (process.env.NODE_ENV === "development") return true;
  if (!width) return true;
  return false;
}

function optimisedSrc(src: string, width: number, quality = 80): string {
  const params = new URLSearchParams({ url: src, q: String(quality) });
  params.set("w", String(snapWidth(Math.round(width))));
  return `/_vercel/image?${params}`;
}

export default function OptimisedImage({
  src,
  width,
  quality = 80,
  alt = "",
  ...rest
}: OptimisedImageProps) {
  // Resolve Next.js static imports (StaticImageData) to their .src string
  const rawSrc =
    typeof src === "object" && src !== null && "src" in src ? src.src : src;

  if (typeof rawSrc !== "string") {
    return (
      <img {...rest} src={undefined} width={width} loading="lazy" alt={alt} />
    );
  }

  if (shouldSkipOptimisation(rawSrc, width)) {
    return (
      <img {...rest} src={rawSrc} width={width} loading="lazy" alt={alt} />
    );
  }

  // width is guaranteed by shouldSkipOptimisation above
  const w = width!;
  const src1x = optimisedSrc(rawSrc, w, quality);
  const src2x = optimisedSrc(rawSrc, w * 2, quality);

  // If 1x and 2x snap to the same allowed width, the browser would download
  // the same file twice via srcset — skip the descriptor in that case.
  const srcSet = src1x === src2x ? undefined : `${src1x} 1x, ${src2x} 2x`;

  return (
    <img
      {...rest}
      src={src1x}
      srcSet={srcSet}
      width={w}
      loading="lazy"
      alt={alt}
    />
  );
}
