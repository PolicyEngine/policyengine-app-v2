/**
 * Blog Page
 *
 * Renders individual blog post/research articles.
 * Loads markdown content and displays with MarkdownFormatter.
 */

import { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Box, Container, Text, Loader, Center } from '@mantine/core';
import { colors } from '@/designTokens';
import { useDisplayCategory } from '@/components/blog/useDisplayCategory';
import { MarkdownFormatter } from '@/components/blog/MarkdownFormatter';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import { posts, topicLabels, locationLabels, topicTags, locationTags } from '@/data/posts/postTransformers';
import authorsData from '@/data/posts/authors.json';
import type { BlogPost, AuthorsCollection } from '@/types/blog';

// Import all markdown files as raw strings using Vite's glob import
const articleModules = import.meta.glob('../data/posts/articles/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

const authors = authorsData as AuthorsCollection;

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
        const availableKeys = Object.keys(articleModules);
        const matchingKey = availableKeys.find((key) => key.endsWith(`/${post.filename}`));

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

  if (loading) {
    return (
      <StaticPageLayout title={post.title}>
        <Center py="xl" style={{ minHeight: '50vh' }}>
          <Loader size="lg" />
        </Center>
      </StaticPageLayout>
    );
  }

  if (error) {
    return (
      <StaticPageLayout title="Error">
        <Center py="xl">
          <Text c="red">{error}</Text>
        </Center>
      </StaticPageLayout>
    );
  }

  return (
    <StaticPageLayout title={post.title}>
      {/* Header Section */}
      <Box style={{ backgroundColor: colors.gray[50] }}>
        <Container size="lg" py="xl">
          <PostHeadingSection
            post={post}
            markdown={content}
            postDate={formattedDate}
            countryId={countryId}
            displayCategory={displayCategory}
          />
        </Container>
      </Box>

      {/* Body Section */}
      <Container size="lg" py="xl">
        <PostBodySection
          post={post}
          markdown={content}
          countryId={countryId}
          displayCategory={displayCategory}
        />
      </Container>
    </StaticPageLayout>
  );
}

// Calculate reading time
function calculateReadingTime(text: string): string {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

// Post Heading Section
function PostHeadingSection({
  post,
  markdown,
  postDate,
  countryId,
  displayCategory,
}: {
  post: BlogPost;
  markdown: string;
  postDate: string;
  countryId: string;
  displayCategory: string;
}) {
  const imageUrl = post.image ? `/assets/posts/${post.image}` : '';
  const readingTime = calculateReadingTime(markdown);

  console.log('[THIS] Cover image debug:', {
    postImage: post.image,
    imageUrl,
    hasImage: !!post.image,
  });

  if (displayCategory === 'desktop') {
    return (
      <div style={{ display: 'flex' }}>
        {/* Left sidebar */}
        <div style={{ flex: 1, paddingRight: 30 }}>
          <Text size="md" tt="uppercase" fw={600} mb="sm" style={{ letterSpacing: '0.05em' }}>
            {postDate}
          </Text>
          <Authorship post={post} countryId={countryId} />
          <div style={{ marginBottom: 60 }} />
          <Text size="md" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
            {readingTime}
          </Text>
          <div style={{ marginTop: 60 }} />
          <ShareLinks post={post} displayCategory={displayCategory} />
        </div>

        {/* Main content */}
        <div style={{ flex: 3 }}>
          <Text
            component="h1"
            size="xl"
            fw={700}
            style={{ fontSize: '2.5rem', lineHeight: 1.2, marginBottom: 20 }}
          >
            {post.title}
          </Text>
          <Text size="lg" c="dimmed" style={{ marginTop: 30, fontSize: '1.25rem' }}>
            {post.description}
          </Text>
          {imageUrl && (
            <img
              alt={post.title}
              src={imageUrl}
              style={{ width: '100%', marginTop: 30 }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>

        {/* Right spacer */}
        <div style={{ flex: 1 }} />
      </div>
    );
  }

  // Tablet and mobile
  return (
    <div>
      <Text
        component="h1"
        size="xl"
        fw={700}
        style={{ fontSize: displayCategory === 'mobile' ? '1.75rem' : '2rem', lineHeight: 1.2 }}
        mb="md"
      >
        {post.title}
      </Text>
      <Text size="lg" c="dimmed" mb="lg">
        {post.description}
      </Text>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <Authorship post={post} countryId={countryId} />
        <Text size="md" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
          {postDate}
        </Text>
        <Text size="md" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
          {readingTime}
        </Text>
      </div>
      {imageUrl && (
        <img
          alt={post.title}
          src={imageUrl}
          style={{ width: '100%' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <div style={{ marginTop: 20 }}>
        <ShareLinks post={post} displayCategory={displayCategory} />
      </div>
    </div>
  );
}

// Post Body Section
function PostBodySection({
  post,
  markdown,
  countryId,
  displayCategory,
}: {
  post: BlogPost;
  markdown: string;
  countryId: string;
  displayCategory: string;
}) {
  if (displayCategory === 'desktop') {
    return (
      <div style={{ display: 'flex' }}>
        {/* Left sidebar - Contents */}
        <div style={{ flex: 1, marginRight: 30 }}>
          <div style={{ position: 'sticky', top: 150 }}>
            <Text
              size="sm"
              tt="uppercase"
              fw={600}
              mb="xs"
              style={{ letterSpacing: '0.1em', color: colors.primary[600] }}
            >
              Contents
            </Text>
            <LeftContents markdown={markdown} />
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 4, minWidth: 0 }}>
          <MarkdownFormatter markdown={markdown} />
          <AuthorSection post={post} countryId={countryId} />
        </div>

        {/* Right sidebar - More On */}
        <div style={{ flex: 1, marginLeft: 20 }}>
          <div style={{ position: 'sticky', top: 150 }}>
            <MoreOn post={post} countryId={countryId} />
          </div>
        </div>
      </div>
    );
  }

  // Tablet
  if (displayCategory === 'tablet') {
    return (
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, marginRight: 30 }}>
          <div style={{ position: 'sticky', top: 150 }}>
            <Text
              size="sm"
              tt="uppercase"
              fw={600}
              mb="xs"
              style={{ letterSpacing: '0.1em', color: colors.primary[600] }}
            >
              Contents
            </Text>
            <LeftContents markdown={markdown} />
            <div style={{ marginTop: 15 }} />
            <MoreOn post={post} countryId={countryId} />
          </div>
        </div>
        <div style={{ flex: 3 }}>
          <MarkdownFormatter markdown={markdown} />
          <AuthorSection post={post} countryId={countryId} />
        </div>
      </div>
    );
  }

  // Mobile
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Text
          size="sm"
          tt="uppercase"
          fw={600}
          mb="xs"
          style={{ letterSpacing: '0.1em', color: colors.primary[600] }}
        >
          Contents
        </Text>
        <LeftContents markdown={markdown} />
      </div>
      <MarkdownFormatter markdown={markdown} />
      <AuthorSection post={post} countryId={countryId} />
      <div style={{ marginTop: 15 }}>
        <MoreOn post={post} countryId={countryId} />
      </div>
    </div>
  );
}

// Authorship component
function Authorship({ post, countryId }: { post: BlogPost; countryId: string }) {
  const authorNames = post.authors.map((author) => (
    <span key={author} style={{ whiteSpace: 'nowrap' }}>
      <Link
        to={`/${countryId}/research?authors=${author}`}
        style={{
          color: colors.primary[600],
          textDecoration: 'none',
        }}
      >
        {author
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}
      </Link>
    </span>
  ));

  let content;
  if (authorNames.length === 1) {
    content = <>By {authorNames}</>;
  } else if (authorNames.length === 2) {
    content = (
      <>
        By {authorNames[0]} and {authorNames[1]}
      </>
    );
  } else {
    const last = authorNames.pop();
    content = (
      <>
        By {authorNames.reduce((prev, curr, i) => (
          <>
            {prev}
            {i > 0 ? ', ' : ''}
            {curr}
          </>
        ))}, and {last}
      </>
    );
  }

  return (
    <Text size="md" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
      {content}
    </Text>
  );
}

// Author Section (footer with author bios)
function AuthorSection({ post, countryId }: { post: BlogPost; countryId: string }) {
  return (
    <div style={{ marginTop: 50 }}>
      {post.authors.map((authorId) => {
        const author = authors[authorId];
        if (!author) return null;

        return (
          <div
            key={authorId}
            style={{
              display: 'flex',
              justifyContent: 'start',
              gap: 15,
              padding: '1rem 0.5rem',
              borderTop: '1px solid black',
            }}
          >
            {author.headshot && (
              <img
                alt={author.name}
                src={`/assets/authors/${author.headshot}`}
                width={70}
                height={70}
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div style={{ paddingTop: 5 }}>
              <Text size="sm" tt="uppercase" fw={600} style={{ letterSpacing: '0.05em' }}>
                <Link
                  to={`/${countryId}/research?authors=${authorId}`}
                  style={{ color: colors.primary[600], textDecoration: 'none' }}
                >
                  {authorId
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </Link>
              </Text>
              <Text size="xs" c="dimmed">
                {author.title}
              </Text>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// More On section
function MoreOn({ post, countryId }: { post: BlogPost; countryId: string }) {
  const categoryLinks = post.tags
    .filter((tag) => locationTags.includes(tag) || topicTags.includes(tag))
    .map((tag) => {
      const isLocation = locationTags.includes(tag);
      const label = isLocation ? locationLabels[tag] : topicLabels[tag];
      if (!label) return null;

      return (
        <div key={tag} style={{ marginBottom: 4 }}>
          <Link
            to={`/${countryId}/research?${isLocation ? 'locations' : 'topics'}=${tag}`}
            style={{
              color: colors.primary[600],
              textDecoration: 'none',
              fontSize: '0.95rem',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            {label}
          </Link>
        </div>
      );
    });

  if (categoryLinks.filter(Boolean).length === 0) return null;

  return (
    <>
      <Text
        size="sm"
        tt="uppercase"
        fw={600}
        mb="xs"
        style={{ letterSpacing: '0.1em', color: colors.primary[600] }}
      >
        More on
      </Text>
      {categoryLinks}
    </>
  );
}

// Share Links
function ShareLinks({ post, displayCategory }: { post: BlogPost; displayCategory: string }) {
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const desktop = displayCategory === 'desktop';

  const links = [
    {
      name: 'Twitter',
      icon: '𝕏',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'Facebook',
      icon: 'f',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: 'in',
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(currentUrl)}&title=${encodeURIComponent(post.title)}&summary=${encodeURIComponent(post.description)}`,
    },
    {
      name: 'Email',
      icon: '✉',
      url: `mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(currentUrl)}`,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: desktop ? 'column' : 'row',
        gap: desktop ? 10 : 20,
      }}
    >
      {desktop && (
        <Text size="sm" tt="uppercase" fw={600} style={{ letterSpacing: '0.1em' }}>
          Share
        </Text>
      )}
      {links.map((link) => (
        <a
          key={link.name}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: colors.gray[600],
            textDecoration: 'none',
            fontSize: '0.85rem',
          }}
          title={link.name}
        >
          <span
            style={{
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: desktop ? colors.gray[500] : 'transparent',
              color: desktop ? 'white' : colors.gray[600],
              border: desktop ? 'none' : `1px solid ${colors.gray[400]}`,
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {link.icon}
          </span>
          {desktop && <span>{link.name}</span>}
        </a>
      ))}
    </div>
  );
}

// Left Contents (table of contents)
function LeftContents({ markdown }: { markdown: string }) {
  if (!markdown) return null;

  const lines = markdown.split('\n');
  const headers = lines.filter((line) => line.startsWith('##'));

  if (headers.length === 0) return null;

  const contents = headers.map((header, index) => {
    const level = header.split('#').length - 1;
    let text = header.split(' ').slice(1).join(' ');

    // Extract text from links like [text](url)
    if (text.includes('[')) {
      text = text.split('[').slice(1).join('[').split(']')[0];
    }

    const slug = header
      .replace(/[#,/]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase();

    return (
      <div
        key={`${slug}-${index}`}
        style={{
          marginBottom: 2,
        }}
      >
        <Text
          size="sm"
          style={{
            fontSize: 15 - 1.5 * (level - 2),
            cursor: 'pointer',
            paddingLeft: 8 * (level - 2),
            padding: '2px 0',
            color: colors.gray[700],
            transition: 'color 0.2s ease',
          }}
          onClick={() => {
            const element = document.getElementById(slug);
            if (element) {
              window.scrollTo({
                top: element.offsetTop - 200,
                behavior: 'smooth',
              });
            }
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = colors.primary[600];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.gray[700];
          }}
        >
          {text}
        </Text>
      </div>
    );
  });

  return <>{contents}</>;
}
