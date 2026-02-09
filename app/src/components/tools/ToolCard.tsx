/**
 * ToolCard Component
 *
 * Card component for displaying tools/apps in the Tools listing.
 * Mirrors BlogPostCard styling with design tokens.
 */

import { Link } from 'react-router-dom';
import { Badge, Box, Group, Text } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import type { App } from '@/types/apps';
import { AppVisual } from './visuals/AppVisual';

interface ToolCardProps {
  app: App;
}

/** Derive a display label for the first meaningful tag */
function getTagLabel(tags: string[]): string | null {
  if (tags.includes('interactives')) {
    return 'Interactive';
  }
  if (tags.includes('tracker')) {
    return 'Tracker';
  }
  if (tags.includes('healthcare')) {
    return 'Healthcare';
  }
  if (tags.includes('reconciliation')) {
    return 'Reconciliation';
  }
  return 'Calculator';
}

/** Derive a country label */
function getCountryLabel(countryId: string): string {
  const labels: Record<string, string> = { us: 'US', uk: 'UK' };
  return labels[countryId] || countryId.toUpperCase();
}

export function ToolCard({ app }: ToolCardProps) {
  const link = `/${app.countryId}/${app.slug}`;
  const tagLabel = getTagLabel(app.tags);
  const countryLabel = getCountryLabel(app.countryId);

  const formattedDate = app.date
    ? new Date(app.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Box
        style={{
          border: `1px solid ${colors.gray[300]}`,
          borderRadius: spacing.radius.md,
          overflow: 'hidden',
          backgroundColor: colors.white,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'box-shadow 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `0 4px 12px ${colors.gray[300]}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Image / CSS visual / placeholder */}
        <AppVisual image={app.image} alt={app.title} variant="light" height="200px" />

        {/* Content */}
        <Box
          style={{
            padding: spacing.md,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Tags and date */}
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              {tagLabel && (
                <Badge size="xs" variant="light" color="teal">
                  {tagLabel}
                </Badge>
              )}
              <Badge size="xs" variant="light" color="blue">
                {countryLabel}
              </Badge>
            </Group>
            {formattedDate && (
              <Text size="xs" c="dimmed" tt="uppercase">
                {formattedDate}
              </Text>
            )}
          </Group>

          {/* Title */}
          <Text fw={600} size="md" mb="xs" lineClamp={2} style={{ color: colors.gray[900] }}>
            {app.title}
          </Text>

          {/* Description */}
          <Text size="sm" c="dimmed" lineClamp={3} style={{ flex: 1 }}>
            {app.description}
          </Text>

          {/* Link */}
          <Text
            size="sm"
            mt="sm"
            style={{
              color: colors.primary[600],
              textAlign: 'right',
            }}
          >
            Open &rarr;
          </Text>
        </Box>
      </Box>
    </Link>
  );
}
