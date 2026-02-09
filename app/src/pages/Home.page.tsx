import { Box } from '@mantine/core';
import ActionCards from '@/components/home/ActionCards';
import HomeBlogPreview from '@/components/home/HomeBlogPreview';
import HomeTrackerPreview from '@/components/home/HomeTrackerPreview';
import MainSection from '@/components/home/MainSection';
import OrgLogos from '@/components/home/OrgLogos';
import DowningStreetBanner from '@/components/shared/DowningStreetBanner';
import '@/components/tools/visuals'; // Register CSS visuals
import { colors, spacing, typography } from '@/designTokens';

export default function HomePage() {
  return (
    <>
      <DowningStreetBanner />
      <Box
        style={{
          backgroundImage: `linear-gradient(180deg, ${colors.primary[50]}, #f2fcfaff, ${colors.white})`,
          minHeight: '100vh',
          fontFamily: typography.fontFamily.primary,
          position: 'relative',
        }}
      >
        <Box pt={spacing['4xl']}>
          <MainSection />
          <ActionCards />
        </Box>
        <OrgLogos />
        <HomeBlogPreview />
        <HomeTrackerPreview />
      </Box>
    </>
  );
}
