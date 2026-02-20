import { Link } from 'react-router-dom';
import { Box, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import type { BlogPost } from '@/types/blog';
import { formatPostDate, getPostImageUrl } from './blogPreviewUtils';

interface PrimaryCardProps {
  post: BlogPost;
  countryId: string;
  flex?: number;
}

export default function PrimaryCard({ post, countryId, flex }: PrimaryCardProps) {
  const imageUrl = getPostImageUrl(post);
  const date = formatPostDate(post.date);

  return (
    <Link
      to={`/${countryId}/research/${post.slug}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        flex: flex ?? 'none',
      }}
    >
      <Box
        style={{
          borderRadius: spacing.radius.feature,
          overflow: 'hidden',
          backgroundColor: colors.white,
          border: `1px solid ${colors.border.light}`,
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
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
        {/* Image */}
        {imageUrl && (
          <Box
            style={{
              minHeight: '200px',
              flex: 1,
              overflow: 'hidden',
              backgroundColor: colors.gray[100],
            }}
          >
            <img
              src={imageUrl}
              alt={post.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>
        )}

        {/* Content */}
        <Box style={{ padding: spacing['2xl'], flexShrink: 0 }}>
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
            {date}
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
            {post.title}
          </Text>

          <Text
            size={typography.fontSize.sm}
            style={{
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              fontFamily: typography.fontFamily.primary,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.description}
          </Text>

          <Text
            size={typography.fontSize.sm}
            fw={typography.fontWeight.semibold}
            style={{
              color: colors.primary[600],
              marginTop: spacing.lg,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            Read more &rarr;
          </Text>
        </Box>
      </Box>
    </Link>
  );
}
