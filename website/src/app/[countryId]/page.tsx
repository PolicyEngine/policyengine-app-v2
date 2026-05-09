import HeroSection from "@/components/home/HeroSection";
import HomeBlogPreview from "@/components/home/HomeBlogPreview";
import HomeTrackerPreview from "@/components/home/HomeTrackerPreview";
import OrgLogos from "@/components/home/OrgLogos";
import FeaturedResearchBanner from "@/components/home/FeaturedResearchBanner";
import { typography } from "../../../app/src/designTokens";

export default async function HomePage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  return (
    <>
      <HeroSection countryId={countryId} />
      <div style={{ fontFamily: typography.fontFamily.primary }}>
        <OrgLogos countryId={countryId} />
        <FeaturedResearchBanner countryId={countryId} />
        <HomeBlogPreview countryId={countryId} />
        <HomeTrackerPreview countryId={countryId} />
      </div>
    </>
  );
}
