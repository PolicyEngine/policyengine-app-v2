"use client";

import { useEffect } from "react";
import ReportBuilderPage from "@/pages/reportBuilder/ReportBuilderPage";
import { perfContentVisible } from "@/utils/perfHarness";

export default function ReportBuilderRoute() {
  useEffect(() => { perfContentVisible('ReportBuilderRoute'); }, []);
  return <ReportBuilderPage />;
}
