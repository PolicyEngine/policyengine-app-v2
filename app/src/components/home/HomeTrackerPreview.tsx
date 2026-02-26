import { Link } from 'react-router-dom';
import { Container, Group, Text } from '@/components/ui';
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
    <div
      style={{
        backgroundColor: colors.primary[50],
        paddingTop: spacing['5xl'],
        paddingBottom: spacing['5xl'],
      }}
    >
      <Container size="xl">
        {/* Section header */}
        <Group justify="space-between" align="start" style={{ marginBottom: spacing['3xl'] }}>
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
            to={`/${countryId}/research`}
            style={{
              textDecoration: 'none',
              color: colors.primary[600],
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            View all research &rarr;
          </Link>
        </Group>

        {/* Two-column layout: image on left, content on right */}
        <Link
          to={`/${countryId}/state-legislative-tracker`}
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <div
            style={{
              borderRadius: spacing.radius.feature,
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
            <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2">
              {/* Left: Image */}
              <div
                style={{
                  minHeight: '280px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <img
                  src="/assets/posts/state-legislative-tracker.png"
                  alt="2026 State Legislative Tracker showing US map with state session statuses"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                />
              </div>

              {/* Right: Content */}
              <div
                className="tw:flex tw:flex-col tw:justify-center"
                style={{ padding: spacing['3xl'] }}
              >
                <Text
                  c={colors.primary[600]}
                  fw={typography.fontWeight.semibold}
                  style={{
                    fontSize: typography.fontSize.xs,
                    textTransform: 'uppercase',
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
                  style={{
                    fontSize: typography.fontSize.base,
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
                  fw={typography.fontWeight.semibold}
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.primary[600],
                    fontFamily: typography.fontFamily.primary,
                  }}
                >
                  Explore the tracker &rarr;
                </Text>
              </div>
            </div>
          </div>
        </Link>
      </Container>
    </div>
  );
}
