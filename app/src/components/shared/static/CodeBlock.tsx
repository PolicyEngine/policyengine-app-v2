import { IconCheck, IconCopy } from '@tabler/icons-react';
import { ActionIcon, Box, Code, CopyButton, Stack, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export default function CodeBlock({ code, language: _language, title }: CodeBlockProps) {
  return (
    <Stack gap={spacing.xs}>
      {title && (
        <Text
          fw={typography.fontWeight.semibold}
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          {title}
        </Text>
      )}
      <Box pos="relative">
        <Code
          block
          style={{
            fontSize: typography.fontSize.sm,
            padding: spacing.md,
            backgroundColor: colors.gray[50],
            border: `1px solid ${colors.gray[200]}`,
            borderRadius: '8px',
            overflowX: 'auto',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {code}
        </Code>
        <Box
          style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
          }}
        >
          <CopyButton value={code} timeout={2000}>
            {({ copied, copy }) => (
              <ActionIcon
                color={copied ? 'teal' : 'gray'}
                variant="filled"
                onClick={copy}
                size="sm"
              >
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            )}
          </CopyButton>
        </Box>
      </Box>
    </Stack>
  );
}
