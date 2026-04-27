import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "State EITCs and CTCs",
};

export default function StateEitcsCtcsPage() {
  const embedUrl = "https://policyengine.github.io/us-state-eitcs-ctcs/";

  return (
    <iframe
      src={embedUrl}
      title="US state EITCs and CTCs | PolicyEngine"
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
