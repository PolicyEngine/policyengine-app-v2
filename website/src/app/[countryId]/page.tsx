import HeroSection from "@/components/home/HeroSection";
import HomeBlogPreview from "@/components/home/HomeBlogPreview";
import HomeTrackerPreview from "@/components/home/HomeTrackerPreview";
import OrgLogos from "@/components/home/OrgLogos";
import FeaturedResearchBanner from "@/components/home/FeaturedResearchBanner";
import PE84Banner from "@/components/home/PE84Banner";
import { typography } from "@policyengine/design-system/tokens";

export default async function HomePage({
  params,
}: {
  params: Promise<{ countryId: string }>;
}) {
  const { countryId } = await params;

  return (
    <>
      <PE84Banner />
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
