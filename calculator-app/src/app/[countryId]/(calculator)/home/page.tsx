"use client";

import FlagshipHomePage from "@/pages/flagship/Home.page";
import FlagshipGate from "../FlagshipGate";

export default function HomeRoute() {
  return (
    <FlagshipGate>
      <FlagshipHomePage />
    </FlagshipGate>
  );
}
