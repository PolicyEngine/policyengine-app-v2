"use client";

import { use } from "react";
import StandardLayout from "@/components/StandardLayout";
import ReportOutputPage from "@/pages/ReportOutput.page";
import { CalculatorProviders } from "../../../providers";

export default function ReportOutputRoute({
  params,
}: {
  params: Promise<{ reportId: string; rest?: string[] }>;
}) {
  const { reportId, rest } = use(params);
  const subpage = rest?.[0];
  const view = rest?.[1];

  return (
    <CalculatorProviders>
      <StandardLayout>
        <ReportOutputPage reportId={reportId} subpage={subpage} view={view} />
      </StandardLayout>
    </CalculatorProviders>
  );
}
