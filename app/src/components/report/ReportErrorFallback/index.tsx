import { useState } from 'react';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { Button, Paper, Stack } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
import { deriveScrubbedContext } from './deriveScrubbedContext';
import { ErrorHeader } from './ErrorHeader';
import { TechnicalDetails } from './TechnicalDetails';
import type { ReportErrorFallbackProps } from './types';

// Re-export types for external use
export type { ReportErrorContext, ReportErrorFallbackProps } from './types';

/**
 * ReportErrorFallback - Error UI for report output pages
 *
 * Displays a user-friendly error message with an optional dev mode
 * that shows detailed debugging information including:
 * - User-associated ingredients (with userId scrubbed)
 * - Base ingredients if they were fetched
 * - Error stack trace
 */
export function ReportErrorFallback({ error, errorInfo, context }: ReportErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);
  const scrubbedContext = deriveScrubbedContext(context);

  return (
    <Paper
      p={spacing.xl}
      radius="md"
      style={{
        backgroundColor: colors.gray[50],
        border: `1px solid ${colors.gray[200]}`,
      }}
    >
      <Stack gap={spacing.lg}>
        <ErrorHeader />

        <Button
          variant="subtle"
          color="gray"
          size="sm"
          leftSection={showDetails ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          onClick={() => setShowDetails(!showDetails)}
          style={{ alignSelf: 'flex-start' }}
        >
          {showDetails ? 'Hide' : 'Show'} technical details
        </Button>

        <TechnicalDetails
          isOpen={showDetails}
          error={error}
          errorInfo={errorInfo}
          scrubbedContext={scrubbedContext}
        />
      </Stack>
    </Paper>
  );
}
