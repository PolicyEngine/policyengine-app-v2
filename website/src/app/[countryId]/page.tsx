import HeroSection from "@/components/home/HeroSection";
import HomeBlogPreview from "@/components/home/HomeBlogPreview";
import HomeFeaturedResearch from "@/components/home/HomeFeaturedResearch";
import HomeToolsPreview from "@/components/home/HomeToolsPreview";
import OrgLogos from "@/components/home/OrgLogos";
import FeaturedResearchBanner from "@/components/home/FeaturedResearchBanner";
import AutumnBudgetEventBanner from "@/components/home/AutumnBudgetEventBanner";
import { typography } from "@/designTokens";

export default async function HomePage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  return (
    <>
      <AutumnBudgetEventBanner countryId={countryId} />
      <HeroSection countryId={countryId} />
      <div style={{ fontFamily: typography.fontFamily.primary }}>
        <OrgLogos countryId={countryId} />
        <FeaturedResearchBanner countryId={countryId} />
        <HomeBlogPreview countryId={countryId} />
        <HomeFeaturedResearch countryId={countryId} />
        <HomeToolsPreview countryId={countryId} />
      </div>
    </>
  );
}
