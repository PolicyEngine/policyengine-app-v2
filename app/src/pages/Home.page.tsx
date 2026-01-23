import { Box } from '@mantine/core';
import ActionCards from '@/components/home/ActionCards';
import DowningStreetCredibility from '@/components/home/DowningStreetCredibility';
import MainSection from '@/components/home/MainSection';
import OrgLogos from '@/components/home/OrgLogos';
import YearInReviewBanner from '@/components/shared/YearInReviewBanner';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function HomePage() {
  const countryId = useCurrentCountry();

  return (
    <>
      <YearInReviewBanner />
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
          {countryId === 'uk' && <DowningStreetCredibility />}
          <ActionCards />
        </Box>
        <OrgLogos />
      </Box>
    </>
  );
}
