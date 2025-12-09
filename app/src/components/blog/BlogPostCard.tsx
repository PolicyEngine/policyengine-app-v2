/**
 * BlogPostCard - Editorial Research Card
 *
 * A refined card component for displaying research posts with
 * sophisticated typography, elegant hover states, and editorial styling.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowRight } from '@tabler/icons-react';
import { Badge, Box, Text } from '@mantine/core';
import { locationLabels, topicLabels } from '@/data/posts/postTransformers';
import { colors, spacing, typography } from '@/designTokens';
import type { ResearchItem } from '@/types/blog';

interface BlogPostCardProps {
  item: ResearchItem;
  countryId: string;
}

export function BlogPostCard({ item, countryId }: BlogPostCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const link = item.isApp
    ? `/${item.countryId}/${item.slug}`
    : `/${countryId}/research/${item.slug}`;

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const displayTags = item.tags
    .filter((tag) => topicLabels[tag] || locationLabels[tag])
    .slice(0, 2)
    .map((tag) => topicLabels[tag] || locationLabels[tag] || tag);

  const cardContent = (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: colors.white,
        borderRadius: spacing.radius.xl,
        overflow: 'hidden',
        border: `1px solid ${isHovered ? colors.primary[200] : colors.border.light}`,
        boxShadow: isHovered ? spacing.shadow.lg : spacing.shadow.sm,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 250ms ease-out',
      }}
    >
      {/* Image */}
      <Box
        style={{
          position: 'relative',
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
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 400ms ease-out',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {/* Type Badge Overlay */}
        <Box
          style={{
            position: 'absolute',
            top: spacing.md,
            left: spacing.md,
          }}
        >
          <Badge
            size="sm"
            style={{
              backgroundColor: item.isApp ? colors.primary[600] : colors.secondary[800],
              color: colors.white,
              fontFamily: typography.fontFamily.primary,
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.xs,
              letterSpacing: typography.letterSpacing.wide,
              textTransform: 'uppercase',
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: spacing.radius.md,
            }}
          >
            {item.isApp ? 'Interactive' : 'Article'}
          </Badge>
        </Box>
      </Box>

      {/* Content */}
      <Box
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: spacing.xl,
        }}
      >
        {/* Date */}
        <Text
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.tertiary,
            letterSpacing: typography.letterSpacing.wide,
            textTransform: 'uppercase',
            marginBottom: spacing.sm,
          }}
        >
          {formattedDate}
        </Text>

        {/* Title */}
        <Text
          component="h3"
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            lineHeight: 1.3,
            color: colors.text.primary,
            marginBottom: spacing.sm,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.title}
        </Text>

        {/* Description */}
        <Text
          style={{
            fontFamily: typography.fontFamily.primary,
            fontSize: typography.fontSize.sm,
            lineHeight: 1.6,
            color: colors.text.secondary,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.description}
        </Text>

        {/* Footer */}
        <Box
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: spacing.lg,
            paddingTop: spacing.md,
            borderTop: `1px solid ${colors.border.light}`,
          }}
        >
          {/* Tags */}
          <Box style={{ display: 'flex', gap: spacing.xs, flexWrap: 'wrap' }}>
            {displayTags.map((tag) => (
              <Text
                key={tag}
                style={{
                  fontFamily: typography.fontFamily.primary,
                  fontSize: '11px',
                  fontWeight: typography.fontWeight.medium,
                  color: colors.primary[600],
                  backgroundColor: colors.primary[50],
                  padding: `2px ${spacing.sm}`,
                  borderRadius: spacing.radius.sm,
                }}
              >
                {tag}
              </Text>
            ))}
          </Box>

          {/* Read Link */}
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              color: isHovered ? colors.primary[600] : colors.text.tertiary,
              transition: 'color 200ms ease',
            }}
          >
            <Text
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
              }}
            >
              {item.isApp ? 'Open' : 'Read'}
            </Text>
            <IconArrowRight
              size={14}
              style={{
                transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                transition: 'transform 200ms ease',
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      {cardContent}
    </Link>
  );
}
