/**
 * Analysis Landing Page
 *
 * Provides links to demo pages exploring different layouts
 * for combining research articles and interactive tools.
 */

import { Link, useParams } from 'react-router-dom';
import { Box, Button, Container, SimpleGrid, Text } from '@mantine/core';
import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { colors, spacing, typography } from '@/designTokens';

export default function AnalysisPage() {
  const { countryId = 'us' } = useParams<{ countryId: string }>();

  const demoPages = [
    {
      title: 'Tools mixed with articles',
      description:
        'All tools and articles displayed on a single page with a unified grid layout. Includes a "Type" filter to switch between tools and articles.',
      path: `/${countryId}/analysis/mixed`,
    },
    {
      title: 'Tools first',
      description:
        'Tools displayed in a dedicated section at the top, followed by articles in a separate section below. Same filtering and search as the Research page.',
      path: `/${countryId}/analysis/tools-first`,
    },
  ];

  return (
    <StaticPageLayout title="Analysis">
      <HeroSection
        title="Analysis"
        description="Explore different layouts for combining research articles and interactive tools. These demo pages help evaluate which approach works best for user navigation."
      />

      <Container size="xl" py={spacing['3xl']}>
        <Text
          size={typography.fontSize.lg}
          mb={spacing['2xl']}
          style={{
            color: colors.text.secondary,
            fontFamily: typography.fontFamily.primary,
          }}
        >
          Select a demo layout to preview:
        </Text>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          {demoPages.map((page) => (
            <Box
              key={page.path}
              style={{
                padding: spacing['2xl'],
                backgroundColor: colors.white,
                borderRadius: spacing.radius.lg,
                border: `1px solid ${colors.border.light}`,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.lg,
              }}
            >
              <Text
                fw={typography.fontWeight.bold}
                style={{
                  fontSize: typography.fontSize.xl,
                  color: colors.gray[900],
                  fontFamily: typography.fontFamily.primary,
                }}
              >
                {page.title}
              </Text>

              <Text
                style={{
                  color: colors.text.secondary,
                  fontSize: typography.fontSize.base,
                  lineHeight: typography.lineHeight.relaxed,
                  fontFamily: typography.fontFamily.primary,
                  flex: 1,
                }}
              >
                {page.description}
              </Text>

              <Button
                component={Link}
                to={page.path}
                variant="filled"
                color="teal"
                size="md"
                style={{ alignSelf: 'flex-start' }}
              >
                View demo
              </Button>
            </Box>
          ))}
        </SimpleGrid>
      </Container>
    </StaticPageLayout>
  );
}
