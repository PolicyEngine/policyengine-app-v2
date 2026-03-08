import { Box, Container, Group, Stack, Text } from '@mantine/core';
import { CALCULATOR_URL, WEBSITE_URL } from '@/constants';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useScrollReveal } from '@/hooks/useScrollReveal';

/**
 * CTA section at the bottom of the hero.
 * Primary button links to the reports (simulation) flow.
 * Secondary link goes to the research page.
 */
export default function ActionCards() {
  const countryId = useCurrentCountry();
  const [ref, visible] = useScrollReveal<HTMLDivElement>(0.3);

  return (
    <Container size="xl" pb={spacing['4xl']}>
      <Stack ref={ref} align="center" gap={spacing.lg}>
        <Group gap={spacing.md} justify="center" wrap="wrap">
          {/* Primary CTA */}
          <Box
            component="a"
            href={`${CALCULATOR_URL}/${countryId}/reports`}
            className={`reveal${visible ? ' visible' : ''} reveal-delay-1`}
            style={{
              display: 'inline-block',
              backgroundColor: colors.primary[600],
              color: colors.white,
              borderRadius: spacing.radius.md,
              padding: `${spacing.md} ${spacing['2xl']}`,
              fontFamily: typography.fontFamily.primary,
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.base,
              textDecoration: 'none',
              transition: 'background-color 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: `0 4px 14px -2px ${colors.primary[300]}`,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = colors.primary[700];
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                `0 8px 20px -4px ${colors.primary[300]}`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = colors.primary[600];
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                `0 4px 14px -2px ${colors.primary[300]}`;
            }}
          >
            Enter PolicyEngine
          </Box>

          {/* Secondary CTA */}
          <Box
            component="a"
            href={`${WEBSITE_URL}/${countryId}/research`}
            className={`reveal${visible ? ' visible' : ''} reveal-delay-2`}
            style={{
              display: 'inline-block',
              backgroundColor: 'transparent',
              color: colors.primary[700],
              borderRadius: spacing.radius.md,
              padding: `${spacing.md} ${spacing['2xl']}`,
              fontFamily: typography.fontFamily.primary,
              fontWeight: typography.fontWeight.medium,
              fontSize: typography.fontSize.base,
              textDecoration: 'none',
              border: `1.5px solid ${colors.primary[300]}`,
              transition: 'border-color 0.2s ease, background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = colors.primary[500];
              (e.currentTarget as HTMLElement).style.backgroundColor = colors.primary[50];
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = colors.primary[300];
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            Read our research
          </Box>
        </Group>

        {/* Trust line */}
        <Text
          className={`reveal${visible ? ' visible' : ''} reveal-delay-3`}
          size="xs"
          c={colors.gray[400]}
          style={{ fontFamily: typography.fontFamily.primary }}
        >
          Free forever · Open source · No account required
        </Text>
      </Stack>
    </Container>
  );
}
