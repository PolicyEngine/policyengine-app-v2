import type { Metadata } from "next";
import ClaudePluginClient from "./ClaudePluginClient";

export const metadata: Metadata = {
  title: "Claude plugin",
  description:
    "AI-powered policy analysis with Claude Code and PolicyEngine.",
};

export default async function ClaudePluginPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  return <ClaudePluginClient countryId={countryId} />;
}
