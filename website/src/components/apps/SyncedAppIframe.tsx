"use client";

import { useEffect, useMemo, useState } from "react";

interface SyncedAppIframeProps {
  srcPath: string;
  title: string;
  height?: string;
  initialQuery?: string;
}

export default function SyncedAppIframe({
  srcPath,
  title,
  height = "calc(100vh - 58px)",
  initialQuery = "",
}: SyncedAppIframeProps) {
  const [query, setQuery] = useState(initialQuery);

  const iframeUrl = useMemo(() => {
    return query ? `${srcPath}?${query}` : srcPath;
  }, [query, srcPath]);

  useEffect(() => {
    const basePath = srcPath.replace(/\/embed$/, "");

    const syncQueryFromLocation = () => {
      const currentQuery = window.location.search.replace(/^\?/, "");
      setQuery(currentQuery);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

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
        setQuery(event.data.params || "");
      }
    };

    syncQueryFromLocation();
    window.addEventListener("message", handleMessage);
    window.addEventListener("popstate", syncQueryFromLocation);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("popstate", syncQueryFromLocation);
    };
  }, [srcPath]);

  return (
    <iframe
      src={iframeUrl}
      title={title}
      allow="clipboard-write"
      style={{
        width: "100%",
        height,
        border: "none",
        display: "block",
      }}
    />
  );
}
