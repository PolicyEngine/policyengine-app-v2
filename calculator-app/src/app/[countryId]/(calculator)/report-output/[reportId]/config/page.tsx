"use client";

import { use } from "react";
import ModifyReportPage from "@/pages/reportBuilder/ModifyReportPage";

export default function ReportConfigRoute({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);

  return <ModifyReportPage userReportId={reportId} />;
}
