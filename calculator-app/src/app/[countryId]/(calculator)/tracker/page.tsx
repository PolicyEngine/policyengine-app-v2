"use client";

import TrackerPage from "@/pages/flagship/Tracker.page";
import FlagshipGate from "../FlagshipGate";

export default function TrackerRoute() {
  return (
    <FlagshipGate>
      <TrackerPage />
    </FlagshipGate>
  );
}
