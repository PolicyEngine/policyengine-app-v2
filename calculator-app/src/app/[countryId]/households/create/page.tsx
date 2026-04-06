"use client";

import { useEffect } from "react";
import PopulationPathwayWrapper from "@/pathways/population/PopulationPathwayWrapper";
import { perfContentVisible } from "@/utils/perfHarness";

export default function HouseholdCreateRoute() {
  useEffect(() => { perfContentVisible('HouseholdCreateRoute'); }, []);
  return <PopulationPathwayWrapper />;
}
