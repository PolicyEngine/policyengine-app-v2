/**
 * MarkdownFormatter Test Component
 * Loads and displays a recent blog article for styling assessment
 */

import { useState, useEffect } from 'react';
import { Box, Button, Container, Stack, Title } from '@mantine/core';
import { MarkdownFormatter } from './MarkdownFormatter';
import { posts } from '@/data/posts/postTransformers';

export function MarkdownFormatterTest() {
  const [markdown, setMarkdown] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Get a recent blog post (first one in sorted array)
  const recentPost = posts[0];

  const loadMarkdown = async () => {
    if (!recentPost?.filename) {
      setError('No recent post with markdown file found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Dynamically import the markdown file
      const response = await fetch(`/src/data/posts/articles/${recentPost.filename}`);
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

  return (
    <Container size="lg" py="xl">
      <Stack gap="md">
        <Title order={2}>MarkdownFormatter Test</Title>

        <Box>
          <strong>Testing with post:</strong> {recentPost?.title || 'N/A'}
          <br />
          <strong>Date:</strong> {recentPost?.date || 'N/A'}
          <br />
          <strong>File:</strong> {recentPost?.filename || 'N/A'}
        </Box>

        <Button onClick={loadMarkdown} loading={loading}>
          Load and Render Markdown
        </Button>

        {error && (
          <Box c="red" p="md" style={{ backgroundColor: '#ffe0e0', borderRadius: 8 }}>
            {error}
          </Box>
        )}

        {markdown && (
          <Box
            p="xl"
            style={{
              backgroundColor: 'white',
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <MarkdownFormatter markdown={markdown} />
          </Box>
        )}
      </Stack>
    </Container>
  );
}
