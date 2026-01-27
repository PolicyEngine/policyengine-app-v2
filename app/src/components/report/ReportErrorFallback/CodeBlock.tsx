import { Box, Code, Text } from '@mantine/core';
import { spacing, typography } from '@/designTokens';

interface CodeBlockProps {
  title: string;
  content: string;
  maxHeight?: string;
}

/**
 * Reusable code block for displaying formatted code/JSON content
 */
export function CodeBlock({ title, content, maxHeight = '185px' }: CodeBlockProps) {
  return (
    <Box>
      <Text size="sm" fw={typography.fontWeight.medium} mb={spacing.xs}>
        {title}
      </Text>
      <Code
        block
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight,
          overflow: 'auto',
          fontSize: '11px',
        }}
      >
        {content}
      </Code>
    </Box>
  );
}
