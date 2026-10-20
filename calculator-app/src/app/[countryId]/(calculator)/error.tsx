"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { colors } from "@/designTokens";
import { reportsHref } from "../../reportsHref";

export default function CountryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { countryId } = useParams<{ countryId: string }>();
  const reportsPath = reportsHref(countryId);

  useEffect(() => {
    console.error("[Calculator] Route error:", error);
  }, [error]);

  return (
    <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-screen tw:gap-4">
      <p
        className="tw:text-6xl tw:font-bold"
        style={{ color: colors.primary[500], lineHeight: 1 }}
      >
        Error
      </p>
      <p className="tw:text-sm" style={{ color: colors.gray[500] }}>
        Something went wrong loading this page.
      </p>
      <div className="tw:flex tw:gap-2">
        <button
          onClick={reset}
          className="tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:text-white tw:rounded-md"
          style={{ backgroundColor: colors.primary[500] }}
        >
          Try again
        </button>
        {/* A full page load rather than a client-side navigation, so the
            client state that may have caused the error is discarded. */}
        <a
          href={reportsPath}
          className="tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:border tw:rounded-md"
          style={{
            borderColor: colors.border.light,
            color: colors.text.primary,
          }}
        >
          Go to reports
        </a>
      </div>
    </div>
  );
}
