import { Box } from '@mantine/core';
import HeroSection from '@/components/home/HeroSection';
import HomeBlogPreview from '@/components/home/HomeBlogPreview';
import OrgLogos from '@/components/home/OrgLogos';
import DowningStreetBanner from '@/components/shared/DowningStreetBanner';
import { typography } from '@/designTokens';

export default function HomePage() {
  return (
    <>
      <DowningStreetBanner />
      <HeroSection />
      <Box
        style={{
          fontFamily: typography.fontFamily.primary,
        }}
      >
        <OrgLogos />
        <HomeBlogPreview />
      </Box>
    </>
  );
}
