"use client";

import ExplorePage from "@/pages/flagship/Explore.page";
import FlagshipGate from "../FlagshipGate";

export default function ExploreRoute() {
  return (
    <FlagshipGate>
      <ExplorePage />
    </FlagshipGate>
  );
}
