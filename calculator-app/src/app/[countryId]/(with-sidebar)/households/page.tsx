"use client";

import { useEffect } from "react";
import PopulationsPage from "@/pages/Populations.page";
import { perfContentVisible } from "@/utils/perfHarness";

export default function HouseholdsRoute() {
  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('HouseholdsRoute'); }, []);

  return <PopulationsPage />;
}
