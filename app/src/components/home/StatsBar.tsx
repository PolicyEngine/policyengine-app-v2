import { Box, Container, SimpleGrid, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface Stat {
  value: string;
  label: string;
}

const US_STATS: Stat[] = [
  { value: '50', label: 'US states modelled' },
  { value: '1,000+', label: 'Tax and benefit rules' },
  { value: '100M+', label: 'Households simulated' },
  { value: 'Open source', label: 'Always free' },
];

const UK_STATS: Stat[] = [
  { value: 'UK-wide', label: 'Coverage across England, Scotland, Wales & NI' },
  { value: '500+', label: 'Tax and benefit rules' },
  { value: 'Open source', label: 'Always free' },
  { value: 'Real-time', label: 'Instant policy impact' },
];

/**
 * Horizontal stat bar that animates in on scroll.
 * Numbers use CSS statPop animation with staggered delays.
 */
export default function StatsBar() {
  const countryId = useCurrentCountry();
  const [ref, visible] = useScrollReveal<HTMLDivElement>(0.2);

  const stats = countryId === 'uk' ? UK_STATS : US_STATS;

  return (
    <Box
      ref={ref}
      style={{
        borderTop: `1px solid ${colors.primary[100]}`,
        borderBottom: `1px solid ${colors.primary[100]}`,
        backgroundColor: colors.primary[50],
        padding: `${spacing['2xl']} 0`,
      }}
    >
      <Container size="xl">
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing={spacing['2xl']}>
          {stats.map((stat, i) => (
            <Box
              key={stat.label}
              className={`stat-reveal${visible ? ' visible' : ''}`}
              style={{ textAlign: 'center', animationDelay: `${i * 0.12}s` }}
            >
              <Text
                fw={typography.fontWeight.bold}
                c={colors.primary[700]}
                style={{
                  fontSize: 'clamp(22px, 3vw, 36px)',
                  fontFamily: typography.fontFamily.primary,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                }}
              >
                {stat.value}
              </Text>
              <Text
                size="sm"
                c={colors.gray[500]}
                mt={spacing.xs}
                style={{ fontFamily: typography.fontFamily.primary }}
              >
                {stat.label}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}
