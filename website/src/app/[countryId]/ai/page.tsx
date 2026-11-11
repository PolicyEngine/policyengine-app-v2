import type { Metadata } from "next";
import AiHubClient from "./AiHubClient";

export const metadata: Metadata = {
  title: "AI",
};

export default async function AiPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  return <AiHubClient countryId={countryId} />;
}
