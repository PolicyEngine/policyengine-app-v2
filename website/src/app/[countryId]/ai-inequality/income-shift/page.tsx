import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Income shift experiment",
  description:
    "A PolicyEngine prototype examining distributional effects when positive labor income shifts to positive capital income.",
};

type Props = {
  params: Promise<{ countryId: string }>;
};

function countryQuery(countryId: string) {
  return countryId === "us" ? "" : `?country=${encodeURIComponent(countryId)}`;
}

export default async function IncomeShiftPage({ params }: Props) {
  const { countryId } = await params;

  return (
    <iframe
      src={`https://ai-inequality-theta.vercel.app/income-shift${countryQuery(countryId)}`}
      title="Income shift experiment | PolicyEngine"
      style={{
        width: "100%",
        height: "calc(100vh - 120px)",
        border: "none",
      }}
    />
  );
}
