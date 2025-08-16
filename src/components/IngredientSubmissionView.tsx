import { Container, Divider, Stack, Title, Card, Group, Text, Badge } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { spacing, colors } from '@/designTokens';
import MultiButtonFooter, { ButtonConfig } from './common/MultiButtonFooter';

// Interfaces for different content types
export interface SummaryBoxItem {
  title: string;
  description?: string;
  isFulfilled?: boolean;
  badge?: string | number;
}

export interface TextListItem {
  text: string;
  badge?: string | number;
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
              variant={item.isFulfilled ? 'setupCondition--fulfilled' : 'setupCondition--unfulfilled'}
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
        <Stack gap={spacing.xs}>
          {textList.map((item, index) => (
            <Group key={index} gap={spacing.xs} align="center">
              <Text size="xs" c={colors.text.secondary}>
                •
              </Text>
              <Text size="sm" style={{ flex: 1 }}>
                {item.text}
              </Text>
              {item.badge && (
                <Badge size="xs" variant="light" color="gray" radius={spacing.radius.sm}>
                  {typeof item.badge === 'number' ? `${item.badge}` : item.badge}
                </Badge>
              )}
            </Group>
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
