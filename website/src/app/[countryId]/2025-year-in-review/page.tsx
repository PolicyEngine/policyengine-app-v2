import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2025 year in review",
};

export default async function YearInReviewPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;
  const embedUrl = `https://policyengine.github.io/2025-year-in-review/${countryId}?embed=true`;

  return (
    <iframe
      src={embedUrl}
      title="PolicyEngine 2025 year in review"
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
