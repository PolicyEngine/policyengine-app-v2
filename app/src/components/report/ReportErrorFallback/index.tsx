import { IconAlertTriangle } from '@tabler/icons-react';
import { colors } from '@/designTokens';
import { CodeBlock } from './CodeBlock';
import type { ReportErrorFallbackProps } from './types';

// Re-export types for external use
export type { ReportErrorFallbackProps } from './types';

/**
 * ReportErrorFallback - Error UI for report output pages
 *
 * Displays an error message with technical details including
 * error message and stack trace.
 */
export function ReportErrorFallback({ error, errorInfo }: ReportErrorFallbackProps) {
  return (
    <div
      className="tw:p-xl tw:rounded-md"
      style={{
        backgroundColor: colors.gray[50],
        border: `1px solid ${colors.gray[200]}`,
      }}
    >
      <div className="tw:flex tw:flex-col tw:gap-lg">
        {/* Header */}
        <div className="tw:flex tw:items-start tw:gap-md">
          <IconAlertTriangle
            size={32}
            color={colors.gray[600]}
            style={{ flexShrink: 0, marginTop: 4 }}
          />
          <div>
            <h3 className="tw:text-lg tw:font-semibold tw:text-gray-900 tw:mb-xs">
              Something went wrong
            </h3>
            <p className="tw:text-sm tw:text-gray-500">
              We encountered an error while loading this report.
            </p>
          </div>
        </div>

        {/* Error message */}
        <div>
          <p className="tw:text-sm tw:font-medium tw:mb-xs">Error message</p>
          <code
            className="tw:block tw:bg-gray-100 tw:px-sm tw:py-sm tw:rounded-md tw:text-xs tw:font-mono"
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {error.message || 'Unknown error'}
          </code>
        </div>

        {/* Stack trace */}
        {error.stack && <CodeBlock title="Stack trace" content={error.stack} maxHeight="200px" />}

        {/* Component stack */}
        {errorInfo?.componentStack && (
          <CodeBlock title="Component stack" content={errorInfo.componentStack} maxHeight="200px" />
        )}
      </div>
    </div>
  );
}
