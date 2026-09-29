"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import FlagshipGate from "../../../FlagshipGate";

// Client-only: bill reports render the browser-only chart stack.
const BillReportPage = dynamic(
  () => import("@/pages/flagship/BillReport.page"),
  { ssr: false },
);

export default function BillReportRoute({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = use(params);

  return (
    <FlagshipGate>
      <BillReportPage billId={billId} />
    </FlagshipGate>
  );
}
