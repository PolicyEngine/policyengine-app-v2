import { useState } from 'react';
import { IconCheck, IconChevronDown, IconChevronUp, IconCopy } from '@tabler/icons-react';
import { langs } from '@uiw/codemirror-extensions-langs';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { espresso } from 'thememirror';
import { Box, Button, CopyButton, Flex, Group, Stack, Text } from '@mantine/core';
import { colors, spacing, typography } from '@/designTokens';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showExpand?: boolean;
}

export default function CodeBlock({ code, language, title, showExpand = true }: CodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Map common language names to CodeMirror language extensions
  const getLanguageExtension = () => {
    if (!language) {
      return langs.json();
    }

    const langKey = language.toLowerCase() as keyof typeof langs;
    return langKey in langs ? langs[langKey]() : langs.json();
  };

  return (
    <Stack gap={0}>
      {title && (
        <Text
          fw={typography.fontWeight.semibold}
          mb={spacing.xs}
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          {title}
        </Text>
      )}
      <Box
        style={{
          border: `1px solid ${colors.gray[200]}`,
          borderRadius: spacing.radius.lg,
          overflow: 'hidden',
        }}
      >
        {/* Header bar */}
        <Flex
          justify="space-between"
          align="center"
          px={spacing.md}
          py={spacing.sm}
          style={{
            backgroundColor: colors.gray[100],
            borderBottom: `1px solid ${colors.gray[200]}`,
          }}
        >
          <Text
            size="sm"
            fw={typography.fontWeight.medium}
            style={{ color: colors.text.secondary }}
          >
            {language || 'code'}
          </Text>
          <Group gap={spacing.xs}>
            {showExpand && (
              <Button
                variant="subtle"
                size="compact-sm"
                color="gray"
                leftSection={
                  isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />
                }
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Shrink' : 'Expand'}
              </Button>
            )}
            <CopyButton value={code} timeout={2000}>
              {({ copied, copy }) => (
                <Button
                  variant="subtle"
                  size="compact-sm"
                  color={copied ? 'teal' : 'gray'}
                  leftSection={copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  onClick={copy}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              )}
            </CopyButton>
          </Group>
        </Flex>

        {/* Code content with syntax highlighting */}
        <CodeMirror
          value={code}
          maxHeight={isExpanded ? undefined : '400px'}
          editable={false}
          extensions={[getLanguageExtension(), EditorView.lineWrapping]}
          theme={espresso}
        />
      </Box>
    </Stack>
  );
}
