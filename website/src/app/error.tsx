"use client";

import { useEffect } from "react";
import { captureWebsiteException } from "@/lib/posthog-events";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureWebsiteException(error, {
      boundary: "route",
      digest: error.digest,
    });
    console.error("[Website] Route error:", error);
  }, [error]);

  return (
    <main
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1 style={{ margin: 0 }}>Something went wrong</h1>
      <p style={{ margin: 0, maxWidth: "32rem" }}>
        We hit an unexpected problem loading this page.
      </p>
      <button onClick={reset} style={{ cursor: "pointer", padding: "0.75rem 1rem" }}>
        Try again
      </button>
    </main>
  );
}
