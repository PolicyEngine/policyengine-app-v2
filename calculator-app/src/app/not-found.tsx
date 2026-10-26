import type { Metadata } from "next";
import Link from "next/link";
import { colors, typography } from "@/designTokens";

export const metadata: Metadata = {
  title: "Page not found | PolicyEngine calculator",
};

/**
 * 404 page for any path the calculator does not serve, including a first
 * path segment that is not a supported country (see [countryId]/layout.tsx).
 */
export default function NotFound() {
  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-screen tw:gap-4">
      <p
        className="tw:text-6xl tw:font-bold"
        style={{
          color: colors.primary[500],
          lineHeight: typography.lineHeight.none,
        }}
      >
        404
      </p>
      <p className="tw:text-sm" style={{ color: colors.text.secondary }}>
        This page could not be found.
      </p>
      <Link
        href="/"
        className="tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:text-white tw:rounded-md"
        style={{ backgroundColor: colors.primary[500] }}
      >
        Go to the calculator
      </Link>
    </div>
  );
}
