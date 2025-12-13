import { Box } from '@mantine/core';
import ActionCards from '@/components/home/ActionCards';
import MainSection from '@/components/home/MainSection';
import OrgLogos from '@/components/home/OrgLogos';
import AutumnBudgetBanner from '@/components/shared/AutumnBudgetBanner';
import { colors, spacing, typography } from '@/designTokens';

export default function HomePage() {
  return (
    <>
      <AutumnBudgetBanner />
      <Box
        style={{
          minHeight: '100vh',
          fontFamily: typography.fontFamily.primary,
          position: 'relative',
          backgroundColor: colors.background.primary,
        }}
      >
        {/* Hero Section with gradient backgrounds (exact copy from redesign) */}
        <Box
          style={{
            background: colors.hero.gradient,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Gradient mesh overlay for depth */}
          <Box
            style={{
              position: 'absolute',
              inset: 0,
              background: colors.hero.mesh,
              pointerEvents: 'none',
            }}
          />
          <Box pt={spacing['4xl']} style={{ position: 'relative', zIndex: 1 }}>
            <MainSection />
            <ActionCards />
          </Box>
        </Box>
        <OrgLogos />
      </Box>
    </>
  );
}
