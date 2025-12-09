import { Box } from '@mantine/core';
import ActionCards from '@/components/home/ActionCards';
import AnimatedBackground from '@/components/home/AnimatedBackground';
import AnimatedStats from '@/components/home/AnimatedStats';
import MainSection from '@/components/home/MainSection';
import OrgLogos from '@/components/home/OrgLogos';
import AutumnBudgetBanner from '@/components/shared/AutumnBudgetBanner';
import { colors, typography } from '@/designTokens';

export default function HomePage() {
  return (
    <>
      <AutumnBudgetBanner />
      <Box
        style={{
          background: `linear-gradient(180deg, ${colors.primary[50]}80, ${colors.white}E6, ${colors.white})`,
          minHeight: '100vh',
          fontFamily: typography.fontFamily.primary,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AnimatedBackground />
        <Box style={{ position: 'relative', zIndex: 1 }}>
          <MainSection />
          <ActionCards />
          <AnimatedStats />
          <OrgLogos />
        </Box>
      </Box>
    </>
  );
}
