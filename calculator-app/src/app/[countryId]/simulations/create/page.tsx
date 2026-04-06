"use client";

import { useEffect } from "react";
import SimulationPathwayWrapper from "@/pathways/simulation/SimulationPathwayWrapper";
import { perfContentVisible } from "@/utils/perfHarness";

export default function SimulationCreateRoute() {
  useEffect(() => { perfContentVisible('SimulationCreateRoute'); }, []);
  return <SimulationPathwayWrapper />;
}
