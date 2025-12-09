/**
 * MainSection - Editorial Hero Content
 *
 * Dramatic, authority-building headline with sophisticated typography.
 * Uses Fraunces display font for editorial impact with
 * careful attention to spacing and hierarchy.
 */

import { Box, Container, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function MainSection() {
  const countryId = useCurrentCountry();

  const countryText =
    countryId === 'uk' ? 'across the United Kingdom' : 'across all 50 states';

  return (
    <Container
      size="lg"
      style={{
        paddingTop: spacing['6xl'],
        paddingBottom: spacing['4xl'],
      }}
    >
      <Box
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          textAlign: 'center',
        }}
      >
        {/* Eyebrow Label */}
        <Text
          component="span"
          style={{
            display: 'inline-block',
            fontFamily: typography.fontFamily.primary,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            letterSpacing: typography.letterSpacing.widest,
            textTransform: 'uppercase',
            color: colors.primary[600],
            marginBottom: spacing.xl,
            padding: `${spacing.xs} ${spacing.lg}`,
            backgroundColor: colors.primary[50],
            borderRadius: spacing.radius.full,
            border: `1px solid ${colors.primary[100]}`,
          }}
        >
          Open-Source Policy Analysis
        </Text>

        {/* Main Headline - Editorial Serif */}
        <h1
          style={{
            fontFamily: typography.fontFamily.display,
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: colors.text.primary,
            margin: `${spacing['2xl']} 0`,
          }}
        >
          Understand policy.
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[500]} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Transform decisions.
          </span>
        </h1>

        {/* Subheadline */}
        <Text
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
            fontWeight: typography.fontWeight.normal,
            lineHeight: 1.6,
            color: colors.text.secondary,
            maxWidth: '640px',
            margin: '0 auto',
            marginTop: spacing['2xl'],
          }}
        >
          Free, open-source tax and benefit analysis.
          <br />
          Model policy reforms {countryText}.
          <br />
          Power benefit access tools with accurate rules.
        </Text>

        {/* Metric Highlights */}
        <Box
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: spacing['4xl'],
            marginTop: spacing['5xl'],
            flexWrap: 'wrap',
          }}
        >
          <MetricHighlight
            value="9,000+"
            label="Parameters"
            sublabel="encoded"
          />
          <MetricHighlight
            value="50"
            label="States"
            sublabel="covered"
          />
          <MetricHighlight
            value="1,800+"
            label="Citations"
            sublabel="to law"
          />
        </Box>
      </Box>
    </Container>
  );
}

function MetricHighlight({
  value,
  label,
  sublabel,
}: {
  value: string;
  label: string;
  sublabel: string;
}) {
  return (
    <Box style={{ textAlign: 'center' }}>
      <Text
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize['4xl'],
          fontWeight: typography.fontWeight.bold,
          lineHeight: 1,
          color: colors.primary[600],
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
          marginTop: spacing.xs,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: typography.fontFamily.primary,
          fontSize: typography.fontSize.xs,
          color: colors.text.tertiary,
        }}
      >
        {sublabel}
      </Text>
    </Box>
  );
}
