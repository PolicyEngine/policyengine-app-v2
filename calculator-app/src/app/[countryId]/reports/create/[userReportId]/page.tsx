"use client";

import { use } from "react";
import StandardLayout from "@/components/StandardLayout";
import ModifyReportPage from "@/pages/reportBuilder/ModifyReportPage";
import { CalculatorProviders } from "../../../providers";

export default function ModifyReportRoute({
  params,
}: {
  params: Promise<{ userReportId: string }>;
}) {
  const { userReportId } = use(params);

  return (
    <CalculatorProviders>
      <StandardLayout>
        <ModifyReportPage userReportId={userReportId} />
      </StandardLayout>
    </CalculatorProviders>
  );
}
