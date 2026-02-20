import { Link } from 'react-router-dom';
import { Box, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';
import type { BlogPost } from '@/types/blog';
import { formatPostDate, getPostImageUrl } from './blogPreviewUtils';

interface SecondaryCardProps {
  post: BlogPost;
  countryId: string;
}

export default function SecondaryCard({ post, countryId }: SecondaryCardProps) {
  const imageUrl = getPostImageUrl(post);
  const date = formatPostDate(post.date);

  return (
    <Link
      to={`/${countryId}/research/${post.slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
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
          e.currentTarget.style.boxShadow = `0 6px 24px ${colors.shadow.medium}`;
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
              height: '180px',
              overflow: 'hidden',
              backgroundColor: colors.gray[100],
              flexShrink: 0,
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
        <Box
          style={{
            padding: spacing.lg,
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
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
              marginBottom: spacing.xs,
            }}
          >
            {date}
          </Text>

          <Text
            fw={typography.fontWeight.semibold}
            style={{
              fontSize: typography.fontSize.base,
              lineHeight: typography.lineHeight.snug,
              fontFamily: typography.fontFamily.primary,
              color: colors.gray[900],
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              marginBottom: spacing.sm,
            }}
          >
            {post.title}
          </Text>

          <Text
            size={typography.fontSize.sm}
            style={{
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.normal,
              fontFamily: typography.fontFamily.primary,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flex: 1,
            }}
          >
            {post.description}
          </Text>

          <Text
            size={typography.fontSize.sm}
            fw={typography.fontWeight.semibold}
            style={{
              color: colors.primary[600],
              marginTop: spacing.md,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            Read &rarr;
          </Text>
        </Box>
      </Box>
    </Link>
  );
}
