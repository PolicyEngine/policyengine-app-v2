import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Box, Text, rem } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <Box
      className={className}
      style={{
        minHeight: rem(40),
        padding: rem(8),
      }}
    >
      {content ? (
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <Text size="xl" fw={700} mb="sm">
                {children}
              </Text>
            ),
            h2: ({ children }) => (
              <Text size="lg" fw={600} mb="sm">
                {children}
              </Text>
            ),
            h3: ({ children }) => (
              <Text size="md" fw={600} mb="xs">
                {children}
              </Text>
            ),
            p: ({ children }) => <Text mb="sm">{children}</Text>,
            ul: ({ children }) => (
              <Box component="ul" mb="sm">
                {children}
              </Box>
            ),
            ol: ({ children }) => (
              <Box component="ol" mb="sm">
                {children}
              </Box>
            ),
            li: ({ children }) => (
              <Text component="li" mb="xs">
                {children}
              </Text>
            ),
            table: ({ children }) => (
              <Box
                component="table"
                style={{
                  width: '100%',
                  marginBottom: spacing.lg,
                  borderCollapse: 'collapse',
                }}
              >
                {children}
              </Box>
            ),
            thead: ({ children }) => (
              <Box
                component="thead"
                style={{
                  backgroundColor: colors.gray[50],
                  borderBottom: `2px solid ${colors.border.light}`,
                }}
              >
                {children}
              </Box>
            ),
            tbody: ({ children }) => (
              <Box component="tbody">{children}</Box>
            ),
            tr: ({ children }) => <Box component="tr">{children}</Box>,
            th: ({ children }) => (
              <Box
                component="th"
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  textAlign: 'left',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {children}
              </Box>
            ),
            td: ({ children }) => (
              <Box
                component="td"
                style={{
                  padding: `${spacing.md} ${spacing.lg}`,
                  borderTop: `1px solid ${colors.border.light}`,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.primary,
                }}
              >
                {children}
              </Box>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      ) : (
        <Text c="dimmed">No content</Text>
      )}
    </Box>
  );
}
