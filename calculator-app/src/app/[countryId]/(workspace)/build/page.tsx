"use client";

import BuildPage from "@/pages/flagship/Build.page";
import FlagshipGate from "../FlagshipGate";

export default function BuildRoute() {
  return (
    <FlagshipGate>
      <BuildPage />
    </FlagshipGate>
  );
}
