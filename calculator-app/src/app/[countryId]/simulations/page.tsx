"use client";

import { useEffect } from "react";
import SimulationsPage from "@/pages/Simulations.page";
import { perfContentVisible } from "@/utils/perfHarness";

export default function SimulationsRoute() {
  // [PERF HARNESS]
  useEffect(() => { perfContentVisible('SimulationsRoute'); }, []);

  return <SimulationsPage />;
}
