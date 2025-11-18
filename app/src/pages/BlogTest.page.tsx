/**
 * Blog Test Page
 * Standalone page for testing blog post rendering
 * Mirrors the structure of BlogPage from the old app
 */

import { useState, useEffect } from 'react';
import { Box, Container, Title, Text, Button, Select } from '@mantine/core';
import { MarkdownFormatter } from '@/components/blog/MarkdownFormatter';
import { posts, topicLabels, locationLabels } from '@/data/posts/postTransformers';
import { useDisplayCategory } from '@/components/blog/useDisplayCategory';
import { colors, spacing } from '@/designTokens';
import IframeContent from '@/components/IframeContent';

export default function BlogTestPage() {
  const [selectedPostIndex, setSelectedPostIndex] = useState<number>(0);
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const displayCategory = useDisplayCategory();

  const post = posts[selectedPostIndex];

  const loadMarkdown = async () => {
    // Skip loading for interactive posts
    if (post?.type === 'interactive') {
      setMarkdown('');
      setLoading(false);
      setError('');
      return;
    }

    if (post?.type !== 'article' || !post.filename) {
      setError('No post with markdown file found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/src/data/posts/articles/${post.filename}`);
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.statusText}`);
      }
      const text = await response.text();
      setMarkdown(text);
    } catch (err) {
      setError(`Error loading markdown: ${err}`);
      console.error('Failed to load markdown:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load first post on mount
  useEffect(() => {
    loadMarkdown();
  }, []);

  // Reload when selection changes
  useEffect(() => {
    if (selectedPostIndex >= 0) {
      loadMarkdown();
    }
  }, [selectedPostIndex]);

  const postOptions = posts.map((p, index) => ({
    value: String(index),
    label: `${p.title} (${p.date}) ${p.type === 'interactive' ? '[INTERACTIVE]' : ''}`,
  }));

  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: colors.white,
      }}
    >
      {/* Header Section - light blue background like old app */}
      <Box
        style={{
          backgroundColor: colors.primary[50],
          paddingTop: spacing['3xl'],
          paddingBottom: spacing['3xl'],
        }}
      >
        <Container size="lg">
          <Title order={1} mb="md">
            Blog Post Test Page
          </Title>
          <Text size="lg" mb="xl" c="dimmed">
            Select a blog post to test the MarkdownFormatter styling
          </Text>

          <Box mb="md">
            <Select
              label="Select Blog Post"
              placeholder="Choose a post to render"
              data={postOptions}
              value={String(selectedPostIndex)}
              onChange={(value) => setSelectedPostIndex(Number(value || 0))}
              searchable
              mb="md"
            />
          </Box>

          {post && (
            <Box>
              <Text size="sm" c="dimmed">
                <strong>Type:</strong> {post.type}
              </Text>
              <Text size="sm" c="dimmed">
                <strong>Title:</strong> {post.title}
              </Text>
              <Text size="sm" c="dimmed">
                <strong>Date:</strong> {post.date}
              </Text>
              {post.type === 'article' ? (
                <Text size="sm" c="dimmed">
                  <strong>File:</strong> {post.filename}
                </Text>
              ) : (
                <Text size="sm" c="dimmed">
                  <strong>Source:</strong> {post.source}
                </Text>
              )}
            </Box>
          )}
        </Container>
      </Box>

      {/* Body Section - white background with responsive layout like old app */}
      <Container size="xl" py="xl">
        {error && (
          <Box
            p="md"
            mb="xl"
            style={{
              backgroundColor: '#ffe0e0',
              borderRadius: 8,
              color: 'red',
            }}
          >
            {error}
          </Box>
        )}

        {loading && (
          <Box ta="center" py="xl">
            <Text>Loading markdown...</Text>
          </Box>
        )}

        {/* Render interactive posts */}
        {post?.type === 'interactive' && !loading && (
          <Box
            style={{
              width: '100%',
              height: 'calc(100vh - 400px)',
              minHeight: '600px',
            }}
          >
            <IframeContent url={post.source} title={post.title} />
          </Box>
        )}

        {/* Render article posts with markdown */}
        {post?.type === 'article' && markdown && !loading && (
          <Box
            style={{
              display: 'flex',
              gap: displayCategory === 'desktop' ? spacing.xl : 0,
              flexDirection: displayCategory === 'mobile' ? 'column' : 'row',
            }}
          >
            {/* Left sidebar - Table of Contents (desktop only) */}
            {displayCategory === 'desktop' && (
              <Box
                style={{
                  flex: 1,
                  minWidth: 200,
                }}
              >
                <Box style={{ position: 'sticky', top: 150 }}>
                  <Text size="sm" fw={600} mb="sm" tt="uppercase" c={colors.primary[800]}>
                    Contents
                  </Text>
                  <LeftContents markdown={markdown} />
                </Box>
              </Box>
            )}

            {/* Main content area */}
            <Box
              style={{
                flex: displayCategory === 'desktop' ? 4 : 1,
                minWidth: 0,
              }}
            >
              {/* Render the actual markdown */}
              <MarkdownFormatter markdown={markdown} />
            </Box>

            {/* Right sidebar - More info (desktop only) */}
            {displayCategory === 'desktop' && post && (
              <Box
                style={{
                  flex: 1,
                  minWidth: 200,
                }}
              >
                <Box style={{ position: 'sticky', top: 150 }}>
                  <Text size="sm" fw={600} mb="sm" tt="uppercase" c={colors.primary[800]}>
                    More on
                  </Text>
                  {post.tags.map((tag) => {
                    // Get the proper label for this tag
                    const label = topicLabels[tag] || locationLabels[tag] || tag;

                    return (
                      <Text
                        key={tag}
                        size="sm"
                        mb="xs"
                        style={{
                          cursor: 'pointer',
                          // TODO: When research page is built, make these links navigate to:
                          // /us/research?topics={tag} for topic tags
                          // /us/research?locations={tag} for location tags
                        }}
                      >
                        {label}
                      </Text>
                    );
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}

/**
 * Table of Contents component
 * Extracts headings from markdown and creates clickable links
 */
function LeftContents({ markdown }: { markdown: string }) {
  const lines = markdown.split('\n');
  const headers = lines.filter((line) => line.startsWith('##'));

  const headerData = headers.map((header) => {
    const level = header.split('#').length - 1;
    let text = header.split(' ').slice(1).join(' ');

    // Remove markdown links from text
    if (text.includes('[')) {
      text = text.split('[').slice(1).join('[').split(']')[0];
    }

    // Generate slug using the EXACT same logic as old app and MarkdownFormatter
    // This must match the slug generation in MarkdownFormatter's h1/h2/h3/h4 components
    const slug = header
      .replace(/[#,/]/g, '')  // Remove #, comma, forward slash
      .trim()
      .replace(/\s+/g, '-')   // Replace spaces with hyphens
      .toLowerCase();         // Convert to lowercase

    return { level, text, slug };
  });

  if (headerData.length === 0) {
    return <Text size="sm" c="dimmed">No headings found</Text>;
  }

  return (
    <Box>
      {headerData.map(({ level, text, slug }) => (
        <Text
          key={slug}
          size="sm"
          mb="xs"
          style={{
            cursor: 'pointer',
            paddingLeft: 10 * (level - 2),
          }}
          onClick={() => {
            console.log('Clicking on TOC item with slug:', slug);
            const element = document.getElementById(slug);
            if (element) {
              console.log('Found element, scrolling to:', element);
              // The headings already have scrollMarginTop: '70px' set in their styles
              // So scrollIntoView will respect that automatically
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            } else {
              console.error('Could not find element with id:', slug);
              // Log all heading IDs on the page for debugging
              const allHeadings = document.querySelectorAll('h1[id], h2[id], h3[id], h4[id]');
              console.log('Available heading IDs:', Array.from(allHeadings).map(h => h.id));
            }
          }}
        >
          {text}
        </Text>
      ))}
    </Box>
  );
}
