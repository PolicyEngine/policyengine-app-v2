import { IconCheck } from '@tabler/icons-react';
import { Badge, Container, Group, Stack, Text, Title } from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { cn } from '@/lib/utils';
import MultiButtonFooter, { ButtonConfig } from './common/MultiButtonFooter';

// Interfaces for different content types
export interface SummaryBoxItem {
  title: string;
  description?: string;
  isFulfilled?: boolean;
  isDisabled?: boolean;
  badge?: string | number;
}

export interface TextListItem {
  text: string;
  badge?: string | number;
  isHeader?: boolean; // NEW: Mark as header for larger sizing
  subItems?: TextListSubItem[]; // Optional hierarchical sub-items
}

export interface TextListSubItem {
  label: string;
  dateIntervals?: DateIntervalValue[]; // NEW: For date-based intervals
}

export interface DateIntervalValue {
  dateRange: string;
  value: string | number;
}

interface IngredientSubmissionViewProps {
  title: string;
  subtitle?: string;
  submitButtonText?: string; // Defaults to title
  submissionHandler: CallableFunction; // Function to handle form submission
  submitButtonLoading?: boolean;
  submitButtonDisabled?: boolean; // Disable submit button (e.g., for validation)
  warningMessage?: string; // Warning message to display (e.g., for empty states)
  onBack?: () => void;
  onCancel?: () => void;

  // Content modes - only one should be provided
  content?: React.ReactNode; // Original free-form content
  summaryBoxes?: SummaryBoxItem[]; // Box-based formatting like in the image
  textList?: TextListItem[]; // Simple text list formatting
}

export default function IngredientSubmissionView({
  title,
  subtitle,
  content,
  summaryBoxes,
  textList,
  submitButtonText,
  submissionHandler,
  submitButtonLoading,
  submitButtonDisabled,
  warningMessage,
  onBack,
  onCancel,
}: IngredientSubmissionViewProps) {
  // Use new layout if back or cancel provided
  const useNewLayout = onBack || onCancel;

  // Render content based on the provided content type
  const renderContent = () => {
    // Priority: summaryBoxes > textList > content (fallback)
    if (summaryBoxes && summaryBoxes.length > 0) {
      return (
        <Stack gap="md">
          {summaryBoxes.map((item, index) => (
            <div
              key={index}
              className={cn(
                'tw:w-full tw:text-left tw:rounded-element tw:border tw:p-md tw:transition-all',
                item.isDisabled
                  ? 'tw:opacity-60 tw:border-border-light tw:bg-gray-50 tw:pointer-events-none'
                  : 'tw:border-border-light tw:bg-white tw:hover:bg-gray-50 tw:hover:border-border-medium'
              )}
            >
              <Group gap="sm" className="tw:items-center">
                {item.isFulfilled && (
                  <IconCheck
                    size={20}
                    style={{
                      color: colors.primary[600],
                      marginTop: '2px',
                      flexShrink: 0,
                    }}
                  />
                )}
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Text fw={typography.fontWeight.bold}>{item.title}</Text>
                  {item.description && (
                    <Text size="sm" style={{ color: colors.text.secondary }}>
                      {item.description}
                    </Text>
                  )}
                </Stack>
                {item.badge && (
                  <Badge variant="secondary" style={{ borderRadius: spacing.radius.element }}>
                    {item.badge}
                  </Badge>
                )}
              </Group>
            </div>
          ))}
        </Stack>
      );
    }

    if (textList && textList.length > 0) {
      return (
        <Stack gap="md">
          {textList.map((item, index) => (
            <Stack key={index} gap="xs">
              {/* Main item with optional header styling */}
              <div className="tw:flex tw:items-center tw:gap-1">
                <Text
                  size={item.isHeader ? 'lg' : 'sm'}
                  fw={item.isHeader ? typography.fontWeight.bold : typography.fontWeight.semibold}
                  className="tw:flex-1"
                >
                  {item.text}
                </Text>
                {item.badge && (
                  <Badge variant="secondary" style={{ borderRadius: spacing.radius.element }}>
                    {item.badge}
                  </Badge>
                )}
              </div>

              {/* Sub-items with parameter names and date intervals */}
              {item.subItems && item.subItems.length > 0 && (
                <Stack gap="md" className="tw:ml-3">
                  {item.subItems.map((subItem, subIndex) => (
                    <Stack key={subIndex} gap="xs">
                      {/* Parameter name */}
                      <Text size="sm" fw={typography.fontWeight.medium}>
                        {subItem.label}
                      </Text>

                      {/* Date intervals in two columns */}
                      {subItem.dateIntervals && subItem.dateIntervals.length > 0 && (
                        <Stack gap="xs" className="tw:ml-2">
                          {subItem.dateIntervals.map((interval, intervalIndex) => (
                            <div key={intervalIndex} className="tw:flex tw:items-center tw:gap-2">
                              <Text
                                size="sm"
                                className="tw:flex-1"
                                style={{ color: colors.text.secondary }}
                              >
                                {interval.dateRange}
                              </Text>
                              <Text size="sm">{interval.value}</Text>
                            </div>
                          ))}
                        </Stack>
                      )}
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          ))}
        </Stack>
      );
    }

    // Fallback to original content prop
    return content;
  };

  // Build footer props
  const footerProps = useNewLayout
    ? {
        buttons: [] as ButtonConfig[],
        cancelAction: onCancel ? { label: 'Cancel', onClick: onCancel } : undefined,
        backAction: onBack ? { label: 'Back', onClick: onBack } : undefined,
        primaryAction: {
          label: submitButtonText || title,
          onClick: () => submissionHandler(),
          isLoading: submitButtonLoading,
          isDisabled: submitButtonDisabled,
        },
      }
    : {
        buttons: [
          {
            label: 'Cancel',
            variant: 'disabled' as const,
            onClick: () => {},
          },
          {
            label: submitButtonText || title,
            variant: 'filled' as const,
            onClick: () => submissionHandler(),
            isLoading: submitButtonLoading,
            isDisabled: submitButtonDisabled,
          },
        ] as ButtonConfig[],
      };

  return (
    <Container variant="guttered">
      <Title order={2} style={{ color: colors.primary[700] }}>
        {title}
      </Title>
      {subtitle && (
        <Text style={{ color: colors.text.secondary, marginBottom: spacing.sm }}>{subtitle}</Text>
      )}
      <hr className="tw:my-2 tw:border-border-light" />
      {warningMessage && (
        <Text
          style={{
            color: colors.text.warning,
            fontWeight: typography.fontWeight.medium,
            marginBottom: spacing.md,
          }}
        >
          {warningMessage}
        </Text>
      )}
      <Stack gap="md" className="tw:pb-4">
        {renderContent()}
      </Stack>
      <MultiButtonFooter {...footerProps} />
    </Container>
  );
}
