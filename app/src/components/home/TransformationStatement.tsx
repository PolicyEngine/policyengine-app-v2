/**
 * TransformationStatement - Editorial Manifesto Section
 *
 * A dramatic, dark-themed section that communicates PolicyEngine's
 * core mission with authority. Uses inverted colors for contrast.
 */

import { Box, Container, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function TransformationStatement() {
  const countryId = useCurrentCountry();

  const trustedBy =
    countryId === 'uk'
      ? 'trusted by researchers, think tanks, and benefit access tools across the UK'
      : 'trusted by NBER, the Federal Reserve, and benefit access tools nationwide';

  return (
    <Box
      component="section"
      style={{
        backgroundColor: colors.secondary[900],
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 60% 40% at 0% 0%, ${colors.primary[900]}40 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 100% 100%, ${colors.primary[800]}30 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />

      <Container
        size="md"
        style={{
          position: 'relative',
          paddingTop: spacing['6xl'],
          paddingBottom: spacing['6xl'],
        }}
      >
        <Box
          style={{
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          {/* Small label */}
          <Text
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.semibold,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
              color: colors.primary[400],
              marginBottom: spacing['2xl'],
            }}
          >
            Our Mission
          </Text>

          {/* Main statement */}
          <Text
            component="h2"
            style={{
              fontFamily: typography.fontFamily.display,
              fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
              fontWeight: 400,
              fontStyle: 'italic',
              lineHeight: 1.5,
              color: colors.white,
              margin: 0,
            }}
          >
            "We believe policy decisions should be informed by{' '}
            <span style={{ color: colors.primary[300] }}>rigorous analysis</span>,
            not intuition. Our open-source platform makes professional-grade
            tax-benefit modeling{' '}
            <span style={{ color: colors.accent[400] }}>accessible to everyone</span>."
          </Text>

          {/* Divider */}
          <Box
            style={{
              width: '60px',
              height: '2px',
              backgroundColor: colors.primary[500],
              margin: `${spacing['3xl']} auto`,
              opacity: 0.6,
            }}
          />

          {/* Supporting text */}
          <Text
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: typography.fontSize.base,
              lineHeight: 1.7,
              color: colors.secondary[400],
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            From individual household calculations to society-wide budget projections,
            PolicyEngine transforms complex policy into actionable insights.
            Free, open-source, and {trustedBy}.
          </Text>
        </Box>
      </Container>
    </Box>
  );
}
