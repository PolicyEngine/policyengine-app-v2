"use client";

import { useEffect } from "react";
import PoliciesPage from "@/pages/Policies.page";
import { perfContentVisible } from "@/utils/perfHarness";

export default function PoliciesRoute() {
  useEffect(() => { perfContentVisible('PoliciesRoute'); }, []);
  return <PoliciesPage />;
}
