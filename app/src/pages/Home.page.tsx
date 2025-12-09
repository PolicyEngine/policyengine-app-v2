/**
 * HomePage - Editorial Landing Experience
 *
 * A bold, editorial-style homepage that communicates PolicyEngine's
 * mission with authority and visual impact. Features asymmetric layouts,
 * dramatic typography, and purposeful motion.
 */

import { Box } from '@mantine/core';
import ActionCards from '@/components/home/ActionCards';
import MainSection from '@/components/home/MainSection';
import OrgLogos from '@/components/home/OrgLogos';
import TransformationStatement from '@/components/home/TransformationStatement';
import AutumnBudgetBanner from '@/components/shared/AutumnBudgetBanner';
import { colors, typography } from '@/designTokens';

export default function HomePage() {
  return (
    <>
      <AutumnBudgetBanner />

      {/* Hero Section - Editorial Impact */}
      <Box
        component="section"
        style={{
          position: 'relative',
          minHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: typography.fontFamily.primary,
          overflow: 'hidden',
        }}
      >
        {/* Layered Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              radial-gradient(ellipse 80% 50% at 50% -20%, ${colors.primary[100]} 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 100% 100%, ${colors.accent[50]} 0%, transparent 40%),
              linear-gradient(180deg, ${colors.background.primary} 0%, ${colors.background.editorial} 100%)
            `,
            zIndex: 0,
          }}
        />

        {/* Decorative Grid Pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(${colors.primary[200]}15 1px, transparent 1px),
              linear-gradient(90deg, ${colors.primary[200]}15 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'linear-gradient(180deg, black 0%, transparent 60%)',
            WebkitMaskImage: 'linear-gradient(180deg, black 0%, transparent 60%)',
            zIndex: 0,
            opacity: 0.5,
          }}
        />

        {/* Content */}
        <Box style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <MainSection />
          <ActionCards />
        </Box>
      </Box>

      {/* Transformation Statement */}
      <TransformationStatement />

      {/* Organization Logos */}
      <OrgLogos />
    </>
  );
}
