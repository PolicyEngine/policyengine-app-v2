import { Box } from '@mantine/core';
import ActionCards from '@/components/home/ActionCards';
import FeatureGrid from '@/components/home/FeatureGrid';
import MainSection from '@/components/home/MainSection';
import OrgLogos from '@/components/home/OrgLogos';
import StatsBar from '@/components/home/StatsBar';
import DowningStreetBanner from '@/components/shared/DowningStreetBanner';
import { colors, spacing, typography } from '@/designTokens';

export default function HomePage() {
  return (
    <>
      <DowningStreetBanner />
      <Box
        style={{
          backgroundImage: `linear-gradient(180deg, ${colors.primary[50]} 0%, #f2fcfaff 40%, ${colors.white} 80%)`,
          minHeight: '100vh',
          fontFamily: typography.fontFamily.primary,
          position: 'relative',
        }}
      >
        {/* Hero: animated headline + subtitle */}
        <Box pt={spacing['4xl']}>
          <MainSection />
          <ActionCards />
        </Box>

        {/* Stats bar: numbers that animate in on scroll */}
        <StatsBar />

        {/* Feature grid: three use-case cards */}
        <FeatureGrid />

        {/* Partner logos: cycling org logos */}
        <OrgLogos />
      </Box>
    </>
  );
}
