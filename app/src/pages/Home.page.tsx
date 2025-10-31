import { Box } from '@mantine/core';
import ActionCards from '@/components/home/ActionCards';
import MainSection from '@/components/home/MainSection';
import OrgLogos from '@/components/home/OrgLogos';
import TransformationStatement from '@/components/home/TransformationStatement';
import HeaderNavigation from '@/components/shared/HomeHeader';
import { orgData } from '@/data/organizations';
import { colors, spacing, typography } from '@/designTokens';

export default function HomePage() {
  return (
    <Box
      style={{
        backgroundImage: `linear-gradient(180deg, ${colors.primary[50]}, #f2fcfaff, ${colors.white})`,
        minHeight: '100vh',
        fontFamily: typography.fontFamily.primary,
        position: 'relative',
        paddingTop: spacing['3xl'], // Fill the gap created by navbar's initial marginTop
      }}
    >
      <HeaderNavigation enableScrollAnimation />

      <Box pt={`calc(${spacing.layout.header} + ${spacing['4xl']})`}>
        <MainSection />
        <ActionCards />
        <TransformationStatement />
      </Box>
      <OrgLogos logos={orgData} />
    </Box>
  );
}
