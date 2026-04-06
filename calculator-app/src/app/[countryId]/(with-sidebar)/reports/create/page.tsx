"use client";

import { useEffect } from "react";
import ReportBuilderPage from "@/pages/reportBuilder/ReportBuilderPage";
import { perfContentVisible } from "@/utils/perfHarness";

export default function ReportBuilderRoute() {
  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('ReportBuilderRoute'); }, []);

  return <ReportBuilderPage />;
}
