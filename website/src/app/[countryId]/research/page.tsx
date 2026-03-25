import type { Metadata } from "next";
import { Suspense } from "react";
import ResearchClient from "./ResearchClient";

export const metadata: Metadata = {
  title: "Research and analysis",
};

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  return (
    <Suspense>
      <ResearchClient countryId={countryId} />
    </Suspense>
  );
}
