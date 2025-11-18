/**
 * Blog Page
 *
 * Renders individual blog post/research articles.
 * Loads markdown content and displays with MarkdownFormatter.
 */

import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Box, Container, Text, Group, Badge, Loader, Center } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { useDisplayCategory } from '@/components/blog/useDisplayCategory';
import { MarkdownFormatter } from '@/components/blog/MarkdownFormatter';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { posts, topicLabels, locationLabels, topicTags, locationTags } from '@/data/posts/postTransformers';
import type { BlogPost } from '@/types/blog';

// Import all markdown files as raw strings using Vite's glob import
const articleModules = import.meta.glob('../data/posts/articles/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

export default function BlogPage() {
  const { countryId = 'us', slug } = useParams<{ countryId: string; slug: string }>();
  const displayCategory = useDisplayCategory();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Find the post by slug
  const post = posts.find((p: BlogPost) => p.slug === slug);

  // Handle old dated URL format (YYYY-MM-DD-slug)
  const YYYYMMDDFormat = /^\d{4}-\d{2}-\d{2}-/;
  if (slug && YYYYMMDDFormat.test(slug)) {
    return <Navigate to={`/${countryId}/research/${slug.substring(11)}`} replace />;
  }

  // Handle missing post
  if (!post) {
    return <Navigate to={`/${countryId}/research`} replace />;
  }

  // Load markdown content
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Find the module for this article
        // Glob import keys use the pattern from the glob, so we need to match it
        const availableKeys = Object.keys(articleModules);
        console.log('[THIS] Available article modules:', availableKeys.slice(0, 5), '...');
        console.log('[THIS] Looking for filename:', post.filename);

        // Find the key that ends with our filename
        const matchingKey = availableKeys.find((key) => key.endsWith(`/${post.filename}`));
        console.log('[THIS] Matching key:', matchingKey);

        if (!matchingKey) {
          throw new Error(`Article not found: ${post.filename}`);
        }

        const loader = articleModules[matchingKey];
        const text = await loader();
        setContent(text);
      } catch (err) {
        console.error('Failed to load blog post:', err);
        setError('Failed to load article content');
      } finally {
        setLoading(false);
      }
    };

    if (post?.filename) {
      loadContent();
    }
  }, [post?.filename]);

  // Format date
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get display tags
  const displayTags = post.tags
    .filter((tag) => topicLabels[tag] || locationLabels[tag])
    .map((tag) => ({
      key: tag,
      label: topicLabels[tag] || locationLabels[tag] || tag,
      isLocation: locationTags.includes(tag),
    }));

  // Format author names
  const authorNames = post.authors.map((author) =>
    author
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );

  return (
    <StaticPageLayout title={post.title}>
      {/* Hero section with post metadata */}
      <Box
        style={{
          backgroundColor: colors.gray[50],
          borderBottom: `1px solid ${colors.gray[200]}`,
        }}
      >
        <Container size="lg" py="xl">
          {/* Tags */}
          <Group gap="xs" mb="md">
            {displayTags.map(({ key, label, isLocation }) => (
              <Badge
                key={key}
                component={Link}
                to={`/${countryId}/research?${isLocation ? 'locations' : 'topics'}=${key}`}
                size="sm"
                variant="light"
                color={isLocation ? 'green' : 'blue'}
                style={{ cursor: 'pointer', textDecoration: 'none' }}
              >
                {label}
              </Badge>
            ))}
          </Group>

          {/* Title */}
          <Text
            component="h1"
            size="xl"
            fw={700}
            style={{
              fontSize: displayCategory === 'mobile' ? '1.75rem' : '2.5rem',
              lineHeight: 1.2,
              color: colors.gray[900],
            }}
            mb="md"
          >
            {post.title}
          </Text>

          {/* Description */}
          <Text
            size="lg"
            c="dimmed"
            mb="lg"
            style={{
              fontSize: displayCategory === 'mobile' ? '1rem' : '1.25rem',
            }}
          >
            {post.description}
          </Text>

          {/* Author and date */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <Text size="sm" fw={500}>
                By{' '}
                {authorNames.map((name, index) => (
                  <span key={name}>
                    <Link
                      to={`/${countryId}/research?authors=${post.authors[index]}`}
                      style={{
                        color: colors.primary[600],
                        textDecoration: 'none',
                      }}
                    >
                      {name}
                    </Link>
                    {index < authorNames.length - 2 && ', '}
                    {index === authorNames.length - 2 && ' and '}
                  </span>
                ))}
              </Text>
            </Group>
            <Text size="sm" c="dimmed" tt="uppercase">
              {formattedDate}
            </Text>
          </Group>

          {/* Cover image */}
          {post.image && (
            <Box mt="xl">
              <img
                src={`/assets/posts/${post.image}`}
                alt={post.title}
                style={{
                  width: '100%',
                  maxHeight: '400px',
                  objectFit: 'cover',
                  borderRadius: spacing.radius.md,
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </Box>
          )}
        </Container>
      </Box>

      {/* Article content */}
      <Container size="md" py="xl">
        {loading ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : error ? (
          <Center py="xl">
            <Text c="red">{error}</Text>
          </Center>
        ) : (
          <Box>
            <MarkdownFormatter markdown={content} />
          </Box>
        )}

        {/* Back to research link */}
        <Box mt="xl" pt="xl" style={{ borderTop: `1px solid ${colors.gray[200]}` }}>
          <Link
            to={`/${countryId}/research`}
            style={{
              color: colors.primary[600],
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            ← Back to Research
          </Link>
        </Box>
      </Container>
    </StaticPageLayout>
  );
}
