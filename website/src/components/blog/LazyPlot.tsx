"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-loaded Plotly chart component.
 * Uses next/dynamic with ssr:false since Plotly requires the browser's window object.
 * Keeps the ~3MB Plotly bundle out of the initial page load.
 */
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#999",
      }}
    >
      Loading chart…
    </div>
  ),
});

export function LazyPlot(props: React.ComponentProps<typeof Plot>) {
  return <Plot {...props} />;
}
