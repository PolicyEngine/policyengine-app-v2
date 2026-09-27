"use client";

import AskPage from "@/pages/flagship/Ask.page";
import FlagshipGate from "../FlagshipGate";

export default function AskRoute() {
  return (
    <FlagshipGate>
      <AskPage />
    </FlagshipGate>
  );
}
