"use client";

import LibraryPage from "@/pages/flagship/Library.page";
import FlagshipGate from "../FlagshipGate";

export default function LibraryRoute() {
  return (
    <FlagshipGate>
      <LibraryPage />
    </FlagshipGate>
  );
}
