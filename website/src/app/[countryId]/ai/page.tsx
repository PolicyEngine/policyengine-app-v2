import type { Metadata } from "next";
import { VALID_COUNTRIES } from "@/lib/countries";
import HeroSection from "@/components/static/HeroSection";
import AIContent from "@/components/ai/AIContent";

export const metadata: Metadata = {
  title: "AI & machine learning",
  description:
    "PolicyEngine uses artificial intelligence and machine learning to make policy analysis more accurate and accessible.",
};

export function generateStaticParams() {
  return VALID_COUNTRIES.map((countryId) => ({ countryId }));
}

export default async function AIPage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  return (
    <div>
      <HeroSection
        title="AI & machine learning"
        description="PolicyEngine uses artificial intelligence and machine learning to make policy analysis more accurate and accessible."
      />
      <AIContent countryId={countryId} />
    </div>
  );
}
