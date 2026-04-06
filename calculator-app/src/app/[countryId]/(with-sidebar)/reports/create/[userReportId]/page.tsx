"use client";

import { use, useEffect } from "react";
import ModifyReportPage from "@/pages/reportBuilder/ModifyReportPage";
import { perfContentVisible } from "@/utils/perfHarness";

export default function ModifyReportRoute({
  params,
}: {
  params: Promise<{ userReportId: string }>;
}) {
  const { userReportId } = use(params);

  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('ModifyReportRoute'); }, []);

  return <ModifyReportPage userReportId={userReportId} />;
}
