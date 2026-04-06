"use client";

import { use, useEffect } from "react";
import ReportOutputPage from "@/pages/ReportOutput.page";
import { perfContentVisible } from "@/utils/perfHarness";

export default function ReportOutputRoute({
  params,
}: {
  params: Promise<{ reportId: string; rest?: string[] }>;
}) {
  const { reportId, rest } = use(params);
  const subpage = rest?.[0];
  const view = rest?.[1];

  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('ReportOutputRoute'); }, []);

  return <ReportOutputPage reportId={reportId} subpage={subpage} view={view} />;
}
