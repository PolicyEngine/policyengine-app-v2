"use client";

import { use } from "react";
import StandardLayout from "@/components/StandardLayout";
import ModifyReportPage from "@/pages/reportBuilder/ModifyReportPage";
import { CalculatorProviders } from "../../../providers";

export default function ReportConfigRoute({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = use(params);

  return (
    <CalculatorProviders>
      <StandardLayout>
        <ModifyReportPage userReportId={reportId} />
      </StandardLayout>
    </CalculatorProviders>
  );
}
