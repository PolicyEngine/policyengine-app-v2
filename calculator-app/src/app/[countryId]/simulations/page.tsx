"use client";

import { useEffect } from "react";
import SimulationsPage from "@/pages/Simulations.page";
import { perfContentVisible } from "@/utils/perfHarness";

export default function SimulationsRoute() {
  useEffect(() => { perfContentVisible('SimulationsRoute'); }, []);
  return <SimulationsPage />;
}
