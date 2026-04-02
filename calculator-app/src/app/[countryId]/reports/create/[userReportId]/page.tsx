"use client";

import { use } from "react";
import ModifyReportPage from "@/pages/reportBuilder/ModifyReportPage";

export default function ModifyReportRoute({
  params,
}: {
  params: Promise<{ userReportId: string }>;
}) {
  const { userReportId } = use(params);

  return <ModifyReportPage userReportId={userReportId} />;
}
