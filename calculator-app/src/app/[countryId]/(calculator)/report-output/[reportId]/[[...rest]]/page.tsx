"use client";

import { use } from "react";
import dynamic from "next/dynamic";

// Report charts depend on browser APIs provided by Plotly.
const ReportOutputPage = dynamic(() => import("@/pages/ReportOutput.page"), {
  ssr: false,
});

export default function ReportOutputRoute({
  params,
}: {
  params: Promise<{ reportId: string; rest?: string[] }>;
}) {
  const { reportId, rest } = use(params);
  const subpage = rest?.[0];
  const view = rest?.[1];

  return <ReportOutputPage reportId={reportId} subpage={subpage} view={view} />;
}
