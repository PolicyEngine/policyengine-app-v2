import type { ErrorInfo } from 'react';
import { Box, Code, Collapse, Stack, Text } from '@mantine/core';
import { spacing, typography } from '@/designTokens';
import { CodeBlock } from './CodeBlock';
import { ContextSection } from './ContextSection';
import type { ScrubbedReportErrorContext } from './types';

interface TechnicalDetailsProps {
  isOpen: boolean;
  error: Error;
  errorInfo: ErrorInfo | null;
  scrubbedContext: ScrubbedReportErrorContext | null;
}

/**
 * Collapsible section containing technical error details
 */
export function TechnicalDetails({
  isOpen,
  error,
  errorInfo,
  scrubbedContext,
}: TechnicalDetailsProps) {
  return (
    <Collapse in={isOpen}>
      <Stack gap={spacing.md}>
        {/* Error message */}
        <Box>
          <Text size="sm" fw={typography.fontWeight.medium} mb={spacing.xs}>
            Error message
          </Text>
          <Code
            block
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {error.message || 'Unknown error'}
          </Code>
        </Box>

        {/* Stack trace */}
        {error.stack && <CodeBlock title="Stack trace" content={error.stack} maxHeight="200px" />}

        {/* Component stack */}
        {errorInfo?.componentStack && (
          <CodeBlock title="Component stack" content={errorInfo.componentStack} maxHeight="200px" />
        )}

        {/* Report context */}
        {scrubbedContext && <ContextSection context={scrubbedContext} />}
      </Stack>
    </Collapse>
  );
}
