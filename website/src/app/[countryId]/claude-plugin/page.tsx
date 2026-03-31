import type { Metadata } from "next";
import ClaudePluginClient from "./ClaudePluginClient";

export const metadata: Metadata = {
  title: "PolicyEngine AI skills",
  description:
    "AI-powered policy analysis with PolicyEngine skills for Claude Code and Codex.",
};

export default async function ClaudePluginPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  return <ClaudePluginClient countryId={countryId} />;
}
