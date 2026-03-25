import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI and inequality",
  description:
    "Research examining how policy interventions shape distributional outcomes when AI drives economic transformation.",
};

export default function AIInequalityPage() {
  return (
    <iframe
      src="https://policyengine.github.io/ai-inequality"
      title="AI and inequality | PolicyEngine"
      style={{
        width: "100%",
        height: "calc(100vh - 120px)",
        border: "none",
      }}
    />
  );
}
