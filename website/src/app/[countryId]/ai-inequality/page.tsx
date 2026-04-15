import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI and inequality",
  description:
    "Research examining how policy interventions shape distributional outcomes when AI drives economic transformation.",
};

type Props = {
  params: Promise<{ countryId: string }>;
};

function countryQuery(countryId: string) {
  return countryId === "us" ? "" : `?country=${encodeURIComponent(countryId)}`;
}

export default async function AIInequalityPage({ params }: Props) {
  const { countryId } = await params;

  return (
    <iframe
      src={`https://ai-inequality-theta.vercel.app${countryQuery(countryId)}`}
      title="AI and inequality | PolicyEngine"
      style={{
        width: "100%",
        height: "calc(100vh - 120px)",
        border: "none",
      }}
    />
  );
}
