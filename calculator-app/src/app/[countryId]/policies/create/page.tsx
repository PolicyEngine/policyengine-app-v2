"use client";

import { useEffect } from "react";
import PolicyPathwayWrapper from "@/pathways/policy/PolicyPathwayWrapper";
import { perfContentVisible } from "@/utils/perfHarness";

export default function PolicyCreateRoute() {
  useEffect(() => { perfContentVisible('PolicyCreateRoute'); }, []);
  return <PolicyPathwayWrapper />;
}
