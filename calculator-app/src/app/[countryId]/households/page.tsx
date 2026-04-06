"use client";

import { useEffect } from "react";
import PopulationsPage from "@/pages/Populations.page";
import { perfContentVisible } from "@/utils/perfHarness";

export default function HouseholdsRoute() {
  useEffect(() => { perfContentVisible('HouseholdsRoute'); }, []);
  return <PopulationsPage />;
}
