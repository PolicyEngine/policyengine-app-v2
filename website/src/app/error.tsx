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
      boundary: "root",
      digest: error.digest,
    });
    console.error("[Website] Route error:", error);
  }, [error]);

  return (
    <div className="tw:flex tw:min-h-screen tw:flex-col tw:items-center tw:justify-center tw:gap-4 tw:px-6">
      <h1 className="tw:text-4xl tw:font-semibold">Something went wrong</h1>
      <p className="tw:max-w-xl tw:text-center tw:text-gray-600">
        We could not load this page. Please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="tw:rounded-md tw:bg-primary-500 tw:px-4 tw:py-2 tw:text-white"
      >
        Try again
      </button>
    </div>
  );
}
