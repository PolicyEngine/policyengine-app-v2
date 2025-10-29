import { IconCheck } from '@tabler/icons-react';
import { Badge, Card, Container, Divider, Group, Stack, Text, Title } from '@mantine/core';
import { colors, spacing } from '@/designTokens';
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
}: IngredientSubmissionViewProps) {
  const buttonConfig: ButtonConfig[] = [
    {
      label: 'Cancel',
      variant: 'default' as const,
      onClick: () => console.log('Cancel clicked'), // Placeholder for cancel action
    },
    {
      label: submitButtonText || title,
      variant: 'filled' as const,
      onClick: () => submissionHandler(),
      isLoading: submitButtonLoading,
    },
  ];

  // Render content based on the provided content type
  const renderContent = () => {
    // Priority: summaryBoxes > textList > content (fallback)
    if (summaryBoxes && summaryBoxes.length > 0) {
      return (
        <Stack gap="md">
          {summaryBoxes.map((item, index) => (
            <Card
              key={index}
              withBorder
              variant={
                item.isDisabled
                  ? 'setupCondition--disabled'
                  : item.isFulfilled
                    ? 'setupCondition--fulfilled'
                    : 'setupCondition--unfulfilled'
              }
            >
              <Group gap={spacing.sm} align="center">
                {item.isFulfilled && (
                  <IconCheck
                    size={20}
                    style={{
                      color: 'var(--mantine-color-primary-6)',
                      marginTop: '2px',
                      flexShrink: 0,
                    }}
                  />
                )}
                <Stack gap={spacing.xs} style={{ flex: 1 }}>
                  <Text fw={700}>{item.title}</Text>
                  {item.description && (
                    <Text size="sm" c="dimmed">
                      {item.description}
                    </Text>
                  )}
                </Stack>
                {item.badge && (
                  <Badge size="sm" variant="light" color="blue" radius={spacing.radius.sm}>
                    {typeof item.badge === 'number' ? `${item.badge}` : item.badge}
                  </Badge>
                )}
              </Group>
            </Card>
          ))}
        </Stack>
      );
    }

    if (textList && textList.length > 0) {
      return (
        <Stack gap={spacing.md}>
          {textList.map((item, index) => (
            <Stack key={index} gap={spacing.xs}>
              {/* Main item with optional header styling */}
              <Group gap={spacing.xs} align="center">
                <Text
                  size={item.isHeader ? 'lg' : 'sm'}
                  fw={item.isHeader ? 700 : 600}
                  style={{ flex: 1 }}
                >
                  {item.text}
                </Text>
                {item.badge && (
                  <Badge size="xs" variant="light" color="gray" radius={spacing.radius.sm}>
                    {typeof item.badge === 'number' ? `${item.badge}` : item.badge}
                  </Badge>
                )}
              </Group>

              {/* Sub-items with parameter names and date intervals */}
              {item.subItems && item.subItems.length > 0 && (
                <Stack gap={spacing.md} ml={spacing.md}>
                  {item.subItems.map((subItem, subIndex) => (
                    <Stack key={subIndex} gap={spacing.xs}>
                      {/* Parameter name */}
                      <Text size="sm" fw={500}>
                        {subItem.label}
                      </Text>

                      {/* Date intervals in two columns */}
                      {subItem.dateIntervals && subItem.dateIntervals.length > 0 && (
                        <Stack gap={spacing.xs} ml={spacing.sm}>
                          {subItem.dateIntervals.map((interval, intervalIndex) => (
                            <Group key={intervalIndex} gap={spacing.sm} align="center">
                              <Text size="sm" c={colors.text.secondary} style={{ flex: 1 }}>
                                {interval.dateRange}
                              </Text>
                              <Text size="sm">{interval.value}</Text>
                            </Group>
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

  return (
    <>
      <Container variant="guttered">
        <Title order={2} variant="colored">
          {title}
        </Title>
        {subtitle && (
          <Text c="dimmed" mb="sm">
            {subtitle}
          </Text>
        )}
        <Divider my="sm" />
        <Stack gap="md" pb="lg">
          {renderContent()}
        </Stack>
        <MultiButtonFooter buttons={buttonConfig} />
      </Container>
    </>
  );
}
