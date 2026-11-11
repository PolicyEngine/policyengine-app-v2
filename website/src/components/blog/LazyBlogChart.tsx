"use client";

import dynamic from "next/dynamic";

/**
 * BlogChart, loaded only on pages that have a ```chart block, so articles
 * without one don't download Recharts. It still renders on the server, so the
 * figure is in the initial HTML.
 */
export const LazyBlogChart = dynamic(() =>
  import("./BlogChart").then((m) => m.BlogChart),
);
