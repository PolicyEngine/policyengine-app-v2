"use client";

import { use } from "react";
import ReportOutputPage from "@/pages/ReportOutput.page";

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
