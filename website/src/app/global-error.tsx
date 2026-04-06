"use client";

import { useEffect } from "react";
import { captureWebsiteException } from "@/lib/posthog-events";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureWebsiteException(error, {
      boundary: "global",
      digest: error.digest,
    });
    console.error("[Website] Global layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="tw:flex tw:min-h-screen tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:px-6">
          <h1 className="tw:text-4xl tw:font-semibold">Something went wrong</h1>
          <p className="tw:max-w-xl tw:text-center tw:text-gray-600">
            An unexpected error occurred while rendering the site shell.
          </p>
          <button
            type="button"
            onClick={reset}
            className="tw:rounded-md tw:bg-primary-500 tw:px-4 tw:py-2 tw:text-white"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
