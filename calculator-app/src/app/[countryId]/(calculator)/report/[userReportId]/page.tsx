"use client";

import { use } from "react";
import FlagshipReportPage from "@/pages/flagship/Report.page";
import FlagshipGate from "../../FlagshipGate";

export default function FlagshipReportRoute({
  params,
}: {
  params: Promise<{ userReportId: string }>;
}) {
  const { userReportId } = use(params);

  return (
    <FlagshipGate>
      <FlagshipReportPage userReportId={userReportId} />
    </FlagshipGate>
  );
}
