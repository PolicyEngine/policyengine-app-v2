/**
 * FeaturedToolCard Component
 *
 * Full-width featured card for highlighted tools like the state legislative tracker.
 * Two-column layout: visual panel (left) + content panel (right).
 */

import { Link } from 'react-router-dom';
import { Badge, Box, Group, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import type { App } from '@/types/apps';
import { AppVisual } from './visuals/AppVisual';

interface FeaturedToolCardProps {
  app: App;
}

const COUNTRY_TAGS = new Set(['us', 'uk', 'ca', 'ng', 'global']);

export function FeaturedToolCard({ app }: FeaturedToolCardProps) {
  const link = `/${app.countryId}/${app.slug}`;
  const displayTags = app.tags.filter((tag) => !COUNTRY_TAGS.has(tag));
  const year = app.date ? new Date(app.date).getFullYear().toString() : null;

  return (
    <Box mb="xl">
      <Text
        size="xs"
        fw={700}
        style={{
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
          color: colors.gray[400],
        }}
        mb="sm"
      >
        Featured
      </Text>
      <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Box
          style={{
            border: `1px solid ${colors.gray[300]}`,
            borderRadius: spacing.radius.md,
            overflow: 'hidden',
            backgroundColor: colors.white,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            transition: 'box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = `0 4px 12px ${colors.gray[300]}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Visual panel */}
          <Box
            style={{
              background: `linear-gradient(135deg, ${colors.primary[800]} 0%, ${colors.primary[600]} 100%)`,
              padding: spacing['3xl'],
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '280px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Subtle radial overlay */}
            <Box
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse 300px 200px at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 70%), radial-gradient(ellipse 250px 250px at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Visual from apps.json image field */}
            <AppVisual image={app.image} alt={app.title} variant="dark" height="100%" featured />
          </Box>

          {/* Content panel */}
          <Box
            style={{
              padding: spacing['2xl'],
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Group justify="space-between" mb="sm">
              <Group gap="xs">
                {displayTags.map((tag) => (
                  <Badge key={tag} size="xs" variant="light" color="teal">
                    {tag.charAt(0).toUpperCase() + tag.slice(1)}
                  </Badge>
                ))}
              </Group>
              {year && (
                <Text size="xs" c="dimmed" tt="uppercase">
                  {year}
                </Text>
              )}
            </Group>

            <Text
              fw={600}
              style={{
                fontSize: typography.fontSize.xl,
                color: colors.gray[900],
                marginBottom: spacing.sm,
                lineHeight: '1.3',
              }}
            >
              {app.title}
            </Text>

            <Text size="sm" c="dimmed" style={{ lineHeight: '1.6', flex: 1 }}>
              {app.description}
            </Text>

            <Text
              size="sm"
              mt="lg"
              style={{
                color: colors.primary[600],
                textAlign: 'right',
              }}
            >
              Check out tool &rarr;
            </Text>
          </Box>
        </Box>
      </Link>
    </Box>
  );
}
