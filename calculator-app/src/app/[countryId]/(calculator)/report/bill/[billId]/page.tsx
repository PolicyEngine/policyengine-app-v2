"use client";

import { use } from "react";
import BillReportPage from "@/pages/flagship/BillReport.page";
import FlagshipGate from "../../../FlagshipGate";

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
