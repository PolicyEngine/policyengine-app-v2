import { Link } from 'react-router-dom';
import { Container, Group, Text } from '@/components/ui';
import { getPosts } from '@/data/posts/postTransformers';
import { colors, spacing, typography } from '@/designTokens';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import type { BlogPost } from '@/types/blog';
import PrimaryCard from './PrimaryCard';
import SecondaryCard from './SecondaryCard';

/**
 * Number of posts shown in the blog preview on the home page.
 * 2 on the left (primary cards), 3 on the right (secondary cards).
 */
const LEFT_COUNT = 2;
const RIGHT_COUNT = 3;
const TOTAL_POSTS = LEFT_COUNT + RIGHT_COUNT;

export default function HomeBlogPreview() {
  const countryId = useCurrentCountry();

  // Get posts relevant to this country (or global), newest first
  const relevantPosts = getPosts()
    .filter((post: BlogPost) => post.tags.includes(countryId) || post.tags.includes('global'))
    .sort((a: BlogPost, b: BlogPost) => b.date.localeCompare(a.date))
    .slice(0, TOTAL_POSTS);

  if (relevantPosts.length === 0) {
    return null;
  }

  const leftPosts = relevantPosts.slice(0, LEFT_COUNT);
  const rightPosts = relevantPosts.slice(LEFT_COUNT, TOTAL_POSTS);

  return (
    <div
      style={{
        backgroundColor: colors.gray[50],
        paddingTop: spacing['5xl'],
        paddingBottom: spacing['5xl'],
      }}
    >
      <Container size="xl">
        {/* Section header */}
        <Group justify="space-between" align="baseline" style={{ marginBottom: spacing['3xl'] }}>
          <Text
            fw={typography.fontWeight.bold}
            style={{
              fontSize: typography.fontSize['3xl'],
              color: colors.primary[800],
              fontFamily: typography.fontFamily.primary,
              lineHeight: typography.lineHeight.tight,
            }}
          >
            Expert policy analysis
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

        {/* Two-column layout: 2 left (stacked), 3 right (stacked) */}
        <div className="tw:grid tw:grid-cols-1 tw:md:grid-cols-2" style={{ gap: spacing['2xl'] }}>
          {/* Left column: 2 posts stacked, filling equal height */}
          <div className="tw:flex tw:flex-col" style={{ gap: spacing['2xl'] }}>
            {leftPosts.map((post: BlogPost) => (
              <PrimaryCard key={post.slug} post={post} countryId={countryId} flex={1} />
            ))}
          </div>

          {/* Right column: 3 smaller posts stacked */}
          <div className="tw:flex tw:flex-col" style={{ gap: spacing['2xl'] }}>
            {rightPosts.map((post: BlogPost) => (
              <SecondaryCard key={post.slug} post={post} countryId={countryId} />
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
