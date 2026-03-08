import { IconChartBar, IconCode, IconSearch } from '@tabler/icons-react';
import { Box, Container, SimpleGrid, Stack, Text } from '@mantine/core';
import { CALCULATOR_URL } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}

function getFeatures(countryId: string): Feature[] {
  return [
    {
      icon: <IconChartBar size={28} stroke={1.5} color={colors.primary[600]} />,
      title: 'Model policy reforms',
      description:
        countryId === 'uk'
          ? 'Simulate tax and benefit changes across the UK. See distributional impacts, revenue effects, and poverty outcomes instantly.'
          : 'Simulate tax and benefit changes across all 50 states. See distributional impacts, revenue effects, and poverty outcomes instantly.',
      href: `${CALCULATOR_URL}/${countryId}/reports/create`,
      cta: 'Run a simulation →',
    },
    {
      icon: <IconSearch size={28} stroke={1.5} color={colors.primary[600]} />,
      title: 'Calculate household benefits',
      description:
        'Enter a household profile and see every tax and benefit they are eligible for — calculated from the actual rules, not estimates.',
      href: `${CALCULATOR_URL}/${countryId}/households/create`,
      cta: 'Try the calculator →',
    },
    {
      icon: <IconCode size={28} stroke={1.5} color={colors.primary[600]} />,
      title: 'Build with our rules engine',
      description:
        'Embed accurate benefit eligibility calculations in your product via our open-source Python package or REST API.',
      href: 'https://github.com/PolicyEngine',
      cta: 'Explore the API →',
    },
  ];
}

/**
 * Three-column feature grid with scroll-triggered card reveal.
 * Each card stagger-animates in using the .feature-card CSS class.
 */
export default function FeatureGrid() {
  const countryId = useCurrentCountry();
  const [ref, visible] = useScrollReveal<HTMLDivElement>(0.1, '-40px');
  const features = getFeatures(countryId);

  return (
    <Container size="xl" py={spacing['5xl']}>
      <Stack gap={spacing['3xl']}>
        <Box
          className={`reveal${visible ? ' visible' : ''}`}
          style={{ textAlign: 'center' }}
          ref={ref}
        >
          <Text
            fw={typography.fontWeight.semibold}
            c={colors.primary[500]}
            size="sm"
            style={{
              fontFamily: typography.fontFamily.primary,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: spacing.sm,
            }}
          >
            What you can do
          </Text>
          <Text
            fw={typography.fontWeight.bold}
            c={colors.primary[900]}
            style={{
              fontSize: 'clamp(24px, 4vw, 40px)',
              fontFamily: typography.fontFamily.primary,
              letterSpacing: '-0.02em',
            }}
          >
            Everything policy analysts need
          </Text>
        </Box>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={spacing['2xl']}>
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} visible={visible} />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

function FeatureCard({
  feature,
  index,
  visible,
}: {
  feature: Feature;
  index: number;
  visible: boolean;
}) {
  return (
    <Box
      component="a"
      href={feature.href}
      className={`feature-card${visible ? ' visible' : ''}`}
      style={{
        transitionDelay: `${index * 0.12}s`,
        borderRadius: spacing.radius.lg,
        border: `1px solid ${colors.primary[100]}`,
        backgroundColor: colors.white,
        padding: spacing['2xl'],
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
        boxShadow: '0 2px 8px -2px rgba(0,88,76,0.08)',
        cursor: 'pointer',
      }}
    >
      <Box
        style={{
          width: 52,
          height: 52,
          borderRadius: spacing.radius.md,
          backgroundColor: colors.primary[50],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {feature.icon}
      </Box>
      <Text
        fw={typography.fontWeight.semibold}
        c={colors.primary[900]}
        size="lg"
        style={{ fontFamily: typography.fontFamily.primary }}
      >
        {feature.title}
      </Text>
      <Text
        c={colors.gray[600]}
        size="sm"
        style={{
          fontFamily: typography.fontFamily.primary,
          lineHeight: typography.lineHeight.relaxed,
          flexGrow: 1,
        }}
      >
        {feature.description}
      </Text>
      <Text
        c={colors.primary[600]}
        size="sm"
        fw={typography.fontWeight.medium}
        style={{ fontFamily: typography.fontFamily.primary }}
      >
        {feature.cta}
      </Text>
    </Box>
  );
}
