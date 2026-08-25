"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import FlagshipGate from "../../FlagshipGate";

// Client-only: the chart stack (plotly) cannot render during SSR, and
// the page's data (localStorage provenance, calculation polling) is
// browser-side anyway.
const FlagshipReportPage = dynamic(() => import("@/pages/flagship/Report.page"), {
  ssr: false,
});

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
