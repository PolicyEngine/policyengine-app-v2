import { Link } from 'react-router-dom';
import { Box, Container, Group, SimpleGrid, Text } from '@mantine/core';
import { StateMapDotGrid } from '@/components/tools/visuals';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

/**
 * HomeTrackerPreview Component
 *
 * Showcases the state legislative tracker on the home page.
 * Uses the same visual style as HomeBlogPreview for consistency.
 */
export default function HomeTrackerPreview() {
  const countryId = useCurrentCountry();

  // Only show for US users
  if (countryId !== 'us') {
    return null;
  }

  return (
    <Box
      style={{
        backgroundColor: colors.primary[50],
        paddingTop: spacing['5xl'],
        paddingBottom: spacing['5xl'],
      }}
    >
      <Container size="xl">
        {/* Section header */}
        <Group justify="space-between" align="baseline" mb={spacing['3xl']}>
          <Text
            fw={typography.fontWeight.bold}
            style={{
              fontSize: typography.fontSize['3xl'],
              color: colors.primary[800],
              fontFamily: typography.fontFamily.primary,
              lineHeight: typography.lineHeight.tight,
            }}
          >
            Track legislative activity
          </Text>

          <Link
            to={`/${countryId}/tools`}
            style={{
              textDecoration: 'none',
              color: colors.primary[600],
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            View all tools &rarr;
          </Link>
        </Group>

        {/* Two-column layout: visual on left, content on right */}
        <Link
          to={`/${countryId}/state-legislative-tracker`}
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <Box
            style={{
              borderRadius: spacing.radius.xl,
              overflow: 'hidden',
              backgroundColor: colors.white,
              border: `1px solid ${colors.border.light}`,
              transition: 'box-shadow 0.25s ease, transform 0.25s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 8px 30px ${colors.shadow.medium}`;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing={0}>
              {/* Left: Visual */}
              <Box
                style={{
                  background: `linear-gradient(135deg, ${colors.primary[800]} 0%, ${colors.primary[600]} 100%)`,
                  padding: spacing['3xl'],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '280px',
                  position: 'relative',
                }}
              >
                {/* Subtle radial overlay for depth */}
                <Box
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'radial-gradient(ellipse 300px 200px at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 70%), radial-gradient(ellipse 250px 250px at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <StateMapDotGrid variant="dark" maxWidth="320px" />
              </Box>

              {/* Right: Content */}
              <Box
                style={{
                  padding: spacing['3xl'],
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Text
                  size={typography.fontSize.xs}
                  c={colors.primary[600]}
                  fw={typography.fontWeight.semibold}
                  tt="uppercase"
                  style={{
                    letterSpacing: '0.06em',
                    fontFamily: typography.fontFamily.primary,
                    marginBottom: spacing.sm,
                  }}
                >
                  Interactive tool
                </Text>

                <Text
                  fw={typography.fontWeight.bold}
                  style={{
                    fontSize: typography.fontSize['2xl'],
                    lineHeight: typography.lineHeight.tight,
                    fontFamily: typography.fontFamily.primary,
                    color: colors.gray[900],
                    marginBottom: spacing.md,
                  }}
                >
                  2026 State legislative tracker
                </Text>

                <Text
                  size={typography.fontSize.base}
                  style={{
                    color: colors.text.secondary,
                    lineHeight: typography.lineHeight.relaxed,
                    fontFamily: typography.fontFamily.primary,
                    marginBottom: spacing.lg,
                  }}
                >
                  Monitor tax and benefit legislation across all 50 US states. See which states are
                  in session, track active bills, and explore PolicyEngine&apos;s research on
                  state-level policy reforms.
                </Text>

                <Text
                  size={typography.fontSize.sm}
                  fw={typography.fontWeight.semibold}
                  style={{
                    color: colors.primary[600],
                    fontFamily: typography.fontFamily.primary,
                  }}
                >
                  Explore the tracker &rarr;
                </Text>
              </Box>
            </SimpleGrid>
          </Box>
        </Link>
      </Container>
    </Box>
  );
}
