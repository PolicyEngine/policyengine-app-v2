"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { colors, spacing, typography } from "@policyengine/design-system/tokens";

interface AppClientProps {
  app: {
    slug: string;
    title: string;
    description: string;
    source: string;
    type: string;
    countryId: string;
  };
  countryId: string;
}

export default function AppClient({ app, countryId }: AppClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const iframeOrigin = useMemo(() => {
    try {
      return new URL(app.source, window.location.origin).origin;
    } catch {
      return "";
    }
  }, [app.source]);

  const basePath = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return `/${segments.slice(0, 2).join("/")}`;
  }, [pathname]);

  // Forward parent URL query params into the iframe src
  const iframeBaseUrl = useMemo(() => {
    try {
      const resolved = new URL(app.source, window.location.origin);
      resolved.search = searchParams.toString() ? `?${searchParams.toString()}` : "";
      return resolved.toString();
    } catch {
      return app.source;
    }
  }, [searchParams, app.source]);

  // Listen for messages from iframe and sync to parent URL bar
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== iframeOrigin) return;
      if (
        event.data?.type === "hashchange" &&
        typeof event.data.hash === "string"
      ) {
        const hash = event.data.hash || "";
        if (hash && !hash.startsWith("#")) {
          const subPath = hash.startsWith("/") ? hash : `/${hash}`;
          window.history.replaceState(null, "", `${basePath}${subPath}`);
        } else {
          window.history.replaceState(null, "", `${basePath}${hash}`);
        }
      }
      if (
        event.data?.type === "urlUpdate" &&
        typeof event.data.params === "string"
      ) {
        const query = event.data.params ? `?${event.data.params}` : "";
        window.history.replaceState(null, "", `${basePath}${query}`);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [basePath, iframeOrigin]);

  // Build iframe URL with forwarded params and country hash
  let iframeUrl = iframeBaseUrl;
  if (countryId && countryId !== "us") {
    iframeUrl = `${iframeBaseUrl}#country=${countryId}`;
  }

  const iframeHeight = "calc(100vh - 58px)";

  return (
    <div style={{ position: "relative", height: "100%" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.gray[50],
            zIndex: 1,
          }}
        >
          <div style={{ textAlign: "center", padding: spacing["4xl"] }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                border: `4px solid ${colors.gray[200]}`,
                borderTop: `4px solid ${colors.primary[600]}`,
                borderRadius: "50%",
                margin: `0 auto ${spacing.lg}`,
                animation: "spin 1s linear infinite",
              }}
            />
            <p
              style={{
                color: colors.gray[500],
                fontSize: typography.fontSize.sm,
              }}
            >
              Loading calculator...
            </p>
          </div>
        </div>
      )}
      {hasError && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.gray[50],
            zIndex: 1,
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: spacing["4xl"],
              maxWidth: "500px",
            }}
          >
            <h2
              style={{ color: colors.gray[900], marginBottom: spacing.lg }}
            >
              Unable to load calculator
            </h2>
            <p
              style={{ color: colors.gray[500], marginBottom: spacing.lg }}
            >
              The embedded calculator could not be loaded. You can try
              opening it directly:
            </p>
            <a
              href={app.source}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: `${spacing.sm} ${spacing.lg}`,
                backgroundColor: colors.primary[600],
                color: colors.white,
                textDecoration: "none",
                borderRadius: spacing.radius.element,
              }}
            >
              Open calculator in new tab
            </a>
          </div>
        </div>
      )}
      <iframe
        src={iframeUrl}
        style={{
          width: "100%",
          height: iframeHeight,
          border: "none",
          display: "block",
        }}
        title={app.title}
        allow="clipboard-write"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
