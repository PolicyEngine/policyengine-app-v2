/**
 * BlogPostCard Component
 *
 * Card component for displaying blog posts and apps in the Research listing.
 * Styled with v2 design tokens.
 */

import { Link } from 'react-router-dom';
import { Badge, Box, Group, Text } from '@mantine/core';
import { locationLabels, topicLabels } from '@/data/posts/postTransformers';
import { colors, spacing } from '@/designTokens';
import type { ResearchItem } from '@/types/blog';

interface BlogPostCardProps {
  item: ResearchItem;
  countryId: string;
}

export function BlogPostCard({ item, countryId }: BlogPostCardProps) {
  // Debug logging
  console.log('[THIS] BlogPostCard rendering:', {
    title: item.title,
    image: item.image,
    imagePath: item.image ? `/assets/posts/${item.image}` : 'NO IMAGE',
    isApp: item.isApp,
    slug: item.slug,
  });

  // Generate link based on whether it's an app or post
  // Apps go to AppPage, posts go to BlogPage
  const link = item.isApp
    ? `/${item.countryId}/${item.slug}`
    : `/${countryId}/research/${item.slug}`;

  // All links are now internal
  const isExternal = false;

  // Format date
  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Get display tags (up to 3)
  const displayTags = item.tags
    .filter((tag) => topicLabels[tag] || locationLabels[tag])
    .slice(0, 3)
    .map((tag) => topicLabels[tag] || locationLabels[tag] || tag);

  const cardContent = (
    <Box
      style={{
        border: '1px solid rgba(79, 209, 197, 0.2)',
        borderRadius: spacing.radius.md,
        overflow: 'hidden',
        backgroundColor: colors.white,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(79, 209, 197, 0.15)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(79, 209, 197, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(79, 209, 197, 0.2)';
      }}
    >
      {/* Image */}
      <Box
        style={{
          height: '200px',
          overflow: 'hidden',
          backgroundColor: colors.gray[100],
        }}
      >
        {item.image && (
          <img
            src={`/assets/posts/${item.image}`}
            alt={item.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
            onError={(e) => {
              // Hide broken images
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </Box>

      {/* Content */}
      <Box
        style={{
          padding: spacing.md,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Tags and Date */}
        <Group justify="space-between" mb="xs">
          <Group gap="xs">
            {displayTags.map((tag) => (
              <Badge
                key={tag}
                size="xs"
                variant="light"
                style={{
                  backgroundColor: item.isApp
                    ? 'rgba(79, 209, 197, 0.1)'
                    : 'rgba(79, 209, 197, 0.1)',
                  color: '#0d9488',
                  border: '1px solid rgba(79, 209, 197, 0.2)',
                }}
              >
                {tag}
              </Badge>
            ))}
          </Group>
          <Text size="xs" c="dimmed" tt="uppercase">
            {formattedDate}
          </Text>
        </Group>

        {/* Title */}
        <Text fw={600} size="md" mb="xs" lineClamp={2} style={{ color: colors.gray[900] }}>
          {item.title}
        </Text>

        {/* Description */}
        <Text size="sm" c="dimmed" lineClamp={3} style={{ flex: 1 }}>
          {item.description}
        </Text>

        {/* Read link */}
        <Text
          size="sm"
          mt="sm"
          style={{
            color: '#0d9488',
            textAlign: 'right',
            fontWeight: 500,
          }}
        >
          {item.isApp ? 'Open →' : 'Read →'}
        </Text>
      </Box>
    </Box>
  );

  if (isExternal) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      {cardContent}
    </Link>
  );
}
