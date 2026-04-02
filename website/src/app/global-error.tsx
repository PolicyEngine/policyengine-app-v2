"use client";

import NextError from "next/error";
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
    console.error("[Website] Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem" }}>
          <NextError statusCode={0} />
          <button
            onClick={reset}
            style={{ cursor: "pointer", marginTop: "1rem", padding: "0.75rem 1rem" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
