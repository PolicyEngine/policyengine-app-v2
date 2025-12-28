/**
 * Blog Page
 *
 * Renders individual blog post/research articles.
 * Loads markdown content and displays with MarkdownFormatter.
 */

import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Box, Center, Container, Loader, Text } from '@mantine/core';
import { blogSpacing } from '@/components/blog/blogStyles';
import { MarkdownFormatter } from '@/components/blog/MarkdownFormatter';
import { NotebookRenderer } from '@/components/blog/NotebookRenderer';
import { useDisplayCategory } from '@/components/blog/useDisplayCategory';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import authorsData from '@/data/posts/authors.json';
import {
  locationLabels,
  locationTags,
  posts,
  topicLabels,
  topicTags,
} from '@/data/posts/postTransformers';
import { colors } from '@policyengine/design-system';
import type { AuthorsCollection, BlogPost, Notebook } from '@/types/blog';
import { extractMarkdownFromNotebook, isNotebookFile } from '@/utils/notebookUtils';

// Import all markdown files as raw strings using Vite's glob import
const markdownModules = import.meta.glob('../data/posts/articles/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

// Import all notebook files as raw strings using Vite's glob import
const notebookModules = import.meta.glob('../data/posts/articles/*.ipynb', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

const authors = authorsData as AuthorsCollection;

export default function BlogPage() {
  const { countryId = 'us', slug } = useParams<{ countryId: string; slug: string }>();
  const displayCategory = useDisplayCategory();
  const [content, setContent] = useState<string>('');
  const [notebook, setNotebook] = useState<Notebook | null>(null);
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

  // Determine if this is a notebook file
  const isNotebook = post?.filename ? isNotebookFile(post.filename) : false;

  // Load article content (markdown or notebook)
  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        setNotebook(null);
        setContent('');

        // Choose the appropriate module collection based on file type
        const modules = isNotebook ? notebookModules : markdownModules;
        const availableKeys = Object.keys(modules);
        const matchingKey = availableKeys.find((key) => key.endsWith(`/${post.filename}`));

        if (!matchingKey) {
          throw new Error(`Article not found: ${post.filename}`);
        }

        const loader = modules[matchingKey];
        const text = await loader();

        if (isNotebook) {
          // Parse notebook JSON and extract markdown for display purposes
          const parsedNotebook: Notebook = JSON.parse(text);
          setNotebook(parsedNotebook);
          // Also extract markdown for TOC and reading time
          setContent(extractMarkdownFromNotebook(parsedNotebook));
        } else {
          setContent(text);
        }
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
  }, [post?.filename, isNotebook]);

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
        <Container size="xl" py={post.hideHeaderImage ? 40 : 80}>
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
      <Container size="xl" py="xl">
        <PostBodySection
          post={post}
          markdown={content}
          notebook={notebook}
          countryId={countryId}
          displayCategory={displayCategory}
        />
      </Container>
    </StaticPageLayout>
  );
}

// Scroll offset for TOC navigation (accounts for fixed header)
const SCROLL_OFFSET_PX = 72;

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
          {imageUrl && !post.hideHeaderImage && (
            <img
              alt={post.title}
              title={post.imageCredit}
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
      {imageUrl && !post.hideHeaderImage && (
        <img
          alt={post.title}
          title={post.imageCredit}
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
  notebook,
  countryId,
  displayCategory,
}: {
  post: BlogPost;
  markdown: string;
  notebook: Notebook | null;
  countryId: string;
  displayCategory: string;
}) {
  // Render either notebook or markdown content
  const bodyContent = notebook ? (
    <NotebookRenderer notebook={notebook} displayCategory={displayCategory} />
  ) : (
    <MarkdownFormatter markdown={markdown} />
  );

  if (displayCategory === 'desktop') {
    return (
      <div style={{ display: 'flex' }}>
        {/* Left sidebar - Contents */}
        <div style={{ flex: 1, marginRight: 30 }}>
          <div style={{ position: 'sticky', top: 150, marginTop: blogSpacing.marginTop.paragraph }}>
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
          {bodyContent}
          <AuthorSection post={post} countryId={countryId} />
        </div>

        {/* Right sidebar - More On */}
        <div style={{ flex: 1, marginLeft: 20 }}>
          <div style={{ position: 'sticky', top: 150, marginTop: blogSpacing.marginTop.paragraph }}>
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
          {bodyContent}
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
      {bodyContent}
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
        By{' '}
        {authorNames.reduce((prev, curr, i) => (
          <>
            {prev}
            {i > 0 ? ', ' : ''}
            {curr}
          </>
        ))}
        , and {last}
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
        if (!author) {
          return null;
        }

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
      if (!label) {
        return null;
      }

      return (
        <div key={tag} style={{ marginBottom: 2 }}>
          <Link
            to={`/${countryId}/research?${isLocation ? 'locations' : 'topics'}=${tag}`}
            style={{
              color: colors.gray[700],
              textDecoration: 'none',
              fontSize: '0.95rem',
              transition: 'color 0.2s ease',
              display: 'block',
              padding: '2px 0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.primary[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.gray[700];
            }}
          >
            {label}
          </Link>
        </div>
      );
    });

  if (categoryLinks.filter(Boolean).length === 0) {
    return null;
  }

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
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${currentUrl}&title=${post.title}&summary=${post.description}`,
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
  if (!markdown) {
    return null;
  }

  const lines = markdown.split('\n');
  const headers = lines.filter((line) => line.startsWith('##'));

  if (headers.length === 0) {
    return null;
  }

  const contents = headers.map((header, index) => {
    const level = header.split('#').length - 1;
    let text = header.split(' ').slice(1).join(' ');

    // Extract text from links like [text](url)
    if (text.includes('[')) {
      text = text.split('[').slice(1).join('[').split(']')[0];
    }

    const slug = header.replace(/[#,/]/g, '').trim().replace(/\s+/g, '-').toLowerCase();

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
              const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
              window.scrollTo({
                top: elementPosition - SCROLL_OFFSET_PX,
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
