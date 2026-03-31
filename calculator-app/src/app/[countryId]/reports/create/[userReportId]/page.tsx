"use client";

import { use } from "react";
import StandardLayout from "@/components/StandardLayout";
import ModifyReportPage from "@/pages/reportBuilder/ModifyReportPage";

export default function ModifyReportRoute({
  params,
}: {
  params: Promise<{ userReportId: string }>;
}) {
  const { userReportId } = use(params);

  return (
    <StandardLayout>
      <ModifyReportPage userReportId={userReportId} />
    </StandardLayout>
  );
}
