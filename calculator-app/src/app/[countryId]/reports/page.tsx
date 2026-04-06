"use client";

import { useEffect } from "react";
import ReportsPage from "@/pages/Reports.page";
import { perfContentVisible } from "@/utils/perfHarness";

export default function ReportsRoute() {
  useEffect(() => { perfContentVisible('ReportsRoute'); }, []);
  return <ReportsPage />;
}
