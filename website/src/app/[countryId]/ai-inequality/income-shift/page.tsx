import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Income shift experiment",
  description:
    "A PolicyEngine prototype examining distributional effects when positive labor income shifts to positive capital income.",
};

export default function IncomeShiftPage() {
  return (
    <iframe
      src="https://ai-inequality-theta.vercel.app/income-shift"
      title="Income shift experiment | PolicyEngine"
      style={{
        width: "100%",
        height: "calc(100vh - 120px)",
        border: "none",
      }}
    />
  );
}
