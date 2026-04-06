"use client";

import { useEffect } from "react";
import { colors } from "@/designTokens";
import { captureRouteException } from "@/utils/errorTracking";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureRouteException(error, {
      boundary: "global",
      digest: error.digest,
    });
    console.error("[Calculator] Global layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="tw:flex tw:flex-col tw:items-center tw:justify-center tw:h-screen tw:gap-4">
          <p
            className="tw:text-6xl tw:font-bold"
            style={{ color: colors.primary[500], lineHeight: 1 }}
          >
            Error
          </p>
          <p className="tw:text-sm" style={{ color: colors.gray[500] }}>
            Something went wrong. Please try again.
          </p>
          <button
            onClick={reset}
            className="tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:text-white tw:rounded-md"
            style={{ backgroundColor: colors.primary[500] }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
