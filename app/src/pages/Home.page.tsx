import { Box } from '@mantine/core';
import HeroSection from '@/components/home/HeroSection';
import HomeBlogPreview from '@/components/home/HomeBlogPreview';
import HomeTrackerPreview from '@/components/home/HomeTrackerPreview';
import OrgLogos from '@/components/home/OrgLogos';
import DowningStreetBanner from '@/components/shared/DowningStreetBanner';
import FeaturedResearchBanner from '@/components/shared/FeaturedResearchBanner';
import { typography } from '@/designTokens';

export default function HomePage() {
  return (
    <>
      <DowningStreetBanner />
      <FeaturedResearchBanner />
      <HeroSection />
      <Box
        style={{
          fontFamily: typography.fontFamily.primary,
        }}
      >
        <OrgLogos />
        <HomeBlogPreview />
        <HomeTrackerPreview />
      </Box>
    </>
  );
}
